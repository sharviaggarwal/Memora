import React from 'react';
import type { Task } from '../types';
import { Calendar, CheckCircle, Clock, Trash2, Bell, Check } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onComplete?: (id: number) => void;
  onDelete?: (id: number) => void;
  compact?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onComplete,
  onDelete,
  compact = false,
}) => {
  const isCompleted = task.status === 'completed';
  const todayStr = new Date().toISOString().split('T')[0];
  const isOverdue = !isCompleted && task.date && task.date < todayStr;
  const isToday = !isCompleted && task.date === todayStr;

  return (
    <div
      className={`group relative rounded-2xl border transition-all ${
        isCompleted
          ? 'bg-gray-50/70 border-gray-200/80 opacity-70'
          : isOverdue
          ? 'bg-rose-50/40 border-rose-200/80 shadow-xs'
          : 'bg-white border-purple-100 hover:border-purple-200 shadow-xs hover:shadow-sm'
      } ${compact ? 'p-3' : 'p-4'}`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Checkmark button + Title + Badges */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {onComplete && (
            <button
              onClick={() => onComplete(task.id)}
              disabled={isCompleted}
              className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                isCompleted
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'border-purple-200 hover:border-[#7C3AED] hover:bg-[#EDE8F5]/60 text-transparent hover:text-[#7C3AED]'
              }`}
              title={isCompleted ? 'Completed' : 'Mark as completed'}
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="flex-1 min-w-0">
            <h4
              className={`text-sm font-semibold text-[#0F0E17] leading-snug break-words ${
                isCompleted ? 'line-through text-[#8C849B]' : ''
              }`}
            >
              {task.task}
            </h4>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {task.date ? (
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${
                    isOverdue
                      ? 'bg-rose-100 text-rose-700'
                      : isToday
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-[#EDE8F5] text-[#7C3AED]'
                  }`}
                >
                  <Calendar className="w-3 h-3" />
                  <span>
                    {isOverdue ? `Overdue (${task.date})` : isToday ? 'Due Today' : task.date}
                  </span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-gray-100 text-[#6E6879]">
                  <Clock className="w-3 h-3" />
                  <span>No date</span>
                </span>
              )}

              {task.action_type === 'reminder' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-[#7C3AED] border border-purple-100">
                  <Bell className="w-2.5 h-2.5" />
                  <span>Reminder</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-50 text-[#6E6879] border border-gray-200">
                  <span>Task</span>
                </span>
              )}

              {isCompleted && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <CheckCircle className="w-2.5 h-2.5" />
                  <span>Done</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Delete button */}
        {onDelete && (
          <button
            onClick={() => onDelete(task.id)}
            title="Delete task"
            className="w-7 h-7 rounded-lg text-[#A49EAE] hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
