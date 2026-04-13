import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import useNotificationStore from '../../store/notificationStore';

const icons = { success: CheckCircle2, error: AlertCircle, warning: AlertTriangle, info: Info };
const colors = {
  success: 'border-emerald-500/30 bg-emerald-500/10',
  error: 'border-rose-500/30 bg-rose-500/10',
  warning: 'border-amber-500/30 bg-amber-500/10',
  info: 'border-indigo-500/30 bg-indigo-500/10',
};
const iconColors = { success: 'text-emerald-400', error: 'text-rose-400', warning: 'text-amber-400', info: 'text-indigo-400' };

export default function ToastContainer() {
  const { toasts, removeToast } = useNotificationStore();
  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-[300] w-96 max-w-[calc(100vw-2rem)] space-y-2">
      {toasts.map(t => {
        const Icon = icons[t.type] || icons.info;
        return (
          <div key={t.id} className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-xl shadow-black/20 animate-slide-right ${colors[t.type]}`}>
            <Icon size={20} className={`${iconColors[t.type]} shrink-0 mt-0.5`} />
            <div className="flex-1 min-w-0">
              {t.title && <p className="text-sm font-bold text-white">{t.title}</p>}
              <p className="text-sm text-slate-300">{t.message}</p>
            </div>
            <button onClick={() => removeToast(t.id)} className="shrink-0 p-1 rounded text-slate-400 hover:text-white"><X size={14} /></button>
          </div>
        );
      })}
    </div>
  );
}
