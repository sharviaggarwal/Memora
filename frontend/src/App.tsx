import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { AuthView } from './components/AuthView';
import { Header } from './components/Header';
import type { NavTab } from './components/Header';
import { ChatView } from './components/ChatView';
import { TasksView } from './components/TasksView';
import { MemoriesView } from './components/MemoriesView';
import { DocumentsView } from './components/DocumentsView';
import type { Message, Task, MemoryItem, DocumentInfo, ChatResponse } from './types';

export function App() {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<NavTab>('chat');

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  // Memories state
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [memoriesLoading, setMemoriesLoading] = useState(false);

  // Documents state
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [totalChunks, setTotalChunks] = useState(0);
  const [docsLoading, setDocsLoading] = useState(false);

  // ----------------- AUTHENTICATION -----------------

  useEffect(() => {
    // Check local stored session first
    const savedDemo = localStorage.getItem('memora_demo_session');
    if (savedDemo) {
      try {
        setSession(JSON.parse(savedDemo));
        setAuthLoading(false);
        return;
      } catch {
        localStorage.removeItem('memora_demo_session');
      }
    }

    // Check active Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSession(session);
        localStorage.removeItem('memora_demo_session');
      }
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleDemoLogin = () => {
    const demoSession = {
      user: {
        id: 'default',
        email: 'demo@memora.ai',
      },
    };
    localStorage.setItem('memora_demo_session', JSON.stringify(demoSession));
    setSession(demoSession);
  };

  const handleLogout = async () => {
    localStorage.removeItem('memora_demo_session');
    await supabase.auth.signOut();
    setSession(null);
    setMessages([]);
  };

  // ----------------- DATA FETCHING -----------------

  const fetchTasks = async () => {
    if (!session) return;
    setTasksLoading(true);
    try {
      const userId = session.user?.id || 'default';
      const res = await fetch(`/api/tasks?user_id=${userId}&status=`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setTasksLoading(false);
    }
  };

  const fetchMemories = async () => {
    if (!session) return;
    setMemoriesLoading(true);
    try {
      const userId = session.user?.id || 'default';
      const res = await fetch(`/api/memories?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setMemories(data);
      }
    } catch (err) {
      console.error('Error fetching memories:', err);
    } finally {
      setMemoriesLoading(false);
    }
  };

  const fetchDocuments = async () => {
    if (!session) return;
    setDocsLoading(true);
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
        setTotalChunks(data.total_chunks || 0);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setDocsLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchTasks();
      fetchMemories();
      fetchDocuments();
    }
  }, [session]);

  // ----------------- CHAT ACTIONS -----------------

  const handleSendMessage = async (queryText: string) => {
    if (!queryText.trim()) return;
    setChatError(null);

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: queryText.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setChatLoading(true);

    try {
      const userId = session?.user?.id || 'default';
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText.trim(), user_id: userId }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Could not communicate with Memora backend.');
      }

      const data: ChatResponse = await res.json();

      const assistantMsg: Message = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: data.answer,
        route: data.route,
        sources: data.sources,
        action: data.action,
        tasks: data.tasks,
        task: data.task,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // If action or database query occurred, refresh tasks list
      if (data.route === 'ACTION' || data.route === 'DATABASE') {
        fetchTasks();
      }
      if (data.route === 'MEMORY') {
        fetchMemories();
      }
    } catch (err: any) {
      setChatError(err.message || 'An error occurred while contacting Memora.');
    } finally {
      setChatLoading(false);
    }
  };

  // ----------------- TASK ACTIONS -----------------

  const handleCompleteTask = async (taskId: number) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/complete`, { method: 'PATCH' });
      if (res.ok) {
        // Update local tasks
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: 'completed' } : t))
        );
        // Also update tasks displayed in existing messages
        setMessages((prev) =>
          prev.map((m) => {
            if (m.task && m.task.id === taskId) {
              return { ...m, task: { ...m.task, status: 'completed' } };
            }
            if (m.tasks) {
              return {
                ...m,
                tasks: m.tasks.map((t) => (t.id === taskId ? { ...t, status: 'completed' } : t)),
              };
            }
            return m;
          })
        );
      }
    } catch (err) {
      console.error('Error completing task:', err);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        setMessages((prev) =>
          prev.map((m) => {
            if (m.tasks) {
              return { ...m, tasks: m.tasks.filter((t) => t.id !== taskId) };
            }
            return m;
          })
        );
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const handleCreateTask = async (task: string, date?: string, action_type?: string) => {
    const userId = session?.user?.id || 'default';
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, date, action_type, user_id: userId }),
    });
    if (res.ok) {
      await fetchTasks();
    }
  };

  // ----------------- MEMORY ACTIONS -----------------

  const handleAddMemory = async (text: string, type: string) => {
    const userId = session?.user?.id || 'default';
    const res = await fetch('/api/memories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, memory_type: type, source: 'user', user_id: userId }),
    });
    if (res.ok) {
      await fetchMemories();
    }
  };

  // ----------------- DOCUMENT ACTIONS -----------------

  const handleAskDocQuestion = (query: string) => {
    setActiveTab('chat');
    handleSendMessage(query);
  };

  // ----------------- RENDER -----------------

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8F6FC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#EDE8F5] border border-purple-200 flex items-center justify-center text-[#7C3AED] animate-pulse">
            <span className="font-['Syne',sans-serif] font-bold text-lg">M</span>
          </div>
          <span className="text-xs font-semibold text-[#8C849B]">Initializing Memora...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return <AuthView onAuthSuccess={() => {}} onDemoLogin={handleDemoLogin} />;
  }

  const pendingTasksCount = tasks.filter((t) => t.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#F8F6FC] flex flex-col text-[#0F0E17]">
      {/* Top Header Navigation */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userEmail={session?.user?.email}
        onLogout={handleLogout}
        pendingTasksCount={pendingTasksCount}
      />

      {/* Main Tab Content */}
      <main className="flex-1 flex flex-col">
        {activeTab === 'chat' && (
          <ChatView
            messages={messages}
            loading={chatLoading}
            onSendMessage={handleSendMessage}
            onCompleteTask={handleCompleteTask}
            onDeleteTask={handleDeleteTask}
            error={chatError}
          />
        )}

        {activeTab === 'tasks' && (
          <TasksView
            tasks={tasks}
            onCompleteTask={handleCompleteTask}
            onDeleteTask={handleDeleteTask}
            onCreateTask={handleCreateTask}
            loading={tasksLoading}
          />
        )}

        {activeTab === 'memories' && (
          <MemoriesView
            memories={memories}
            onAddMemory={handleAddMemory}
            loading={memoriesLoading}
          />
        )}

        {activeTab === 'documents' && (
          <DocumentsView
            documents={documents}
            totalChunks={totalChunks}
            onAskDocQuestion={handleAskDocQuestion}
            loading={docsLoading}
          />
        )}
      </main>
    </div>
  );
}

export default App;
