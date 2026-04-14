import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const sizeMap = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', full: 'max-w-6xl' };

export default function Modal({ isOpen, onClose, title, subtitle, size = 'md', children, footer, noPadding = false }) {
  useEffect(() => {
    if (!isOpen) return;
    const esc = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', esc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xl animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div
        className={`
          relative w-full ${sizeMap[size]}
          bg-gradient-to-b from-slate-800/80 to-slate-900/90
          backdrop-blur-2xl rounded-3xl
          border border-white/[0.08]
          shadow-2xl shadow-black/60
          animate-scale-in flex flex-col max-h-[90vh]
        `}
      >
        {/* Glow Line Top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent rounded-full" />

        {title && (
          <div className="flex items-center justify-between px-7 pt-6 pb-5 border-b border-white/[0.06] shrink-0">
            <div>
              <h2 className="text-lg font-bold text-white">{title}</h2>
              {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/8 transition-all"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div className={`flex-1 overflow-y-auto custom-scrollbar ${noPadding ? '' : 'px-7 py-5'}`}>
          {children}
        </div>

        {footer && (
          <div className="px-7 py-5 border-t border-white/[0.06] flex items-center justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
