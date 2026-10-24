import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-slate-800 text-slate-300 border-slate-700',
    success: 'bg-emerald-950/70 text-emerald-300 border-emerald-700/50',
    warning: 'bg-amber-950/70 text-amber-300 border-amber-700/50',
    danger: 'bg-rose-950/70 text-rose-300 border-rose-700/50',
    info: 'bg-cyan-950/70 text-cyan-300 border-cyan-700/50',
    outline: 'bg-transparent text-slate-300 border-slate-600',
  }[variant];

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs font-medium px-2.5 py-1',
  }[size];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border tracking-wide font-sans',
        variantStyles,
        sizeStyles,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
