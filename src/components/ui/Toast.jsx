import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import useNotificationStore from '../../store/notificationStore';

const config = {
  success: {
    icon: CheckCircle2,
    bar: 'bg-emerald-500',
    text: 'text-emerald-300',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  error: {
    icon: AlertCircle,
    bar: 'bg-rose-500',
    text: 'text-rose-300',
    bg: 'bg-rose-500/10 border-rose-500/20',
  },
  warning: {
    icon: AlertTriangle,
    bar: 'bg-amber-500',
    text: 'text-amber-300',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
  info: {
    icon: Info,
    bar: 'bg-indigo-500',
    text: 'text-indigo-300',
    bg: 'bg-indigo-500/10 border-indigo-500/20',
  },
};

export default function ToastContainer() {
  const { toasts, removeToast } = useNotificationStore();
  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-[300] space-y-2.5 w-96 max-w-[calc(100vw-2rem)]">
      {toasts.map((t) => {
        const c = config[t.type] || config.info;
        const Icon = c.icon;

        return (
          <div
            key={t.id}
            className={`
              relative flex items-start gap-3.5 p-4 rounded-2xl border 
              backdrop-blur-xl shadow-2xl shadow-black/30
              animate-slide-right overflow-hidden
              ${c.bg}
            `}
          >
            {/* Left accent bar */}
            <div className={`absolute left-0 inset-y-0 w-1 ${c.bar} rounded-l-2xl`} />

            <div className="pl-1">
              <Icon size={20} className={`${c.text} shrink-0 mt-0.5`} />
            </div>

            <div className="flex-1 min-w-0">
              {t.title && (
                <p className="text-sm font-bold text-white mb-0.5">{t.title}</p>
              )}
              <p className="text-sm text-slate-300 leading-relaxed">{t.message}</p>
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
