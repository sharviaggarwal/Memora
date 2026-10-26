import React, { useState, useRef, useEffect } from 'react';
import type { Message } from '../types';
import { TaskCard } from './TaskCard';
import { SourceCard } from './SourceCard';
import {
  Sparkles,
  ArrowUp,
  Brain,
  FileText,
  CheckSquare,
  Database,
  AlertCircle
} from 'lucide-react';

interface ChatViewProps {
  messages: Message[];
  loading: boolean;
  onSendMessage: (query: string) => void;
  onCompleteTask?: (taskId: number) => void;
  onDeleteTask?: (taskId: number) => void;
  error?: string | null;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  loading,
  onSendMessage,
  onCompleteTask,
  onDeleteTask,
  error,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;
    const query = input.trim();
    setInput('');
    onSendMessage(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = (promptText: string) => {
    onSendMessage(promptText);
  };

  // Helper to render route badge
  const renderRouteBadge = (route?: string) => {
    switch (route) {
      case 'MEMORY':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#EDE8F5] text-[#7C3AED]">
            <Brain className="w-3 h-3" />
            <span>Memory</span>
          </span>
        );
      case 'RAG':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
            <FileText className="w-3 h-3" />
            <span>Document Knowledge</span>
          </span>
        );
      case 'ACTION':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-50 text-[#7C3AED] border border-purple-100">
            <CheckSquare className="w-3 h-3" />
            <span>Task Saved</span>
          </span>
        );
      case 'DATABASE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-violet-50 text-violet-700 border border-violet-100">
            <Database className="w-3 h-3" />
            <span>Task Database</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-gray-100 text-[#6E6879]">
            <Sparkles className="w-3 h-3 text-[#7C3AED]" />
            <span>Memora</span>
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between max-w-4xl w-full mx-auto px-4 sm:px-6 pt-4 pb-6">
      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto space-y-6 pb-6">
        {messages.length === 0 ? (
          /* Empty State - Editorial Layout Inspired by Reference */
          <div className="py-8 sm:py-12 flex flex-col items-center text-center">
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EDE8F5] border border-purple-200/60 text-[#7C3AED] text-xs font-bold uppercase tracking-wider mb-5 shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personal AI Memory & Action Assistant</span>
            </div>

            {/* Bold Headline */}
            <h1 className="font-['Syne',sans-serif] text-4xl sm:text-5xl font-extrabold tracking-tight text-[#0F0E17] max-w-2xl leading-[1.1] mb-4">
              REMEMBER ANYTHING. GET THINGS DONE.
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-[#6E6879] max-w-xl leading-relaxed mb-10">
              Memora remembers your personal preferences, queries your uploaded documents with RAG,
              and manages your schedule with natural language date understanding.
            </p>

            {/* 3 Hero Cards (Lavender Cards Inspired by Reference Image) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-10 text-left">
              {/* Card 1: Memory */}
              <div
                onClick={() => handleSuggestionClick('What is my favorite color?')}
                className="bg-[#EDE8F5] hover:bg-[#E5DEFF] p-6 rounded-[28px] border border-purple-200/60 transition-all cursor-pointer group shadow-xs hover:shadow-md flex flex-col justify-between h-56"
              >
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-[#7C3AED] shadow-xs mb-4 group-hover:scale-105 transition-transform">
                    <Brain className="w-5 h-5" />
                  </div>
                  <h3 className="font-['Syne',sans-serif] text-lg font-bold text-[#0F0E17] mb-1.5">
                    Personal Memory
                  </h3>
                  <p className="text-xs text-[#6E6879] leading-relaxed">
                    Recalls your favorite things, preferences, and private personal notes.
                  </p>
                </div>
                <div className="pt-3 border-t border-purple-200/50 flex items-center justify-between text-xs font-semibold text-[#7C3AED]">
                  <span>"What is my favorite color?"</span>
                  <span className="text-base group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>

              {/* Card 2: RAG */}
              <div
                onClick={() => handleSuggestionClick('What is environment?')}
                className="bg-[#EDE8F5] hover:bg-[#E5DEFF] p-6 rounded-[28px] border border-purple-200/60 transition-all cursor-pointer group shadow-xs hover:shadow-md flex flex-col justify-between h-56"
              >
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-[#7C3AED] shadow-xs mb-4 group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="font-['Syne',sans-serif] text-lg font-bold text-[#0F0E17] mb-1.5">
                    Document RAG
                  </h3>
                  <p className="text-xs text-[#6E6879] leading-relaxed">
                    Retrieves exact factual answers and citations from indexed PDFs.
                  </p>
                </div>
                <div className="pt-3 border-t border-purple-200/50 flex items-center justify-between text-xs font-semibold text-[#7C3AED]">
                  <span>"What is environment?"</span>
                  <span className="text-base group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>

              {/* Card 3: Action */}
              <div
                onClick={() => handleSuggestionClick('What am I overdue on?')}
                className="bg-[#EDE8F5] hover:bg-[#E5DEFF] p-6 rounded-[28px] border border-purple-200/60 transition-all cursor-pointer group shadow-xs hover:shadow-md flex flex-col justify-between h-56"
              >
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-[#7C3AED] shadow-xs mb-4 group-hover:scale-105 transition-transform">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <h3 className="font-['Syne',sans-serif] text-lg font-bold text-[#0F0E17] mb-1.5">
                    Tasks & Schedule
                  </h3>
                  <p className="text-xs text-[#6E6879] leading-relaxed">
                    Understands natural dates, overdue tracking, and upcoming deadlines.
                  </p>
                </div>
                <div className="pt-3 border-t border-purple-200/50 flex items-center justify-between text-xs font-semibold text-[#7C3AED]">
                  <span>"What am I overdue on?"</span>
                  <span className="text-base group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </div>

            {/* Quick Prompt Pills */}
            <div className="w-full text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8C849B] block mb-3">
                Try asking natural queries:
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {[
                  "What deadlines are coming up?",
                  "What's due tomorrow?",
                  "Remind me to submit internship application tomorrow.",
                  "What tasks do I have?",
                  "What programming language do I prefer for AI projects?",
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(prompt)}
                    className="px-3.5 py-1.5 rounded-full bg-white hover:bg-[#EDE8F5] text-xs font-medium text-[#2B283A] border border-purple-100/90 shadow-xs hover:border-purple-200 transition-all cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Conversation Stream */
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              {msg.role === 'user' ? (
                /* User Bubble */
                <div className="max-w-xl bg-[#0F0E17] text-white px-5 py-3.5 rounded-[24px] rounded-tr-sm text-sm font-medium leading-relaxed shadow-xs">
                  {msg.content}
                </div>
              ) : (
                /* Assistant Message Card */
                <div className="max-w-2xl w-full bg-white border border-purple-100 rounded-[28px] rounded-tl-sm p-5 sm:p-6 shadow-[0_4px_25px_-5px_rgba(124,58,237,0.05)]">
                  {/* Route & Timestamp Bar */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-[#EDE8F5] flex items-center justify-center text-[#7C3AED]">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      {renderRouteBadge(msg.route)}
                    </div>
                    <span className="text-[11px] font-medium text-[#A49EAE]">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Answer Content */}
                  <div className="text-sm text-[#0F0E17] font-normal leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </div>

                  {/* RAG Sources (if available) */}
                  {msg.sources && msg.sources.length > 0 && (
                    <SourceCard sources={msg.sources} />
                  )}

                  {/* Created Task Confirmation */}
                  {msg.task && (
                    <div className="mt-4">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#6E6879] block mb-1.5">
                        Saved Task Details:
                      </span>
                      <TaskCard
                        task={msg.task}
                        onComplete={onCompleteTask}
                        onDelete={onDeleteTask}
                        compact
                      />
                    </div>
                  )}

                  {/* Returned Task List (Database View / Overdue / Upcoming / Date) */}
                  {msg.tasks && msg.tasks.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#6E6879] block mb-1">
                        Matching Tasks ({msg.tasks.length}):
                      </span>
                      {msg.tasks.map((t) => (
                        <TaskCard
                          key={t.id}
                          task={t}
                          onComplete={onCompleteTask}
                          onDelete={onDeleteTask}
                          compact
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-start">
            <div className="bg-white border border-purple-100 rounded-[24px] rounded-tl-sm px-5 py-4 shadow-xs flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-[#EDE8F5] flex items-center justify-center text-[#7C3AED]">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
              </div>
              <span className="text-xs font-semibold text-[#6E6879]">
                Memora is thinking...
              </span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <div className="pt-2">
        <form
          onSubmit={handleSubmit}
          className="relative bg-white rounded-full border border-purple-100/90 shadow-[0_10px_35px_-10px_rgba(124,58,237,0.08)] p-2 flex items-center gap-2 focus-within:border-[#7C3AED] focus-within:ring-2 focus-within:ring-[#7C3AED]/20 transition-all"
        >
          <div className="pl-4 text-[#8C849B]">
            <Sparkles className="w-4 h-4 text-[#7C3AED]" />
          </div>

          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything, set reminders, query deadlines..."
            disabled={loading}
            className="flex-1 bg-transparent py-2.5 px-2 text-sm text-[#0F0E17] placeholder-[#A49EAE] focus:outline-none resize-none leading-tight"
          />

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-full bg-[#0F0E17] hover:bg-[#252233] text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0 shadow-xs active:scale-95"
            title="Send message"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </form>

        <p className="text-[11px] text-center text-[#A49EAE] mt-2">
          Natural language date recognition active • Press Enter to send, Shift+Enter for newline
        </p>
      </div>
    </div>
  );
};
