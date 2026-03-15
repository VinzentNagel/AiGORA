import React, { useState, useEffect, useCallback } from 'react';
import { Settings, UploadCloud, BrainCircuit, ShieldAlert, Scale, ChevronRight, FileText, Activity, AlertTriangle, X, Info, RefreshCw, Moon, Sun, Layers, Loader2, FileSearch, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from '@google/genai';
import { create } from 'zustand';
import { SemanticThermometer, DocumentMinimap, NightingaleRose } from './components/MetricsVisualizations';
import { UnifiedInput } from './components/UnifiedInput';
import { BiasSegment } from './components/BiasSegment';
import { BiasCard } from './components/BiasCard';
import { AigoraLogo } from './components/AigoraLogo';
import * as pdfjs from 'pdfjs-dist';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

type AppState = 'INGEST' | 'PROCESSING' | 'ANALYSIS';

interface Segment {
  id: string;
  text: string;
}

interface Finding {
  segment_id: string;
  severity: number;
  detector_log: string;
  nuance_log: string;
  impact_statement: string;
  review: string;
}

interface DimensionResult {
  dimension: string;
  findings: Finding[];
}

interface AssessmentResult {
  results: DimensionResult[];
}

interface Metrics {
  swbd: number;
  ioc: number;
  vmr: number;
  burstiness: string;
  ddr: Record<string, number>;
  deciles: number[];
  intersections: { sets: string; size: number }[];
  dimensionStats: { name: string; severity: number; frequency: number }[];
  minimap: { segment_id: string; severity: number; index: number }[];
}

interface AppStateStore {
  activeDimension: string | null;
  activeSegmentId: string | null;
  showDimInfo: boolean;
  setActiveDimension: (dim: string | null) => void;
  setActiveSegmentId: (id: string | null) => void;
  setShowDimInfo: (show: boolean) => void;
}

const useAppStore = create<AppStateStore>((set) => ({
  activeDimension: null,
  activeSegmentId: null,
  showDimInfo: false,
  setActiveDimension: (dim) => set({ activeDimension: dim, showDimInfo: false }),
  setActiveSegmentId: (id) => set({ activeSegmentId: id }),
  setShowDimInfo: (show) => set({ showDimInfo: show }),
}));

const getDimensionColor = (dimension: string, severity: number, isDark: boolean) => {
  const dimLower = dimension.toLowerCase();
  
  if (dimLower.includes('gender')) {
    if (severity === 3) return { bg: isDark ? 'bg-rose-900/40' : 'bg-rose-100/80', border: isDark ? 'border-rose-600' : 'border-rose-400', text: isDark ? 'text-rose-400' : 'text-rose-600', dot: 'bg-rose-500' };
    if (severity === 2) return { bg: isDark ? 'bg-rose-900/20' : 'bg-rose-50/80', border: isDark ? 'border-rose-500/70' : 'border-rose-300', text: isDark ? 'text-rose-400/80' : 'text-rose-600/80', dot: 'bg-rose-400' };
    return { bg: isDark ? 'bg-rose-900/10' : 'bg-rose-50/40', border: isDark ? 'border-rose-400/50' : 'border-rose-200', text: isDark ? 'text-rose-400/60' : 'text-rose-600/60', dot: 'bg-rose-300' };
  } else if (dimLower.includes('socioeconomic') || dimLower.includes('classism') || dimLower.includes('socioeconomics')) {
    if (severity === 3) return { bg: isDark ? 'bg-emerald-900/40' : 'bg-emerald-100/80', border: isDark ? 'border-emerald-600' : 'border-emerald-400', text: isDark ? 'text-emerald-400' : 'text-emerald-600', dot: 'bg-emerald-500' };
    if (severity === 2) return { bg: isDark ? 'bg-emerald-900/20' : 'bg-emerald-50/80', border: isDark ? 'border-emerald-500/70' : 'border-emerald-300', text: isDark ? 'text-emerald-400/80' : 'text-emerald-600/80', dot: 'bg-emerald-400' };
    return { bg: isDark ? 'bg-emerald-900/10' : 'bg-emerald-50/40', border: isDark ? 'border-emerald-400/50' : 'border-emerald-200', text: isDark ? 'text-emerald-400/60' : 'text-emerald-600/60', dot: 'bg-emerald-300' };
  } else if (dimLower.includes('eurocentrism')) {
    if (severity === 3) return { bg: isDark ? 'bg-amber-900/40' : 'bg-amber-100/80', border: isDark ? 'border-amber-600' : 'border-amber-400', text: isDark ? 'text-amber-400' : 'text-amber-600', dot: 'bg-amber-500' };
    if (severity === 2) return { bg: isDark ? 'bg-amber-900/20' : 'bg-amber-50/80', border: isDark ? 'border-amber-500/70' : 'border-amber-300', text: isDark ? 'text-amber-400/80' : 'text-amber-600/80', dot: 'bg-amber-400' };
    return { bg: isDark ? 'bg-amber-900/10' : 'bg-amber-50/40', border: isDark ? 'border-amber-400/50' : 'border-amber-200', text: isDark ? 'text-amber-400/60' : 'text-amber-600/60', dot: 'bg-amber-300' };
  } else if (dimLower.includes('heteronormative') || dimLower.includes('heteronormativity')) {
    if (severity === 3) return { bg: isDark ? 'bg-violet-900/40' : 'bg-violet-100/80', border: isDark ? 'border-violet-600' : 'border-violet-400', text: isDark ? 'text-violet-400' : 'text-violet-600', dot: 'bg-violet-500' };
    if (severity === 2) return { bg: isDark ? 'bg-violet-900/20' : 'bg-violet-50/80', border: isDark ? 'border-violet-500/70' : 'border-violet-300', text: isDark ? 'text-violet-400/80' : 'text-violet-600/80', dot: 'bg-violet-400' };
    return { bg: isDark ? 'bg-violet-900/10' : 'bg-violet-50/40', border: isDark ? 'border-violet-400/50' : 'border-violet-200', text: isDark ? 'text-violet-400/60' : 'text-violet-600/60', dot: 'bg-violet-300' };
  } else if (dimLower.includes('ableism')) {
    if (severity === 3) return { bg: isDark ? 'bg-blue-900/40' : 'bg-blue-100/80', border: isDark ? 'border-blue-600' : 'border-blue-400', text: isDark ? 'text-blue-400' : 'text-blue-600', dot: 'bg-blue-500' };
    if (severity === 2) return { bg: isDark ? 'bg-blue-900/20' : 'bg-blue-50/80', border: isDark ? 'border-blue-500/70' : 'border-blue-300', text: isDark ? 'text-blue-400/80' : 'text-blue-600/80', dot: 'bg-blue-400' };
    return { bg: isDark ? 'bg-blue-900/10' : 'bg-blue-50/40', border: isDark ? 'border-blue-400/50' : 'border-blue-200', text: isDark ? 'text-blue-400/60' : 'text-blue-600/60', dot: 'bg-blue-300' };
  } else {
    if (severity === 3) return { bg: isDark ? 'bg-orange-900/40' : 'bg-orange-100/80', border: isDark ? 'border-orange-600' : 'border-orange-400', text: isDark ? 'text-orange-400' : 'text-orange-600', dot: 'bg-orange-500' };
    if (severity === 2) return { bg: isDark ? 'bg-orange-900/20' : 'bg-orange-50/80', border: isDark ? 'border-orange-500/70' : 'border-orange-300', text: isDark ? 'text-orange-400/80' : 'text-orange-600/80', dot: 'bg-orange-400' };
    return { bg: isDark ? 'bg-orange-900/10' : 'bg-orange-50/40', border: isDark ? 'border-orange-400/50' : 'border-orange-200', text: isDark ? 'text-orange-400/60' : 'text-orange-600/60', dot: 'bg-orange-300' };
  }
};

const QUIZ_DATA = [
  {
    sentence: "The nurse carefully checked the patient's vitals before his surgery.",
    isBiased: true,
    explanation: "Assumes the patient is male ('his surgery') without context, though less common than gendered professional roles."
  },
  {
    sentence: "Each student must bring their own laptop to the seminar.",
    isBiased: false,
    explanation: "Uses singular 'their' which is a standard neutral way to refer to a person of unknown gender."
  },
  {
    sentence: "The CEO and his wife attended the gala.",
    isBiased: true,
    explanation: "Assumes the CEO is male. A neutral alternative would be 'The CEO and their spouse'."
  },
  {
    sentence: "A pilot must be focused during landing.",
    isBiased: false,
    explanation: "Neutral statement about a professional role."
  },
  {
    sentence: "The cleaning lady will be here at 10 AM.",
    isBiased: true,
    explanation: "Gendered professional role. 'The cleaner' is a neutral alternative."
  }
];

export default function App() {
  const [appState, setAppState] = useState<AppState>('INGEST');
  const [workflowStatus, setWorkflowStatus] = useState<'idle' | 'detector' | 'nuance' | 'orchestrator' | 'complete'>('idle');
  const [text, setText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [results, setResults] = useState<AssessmentResult | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const { activeDimension, activeSegmentId, showDimInfo, setActiveDimension, setActiveSegmentId, setShowDimInfo } = useAppStore();

  const handleImageTextExtraction = useCallback(async (base64: string, mimeType: string) => {
    setIsExtracting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            inlineData: {
              data: base64,
              mimeType: mimeType
            }
          },
          {
            text: "Extract all the text from this image. Return only the extracted text, nothing else."
          }
        ]
      });
      if (response.text) {
        setText(prev => prev ? prev + "\n\n" + response.text : response.text);
      }
    } catch (err) {
      console.error("Image extraction failed:", err);
      setError("Failed to extract text from image.");
    } finally {
      setIsExtracting(false);
    }
  }, []);

  const handlePDFTextExtraction = useCallback(async (arrayBuffer: ArrayBuffer) => {
    setIsExtracting(true);
    try {
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map((item: any) => item.str);
        fullText += strings.join(" ") + "\n";
      }
      setText(prev => prev ? prev + "\n\n" + fullText : fullText);
    } catch (err) {
      console.error("PDF extraction failed:", err);
      setError("Failed to extract text from PDF.");
    } finally {
      setIsExtracting(false);
    }
  }, []);

  useEffect(() => {
    const onImageExtract = (e: any) => handleImageTextExtraction(e.detail.base64, e.detail.mimeType);
    const onPDFExtract = (e: any) => handlePDFTextExtraction(e.detail.arrayBuffer);

    window.addEventListener('extract-image-text', onImageExtract);
    window.addEventListener('extract-pdf-text', onPDFExtract);

    return () => {
      window.removeEventListener('extract-image-text', onImageExtract);
      window.removeEventListener('extract-pdf-text', onPDFExtract);
    };
  }, [handleImageTextExtraction, handlePDFTextExtraction]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
  
  // Settings Drawer State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [agentRigor, setAgentRigor] = useState(75);

  // Dynamic Ingestion: Dimension Documents
  const [availableDimensions, setAvailableDimensions] = useState<{id: string, description: string}[]>([]);
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>(['gender']);
  
  // Quiz State
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState<boolean | null>(null);

  const handleQuizAnswer = (answer: boolean) => {
    setQuizAnswered(answer);
  };

  const nextQuiz = () => {
    setQuizAnswered(null);
    setCurrentQuizIdx((prev) => (prev + 1) % QUIZ_DATA.length);
  };

  useEffect(() => {
    // Fetch dimension documents from backend
    fetch('/api/dimensions')
      .then(res => res.json())
      .then(data => setAvailableDimensions(data))
      .catch(err => console.error("Failed to fetch dimensions:", err));
  }, []);

  const toggleDimension = (dim: string) => {
    setSelectedDimensions(prev => {
      if (prev.includes(dim)) {
        return prev.filter(d => d !== dim);
      } else {
        return [...prev, dim];
      }
    });
  };

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setAppState('PROCESSING');
    setWorkflowStatus('detector');
    setResults(null);
    setMetrics(null);
    setError(null);

    try {
      // Create a new GoogleGenAI instance right before making an API call
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

      // 1. Pre-segment the text via backend NLP (compromise/spaCy alternative)
      const parseRes = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      if (!parseRes.ok) throw new Error("Failed to parse text");
      
      const { segments: parsedSegments } = await parseRes.json();
      setSegments(parsedSegments);
      const segmentsJson = JSON.stringify(parsedSegments, null, 2);

      // Helper to fetch dimensions for an agent
      const fetchAgentDimensions = async (agent: string) => {
        let dimsText = "";
        for (const dim of selectedDimensions) {
          try {
            const res = await fetch(`/api/agents/${agent}/dimensions/${dim}`);
            if (res.ok) {
              const content = await res.text();
              if (content) dimsText += `\n[Dimension: ${dim}]\n${content}\n`;
            }
          } catch (e) {
            console.error(`Failed to fetch dimension ${dim} for ${agent}`, e);
          }
        }
        return dimsText;
      };

      // --- STEP 1: DETECTOR ---
      const detectorPromptRes = await fetch('/api/agents/detector/prompt');
      const detectorPrompt = await detectorPromptRes.text();
      const detectorDims = await fetchAgentDimensions('detector');
      const detectorSystemInstruction = `${detectorPrompt}${detectorDims ? `\n\n--- REFERENCE CRITERIA DO NOT DEVIATE ---\n${detectorDims}` : ''}`;

      const detectorResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: segmentsJson,
        config: { systemInstruction: detectorSystemInstruction }
      });
      const detectorOutput = detectorResponse.text;

      // --- STEP 2: NUANCE SPECIALIST ---
      setWorkflowStatus('nuance');
      const nuancePromptRes = await fetch('/api/agents/nuance/prompt');
      const nuancePrompt = await nuancePromptRes.text();
      const nuanceDims = await fetchAgentDimensions('nuance');
      const nuanceSystemInstruction = `${nuancePrompt}${nuanceDims ? `\n\n--- REFERENCE CRITERIA DO NOT DEVIATE ---\n${nuanceDims}` : ''}`;

      const nuanceResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Original Segments:\n${segmentsJson}\n\nDetector Output:\n${detectorOutput}`,
        config: { systemInstruction: nuanceSystemInstruction }
      });
      const nuanceOutput = nuanceResponse.text;

      // --- STEP 3: ORCHESTRATOR ---
      setWorkflowStatus('orchestrator');
      const orchPromptRes = await fetch('/api/agents/orchestrator/prompt');
      const orchPrompt = await orchPromptRes.text();
      const finalOrchPrompt = orchPrompt + `\n\nCRITICAL: For each finding, you MUST generate a 'review' (string) which is a deep pedagogical explanation of why this segment is biased or why the nuance specialist's defense was overruled/accepted. Also generate an 'impact_statement' (string) that synthesizes the detector and nuance logs into a single pedagogical sentence.\n\nBLINDNESS INSTRUCTION: Ignore all other biases. The 'dimension' field MUST exactly match one of the following provided dimensions: ${selectedDimensions.join(', ')}. Do NOT invent new dimensions or change the casing.`;

      const orchResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Original Segments:\n${segmentsJson}\n\nDetector Output:\n${detectorOutput}\n\nNuance Specialist Output:\n${nuanceOutput}`,
        config: {
          systemInstruction: finalOrchPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              results: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    dimension: { 
                      type: Type.STRING,
                      description: `Must be exactly one of: ${selectedDimensions.join(', ')}`,
                      enum: selectedDimensions
                    },
                    findings: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          segment_id: { type: Type.STRING },
                          severity: { type: Type.INTEGER },
                          detector_log: { type: Type.STRING },
                          nuance_log: { type: Type.STRING },
                          review: { type: Type.STRING },
                          impact_statement: { type: Type.STRING, description: "Synthesize the detector and nuance logs into a single pedagogical sentence (e.g., 'The Detector found Severe Erasure here, and the Nuance Specialist agreed there is no pedagogical justification.')." }
                        },
                        required: ["segment_id", "severity", "detector_log", "nuance_log", "impact_statement", "review"]
                      }
                    }
                  },
                  required: ["dimension", "findings"]
                }
              }
            },
            required: ["results"]
          }
        }
      });

      function sanitizeOrchestratorOutput(llmPayload: AssessmentResult, activeDimensions: string[]) {
         return llmPayload.results.filter(finding => 
             activeDimensions.includes(finding.dimension)
         );
      }

      if (orchResponse.text) {
        const jsonStr = orchResponse.text.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(jsonStr) as AssessmentResult;
        
        // Apply The Pruning Middleware
        parsed.results = sanitizeOrchestratorOutput(parsed, selectedDimensions);
        
        setResults(parsed);
        
        // Initialize state
        if (parsed.results.length > 0) {
          setActiveDimension(parsed.results[0].dimension);
        }

        // Fetch Quantitative Metrics
        try {
          const metricsRes = await fetch('/api/metrics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ results: parsed.results, totalSegments: parsedSegments.length })
          });
          if (metricsRes.ok) {
            const metricsData = await metricsRes.json();
            setMetrics(metricsData);
          }
        } catch (e) {
          console.error("Failed to fetch metrics", e);
        }
        
        setAppState('ANALYSIS');
        setWorkflowStatus('complete');
      } else {
        throw new Error("No response generated.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred during the multi-agent simulation. Please try again.");
      setAppState('INGEST');
      setWorkflowStatus('idle');
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f4f0] dark:bg-[#1e1e1e] text-stone-800 dark:text-stone-200 font-sans selection:bg-orange-100 dark:selection:bg-orange-900/30 overflow-x-hidden transition-colors duration-300">
      <AnimatePresence mode="wait">
        
        {/* ================= STATE A: INGEST ================= */}
        {appState === 'INGEST' && (
          <motion.div 
            key="ingest"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="min-h-screen flex items-center justify-center p-6 relative"
          >
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="absolute top-6 left-6 p-2 text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 rounded-full transition-colors z-50"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
              <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-50/50 dark:bg-orange-900/10 blur-3xl" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-stone-100/50 dark:bg-stone-800/20 blur-3xl" />
            </div>

            {/* Zero-State Landing Page */}
            <div className="relative z-10 w-full max-w-3xl bg-white/70 dark:bg-[#252525]/80 backdrop-blur-xl border border-stone-200/60 dark:border-stone-700/50 shadow-2xl rounded-3xl p-10 md:p-16 text-center">
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors group"
                title="Open Configuration"
              >
                <span className="text-[10px] font-bold uppercase tracking-widest">Configuration</span>
                <Settings className="w-4 h-4" />
              </button>

              <div className="mx-auto flex items-center justify-center mb-8">
                <AigoraLogo className="h-16 w-auto text-stone-900 dark:text-stone-100" />
              </div>
              
              <h1 className="text-3xl md:text-4xl font-serif font-medium text-stone-900 dark:text-stone-100 mb-4 tracking-tight">
                Bias Scanner
              </h1>
              <p className="text-stone-500 dark:text-stone-400 mb-12 max-w-lg mx-auto leading-relaxed">
                Input text, Upload files or take a photo of a text to analyze it on Bias
              </p>

              <UnifiedInput 
                value={text}
                onChange={setText}
                onAnalyze={handleAnalyze}
                onFileProcessed={(t) => setText(prev => prev ? prev + "\n\n" + t : t)}
                isProcessing={appState === 'PROCESSING'}
                isExtracting={isExtracting}
                setIsExtracting={setIsExtracting}
              />

              {error && (
                <div className="mt-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/30 rounded-xl flex items-start gap-3 text-rose-600 dark:text-rose-400 text-sm text-left">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              {/* Progress Footer */}
              <div className="mt-12 pt-8 border-t border-stone-100 dark:border-stone-800 flex items-center justify-center gap-8 md:gap-16">
                <div className="flex flex-col items-center gap-2 group">
                  <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500">Input</span>
                </div>
                
                <div className="h-px w-8 bg-stone-200 dark:bg-stone-800" />
                
                <div className="flex flex-col items-center gap-2 group">
                  <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
                    <Settings className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500">Config</span>
                </div>
                
                <div className="h-px w-8 bg-stone-200 dark:bg-stone-800" />
                
                <div className="flex flex-col items-center gap-2 group">
                  <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
                    <BrainCircuit className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500">Analyze</span>
                </div>
              </div>

            </div>

            {/* Parameter Sidebar / Drawer */}
            <AnimatePresence>
              {isSettingsOpen && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsSettingsOpen(false)}
                    className="fixed inset-0 bg-stone-900/20 dark:bg-black/40 backdrop-blur-sm z-40"
                  />
                  <motion.div 
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-[#252525] shadow-2xl z-50 border-l border-stone-200 dark:border-stone-800 flex flex-col"
                  >
                    <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
                      <h2 className="text-lg font-serif font-medium flex items-center gap-2 text-stone-900 dark:text-stone-100">
                        <Settings className="w-5 h-5 text-stone-400 dark:text-stone-500" />
                        Configuration
                      </h2>
                      <button onClick={() => setIsSettingsOpen(false)} className="p-2 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="p-6 flex-1 overflow-y-auto space-y-8 custom-scrollbar">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-stone-700 dark:text-stone-300">Agent Sensitivity (Rigor)</label>
                          <span className="text-xs font-mono text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded">{agentRigor}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" max="100" 
                          value={agentRigor} 
                          onChange={(e) => setAgentRigor(Number(e.target.value))}
                          className="w-full h-2 bg-stone-100 dark:bg-stone-800 rounded-lg appearance-none cursor-pointer accent-[#d97757]"
                        />
                        <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">Determines the threshold for the Bias Detector to flag structural anomalies. Higher rigor increases false positives.</p>
                      </div>

                      <div className="space-y-4">
                        <label className="text-sm font-medium text-stone-700 dark:text-stone-300">Reference Dimensions</label>
                        <div className="space-y-2">
                          {availableDimensions.map(dim => (
                            <label key={dim.id} className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-[#1e1e1e] border border-stone-200 dark:border-stone-700 rounded-xl cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
                              <input
                                type="checkbox"
                                checked={selectedDimensions.includes(dim.id)}
                                onChange={() => toggleDimension(dim.id)}
                                className="w-4 h-4 text-[#d97757] bg-white border-stone-300 rounded focus:ring-[#d97757] dark:focus:ring-[#d97757] dark:ring-offset-stone-800 focus:ring-2 dark:bg-stone-700 dark:border-stone-600"
                              />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-stone-700 dark:text-stone-300 capitalize">{dim.id.replace(/-/g, ' ')}</span>
                                <span className="text-[10px] text-stone-500 dark:text-stone-400 line-clamp-2">{dim.description}</span>
                              </div>
                            </label>
                          ))}

                          <div className="flex items-center gap-3 p-3 bg-stone-50/50 dark:bg-[#1e1e1e]/50 border border-dashed border-stone-200 dark:border-stone-700 rounded-xl opacity-60 cursor-not-allowed group relative overflow-hidden">
                            <div className="w-4 h-4 flex items-center justify-center border border-stone-300 dark:border-stone-600 rounded bg-white dark:bg-stone-800">
                              <Plus className="w-3 h-3 text-stone-400" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-stone-500 dark:text-stone-400">Add dimension</span>
                              <span className="text-[10px] text-orange-600/70 dark:text-orange-400/70 font-bold uppercase tracking-wider">Coming Soon</span>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ================= STATE B: PROCESSING ================= */}
        {appState === 'PROCESSING' && (
          <motion.div 
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center bg-[#f5f4f0] dark:bg-[#1e1e1e] relative z-20"
          >
            <div className="relative w-[400px] h-[400px] flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none" viewBox="0 0 400 400">
                <polygon 
                  points="200,60 340,300 60,300" 
                  fill="none" 
                  stroke="currentColor" 
                  className="text-stone-200 dark:text-stone-800"
                  strokeWidth="2" 
                  strokeLinejoin="round"
                />
                <motion.polygon 
                  points="200,60 340,300 60,300" 
                  fill="none" 
                  stroke="#d97757" 
                  strokeWidth="3" 
                  strokeLinejoin="round"
                  strokeDasharray="100 800"
                  initial={{ strokeDashoffset: 900 }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="drop-shadow-[0_0_8px_rgba(217,119,87,0.6)]"
                />
              </svg>

              <div className="absolute top-[20px] flex flex-col items-center">
                <div className="w-16 h-16 bg-white dark:bg-[#252525] border border-stone-200 dark:border-stone-700 shadow-xl rounded-full flex items-center justify-center z-10">
                  <Scale className="w-6 h-6 text-stone-700 dark:text-stone-300" />
                </div>
                <span className="mt-3 text-xs font-mono font-medium text-stone-500 dark:text-stone-400 uppercase tracking-widest bg-white/80 dark:bg-[#252525]/80 px-2 py-1 rounded">Orchestrator</span>
              </div>

              <div className="absolute bottom-[40px] left-[20px] flex flex-col items-center">
                <div className="w-16 h-16 bg-white dark:bg-[#252525] border border-rose-100 dark:border-rose-900/30 shadow-xl shadow-rose-500/10 rounded-full flex items-center justify-center z-10">
                  <ShieldAlert className="w-6 h-6 text-rose-500 dark:text-rose-400" />
                </div>
                <span className="mt-3 text-xs font-mono font-medium text-rose-500/70 dark:text-rose-400/70 uppercase tracking-widest bg-white/80 dark:bg-[#252525]/80 px-2 py-1 rounded">Detector</span>
              </div>

              <div className="absolute bottom-[40px] right-[20px] flex flex-col items-center">
                <div className="w-16 h-16 bg-white dark:bg-[#252525] border border-emerald-100 dark:border-emerald-900/30 shadow-xl shadow-emerald-500/10 rounded-full flex items-center justify-center z-10">
                  <BrainCircuit className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
                </div>
                <span className="mt-3 text-xs font-mono font-medium text-emerald-500/70 dark:text-emerald-400/70 uppercase tracking-widest bg-white/80 dark:bg-[#252525]/80 px-2 py-1 rounded">Nuance</span>
              </div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-16 text-center"
            >
              <h2 className="font-serif text-2xl text-stone-800 dark:text-stone-200 mb-2">Synthesizing Dialectic</h2>
              <p className="text-stone-500 dark:text-stone-400 font-sans text-sm animate-pulse">
                {workflowStatus === 'detector' && "Agent 1: Detector analyzing segments..."}
                {workflowStatus === 'nuance' && "Agent 2: Nuance Specialist reviewing flags..."}
                {workflowStatus === 'orchestrator' && "Agent 3: Orchestrator finalizing consensus..."}
              </p>
            </motion.div>

            {/* Quiz Distraction */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1 }}
              className="mt-12 w-full max-w-md bg-white dark:bg-[#252525] border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xl relative z-30"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">Bias Quiz</span>
                <span className="text-[10px] font-mono text-stone-400">{currentQuizIdx + 1} / {QUIZ_DATA.length}</span>
              </div>
              
              <p className="text-sm font-serif text-stone-800 dark:text-stone-200 mb-6 leading-relaxed">
                "{QUIZ_DATA[currentQuizIdx].sentence}"
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleQuizAnswer(true)}
                  disabled={quizAnswered !== null}
                  className={`py-2 rounded-xl border font-bold text-[10px] uppercase tracking-widest transition-all ${
                    quizAnswered === null 
                      ? 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800' 
                      : quizAnswered === true && QUIZ_DATA[currentQuizIdx].isBiased 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                        : quizAnswered === true && !QUIZ_DATA[currentQuizIdx].isBiased
                          ? 'bg-rose-50 border-rose-200 text-rose-600'
                          : 'opacity-50'
                  }`}
                >
                  Biased
                </button>
                <button 
                  onClick={() => handleQuizAnswer(false)}
                  disabled={quizAnswered !== null}
                  className={`py-2 rounded-xl border font-bold text-[10px] uppercase tracking-widest transition-all ${
                    quizAnswered === null 
                      ? 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800' 
                      : quizAnswered === false && !QUIZ_DATA[currentQuizIdx].isBiased 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                        : quizAnswered === false && QUIZ_DATA[currentQuizIdx].isBiased
                          ? 'bg-rose-50 border-rose-200 text-rose-600'
                          : 'opacity-50'
                  }`}
                >
                  Neutral
                </button>
              </div>
              
              <AnimatePresence>
                {quizAnswered !== null && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 overflow-hidden"
                  >
                    <div className="p-3 bg-stone-50 dark:bg-stone-900/50 rounded-xl border border-stone-100 dark:border-stone-800">
                      <p className="text-[10px] text-stone-600 dark:text-stone-400 leading-relaxed italic">
                        {QUIZ_DATA[currentQuizIdx].explanation}
                      </p>
                      <button 
                        onClick={nextQuiz}
                        className="mt-3 w-full py-1 text-[9px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-600 transition-colors"
                      >
                        Next Question
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}

        {/* ================= STATE C: ANALYSIS ================= */}
        {appState === 'ANALYSIS' && results && (
          <motion.div 
            key="analysis"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-screen flex flex-col bg-[#f5f4f0] dark:bg-[#1e1e1e] overflow-hidden"
          >
            <header className="px-8 py-5 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center bg-[#f5f4f0]/80 dark:bg-[#1e1e1e]/80 backdrop-blur-md sticky top-0 z-30">
              <div className="flex items-center gap-4">
                <AigoraLogo className="h-8 w-auto text-stone-900 dark:text-stone-100" />
                <div className="h-8 w-px bg-stone-200 dark:bg-stone-700" />
                <div>
                  <h1 className="font-serif text-xl font-medium text-stone-900 dark:text-stone-100 leading-none">Externalized Cognitive Map</h1>
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-sans mt-1">Ordinal Salience Hierarchy</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="p-2 text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 rounded-full transition-colors"
                >
                  {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => {
                    setAppState('INGEST');
                    setActiveDimension(null);
                    setActiveSegmentId(null);
                  }}
                  className="text-sm font-medium text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  New Analysis
                </button>
              </div>
            </header>

            <main className="flex-1 max-w-[1600px] w-full mx-auto p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 relative overflow-hidden">
              {(() => {
                const activeDimInfo = availableDimensions.find(d => d.id.toLowerCase() === activeDimension?.toLowerCase());
                return (
                  <>
                    {/* Left Column: Annotated Prose Component */}
                    <div className="lg:col-span-5 relative z-10 h-full overflow-hidden">
                      <div className="h-full bg-white dark:bg-[#1e1e1e] border border-stone-200 dark:border-stone-800 rounded-2xl p-6 md:p-8 shadow-sm overflow-y-auto custom-scrollbar text-sm leading-relaxed text-stone-800 dark:text-stone-200 relative">
                        <div className="mb-6 flex items-center gap-4 text-[10px] font-sans text-stone-400 dark:text-stone-500 uppercase tracking-widest">
                          <FileText className="w-4 h-4" />
                          <h2>Semantic Segmentation View</h2>
                          <div className="h-px bg-stone-100 dark:bg-stone-800 flex-1" />
                        </div>
                        
                        <div className="font-serif text-sm leading-[1.8] text-stone-800 dark:text-stone-200 text-justify">
                          {segments.map((segment) => {
                          const isActive = segment.id === activeSegmentId;
                          
                          // Find if this segment has a finding in the active dimension
                          const activeDimData = results.results.find(d => d.dimension === activeDimension);
                          const finding = activeDimData?.findings.find(f => f.segment_id === segment.id);
                    
                    let bgColorClass = '';
                    let borderClass = '';
                    let opacityClass = 'opacity-100';
                    
                    if (finding && activeDimension) {
                      const colors = getDimensionColor(activeDimension, finding.severity, isDarkMode);
                      bgColorClass = colors.bg;
                      borderClass = `border-b-2 ${colors.border}`;
                    } else if (activeSegmentId) {
                      // Dim non-active segments when something is selected
                      opacityClass = 'opacity-40';
                    }

                    return (
                      <BiasSegment
                        key={segment.id}
                        segment={segment}
                        finding={finding}
                        isActive={isActive}
                        activeDimension={activeDimension}
                        isDarkMode={isDarkMode}
                        getDimensionColor={getDimensionColor}
                        onClick={() => {
                          if (finding) {
                            setActiveSegmentId(isActive ? null : segment.id);
                          }
                        }}
                        bgColorClass={bgColorClass}
                        borderClass={borderClass}
                        opacityClass={opacityClass}
                      />
                    );
                  })}
                </div>
                </div>
              </div>

              {/* Right Column: Analytics Sidebar */}
              <div className="lg:col-span-7 space-y-6 relative z-10 flex flex-col h-full overflow-hidden">
                
                {/* Quantitative Metrics Dashboard */}
                {metrics && (
                  <div className="grid grid-cols-1 gap-4 shrink-0">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white dark:bg-[#252525] border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-sm flex flex-col">
                        <div className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-4 flex items-center gap-1.5">
                          <Activity className="w-3 h-3" /> Toxic Load
                        </div>
                        <SemanticThermometer value={metrics.swbd} max={50} />
                      </div>
                      
                      <div className="bg-white dark:bg-[#252525] border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-sm flex flex-col items-center relative">
                        <div className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-4 w-full text-left flex items-center gap-1.5">
                          <FileSearch className="w-3 h-3" /> Dimensional Dominance
                        </div>
                        <NightingaleRose data={metrics.dimensionStats} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Dimension Tabs */}
                <div className="flex flex-col gap-3 shrink-0">
                  <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {results.results.map((dimResult) => (
                      <div 
                        key={dimResult.dimension} 
                        className={`flex items-center rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                          activeDimension === dimResult.dimension
                            ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 shadow-md border-transparent'
                            : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50 dark:bg-[#252525] dark:text-stone-400 dark:border-stone-800 dark:hover:bg-stone-800 cursor-pointer'
                        }`}
                        onClick={() => {
                          if (activeDimension !== dimResult.dimension) {
                            setActiveDimension(dimResult.dimension);
                            setActiveSegmentId(null);
                          }
                        }}
                      >
                        <div className="px-4 py-2 flex items-center gap-2">
                          {dimResult.dimension}
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                            activeDimension === dimResult.dimension 
                              ? 'bg-stone-700 text-stone-200 dark:bg-stone-300 dark:text-stone-800' 
                              : 'bg-stone-200/50 dark:bg-stone-700/50'
                          }`}>
                            {dimResult.findings.length}
                          </span>
                        </div>
                        
                        {activeDimension === dimResult.dimension && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDimInfo(!showDimInfo);
                            }}
                            className={`p-1.5 mr-1.5 rounded-full transition-colors ${
                              showDimInfo 
                                ? 'bg-stone-600 text-white dark:bg-stone-400 dark:text-stone-900' 
                                : 'text-stone-400 hover:bg-stone-600 hover:text-white dark:hover:bg-stone-400 dark:hover:text-stone-900'
                            }`}
                            title="Dimension Info"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <AnimatePresence>
                    {showDimInfo && activeDimInfo && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/30 rounded-xl mb-2">
                          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed italic">
                            {activeDimInfo.description}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Cards List */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                  {results.results
                    .find(d => d.dimension === activeDimension)
                    ?.findings
                    .sort((a, b) => b.severity - a.severity)
                    .map((finding) => {
                      const isActive = activeSegmentId === finding.segment_id;
                      const originalText = segments.find(s => s.id === finding.segment_id)?.text || "";
                      
                      return (
                        <BiasCard
                          key={finding.segment_id}
                          finding={finding}
                          dimension={activeDimension || ""}
                          isDarkMode={isDarkMode}
                          getDimensionColor={getDimensionColor}
                          isActive={isActive}
                          onSelect={() => setActiveSegmentId(isActive ? null : finding.segment_id)}
                          originalText={originalText}
                        />
                      );
                    })}
                    
                  {results.results.find(d => d.dimension === activeDimension)?.findings.length === 0 && (
                    <div className="p-8 text-center text-stone-500 dark:text-stone-400 border border-dashed border-stone-300 dark:border-stone-700 rounded-2xl">
                      No significant bias detected for this dimension.
                    </div>
                  )}
                </div>
              </div>
            </>
          );
        })()}
      </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
