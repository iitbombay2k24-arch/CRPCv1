import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Smile, Plus, MessageSquare } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { onThreadMessages, sendMessage } from '../../services/firestoreService';
import Avatar from '../ui/Avatar';
import { formatTimeAgo } from '../../lib/utils';
import { getRoleBadge } from '../../lib/rbac';
import Spinner from '../ui/Spinner';
import { moderateMessage } from '../../services/moderationService';
import useNotificationStore from '../../store/notificationStore';
import { logModerationEvent } from '../../services/firestoreService';

export default function ThreadPanel({ channelId, parentMsg, onClose }) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!channelId || !parentMsg) return;
    setIsLoading(true);
    const unsub = onThreadMessages(channelId, parentMsg.id, (msgs) => {
      setMessages(msgs);
      setIsLoading(false);
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });
    return () => unsub();
  }, [channelId, parentMsg]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    // Moderation check
    const { cleanText, isBlocked, reason } = moderateMessage(newMessage.trim());
    
    if (isBlocked) {
      useNotificationStore.getState().warning(reason, 'Message Blocked');
      logModerationEvent({
        userId: user.uid,
        userName: user.name,
        userEmail: user.email,
        text: newMessage.trim(),
        reason,
        location: `thread:${channelId}:${parentMsg.id}`,
        type: 'block'
      });
      return;
    }

    setIsSending(true);
    try {
      await sendMessage({
        channelId,
        text: cleanText,
        senderId: user.uid,
        senderName: user.name,
        senderEmail: user.email,
        senderRole: user.role,
        type: 'channel',
        parentId: parentMsg.id
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setIsSending(false);
    }
  };

  if (!parentMsg) return null;
  const roleInfo = getRoleBadge(parentMsg.senderRole);

  return (
    <div className="w-96 border-l border-slate-700/50 bg-slate-900/90 flex flex-col relative z-20 animate-slide-in shadow-2xl flex-shrink-0">
      <div className="h-16 border-b border-slate-700/50 px-4 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
        <div className="flex items-center gap-2 text-slate-200">
           <MessageSquare size={18} className="text-indigo-400" />
           <h3 className="font-bold">Thread</h3>
           <span className="text-xs text-slate-500 font-medium">#{channelId}</span>
        </div>
        <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Parent Message Info */}
        <div className="p-6 border-b border-slate-800/80 bg-slate-800/20">
           <div className="flex gap-4">
              <Avatar name={parentMsg.senderName} size="sm" className="mt-1" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-slate-100">{parentMsg.senderName}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter ${roleInfo.color} text-white`}>
                    {roleInfo.label}
                  </span>
                  <span className="text-[10px] text-slate-500">{formatTimeAgo(parentMsg.timestamp)}</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{parentMsg.text}</p>
              </div>
           </div>
           
           <div className="mt-4 flex items-center gap-2">
             <div className="flex-1 h-[1px] bg-slate-800"></div>
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{parentMsg.replyCount || messages.length} REPLIES</span>
             <div className="flex-1 h-[1px] bg-slate-800"></div>
           </div>
        </div>

        {/* Replies */}
        <div className="p-6 space-y-6">
           {isLoading ? (
             <Spinner label="Loading replies..." />
           ) : messages.length === 0 ? (
             <p className="text-xs text-center text-slate-500 italic">No replies yet. Be the first!</p>
           ) : (
             messages.map(msg => {
               const rInfo = getRoleBadge(msg.senderRole);
               return (
                 <div key={msg.id} className="flex gap-4 group">
                    <Avatar name={msg.senderName} size="xs" className="mt-1 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                       <div className="flex items-baseline gap-2 mb-0.5">
                         <span className="font-bold text-sm text-slate-100">{msg.senderName}</span>
                         <span className={`text-[9px] px-1 rounded font-bold uppercase tracking-tighter ${rInfo.color} text-white`}>
                            {rInfo.label}
                         </span>
                         <span className="text-[9px] text-slate-600">{formatTimeAgo(msg.timestamp)}</span>
                       </div>
                       <p className="text-sm text-slate-300 leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>
                    </div>
                 </div>
               )
             })
           )}
           <div ref={scrollRef} />
        </div>
      </div>

      {/* Input */}
      <div className="p-4 bg-slate-900 border-t border-slate-700/50">
        <form onSubmit={handleSend} className="bg-slate-800/80 rounded-xl flex items-end p-1 focus-within:ring-1 ring-indigo-500/50">
           <button type="button" className="p-2 text-slate-500 hover:text-slate-300">
             <Plus size={16} />
           </button>
           <textarea
             value={newMessage}
             onChange={(e) => setNewMessage(e.target.value)}
             onKeyDown={(e) => {
               if (e.key === 'Enter' && !e.shiftKey) {
                 e.preventDefault();
                 handleSend(e);
               }
             }}
             placeholder="Reply in thread..."
             className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-white resize-none max-h-32 custom-scrollbar py-2"
             rows={1}
           />
           <button 
             type="submit" 
             disabled={!newMessage.trim() || isSending}
             className="p-1.5 m-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50"
           >
             <Send size={14} />
           </button>
        </form>
      </div>
    </div>
  );
}
