import React from 'react';

const variants = {
  success:  'bg-emerald-500/15 text-emerald-300 border-emerald-500/25 shadow-sm shadow-emerald-500/10',
  warning:  'bg-amber-500/15 text-amber-300 border-amber-500/25 shadow-sm shadow-amber-500/10',
  danger:   'bg-rose-500/15 text-rose-300 border-rose-500/25 shadow-sm shadow-rose-500/10',
  info:     'bg-indigo-500/15 text-indigo-300 border-indigo-500/25 shadow-sm shadow-indigo-500/10',
  primary:  'bg-indigo-500/15 text-indigo-300 border-indigo-500/25',
  neutral:  'bg-slate-500/15 text-slate-300 border-slate-500/25',
  purple:   'bg-purple-500/15 text-purple-300 border-purple-500/25 shadow-sm shadow-purple-500/10',
  secondary:'bg-white/5 text-slate-300 border-white/10',
};

export default function Badge({ children, variant = 'info', size = 'md', icon: Icon, dot = false, className = '' }) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 font-semibold tracking-wide border rounded-full
        ${variants[variant] || variants.info}
        ${size === 'xs' ? 'text-[10px] px-2 py-0.5' : size === 'sm' ? 'text-[11px] px-2.5 py-0.5' : 'text-xs px-3 py-1'}
        ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${
          variant === 'success' ? 'bg-emerald-400' :
          variant === 'danger' ? 'bg-rose-400' :
          variant === 'warning' ? 'bg-amber-400' : 'bg-indigo-400'
        }`} />
      )}
      {Icon && <Icon size={size === 'xs' ? 9 : 11} />}
      {children}
    </span>
  );
}
