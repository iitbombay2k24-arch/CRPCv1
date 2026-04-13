import React from 'react';

const paddings = { sm: 'p-3', md: 'p-4', lg: 'p-6', none: 'p-0' };
const variantStyles = {
  default: 'bg-slate-800/60 border border-slate-700/50',
  elevated: 'bg-slate-800/80 border border-slate-700/50 shadow-lg shadow-black/20',
  glass: 'bg-white/5 backdrop-blur-md border border-white/10',
};

export default function Card({ children, padding = 'md', clickable = false, variant = 'default', className = '', ...props }) {
  return (
    <div className={`rounded-xl transition-all duration-200 ${variantStyles[variant] || variantStyles.default} ${paddings[padding]} ${clickable ? 'cursor-pointer hover:bg-slate-700/60 hover:border-slate-600/60 active:scale-[0.98]' : ''} ${className}`} {...props}>
      {children}
    </div>
  );
}
