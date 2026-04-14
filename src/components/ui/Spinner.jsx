import React from 'react';

const sizes = { sm: 'w-4 h-4', md: 'w-7 h-7', lg: 'w-12 h-12' };

export default function Spinner({ size = 'md', className = '' }) {
  return (
    <div className={`${sizes[size]} ${className} relative`}>
      <div className={`absolute inset-0 rounded-full border-2 border-indigo-500/20`} />
      <div className={`absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-400 animate-spin drop-shadow-[0_0_6px_rgba(99,102,241,0.5)]`} />
    </div>
  );
}

export function PageLoader({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-4">
      <div className="relative w-16 h-16">
        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full border-2 border-indigo-500/15 animate-ping" />
        {/* Inner spinner */}
        <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-indigo-400 border-r-violet-400/50 animate-spin" />
        {/* Center dot */}
        <div className="absolute inset-[30%] rounded-full bg-indigo-500/30 animate-pulse" />
      </div>
      <p className="text-slate-400 text-sm font-medium animate-pulse">{message}</p>
    </div>
  );
}

export function Skeleton({ width = 'w-full', height = 'h-4', rounded = 'rounded-xl', className = '' }) {
  return (
    <div
      className={`${width} ${height} ${rounded} skeleton-shimmer bg-white/[0.04] ${className}`}
    />
  );
}
