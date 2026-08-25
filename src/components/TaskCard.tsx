import React from 'react';
import {
  Calendar,
  Check,
  Pencil,
  Trash2,
  Terminal,
  Tag as TagIcon,
  AlertCircle
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus } from '../types';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (task: Task) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onPriorityChange: (id: string, priority: TaskPriority) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onViewCurl: (task: Task) => void;
  onSelectPreview?: (task: Task) => void;
  isSelected?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleComplete,
  onStatusChange,
  onPriorityChange,
  onEdit,
  onDelete,
  onViewCurl,
  onSelectPreview,
  isSelected,
}) => {
  const isCompleted = task.status === 'completed';
  const isOverdue =
    Boolean(task.dueDate) &&
    !isCompleted &&
    task.dueDate < new Date().toISOString().split('T')[0];

  const priorityStyles: Record<TaskPriority, { label: string; badge: string }> = {
    high: {
      label: 'CRITICAL',
      badge: 'bg-red-100 text-red-700 font-bold dark:bg-red-950/50 dark:text-red-300',
    },
    medium: {
      label: 'MEDIUM',
      badge: 'bg-blue-100 text-blue-700 font-bold dark:bg-blue-950/50 dark:text-blue-300',
    },
    low: {
      label: 'LOW',
      badge: 'bg-slate-100 text-slate-700 font-bold dark:bg-slate-800 dark:text-slate-300',
    },
  };

  const statusStyles: Record<TaskStatus, { label: string; badge: string }> = {
    todo: {
      label: 'Pending',
      badge: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800',
    },
    in_progress: {
      label: 'In Progress',
      badge: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40',
    },
    completed: {
      label: 'Completed',
      badge: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40',
    },
  };

  const statusOptions: { value: TaskStatus; label: string }[] = [
    { value: 'todo', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
  ];

  return (
    <div
      id={`task-card-${task.id}`}
      onClick={() => onSelectPreview && onSelectPreview(task)}
      className={`group relative rounded-xl border transition-all p-4 bg-white dark:bg-slate-900 cursor-pointer ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
          : isCompleted
          ? 'border-slate-200/70 dark:border-slate-800/80 opacity-80'
          : 'border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Completion Checkbox */}
        <button
          type="button"
          id={`toggle-task-${task.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete(task);
          }}
          aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
          className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-colors border ${
            isCompleted
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'border-slate-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-400'
          }`}
        >
          {isCompleted && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-xs text-slate-400 dark:text-slate-500 shrink-0">
                {task.id}
              </span>
              <h3
                className={`text-sm font-medium transition-all truncate ${
                  isCompleted
                    ? 'line-through text-slate-400 dark:text-slate-500'
                    : 'text-slate-800 dark:text-slate-100 font-semibold'
                }`}
              >
                {task.title}
              </h3>
            </div>

            {/* Quick Actions */}
            <div
              className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                id={`curl-btn-${task.id}`}
                onClick={() => onViewCurl(task)}
                title="View cURL API Command"
                className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Terminal className="w-4 h-4" />
              </button>
              <button
                type="button"
                id={`edit-btn-${task.id}`}
                onClick={() => onEdit(task)}
                title="Edit Task"
                className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                id={`delete-btn-${task.id}`}
                onClick={() => onDelete(task.id)}
                title="Delete Task"
                className="p-1.5 rounded-md text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {task.description && (
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Meta row: tags, due date, status, priority */}
          <div
            className="flex flex-wrap items-center gap-2 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Status Selector */}
            <select
              id={`status-select-${task.id}`}
              value={task.status}
              onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded px-2 py-0.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Priority Badge */}
            <span
              className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full ${
                priorityStyles[task.priority].badge
              }`}
            >
              {priorityStyles[task.priority].label}
            </span>

            {/* Due Date */}
            {task.dueDate && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded ${
                  isOverdue
                    ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900 font-medium'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {isOverdue ? <AlertCircle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                {isOverdue ? `Overdue (${task.dueDate})` : task.dueDate}
              </span>
            )}

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1 ml-auto">
                {task.tags.map((tg) => (
                  <span
                    key={tg}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-mono"
                  >
                    <TagIcon className="w-2.5 h-2.5 opacity-60" />
                    {tg}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
