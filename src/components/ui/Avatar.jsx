import React from 'react';
import { getInitials } from '../../lib/utils';

const sizes = { xs: 'w-6 h-6 text-[10px]', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg' };
const colors = ['bg-indigo-600','bg-violet-600','bg-emerald-600','bg-rose-600','bg-amber-600','bg-teal-600','bg-sky-600','bg-pink-600'];
const statusColors = { online: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]', away: 'bg-amber-400', dnd: 'bg-rose-500', offline: 'bg-slate-500' };

function getColor(name) {
  if (!name) return colors[0];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

export default function Avatar({ name, photoURL, size = 'md', status, className = '' }) {
  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {photoURL ? (
        <img src={photoURL} alt={name} className={`${sizes[size]} rounded-xl object-cover border-2 border-slate-700`} />
      ) : (
        <div className={`${sizes[size]} ${getColor(name)} rounded-xl flex items-center justify-center text-white font-bold border-2 border-slate-700`}>{getInitials(name)}</div>
      )}
      {status && <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${statusColors[status]}`} />}
    </div>
  );
}
