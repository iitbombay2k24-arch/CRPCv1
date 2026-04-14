import React from 'react';

const paddings = { sm: 'p-3', md: 'p-5', lg: 'p-7', none: 'p-0' };

const variantStyles = {
  default: 'bg-white/[0.03] border border-white/[0.06]',
  elevated: 'bg-white/[0.04] border border-white/[0.08] shadow-xl shadow-black/30',
  glass: 'glass-card',
  glow: 'bg-white/[0.03] border border-indigo-500/20 shadow-lg shadow-indigo-500/10',
};

export default function Card({ children, padding = 'md', clickable = false, variant = 'glass', glow, className = '', ...props }) {
  return (
    <div
      className={`
        rounded-2xl transition-all duration-300
        ${variantStyles[variant] || variantStyles.glass}
        ${paddings[padding]}
        ${clickable ? 'cursor-pointer hover:bg-white/[0.06] hover:border-white/10 hover:shadow-xl hover:shadow-black/20 active:scale-[0.99]' : ''}
        ${glow ? 'shadow-lg shadow-indigo-500/15 hover:shadow-indigo-500/25' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
