import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function Input({ type = 'text', label, error, helperText, leftIcon: LeftIcon, rightIcon: RightIcon, className = '', ...props }) {
  const [showPw, setShowPw] = useState(false);
  const isPw = type === 'password';

  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-semibold text-slate-300">{label}</label>}
      <div className="relative">
        {LeftIcon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><LeftIcon size={16} /></div>}
        <input
          type={isPw ? (showPw ? 'text' : 'password') : type}
          className={`w-full bg-slate-800/80 border rounded-lg text-sm text-white placeholder-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 ${error ? 'border-rose-500' : 'border-slate-600/50 hover:border-slate-500'} ${LeftIcon ? 'pl-10' : 'pl-4'} ${(RightIcon || isPw) ? 'pr-10' : 'pr-4'} py-2.5 ${className}`}
          {...props}
        />
        {isPw && <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>}
        {!isPw && RightIcon && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><RightIcon size={16} /></div>}
      </div>
      {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
      {helperText && !error && <p className="text-xs text-slate-500">{helperText}</p>}
    </div>
  );
}
