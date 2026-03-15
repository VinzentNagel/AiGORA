export interface Finding {
  segment_id: string;
  severity: number;
  detector_log: string;
  nuance_log: string;
}

export interface DimensionResult {
  dimension: string;
  findings: Finding[];
}

export interface OrchestratorOutput {
  results: DimensionResult[];
}

export class MetricsAggregator {
  static calculateMetrics(data: OrchestratorOutput, totalSegments: number) {
    let totalSeverity = 0;
    const severityByDimension: Record<string, number> = {};
    const dimensionsBySegment: Record<string, Set<string>> = {};
    
    // For VMR
    const decileSeverities = new Array(10).fill(0);
    
    data.results.forEach(dim => {
      severityByDimension[dim.dimension] = 0;
      
      dim.findings.forEach(finding => {
        totalSeverity += finding.severity;
        severityByDimension[dim.dimension] += finding.severity;
        
        if (!dimensionsBySegment[finding.segment_id]) {
          dimensionsBySegment[finding.segment_id] = new Set();
        }
        dimensionsBySegment[finding.segment_id].add(dim.dimension);
        
        // Parse segment index from "s1", "s2", etc.
        const match = finding.segment_id.match(/\d+/);
        if (match) {
          const segIndex = parseInt(match[0], 10) - 1; // 0-based
          // Calculate decile (0 to 9)
          let decile = Math.floor((segIndex / totalSegments) * 10);
          if (decile >= 10) decile = 9;
          if (decile < 0) decile = 0;
          decileSeverities[decile] += finding.severity;
        }
      });
    });

    // 1. SWBD (Semantic Thermometer Logic)
    const swbd = totalSegments > 0 ? (totalSeverity / totalSegments) * 100 : 0;
    let thermometerLabel = "Healthy Context";
    if (swbd > 15) thermometerLabel = "Systemic Erasure";
    else if (swbd > 5) thermometerLabel = "Micro-aggressions Present";

    // 2. IOC
    let totalBiasedSegments = 0;
    let intersectionalSegments = 0;
    const intersectionsMap: Record<string, number> = {};

    for (const segId in dimensionsBySegment) {
      totalBiasedSegments++;
      const dims = Array.from(dimensionsBySegment[segId]).sort();
      if (dims.length >= 2) {
        intersectionalSegments++;
        const key = dims.join(' + ');
        intersectionsMap[key] = (intersectionsMap[key] || 0) + 1;
      }
    }
    const ioc = totalBiasedSegments > 0 ? (intersectionalSegments / totalBiasedSegments) * 100 : 0;

    const intersectionArray = Object.entries(intersectionsMap)
      .map(([sets, size]) => ({ sets, size }))
      .sort((a, b) => b.size - a.size)
      .slice(0, 5);

    // 3. Spatial Autocorrelation (VMR)
    const mean = decileSeverities.reduce((a, b) => a + b, 0) / 10;
    const variance = decileSeverities.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / 10;
    const vmr = mean > 0 ? variance / mean : 0;
    const burstiness = vmr > 1 ? "Clustered/Targeted Bias" : "Dispersed Bias";

    // 4. DDR
    const ddr: Record<string, number> = {};
    const dimensionStats: Array<{ name: string, severity: number, frequency: number }> = [];

    if (totalSeverity > 0) {
      for (const dim in severityByDimension) {
        ddr[dim] = (severityByDimension[dim] / totalSeverity) * 100;
        dimensionStats.push({
          name: dim,
          severity: severityByDimension[dim],
          frequency: Object.values(dimensionsBySegment).filter(set => set.has(dim)).length
        });
      }
    }

    // 5. Synthesized Findings for Impact Cards
    const allFindings: Array<{
      segment_id: string;
      dimension: string;
      severity: number;
      summary: string;
    }> = [];

    data.results.forEach(dim => {
      dim.findings.forEach(f => {
        const severityWord = f.severity >= 4 ? "Severe" : f.severity >= 2 ? "Moderate" : "Subtle";
        allFindings.push({
          segment_id: f.segment_id,
          dimension: dim.dimension,
          severity: f.severity,
          summary: `The Detector found ${severityWord} ${dim.dimension} here, and the Nuance Specialist agreed there is no pedagogical justification.`
        });
      });
    });

    return {
      swbd: parseFloat(swbd.toFixed(1)),
      thermometerLabel,
      ioc: parseFloat(ioc.toFixed(1)),
      vmr: parseFloat(vmr.toFixed(2)),
      burstiness,
      ddr: Object.fromEntries(Object.entries(ddr).map(([k, v]) => [k, parseFloat(v.toFixed(1))])),
      deciles: decileSeverities,
      intersections: intersectionArray,
      dimensionStats,
      allFindings: allFindings.sort((a, b) => b.severity - a.severity)
    };
  }
}
