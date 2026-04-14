import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  AlertCircle,
  X,
  Target
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { onNotificationsChange, markNotificationAsRead, clearAllNotifications } from '../../services/firestoreService';
import Badge from '../ui/Badge';
import { formatTimeAgo } from '../../lib/utils';

export default function NotificationPanel({ isOpen, onClose }) {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user?.uid || !isOpen) return;
    const unsubscribe = onNotificationsChange(user.uid, setNotifications);
    return () => unsubscribe();
  }, [user?.uid, isOpen]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleRead = async (id) => {
    await markNotificationAsRead(user.uid, id);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'TASK_ASSIGNMENT': return <Target size={16} className="text-indigo-400" />;
      case 'REPLY': return <MessageSquare size={16} className="text-emerald-400" />;
      case 'MENTION': return <Bell size={16} className="text-amber-400" />;
      case 'DLP_WARNING': return <AlertCircle size={16} className="text-rose-400" />;
      default: return <Bell size={16} className="text-slate-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-16 right-4 w-96 max-h-[600px] bg-slate-900 border border-slate-700/50 rounded-3xl shadow-2xl z-[100] flex flex-col overflow-hidden animate-slide-up">
      <div className="p-6 border-b border-slate-700/50 bg-slate-950/30 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <h3 className="text-sm font-black text-white uppercase tracking-widest">In-App Intel</h3>
            {unreadCount > 0 && <Badge variant="primary" size="xs">{unreadCount} NEW</Badge>}
         </div>
         <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors">
            <X size={18} />
         </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
         {notifications.length === 0 ? (
           <div className="p-20 text-center text-slate-600">
              <Bell size={48} className="mx-auto mb-4 opacity-10" />
              <p className="text-xs font-bold uppercase tracking-widest">No Active Notifications</p>
           </div>
         ) : (
           <div className="divide-y divide-slate-800/30">
              {notifications.map((n) => (
                <div 
                  key={n.id} 
                  onClick={() => handleRead(n.id)}
                  className={`p-5 flex gap-4 hover:bg-white/[0.02] cursor-pointer transition-colors relative group
                    ${!n.isRead ? 'bg-indigo-500/5' : ''}`}
                >
                   <div className={`p-2 rounded-xl bg-slate-800 flex-shrink-0
                      ${!n.isRead ? 'ring-1 ring-indigo-500/20 shadow-lg shadow-indigo-500/5' : ''}`}>
                      {getIcon(n.type)}
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className={`text-sm tracking-tight mb-1 ${!n.isRead ? 'text-white font-bold' : 'text-slate-400 font-medium'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-2">
                        {n.body}
                      </p>
                      <div className="flex items-center gap-3">
                         <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest flex items-center gap-1.5">
                            <Clock size={10} /> {formatTimeAgo(n.createdAt?.toDate())}
                         </span>
                         {!n.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                         )}
                      </div>
                   </div>
                </div>
              ))}
           </div>
         )}
      </div>

      <div className="p-4 bg-slate-950/50 border-t border-slate-800/50 text-center">
         <button 
           onClick={() => clearAllNotifications(user.uid)}
           className="text-[10px] font-black text-slate-500 hover:text-indigo-400 uppercase tracking-widest transition-colors"
         >
            Clear Processed Notifications
         </button>
      </div>
    </div>
  );
}
