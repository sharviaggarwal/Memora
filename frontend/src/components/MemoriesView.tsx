import React, { useState } from 'react';
import type { MemoryItem } from '../types';
import { Brain, Plus, Tag, Calendar, User } from 'lucide-react';

interface MemoriesViewProps {
  memories: MemoryItem[];
  onAddMemory: (text: string, type: string) => Promise<void>;
  loading: boolean;
}

export const MemoriesView: React.FC<MemoriesViewProps> = ({
  memories,
  onAddMemory,
  loading,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMemoryText, setNewMemoryText] = useState('');
  const [newMemoryType, setNewMemoryType] = useState('preference');
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryText.trim()) return;
    setSubmitting(true);
    try {
      await onAddMemory(newMemoryText.trim(), newMemoryType);
      setNewMemoryText('');
      setShowAddModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Title & Add Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDE8F5] text-[#7C3AED] text-xs font-bold uppercase tracking-wide mb-2">
            <Brain className="w-3.5 h-3.5" />
            <span>ChromaDB Vector Store</span>
          </div>
          <h2 className="font-['Syne',sans-serif] text-2xl sm:text-3xl font-extrabold text-[#0F0E17]">
            Personal Semantic Memories
          </h2>
          <p className="text-xs sm:text-sm text-[#6E6879] mt-0.5">
            Facts and preferences stored as high-dimensional embeddings for immediate conversational retrieval.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0F0E17] hover:bg-[#252233] text-white text-xs font-bold tracking-wide transition-all shadow-xs cursor-pointer self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Memory</span>
        </button>
      </div>

      {/* Grid of Memories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 p-12 text-center text-xs font-medium text-[#6E6879]">
            Loading stored memories from ChromaDB...
          </div>
        ) : memories.length === 0 ? (
          <div className="col-span-2 p-12 text-center bg-white rounded-3xl border border-purple-100">
            <div className="w-12 h-12 rounded-2xl bg-[#EDE8F5] mx-auto flex items-center justify-center text-[#7C3AED] mb-3">
              <Brain className="w-6 h-6" />
            </div>
            <h4 className="font-['Syne',sans-serif] text-base font-bold text-[#0F0E17] mb-1">
              No memories stored yet
            </h4>
            <p className="text-xs text-[#8C849B]">
              Add a personal memory or ask Memora to remember facts for you.
            </p>
          </div>
        ) : (
          memories.map((mem) => (
            <div
              key={mem.id}
              className="bg-white rounded-[24px] p-5 border border-purple-100/90 shadow-xs hover:shadow-sm hover:border-purple-200 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EDE8F5] text-[#7C3AED]">
                    <Tag className="w-2.5 h-2.5" />
                    <span>{mem.type}</span>
                  </span>
                  <span className="text-[11px] font-medium text-[#A49EAE]">
                    ID: {mem.id}
                  </span>
                </div>
                <p className="text-sm font-semibold text-[#0F0E17] leading-relaxed">
                  "{mem.text}"
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-purple-100/50 text-[11px] text-[#8C849B]">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3 text-[#7C3AED]" />
                  <span>Source: {mem.source}</span>
                </span>
                {mem.created_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(mem.created_at).toLocaleDateString()}</span>
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F0E17]/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-[32px] p-6 sm:p-8 max-w-md w-full border border-purple-100 shadow-2xl relative">
            <h3 className="font-['Syne',sans-serif] text-xl font-extrabold text-[#0F0E17] mb-1">
              Store New Memory
            </h3>
            <p className="text-xs text-[#6E6879] mb-5">
              Save personal facts, favorites, or key notes for semantic retrieval.
            </p>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0F0E17] mb-1.5">
                  Memory Statement
                </label>
                <textarea
                  rows={3}
                  value={newMemoryText}
                  onChange={(e) => setNewMemoryText(e.target.value)}
                  placeholder="e.g. My favorite coffee is oat milk latte."
                  required
                  className="w-full px-4 py-3 bg-[#F8F6FC] border border-purple-100 rounded-2xl text-sm text-[#0F0E17] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0F0E17] mb-1.5">
                  Category
                </label>
                <select
                  value={newMemoryType}
                  onChange={(e) => setNewMemoryType(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F8F6FC] border border-purple-100 rounded-2xl text-sm text-[#0F0E17] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]"
                >
                  <option value="preference">Preference / Favorite</option>
                  <option value="deadline">Personal Deadline</option>
                  <option value="fact">Personal Fact</option>
                  <option value="note">General Note</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-full text-xs font-bold text-[#6E6879] hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newMemoryText.trim()}
                  className="px-5 py-2.5 rounded-full bg-[#0F0E17] hover:bg-[#252233] text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {submitting ? 'Storing...' : 'Save to ChromaDB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
