import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  change: number; // e.g. +12.5 or -4.2
  timeframeText?: string;
  icon: React.ReactNode;
  iconBgColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  timeframeText = 'so với kỳ trước',
  icon,
  iconBgColor = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
}) => {
  const isPositive = change >= 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-card p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', iconBgColor)}>
          {icon}
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          {value}
        </h3>
      </div>

      <div className="flex items-center gap-1.5 mt-3 text-xs">
        <span
          className={cn(
            'inline-flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded',
            isPositive
              ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
              : 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40'
          )}
        >
          {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {isPositive ? `+${change}%` : `${change}%`}
        </span>
        <span className="text-slate-400">{timeframeText}</span>
      </div>
    </div>
  );
};
