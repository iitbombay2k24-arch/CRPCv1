import React from 'react';
import { getInitials } from '../../lib/utils';

const sizes = {
  xs:  'w-6 h-6 text-[9px]',
  sm:  'w-8 h-8 text-xs',
  md:  'w-10 h-10 text-sm',
  lg:  'w-14 h-14 text-base',
  xl:  'w-20 h-20 text-xl',
};

const gradients = [
  'from-indigo-500 to-violet-600',
  'from-violet-500 to-purple-600',
  'from-rose-500 to-pink-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-sky-500 to-blue-600',
  'from-fuchsia-500 to-pink-600',
  'from-cyan-500 to-sky-600',
];

const statusColors = {
  online:  'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]',
  away:    'bg-amber-400',
  dnd:     'bg-rose-500',
  offline: 'bg-slate-500',
};

function getGradient(name) {
  if (!name) return gradients[0];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return gradients[Math.abs(h) % gradients.length];
}

export default function Avatar({ name, photoURL, size = 'md', status, border, className = '' }) {
  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {photoURL ? (
        <img
          src={photoURL}
          alt={name}
          className={`${sizes[size]} rounded-2xl object-cover ${border ? 'ring-2 ring-indigo-500/60 ring-offset-2 ring-offset-slate-900' : ''}`}
        />
      ) : (
        <div
          className={`
            ${sizes[size]} rounded-2xl flex items-center justify-center
            bg-gradient-to-br ${getGradient(name)}
            font-bold text-white select-none
            ${border ? 'ring-2 ring-indigo-500/60 ring-offset-2 ring-offset-slate-900' : ''}
          `}
        >
          {getInitials(name)}
        </div>
      )}
      {status && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-slate-900 ${statusColors[status]}
            ${size === 'xs' || size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'}`}
        />
      )}
    </div>
  );
}
