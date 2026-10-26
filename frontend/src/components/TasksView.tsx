import React, { useState } from 'react';
import type { Task } from '../types';
import { TaskCard } from './TaskCard';
import { Plus, CheckSquare, CheckCircle2 } from 'lucide-react';

interface TasksViewProps {
  tasks: Task[];
  onCompleteTask: (id: number) => void;
  onDeleteTask: (id: number) => void;
  onCreateTask: (task: string, date?: string, action_type?: string) => Promise<void>;
  loading: boolean;
}

type FilterType = 'all' | 'pending' | 'overdue' | 'upcoming' | 'completed';

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  onCompleteTask,
  onDeleteTask,
  onCreateTask,
  loading,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('pending');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskType, setNewTaskType] = useState('reminder');
  const [submitting, setSubmitting] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const overdueTasks = tasks.filter((t) => t.status === 'pending' && t.date && t.date < todayStr);
  const upcomingTasks = tasks.filter((t) => t.status === 'pending' && t.date && t.date >= todayStr);
  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  const filteredTasks = tasks.filter((t) => {
    if (activeFilter === 'pending') return t.status === 'pending';
    if (activeFilter === 'overdue') return t.status === 'pending' && t.date && t.date < todayStr;
    if (activeFilter === 'upcoming') return t.status === 'pending' && t.date && t.date >= todayStr;
    if (activeFilter === 'completed') return t.status === 'completed';
    return true;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setSubmitting(true);
    try {
      await onCreateTask(newTaskTitle.trim(), newTaskDate.trim() || undefined, newTaskType);
      setNewTaskTitle('');
      setNewTaskDate('');
      setShowAddModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Title & Add Button Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDE8F5] text-[#7C3AED] text-xs font-bold uppercase tracking-wide mb-2">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Task Database</span>
          </div>
          <h2 className="font-['Syne',sans-serif] text-2xl sm:text-3xl font-extrabold text-[#0F0E17]">
            Schedule & Reminders
          </h2>
          <p className="text-xs sm:text-sm text-[#6E6879] mt-0.5">
            Synchronized with Memora SQLite database and natural date understanding.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0F0E17] hover:bg-[#252233] text-white text-xs font-bold tracking-wide transition-all shadow-xs cursor-pointer self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#EDE8F5]/60 rounded-2xl border border-purple-200/50">
        {[
          { key: 'pending', label: 'Pending', count: pendingTasks.length },
          { key: 'upcoming', label: 'Upcoming', count: upcomingTasks.length },
          { key: 'overdue', label: 'Overdue', count: overdueTasks.length },
          { key: 'completed', label: 'Completed', count: completedTasks.length },
          { key: 'all', label: 'All Tasks', count: tasks.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key as FilterType)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
              activeFilter === tab.key
                ? 'bg-white text-[#0F0E17] shadow-xs'
                : 'text-[#6E6879] hover:text-[#0F0E17]'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                tab.key === 'overdue' && tab.count > 0
                  ? 'bg-rose-100 text-rose-700'
                  : activeFilter === tab.key
                  ? 'bg-[#EDE8F5] text-[#7C3AED]'
                  : 'bg-white/60 text-[#8C849B]'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-xs font-medium text-[#6E6879]">
            Loading your tasks...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-purple-100/80">
            <div className="w-12 h-12 rounded-2xl bg-[#EDE8F5] mx-auto flex items-center justify-center text-[#7C3AED] mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-['Syne',sans-serif] text-base font-bold text-[#0F0E17] mb-1">
              No tasks found
            </h4>
            <p className="text-xs text-[#8C849B]">
              {activeFilter === 'overdue'
                ? 'Great work! You have no overdue deadlines.'
                : 'No tasks matching this filter.'}
            </p>
          </div>
        ) : (
          filteredTasks.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              onComplete={onCompleteTask}
              onDelete={onDeleteTask}
            />
          ))
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F0E17]/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-[32px] p-6 sm:p-8 max-w-md w-full border border-purple-100 shadow-2xl relative">
            <h3 className="font-['Syne',sans-serif] text-xl font-extrabold text-[#0F0E17] mb-1">
              Create New Task
            </h3>
            <p className="text-xs text-[#6E6879] mb-5">
              Enter task details. Supports natural dates like "tomorrow" or "October 30".
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0F0E17] mb-1.5">
                  Task Title
                </label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Prepare internship documents"
                  required
                  className="w-full px-4 py-3 bg-[#F8F6FC] border border-purple-100 rounded-2xl text-sm text-[#0F0E17] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0F0E17] mb-1.5">
                  Due Date (or natural string)
                </label>
                <input
                  type="text"
                  value={newTaskDate}
                  onChange={(e) => setNewTaskDate(e.target.value)}
                  placeholder="e.g. tomorrow, next Friday, October 30, or 2026-10-30"
                  className="w-full px-4 py-3 bg-[#F8F6FC] border border-purple-100 rounded-2xl text-sm text-[#0F0E17] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0F0E17] mb-1.5">
                  Action Type
                </label>
                <select
                  value={newTaskType}
                  onChange={(e) => setNewTaskType(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F8F6FC] border border-purple-100 rounded-2xl text-sm text-[#0F0E17] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]"
                >
                  <option value="reminder">Reminder</option>
                  <option value="task">General Task</option>
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
                  disabled={submitting || !newTaskTitle.trim()}
                  className="px-5 py-2.5 rounded-full bg-[#0F0E17] hover:bg-[#252233] text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {submitting ? 'Saving...' : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
