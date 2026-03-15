import React, { useState } from 'react';
import { ShieldAlert, BrainCircuit, Sparkles, Loader2, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
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

interface BiasCardProps {
  finding: Finding;
  dimension: string;
  isDarkMode: boolean;
  getDimensionColor: (dimension: string, severity: number, isDark: boolean) => any;
  isActive: boolean;
  onSelect: () => void;
  originalText: string;
}

export const BiasCard: React.FC<BiasCardProps> = ({
  finding,
  dimension,
  isDarkMode,
  getDimensionColor,
  isActive,
  onSelect,
  originalText
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRemediating, setIsRemediating] = useState(false);
  const [remediation, setRemediation] = useState<Remediation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const colors = getDimensionColor(dimension, finding.severity, isDarkMode);

  const handleRemediate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setError(null);
    
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }

    setIsExpanded(true);
    
    if (remediation) return;

    if (!originalText) {
      setError("Original text segment not found. Please try again.");
      return;
    }

    setIsRemediating(true);
    try {
      // 1. Fetch the dimension document
      const dimResp = await fetch(`/api/agents/detector/dimensions/${dimension}`);
      if (!dimResp.ok) throw new Error('Failed to fetch dimension criteria');
      const dimDoc = await dimResp.text();

      if (!dimDoc) {
        throw new Error('Dimension criteria document is empty');
      }

      // 2. Call the client-side remediation service
      const data = await remediateSegment(
        originalText,
        dimDoc,
        finding.detector_log,
        finding.severity
      );
      
      setRemediation(data);
    } catch (err: any) {
      console.error("Remediation error:", err);
      setError(err.message || "An unexpected error occurred during remediation.");
    } finally {
      setIsRemediating(false);
    }
  };

  return (
    <div 
      onClick={onSelect}
      className={`p-5 rounded-2xl border transition-all cursor-pointer ${
        isActive 
          ? `bg-white dark:bg-[#2a2a2a] ${colors.border} shadow-md scale-[1.01]` 
          : `bg-white/60 dark:bg-[#252525]/60 border-stone-200 dark:border-stone-800 hover:bg-white dark:hover:bg-[#2a2a2a]`
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono text-stone-500 dark:text-stone-400">Sentence {finding.segment_id.replace('s', '')}</span>
        <div className="flex items-center gap-1">
          <span className={`text-[10px] uppercase tracking-widest ${colors.text}`}>Severity</span>
          <div className="flex gap-0.5">
            {[1, 2, 3].map(level => (
              <div 
                key={level} 
                className={`w-2 h-2 rounded-full ${
                  level <= finding.severity 
                    ? colors.dot
                    : 'bg-stone-200 dark:bg-stone-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <h4 className="text-[10px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" /> WHY IT IS BIAS
          </h4>
          <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">{finding.detector_log}</p>
        </div>
        <div className="h-px w-full bg-stone-100 dark:bg-stone-800" />
        <div>
          <h4 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <BrainCircuit className="w-3 h-3" /> WHY IT IS NOT
          </h4>
          <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">{finding.nuance_log}</p>
        </div>
        <div className="h-px w-full bg-stone-100 dark:bg-stone-800" />
        <div>
          <h4 className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> REVIEW
          </h4>
          <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed italic">{finding.review}</p>
        </div>
      </div>

      {/* Subtle Remediation CTA */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleRemediate}
          className="flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors px-3 py-1.5 rounded-md group"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Close</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
              <span>Neutralize</span>
            </>
          )}
        </button>
      </div>

      {/* Expanded Detail View */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-6 mt-4 border-t border-stone-100 dark:border-stone-800 space-y-6">
              {isRemediating ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-stone-400">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                  <div className="space-y-2 w-full max-w-md px-4">
                    <div className="h-2 bg-stone-100 dark:bg-stone-800 rounded-full animate-pulse w-3/4 mx-auto" />
                    <div className="h-2 bg-stone-100 dark:bg-stone-800 rounded-full animate-pulse w-1/2 mx-auto" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest mt-2">Agent Rewriting...</span>
                </div>
              ) : error ? (
                <div className="p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/30 rounded-2xl text-center">
                  <p className="text-xs text-rose-600 dark:text-rose-400 mb-3">{error}</p>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsExpanded(false); handleRemediate(e); }}
                    className="text-[10px] font-bold uppercase tracking-widest text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 underline underline-offset-4"
                  >
                    Retry Analysis
                  </button>
                </div>
              ) : remediation ? (
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5" /> Neutralized Proposal
                    </h4>
                    <DiffViewer oldText={originalText} newText={remediation.neutralized_text} />
                  </div>
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
