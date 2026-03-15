import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import * as d3 from 'd3';

// 1. Semantic Thermometer (Replaces SWBD Bullet Chart)
export const SemanticThermometer = ({ value, max = 50 }: { value: number, max?: number }) => {
  const percentage = Math.min(100, (value / max) * 100);
  let color = "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]";
  let label = "Healthy Context";
  let description = "The text maintains a balanced and inclusive perspective with minimal semantic bias.";
  
  if (value >= 25) { 
    color = "bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]"; 
    label = "Systemic Erasure";
    description = "Critical levels of bias detected. Significant exclusion or misrepresentation of specific groups.";
  }
  else if (value >= 10) { 
    color = "bg-orange-500 shadow-[0_0_15px_rgba(217,119,87,0.5)]"; 
    label = "Micro-aggressions Present";
    description = "Moderate bias detected. Subtle but persistent patterns of exclusion or stereotyping.";
  }
  
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center h-24 gap-6 w-full justify-center">
        <div className="relative w-6 h-full bg-stone-100 dark:bg-[#1a1a1a] rounded-full overflow-hidden border border-stone-200 dark:border-stone-800 shadow-inner">
          <div className={`absolute bottom-0 w-full transition-all duration-1000 rounded-full ${color}`} style={{ height: `${percentage}%` }} />
          <div className="absolute bottom-[20%] w-full border-t border-stone-300/30 dark:border-stone-600/30" />
          <div className="absolute bottom-[50%] w-full border-t border-stone-300/30 dark:border-stone-600/30" />
        </div>
        <div className="flex flex-col justify-between h-full py-1 text-[10px] text-stone-400 font-medium uppercase tracking-tighter">
          <span className={value >= 25 ? "text-rose-600 dark:text-rose-400 font-bold" : ""}>Critical</span>
          <span className={value >= 10 && value < 25 ? "text-orange-600 dark:text-orange-400 font-bold" : ""}>Moderate</span>
          <span className={value < 10 ? "text-emerald-600 dark:text-emerald-400 font-bold" : ""}>Minimal</span>
        </div>
      </div>
      <div className="text-center">
        <div className={`text-xs font-bold mb-1 ${value >= 25 ? 'text-rose-600' : value >= 10 ? 'text-orange-600' : 'text-emerald-600'}`}>{label}</div>
        <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-tight px-2">{description}</p>
      </div>
    </div>
  );
};

// 2. Document Minimap (Replaces Burstiness Sparkline)
export const DocumentMinimap = ({ data, totalSegments, activeSegmentId, onSegmentClick }: { data: {segment_id: string, severity: number}[], totalSegments: number, activeSegmentId: string | null, onSegmentClick: (id: string) => void }) => {
  return (
    <div className="w-full h-full bg-stone-50 dark:bg-[#1a1a1a] border border-stone-200 dark:border-stone-800 rounded-full relative cursor-pointer overflow-hidden shadow-inner" title="Document Minimap">
      {data.map((d, i) => {
        if (d.severity === 0) return null;
        const top = (i / totalSegments) * 100;
        const color = d.severity === 3 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]' : d.severity === 2 ? 'bg-orange-500 shadow-[0_0_6px_rgba(217,119,87,0.9)]' : 'bg-emerald-400 shadow-[0_0_4px_rgba(16,185,129,0.9)]';
        const isActive = activeSegmentId === d.segment_id;
        return (
          <div 
            key={d.segment_id}
            onClick={(e) => { e.stopPropagation(); onSegmentClick(d.segment_id); }}
            className={`absolute w-full h-1.5 ${color} ${isActive ? 'ring-2 ring-white dark:ring-stone-900 z-10 scale-y-150' : 'opacity-80 hover:opacity-100'} transition-all`}
            style={{ top: `${top}%` }}
          />
        );
      })}
    </div>
  );
}

// 3. IOC UpSet Plot
export const UpSetPlot = ({ intersections, ioc }: { intersections: { sets: string, size: number }[], ioc: number }) => {
  if (!intersections || intersections.length === 0) {
    return <div className="text-xs text-stone-400 italic">No multi-dimensional overlaps detected.</div>;
  }
  
  const max = Math.max(...intersections.map(d => d.size));
  
  return (
    <div className="space-y-3 w-full">
      <div className="space-y-1.5">
        {intersections.slice(0, 3).map(d => (
          <div key={d.sets} className="flex items-center text-[10px]">
            <div className="w-20 truncate text-right pr-2 text-stone-500 dark:text-stone-400 font-mono" title={d.sets}>
              {d.sets.split(' + ').map(s => s.substring(0, 3).toUpperCase()).join('+')}
            </div>
            <div className="flex-1 h-2 bg-stone-100 dark:bg-[#333] rounded-full overflow-hidden flex items-center">
              <div className="h-full bg-[#d97757] dark:bg-[#d97757]/80" style={{ width: `${(d.size / max) * 100}%` }} />
            </div>
            <div className="w-6 text-right text-stone-400 font-mono ml-1">{d.size}</div>
          </div>
        ))}
      </div>
      <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
        <div className="text-[10px] text-stone-500 leading-tight">
          <span className="font-bold text-stone-700 dark:text-stone-300">Overlap Rate: {ioc}%</span>
          <p className="mt-1 opacity-70">Measures how often different types of bias occur in the same sentence, indicating intersectional complexity.</p>
        </div>
      </div>
    </div>
  );
};

// 4. DDR Nightingale Rose Graph
export const NightingaleRose = ({ data }: { data: { name: string, severity: number, frequency: number }[] }) => {
  if (!data || data.length === 0) return null;
  
  const totalFreq = data.reduce((sum, d) => sum + d.frequency, 0);
  const maxSev = Math.max(...data.map(d => d.severity), 1);
  
  let startAngle = -Math.PI / 2; // Start at top
  const cx = 50;
  const cy = 50;
  const maxRadius = 48; // Leave 2px padding

  const colorScale = d3.scaleOrdinal(['#d97757', '#10b981', '#3b82f6', '#8b5cf6', '#f43f5e', '#f59e0b']);

  return (
    <div className="w-full flex flex-col items-center gap-4">
      <div className="relative">
        <svg viewBox="0 0 100 100" className="w-32 h-32 overflow-visible">
          {data.map((d, i) => {
            const angle = totalFreq > 0 ? (d.frequency / totalFreq) * Math.PI * 2 : 0;
            const radius = (d.severity / maxSev) * maxRadius;
            
            if (angle === 0) return null;
            
            if (angle >= Math.PI * 2 - 0.01) {
              return <circle key={d.name} cx={cx} cy={cy} r={radius} fill={colorScale(i.toString())} stroke="#fff" strokeWidth="0.5" />;
            }
            
            const x1 = cx + radius * Math.cos(startAngle);
            const y1 = cy + radius * Math.sin(startAngle);
            const x2 = cx + radius * Math.cos(startAngle + angle);
            const y2 = cy + radius * Math.sin(startAngle + angle);
            
            const largeArc = angle > Math.PI ? 1 : 0;
            
            const pathData = `
              M ${cx} ${cy}
              L ${x1} ${y1}
              A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
              Z
            `;
            
            const currentStartAngle = startAngle;
            startAngle += angle;
            
            return (
              <path 
                key={d.name} 
                d={pathData} 
                fill={colorScale(i.toString())} 
                stroke="#fff" 
                strokeWidth="0.5" 
                className="dark:stroke-[#252525] transition-all hover:opacity-80 cursor-help"
              >
                <title>{`${d.name}: Severity ${d.severity}, Freq ${d.frequency}`}</title>
              </path>
            );
          })}
        </svg>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 w-full px-4">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-1.5 text-[9px] text-stone-500 uppercase tracking-tighter">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colorScale(i.toString()) }} />
            <span className="truncate">{d.name}</span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-stone-400 text-center leading-tight px-4">
        Radius represents <span className="font-bold text-stone-600 dark:text-stone-300">Severity</span>, while arc width represents <span className="font-bold text-stone-600 dark:text-stone-300">Frequency</span> of each bias dimension.
      </p>
    </div>
  );
};
