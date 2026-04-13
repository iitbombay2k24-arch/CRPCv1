// Notification Store — global toast system
import { create } from 'zustand';

let nextId = 0;

const useNotificationStore = create((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = ++nextId;
    const t = { id, type: toast.type || 'info', title: toast.title || '', message: toast.message || '', duration: toast.duration || 4000 };
    set(s => ({ toasts: [...s.toasts, t] }));
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(x => x.id !== id) })), t.duration);
    return id;
  },
  removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
  success: (message, title) => get().addToast({ type: 'success', message, title }),
  error: (message, title) => get().addToast({ type: 'error', message, title }),
  warning: (message, title) => get().addToast({ type: 'warning', message, title }),
  info: (message, title) => get().addToast({ type: 'info', message, title }),
}));

export default useNotificationStore;
