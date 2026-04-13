import React from 'react';

const variants = {
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  danger: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
  info: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
  neutral: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
  purple: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
};

export default function Badge({ children, variant = 'info', size = 'md', icon: Icon, dot = false, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 font-bold uppercase tracking-wider rounded-full border ${variants[variant]} ${size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1'} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${variant === 'success' ? 'bg-emerald-400' : variant === 'danger' ? 'bg-rose-400' : variant === 'warning' ? 'bg-amber-400' : 'bg-indigo-400'}`} />}
      {Icon && <Icon size={size === 'sm' ? 10 : 12} />}
      {children}
    </span>
  );
}
