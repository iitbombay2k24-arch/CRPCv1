import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const sizeMap = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

export default function Modal({ isOpen, onClose, title, subtitle, size = 'md', children, footer }) {
  useEffect(() => {
    if (!isOpen) return;
    const esc = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', esc); document.body.style.overflow = ''; };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={`relative w-full ${sizeMap[size]} bg-slate-800 rounded-2xl border border-slate-700/50 shadow-2xl shadow-black/40 animate-scale-in flex flex-col max-h-[90vh]`}>
        {title && (
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-700/50">
            <div>
              <h2 className="text-lg font-bold text-white">{title}</h2>
              {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"><X size={18} /></button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-slate-700/50 flex items-center justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}
