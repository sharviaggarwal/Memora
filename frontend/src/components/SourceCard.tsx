import React, { useState } from 'react';
import type { Source } from '../types';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface SourceCardProps {
  sources: Source[];
}

export const SourceCard: React.FC<SourceCardProps> = ({ sources }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-purple-100/70">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs font-semibold text-[#7C3AED] hover:text-[#6D28D9] transition-colors cursor-pointer select-none"
      >
        <FileText className="w-3.5 h-3.5" />
        <span>
          {sources.length} document source{sources.length > 1 ? 's' : ''} referenced
        </span>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {isOpen && (
        <div className="mt-2.5 space-y-2">
          {sources.map((s, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-[#F8F6FC] border border-purple-100/80 text-xs text-[#2B283A] transition-all"
            >
              <div className="flex items-center justify-between font-semibold text-[#0F0E17] mb-1">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3 h-3 text-[#7C3AED]" />
                  <span>{s.source}</span>
                </span>
                <span className="text-[11px] font-medium text-[#7C3AED] bg-[#EDE8F5] px-2 py-0.5 rounded-full">
                  Page {s.page}
                </span>
              </div>
              {s.snippet && (
                <p className="text-[#6E6879] text-[11px] leading-relaxed italic line-clamp-3 mt-1 pl-4 border-l-2 border-purple-200">
                  "{s.snippet}"
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
