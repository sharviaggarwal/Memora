export interface Task {
  id: number;
  task: string;
  date: string | null;
  action_type: string;
  status: 'pending' | 'completed';
  created_at?: string;
  user_id?: string;
}

export interface Source {
  source: string;
  page: string | number;
  chunk_index?: number;
  snippet?: string;
}

export interface ChatResponse {
  answer: string;
  route?: 'MEMORY' | 'RAG' | 'ACTION' | 'DATABASE' | 'UNKNOWN';
  sources?: Source[];
  action?: string;
  tasks?: Task[];
  task?: Task;
  target_date?: string | null;
  task_id?: number;
  success?: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  route?: 'MEMORY' | 'RAG' | 'ACTION' | 'DATABASE' | 'UNKNOWN';
  sources?: Source[];
  action?: string;
  tasks?: Task[];
  task?: Task;
  timestamp: string;
}

export interface MemoryItem {
  id: string;
  text: string;
  type: string;
  source: string;
  created_at?: string;
  user_id?: string;
}

export interface DocumentInfo {
  name: string;
  chunk_count: number;
  type: string;
}
