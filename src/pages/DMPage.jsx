import React, { useState, useEffect, useRef } from 'react';
import {
  Send, MessageSquare, ShieldCheck, Phone, Video,
  MoreVertical, Bookmark, Check, CheckCheck
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { sendMessage, onDMMessages, toggleBookmark, markDMAsRead } from '../services/firestoreService';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';

export default function DMPage({ recipient }) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef(null);

  const handleBookmark = async (msg) => await toggleBookmark(user.uid, msg);

  useEffect(() => {
    if (!recipient || !user) return;
    const combinedId = [user.uid, recipient.uid].sort().join('_');
    const unsub = onDMMessages(combinedId, (data) => setMessages(data));
    markDMAsRead(user.uid, recipient.uid);
    return () => unsub();
  }, [recipient, user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending || !recipient) return;
    setIsSending(true);
    try {
      const combinedId = [user.uid, recipient.uid].sort().join('_');
      await sendMessage({
        channelId: combinedId,
        text: newMessage.trim(),
        senderId: user.uid,
        senderName: user.name,
        senderRole: user.role,
        type: 'dm',
      });
      setNewMessage('');
    } finally {
      setIsSending(false);
    }
  };

  if (!recipient) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="w-20 h-20 bg-white/[0.03] border border-white/[0.06] rounded-3xl flex items-center justify-center mb-5 shadow-xl">
          <MessageSquare size={36} className="text-slate-600" />
        </div>
        <h4 className="text-lg font-bold text-slate-300 mb-2">Encrypted Direct Messaging</h4>
        <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
          Select a peer or faculty from the sidebar to start a secure 1-on-1 conversation.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* DM Header */}
      <div className="h-16 border-b border-white/[0.05] px-6 flex items-center justify-between bg-black/20 shrink-0">
        <div className="flex items-center gap-3.5">
          <Avatar name={recipient.name} size="md" status="online" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">{recipient.name}</h2>
              <ShieldCheck size={13} className="text-emerald-400" />
            </div>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1.5 leading-none mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_4px_rgba(52,211,153,0.8)]" />
              Active Now · {recipient.role}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {[Phone, Video, MoreVertical].map((Icon, i) => (
            <button key={i} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/8 transition-all">
              <Icon size={17} />
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center animate-fade-in">
            <div className="w-12 h-12 bg-white/[0.03] border border-white/[0.06] rounded-2xl flex items-center justify-center mb-3">
              <ShieldCheck size={22} className="text-slate-600" />
            </div>
            <p className="text-sm text-slate-500 max-w-xs leading-relaxed italic">
              Messages are end-to-end encrypted. Only you and {recipient.name} can read them.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user.uid;
            return (
              <div key={msg.id} className={`flex gap-3 ${isMe ? 'justify-end' : 'justify-start'} group items-end`}>
                {!isMe && <Avatar name={msg.senderName} size="sm" className="shrink-0" />}
                <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'} relative`}>
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-lg relative
                    ${isMe
                      ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-br-md shadow-indigo-600/15'
                      : 'bg-white/[0.05] border border-white/[0.08] text-slate-200 rounded-bl-md'
                    }`}>
                    {msg.text}
                    {/* Bookmark action */}
                    <button
                      onClick={() => handleBookmark(msg)}
                      className={`absolute ${isMe ? '-left-7' : '-right-7'} top-1/2 -translate-y-1/2 p-1.5 text-slate-600 hover:text-amber-400 rounded-xl opacity-0 group-hover:opacity-100 transition-all`}
                    >
                      <Bookmark size={13} />
                    </button>
                  </div>
                  <div className={`flex items-center gap-1.5 mt-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">{msg.time}</span>
                    {isMe && (
                      <span className={msg.isRead ? 'text-indigo-400' : 'text-slate-600'}>
                        {msg.isRead ? <CheckCheck size={10} /> : <Check size={10} />}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="p-5 border-t border-white/[0.05] bg-black/20 shrink-0">
        <form onSubmit={handleSend} className="relative">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message ${recipient.name}…`}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl py-3.5 pl-5 pr-16 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 focus:bg-white/[0.06] transition-all"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Button
              type="submit"
              variant={newMessage.trim() ? 'primary' : 'ghost'}
              size="sm"
              loading={isSending}
              disabled={!newMessage.trim()}
              className="rounded-xl"
            >
              <Send size={15} />
            </Button>
          </div>
        </form>
        <p className="text-[10px] text-center text-slate-700 mt-2.5 uppercase tracking-widest font-bold">
          End-to-End Encrypted
        </p>
      </div>
    </div>
  );
}
