import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function Input({
  type = 'text',
  label,
  error,
  helperText,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className = '',
  ...props
}) {
  const [showPw, setShowPw] = useState(false);
  const isPw = type === 'password';

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-semibold text-slate-300">
          {label}
        </label>
      )}
      <div className="relative group">
        {LeftIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 pointer-events-none transition-colors">
            <LeftIcon size={16} />
          </div>
        )}
        <input
          type={isPw ? (showPw ? 'text' : 'password') : type}
          className={`
            w-full bg-white/[0.04] border rounded-xl text-sm text-white placeholder-slate-500 
            transition-all duration-200 ease-out py-3
            hover:bg-white/[0.06] hover:border-white/15
            focus:outline-none focus:bg-white/[0.06] focus:shadow-lg focus:shadow-indigo-500/10
            ${error
              ? 'border-rose-500/50 focus:border-rose-400/80'
              : 'border-white/[0.08] focus:border-indigo-500/60'
            }
            ${LeftIcon ? 'pl-10' : 'pl-4'}
            ${(RightIcon || isPw) ? 'pr-10' : 'pr-4'}
            ${className}
          `}
          {...props}
        />
        {isPw && (
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
          >
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
        {!isPw && RightIcon && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <RightIcon size={16} />
          </div>
        )}
      </div>
      {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
      {helperText && !error && <p className="text-xs text-slate-500">{helperText}</p>}
    </div>
  );
}
