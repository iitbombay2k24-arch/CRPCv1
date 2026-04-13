import React from 'react';

const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };

export default function Spinner({ size = 'md', className = '' }) {
  return (
    <svg className={`animate-spin ${sizes[size]} text-indigo-400 ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );
}

export function PageLoader({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
      <Spinner size="lg" />
      <p className="text-slate-400 text-sm font-medium animate-pulse">{message}</p>
    </div>
  );
}

export function Skeleton({ width = 'w-full', height = 'h-4', className = '' }) {
  return <div className={`${width} ${height} bg-slate-700/50 rounded-lg animate-pulse ${className}`} />;
}
