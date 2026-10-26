import React from 'react';
import { Sparkles, MessageSquare, CheckSquare, Brain, FileText, LogOut, User as UserIcon } from 'lucide-react';

export type NavTab = 'chat' | 'tasks' | 'memories' | 'documents';

interface HeaderProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  userEmail?: string;
  onLogout: () => void;
  pendingTasksCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  userEmail,
  onLogout,
  pendingTasksCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#F8F6FC]/90 backdrop-blur-md border-b border-purple-100/70">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          onClick={() => onTabChange('chat')}
          className="flex items-center gap-2.5 group cursor-pointer text-left"
        >
          <div className="w-9 h-9 rounded-2xl bg-[#EDE8F5] border border-purple-200/80 flex items-center justify-center text-[#7C3AED] shadow-sm group-hover:scale-105 transition-transform">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="font-['Syne',sans-serif] text-xl font-extrabold tracking-tight text-[#0F0E17]">
              MEMORA
            </span>
          </div>
        </button>

        {/* Center Navigation Pills */}
        <nav className="flex items-center gap-1 sm:gap-1.5 bg-[#EDE8F5]/60 p-1 rounded-full border border-purple-200/50">
          <button
            onClick={() => onTabChange('chat')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-white text-[#0F0E17] shadow-sm'
                : 'text-[#6E6879] hover:text-[#0F0E17]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span>Chat</span>
          </button>

          <button
            onClick={() => onTabChange('tasks')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all cursor-pointer ${
              activeTab === 'tasks'
                ? 'bg-white text-[#0F0E17] shadow-sm'
                : 'text-[#6E6879] hover:text-[#0F0E17]'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span>Tasks</span>
            {pendingTasksCount > 0 && (
              <span className="w-4.5 h-4.5 rounded-full bg-[#EDE8F5] text-[#7C3AED] text-[10px] font-extrabold flex items-center justify-center">
                {pendingTasksCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('memories')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all cursor-pointer ${
              activeTab === 'memories'
                ? 'bg-white text-[#0F0E17] shadow-sm'
                : 'text-[#6E6879] hover:text-[#0F0E17]'
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span>Memories</span>
          </button>

          <button
            onClick={() => onTabChange('documents')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all cursor-pointer ${
              activeTab === 'documents'
                ? 'bg-white text-[#0F0E17] shadow-sm'
                : 'text-[#6E6879] hover:text-[#0F0E17]'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span>Documents</span>
          </button>
        </nav>

        {/* Right User & Logout */}
        <div className="flex items-center gap-2">
          {userEmail && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-purple-100 text-xs font-medium text-[#2B283A] shadow-xs">
              <div className="w-5 h-5 rounded-full bg-[#EDE8F5] flex items-center justify-center text-[#7C3AED]">
                <UserIcon className="w-3 h-3" />
              </div>
              <span className="max-w-[130px] truncate">{userEmail}</span>
            </div>
          )}

          <button
            onClick={onLogout}
            title="Log out"
            className="w-9 h-9 rounded-full bg-white border border-purple-100/90 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-[#6E6879] flex items-center justify-center transition-all cursor-pointer shadow-xs"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
