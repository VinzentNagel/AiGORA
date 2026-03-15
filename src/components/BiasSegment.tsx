import React, { useState } from 'react';
import { 
  useFloating, 
  autoUpdate, 
  offset, 
  flip, 
  shift, 
  useHover, 
  useInteractions, 
  FloatingPortal,
  FloatingArrow,
  arrow
} from '@floating-ui/react';
import { ShieldAlert, BrainCircuit, Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DiffViewer } from './DiffViewer';
import { remediateSegment } from '../services/remediationService';

interface Finding {
  segment_id: string;
  severity: number;
  detector_log: string;
  nuance_log: string;
  impact_statement: string;
  review: string;
}

interface Remediation {
  explanation: string;
  neutralized_text: string;
}

interface BiasSegmentProps {
  segment: { id: string; text: string };
  finding?: Finding;
  isActive: boolean;
  activeDimension: string | null;
  isDarkMode: boolean;
  getDimensionColor: (dimension: string, severity: number, isDark: boolean) => any;
  onClick: () => void;
  bgColorClass: string;
  borderClass: string;
  opacityClass: string;
}

export const BiasSegment: React.FC<BiasSegmentProps> = ({
  segment,
  finding,
  isActive,
  activeDimension,
  isDarkMode,
  getDimensionColor,
  onClick,
  bgColorClass,
  borderClass,
  opacityClass
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRemediating, setIsRemediating] = useState(false);
  const [remediation, setRemediation] = useState<Remediation | null>(null);
  const [showRemediation, setShowRemediation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRemediate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setError(null);
    if (!finding || !activeDimension) return;
    
    if (remediation) {
      setShowRemediation(!showRemediation);
      return;
    }

    setIsRemediating(true);
    try {
      // 1. Fetch the dimension document first
      const dimResp = await fetch(`/api/agents/detector/dimensions/${activeDimension}`);
      if (!dimResp.ok) throw new Error('Failed to fetch dimension criteria');
      const dimDoc = await dimResp.text();

      if (!dimDoc) throw new Error('Dimension criteria document is empty');

      // 2. Call the client-side remediation service
      const data = await remediateSegment(
        segment.text,
        dimDoc,
        finding.detector_log,
        finding.severity
      );

      setRemediation(data);
      setShowRemediation(true);
    } catch (err: any) {
      console.error("Remediation error:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsRemediating(false);
    }
  };

  const { refs, floatingStyles, context, placement } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'top',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(12),
      flip({
        fallbackAxisSideDirection: 'start',
      }),
      shift({ padding: 10 }),
    ],
  });

  const hover = useHover(context, {
    move: false,
    enabled: !!finding && !!activeDimension,
    delay: { open: 100, close: 100 },
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

  const colorData = activeDimension && finding ? getDimensionColor(activeDimension, finding.severity, isDarkMode) : null;
  const isTop = placement.startsWith('top');

  return (
    <>
      <span
        ref={refs.setReference}
        {...getReferenceProps()}
        id={`span-${segment.id}`}
        className={`transition-all duration-300 relative ${finding ? 'cursor-pointer' : ''} ${isActive ? 'ring-2 ring-stone-400 dark:ring-stone-500 rounded-sm shadow-sm' : ''} ${bgColorClass} ${borderClass} ${opacityClass} px-1 mx-0.5`}
        onClick={onClick}
      >
        {segment.text}
      </span>

      <FloatingPortal>
        <AnimatePresence>
          {isOpen && finding && activeDimension && (
            <motion.div
              ref={refs.setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
              initial={{ opacity: 0, scale: 0.95, y: isTop ? 5 : -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: isTop ? 5 : -5 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="z-[100] p-4 bg-white/95 dark:bg-stone-900/95 text-stone-800 dark:text-stone-200 text-[11px] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.25)] w-[320px] pointer-events-auto border border-stone-200 dark:border-stone-800 backdrop-blur-md"
            >
              {/* Top Accent Line */}
              <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl ${colorData?.dot}`} />
              
              <div className="flex items-center gap-2 mb-2 text-rose-600 dark:text-rose-400 font-bold uppercase tracking-[0.15em] font-sans text-[9px]">
                <ShieldAlert className="w-3.5 h-3.5" /> WHY IT IS BIAS
              </div>
              <p className="font-serif leading-relaxed text-stone-700 dark:text-stone-300 mb-3">{finding.detector_log}</p>
              
              <div className="pt-3 border-t border-stone-100 dark:border-stone-800">
                <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-[0.15em] font-sans text-[9px]">
                  <BrainCircuit className="w-3.5 h-3.5" /> WHY IT IS NOT
                </div>
                <p className="font-serif leading-relaxed text-stone-500 dark:text-stone-400 italic mb-3">{finding.nuance_log}</p>
              </div>

              <div className="pt-3 border-t border-stone-100 dark:border-stone-800">
                <div className="flex items-center gap-2 mb-2 text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-[0.15em] font-sans text-[9px]">
                  <Sparkles className="w-3.5 h-3.5" /> REVIEW
                </div>
                <p className="font-serif leading-relaxed text-stone-500 dark:text-stone-400 italic mb-4">{finding.review}</p>
              </div>

              {/* Remediation Section */}
              <div className="pt-3 border-t border-stone-100 dark:border-stone-800">
                {!remediation && !isRemediating ? (
                  <div className="space-y-2">
                    <button 
                      onClick={handleRemediate}
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl hover:bg-stone-800 dark:hover:bg-white transition-all group pointer-events-auto"
                    >
                      <Sparkles className="w-3 h-3 text-orange-400" />
                      <span className="font-sans font-bold uppercase tracking-widest text-[8px]">Explain & Propose Fix</span>
                    </button>
                    {error && <p className="text-[8px] text-rose-500 text-center font-medium">{error}</p>}
                  </div>
                ) : isRemediating ? (
                  <div className="flex items-center justify-center gap-2 py-2 text-stone-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="font-sans font-bold uppercase tracking-widest text-[8px]">Agent Rewriting...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <button 
                      onClick={() => setShowRemediation(!showRemediation)}
                      className="w-full flex items-center justify-between py-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
                    >
                      <span className="font-sans font-bold uppercase tracking-widest text-[8px]">Remediation Agent Output</span>
                      {showRemediation ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    
                    {showRemediation && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-4 overflow-hidden"
                      >
                        <div className="p-3 bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/30 rounded-xl">
                          <p className="font-serif leading-relaxed text-stone-700 dark:text-stone-300 italic">
                            {remediation.explanation}
                          </p>
                        </div>
                        <DiffViewer oldText={segment.text} newText={remediation.neutralized_text} />
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Triangle Pointer */}
              <div 
                className={`absolute left-1/2 -translate-x-1/2 ${isTop ? 'top-full' : 'bottom-full'}`}
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderTop: isTop ? (isDarkMode ? '8px solid rgba(28, 25, 23, 0.95)' : '8px solid rgba(255, 255, 255, 0.95)') : 'none',
                  borderBottom: !isTop ? (isDarkMode ? '8px solid rgba(28, 25, 23, 0.95)' : '8px solid rgba(255, 255, 255, 0.95)') : 'none',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </FloatingPortal>
    </>
  );
};
