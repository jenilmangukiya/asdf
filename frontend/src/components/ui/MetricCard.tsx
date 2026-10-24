import React from 'react';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';

export interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  tooltip?: string;
  trend?: 'positive' | 'negative' | 'neutral';
  accentColor?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate';
  isLoading?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  badge,
  tooltip,
  accentColor = 'cyan',
  isLoading = false,
}) => {
  const accentBorder = {
    cyan: 'border-l-cyan-500',
    emerald: 'border-l-emerald-500',
    amber: 'border-l-amber-500',
    rose: 'border-l-rose-500',
    slate: 'border-l-slate-600',
  }[accentColor];

  return (
    <div
      className={cn(
        'glass-card glass-card-hover rounded-xl p-5 border-l-4 relative flex flex-col justify-between transition-all duration-200 hover:z-20',
        accentBorder
      )}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {title}
            </span>
            {tooltip && (
              <div className="group relative cursor-help inline-flex items-center">
                <Info className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                <div className="absolute left-0 top-full mt-2 hidden group-hover:block z-50 w-64 p-3 text-xs text-slate-200 bg-slate-900 border border-slate-700/90 rounded-lg shadow-2xl pointer-events-none text-left font-normal normal-case leading-relaxed">
                  <div className="text-[10px] font-semibold text-cyan-400 mb-1 uppercase tracking-wider">
                    {title}
                  </div>
                  {tooltip}
                </div>
              </div>
            )}
          </div>
          {badge && <div>{badge}</div>}
        </div>

        {isLoading ? (
          <div className="h-9 w-28 bg-slate-800 animate-pulse rounded my-1" />
        ) : (
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-white">
              {value}
            </span>
            {unit && (
              <span className="text-sm font-medium font-sans text-slate-400">
                {unit}
              </span>
            )}
          </div>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
          {subtitle}
        </p>
      )}
    </div>
  );
};
