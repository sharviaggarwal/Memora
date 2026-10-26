import React from 'react';
import type { DocumentInfo } from '../types';
import { FileText, Layers, CheckCircle2, Search, ArrowRight, ShieldCheck } from 'lucide-react';

interface DocumentsViewProps {
  documents: DocumentInfo[];
  totalChunks: number;
  onAskDocQuestion: (query: string) => void;
  loading: boolean;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  totalChunks,
  onAskDocQuestion,
  loading,
}) => {
  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDE8F5] text-[#7C3AED] text-xs font-bold uppercase tracking-wide mb-2">
          <FileText className="w-3.5 h-3.5" />
          <span>RAG Knowledge Base</span>
        </div>
        <h2 className="font-['Syne',sans-serif] text-2xl sm:text-3xl font-extrabold text-[#0F0E17]">
          Document Index
        </h2>
        <p className="text-xs sm:text-sm text-[#6E6879] mt-0.5">
          Documents chunked, embedded with SentenceTransformers, and stored in ChromaDB for grounded factual Q&A.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C849B]">
            Indexed Documents
          </span>
          <div className="text-2xl font-extrabold text-[#0F0E17] font-['Syne',sans-serif] mt-1">
            {documents.length}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C849B]">
            Total Document Chunks
          </span>
          <div className="text-2xl font-extrabold text-[#7C3AED] font-['Syne',sans-serif] mt-1">
            {totalChunks}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C849B]">
            Embedding Model
          </span>
          <div className="text-xs font-bold text-[#0F0E17] mt-2 font-mono bg-[#EDE8F5] px-2 py-1 rounded-lg inline-block">
            all-MiniLM-L6-v2
          </div>
        </div>
      </div>

      {/* Document Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-xs font-medium text-[#6E6879]">
            Loading indexed documents...
          </div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-purple-100">
            <div className="w-12 h-12 rounded-2xl bg-[#EDE8F5] mx-auto flex items-center justify-center text-[#7C3AED] mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="font-['Syne',sans-serif] text-base font-bold text-[#0F0E17] mb-1">
              No documents indexed yet
            </h4>
            <p className="text-xs text-[#8C849B]">
              Add PDF documents to your Memora workspace to query them via RAG.
            </p>
          </div>
        ) : (
          documents.map((doc, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-6 border border-purple-100 shadow-xs hover:shadow-sm hover:border-purple-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#EDE8F5] flex items-center justify-center text-[#7C3AED] shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#0F0E17] font-['Syne',sans-serif]">
                    {doc.name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-[#6E6879]">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F8F6FC] border border-purple-100 font-semibold text-[#7C3AED]">
                      <Layers className="w-3 h-3" />
                      <span>{doc.chunk_count} semantic chunks</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Indexed & Searchable</span>
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onAskDocQuestion('What is environment?')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#EDE8F5] hover:bg-[#E5DEFF] text-[#7C3AED] text-xs font-bold tracking-wide transition-all cursor-pointer self-start sm:self-auto"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Ask: "What is environment?"</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* RAG Information Card */}
      <div className="p-6 rounded-3xl bg-[#EDE8F5]/60 border border-purple-200/50">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-[#7C3AED] shadow-xs shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h5 className="font-['Syne',sans-serif] text-sm font-bold text-[#0F0E17] mb-1">
              Grounded Question Answering
            </h5>
            <p className="text-xs text-[#6E6879] leading-relaxed">
              When you ask questions about documents, Memora's AI router recognizes RAG intent, fetches
              the most semantically relevant text chunks from ChromaDB, and synthesizes answers exclusively
              from your context while citing the exact source file and page numbers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
