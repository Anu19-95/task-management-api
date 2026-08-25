import React from 'react';
import { CheckCircle2, Clock, ListTodo, Flame } from 'lucide-react';
import { TaskStats } from '../types';

interface StatsBarProps {
  stats: TaskStats | null;
  activeStatus: string;
  onSelectStatus: (status: string) => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({ stats, activeStatus, onSelectStatus }) => {
  if (!stats) return null;

  const items = [
    {
      id: 'all',
      label: 'Total Tasks',
      value: stats.total,
      icon: ListTodo,
      color: 'text-slate-600 dark:text-slate-300',
      bgColor: 'bg-slate-100 dark:bg-slate-800',
      activeBorder: 'ring-2 ring-blue-500 border-blue-500',
    },
    {
      id: 'todo',
      label: 'To Do (Pending)',
      value: stats.todo,
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/40',
      activeBorder: 'ring-2 ring-amber-500 border-amber-500',
    },
    {
      id: 'in_progress',
      label: 'In Progress',
      value: stats.inProgress,
      icon: Flame,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/40',
      activeBorder: 'ring-2 ring-blue-500 border-blue-500',
    },
    {
      id: 'completed',
      label: 'Completed',
      value: stats.completed,
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
      activeBorder: 'ring-2 ring-emerald-500 border-emerald-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item) => {
        const Icon = item.icon;
        const isSelected = activeStatus === item.id;
        return (
          <button
            key={item.id}
            id={`filter-stat-${item.id}`}
            onClick={() => onSelectStatus(item.id)}
            className={`bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between transition-all text-left hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer ${
              isSelected ? item.activeBorder : ''
            }`}
          >
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1 uppercase tracking-wide">
                {item.label}
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {item.value}
              </div>
            </div>
            <div className={`p-2.5 rounded-lg ${item.bgColor} ${item.color}`}>
              <Icon className="w-5 h-5" />
            </div>
          </button>
        );
      })}
    </div>
  );
};
