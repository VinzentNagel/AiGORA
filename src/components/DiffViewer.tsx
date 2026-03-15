import React from 'react';
import { diffWords } from 'diff';

interface DiffViewerProps {
  oldText: string;
  newText: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ oldText, newText }) => {
  const diff = diffWords(oldText, newText);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Original</span>
          <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-100 dark:border-stone-800 text-stone-600 dark:text-stone-400 leading-relaxed italic">
            {oldText}
          </div>
        </div>
        <div className="space-y-2">
          <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-500">Neutralized</span>
          <div className="p-3 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-xl border border-emerald-100/50 dark:border-emerald-800/30 text-stone-800 dark:text-stone-200 leading-relaxed">
            {diff.map((part, index) => {
              if (part.added) {
                return (
                  <span key={index} className="bg-emerald-200/50 dark:bg-emerald-500/30 text-emerald-900 dark:text-emerald-100 px-0.5 rounded">
                    {part.value}
                  </span>
                );
              }
              if (part.removed) {
                return null; // Don't show removed parts in the neutralized view for clarity, or we can show them struck through
              }
              return <span key={index}>{part.value}</span>;
            })}
          </div>
        </div>
      </div>
      
      <div className="p-3 bg-stone-50 dark:bg-stone-800/30 rounded-xl border border-stone-100 dark:border-stone-800">
        <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400 block mb-2">Detailed Changes</span>
        <div className="text-[10px] leading-relaxed">
          {diff.map((part, index) => {
            const color = part.added 
              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' 
              : part.removed 
                ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 line-through' 
                : 'text-stone-500 dark:text-stone-400';
            
            return (
              <span key={index} className={`${color} px-0.5 rounded mx-px`}>
                {part.value}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};
