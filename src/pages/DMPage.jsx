import React, { useState, useEffect, useRef } from 'react';
import {
  Send, MessageSquare, ShieldCheck, Phone, Video,
  MoreVertical, Bookmark, Check, CheckCheck, Search,
  Loader2, Hash, Mail, ArrowRight
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { sendMessage, onDMMessages, toggleBookmark, markDMAsRead, searchUsers } from '../services/firestoreService';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

import UserSearchModal from '../modals/UserSearchModal';
import useUIStore from '../store/uiStore';

export default function DMPage() {
  const { user } = useAuthStore();
  const { dmTarget, setDmTarget } = useUIStore();
  const recipient = dmTarget;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
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
    const [localQuery, setLocalQuery] = useState('');
    const [localResults, setLocalResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
      if (!localQuery || localQuery.length < 2) {
        setLocalResults([]);
        return;
      }
      const delayFn = setTimeout(async () => {
        setIsSearching(true);
        const data = await searchUsers(localQuery);
        setLocalResults(data);
        setIsSearching(false);
      }, 400);
      return () => clearTimeout(delayFn);
    }, [localQuery]);

    return (
      <div className="h-full flex flex-col items-center justify-center p-8 animate-fade-in relative overflow-hidden bg-[#03040b]">
        {/* Animated Background Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="w-full max-w-2xl relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-white/[0.03] border border-white/[0.06] rounded-3xl flex items-center justify-center mb-10 shadow-2xl relative">
            <MessageSquare size={36} className="text-indigo-400" />
            <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full -z-10" />
          </div>
          
          <h4 className="text-3xl font-black text-white mb-4 tracking-tight">Direct Messaging</h4>
          <p className="text-slate-500 text-center max-w-md leading-relaxed mb-12">
            Connect with any peer or faculty member in the DYPIU registry. 
            Start typing to find someone by <span className="text-indigo-400 font-bold">PRN, Name, or Email</span>.
          </p>

          <div className="w-full relative group">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
              {isSearching ? <Loader2 size={24} className="animate-spin" /> : <Search size={24} />}
            </div>
            <input
              type="text"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Search by PRN, Name or Email..."
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[2rem] py-6 pl-16 pr-8 text-lg text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 focus:bg-white/[0.05] transition-all shadow-2xl"
            />
          </div>

          <div className="w-full mt-8 space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
            {localResults.map((u) => (
              <button
                key={u.uid}
                onClick={() => setDmTarget(u)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all group"
              >
                <Avatar name={u.name} size="md" status={u.status} />
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{u.name}</span>
                    <Badge variant="indigo" size="xs">{u.role}</Badge>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1.5"><Hash size={10} /> {u.prn}</span>
                    <span className="flex items-center gap-1.5"><Mail size={10} /> {u.email}</span>
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition-all text-indigo-400">
                  <ArrowRight size={18} />
                </div>
              </button>
            ))}
            
            {localQuery.length >= 2 && localResults.length === 0 && !isSearching && (
              <div className="text-center py-8 text-slate-500 animate-pulse">
                No matching identities found in registry.
              </div>
            )}
          </div>

          <p className="mt-16 text-[10px] text-slate-700 uppercase tracking-[0.3em] font-black">
            Secure End-to-End Encrypted Channel
          </p>
        </div>
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
