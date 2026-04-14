import React, { useState, useEffect, useRef } from 'react';
import {
  Send, Paperclip, Smile, Hash, Users, Info, Search,
  MoreVertical, Pin, MessageSquare, Bookmark, Reply, Plus
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import useChannelStore from '../store/channelStore';
import { onChannelMessages, sendMessage, toggleBookmark, onTypingStatusChange, setTypingStatus, uploadFile } from '../services/firestoreService';
import { formatTimeAgo, formatFileSize } from '../lib/utils';
import { getRoleBadge } from '../lib/rbac';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import ThreadPanel from '../components/chat/ThreadPanel';

export default function ChatPage() {
  const { user } = useAuthStore();
  const { activeChannel, channels, getActiveChannelId } = useChannelStore();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeThreadMsg, setActiveThreadMsg] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const activeChannelId = getActiveChannelId();
  const channelData = channels.find((c) => c === activeChannel)
    ? { name: activeChannel }
    : { name: 'general', description: 'Main discussion channel' };

  const handleBookmark = async (msg) => await toggleBookmark(user.uid, msg);

  useEffect(() => {
    if (!activeChannelId) return;
    setIsLoading(true);
    const unsubMsgs = onChannelMessages(activeChannelId, (msgs) => {
      setMessages(msgs);
      setIsLoading(false);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    const unsubTyping = onTypingStatusChange(activeChannelId, (users) => {
      setTypingUsers(users.filter(u => u.userId !== user.uid));
    });

    return () => {
      unsubMsgs();
      unsubTyping();
    };
  }, [activeChannel, activeChannelId, user.uid]);

  const handleTyping = () => {
    if (!activeChannelId || !user) return;
    setTypingStatus(activeChannelId, user.uid, true);
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTypingStatus(activeChannelId, user.uid, false);
    }, 3000);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeChannelId) return;
    
    setIsUploading(true);
    try {
      const url = await uploadFile(file, `chat/${activeChannelId}`);
      await sendMessage({
        channelId: activeChannelId,
        text: `Attached file: ${file.name}`,
        fileUrl: url,
        fileName: file.name,
        fileSize: file.size,
        senderId: user.uid,
        senderName: user.name,
        senderEmail: user.email,
        senderRole: user.role,
        type: 'file',
      });
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;
    setIsSending(true);
    try {
      await sendMessage({
        channelId: activeChannelId,
        text: newMessage.trim(),
        senderId: user.uid,
        senderName: user.name,
        senderEmail: user.email,
        senderRole: user.role,
        type: 'channel',
      });
      setNewMessage('');
    } finally {
      setIsSending(false);
    }
  };

  if (!activeChannel) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <div className="text-center animate-fade-in space-y-4">
          <div className="w-20 h-20 mx-auto bg-indigo-500/10 border border-indigo-500/20 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-500/10">
            <MessageSquare size={36} className="text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Welcome to DYPIU Collab</h2>
          <p className="max-w-sm mx-auto text-slate-400 text-sm leading-relaxed">
            Pick a channel from the sidebar to start collaborating with your classmates and faculty in real-time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex min-w-0 relative overflow-hidden">
      {/* Main Chat Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Channel Header */}
        <div className="h-14 border-b border-white/[0.05] px-6 flex items-center justify-between bg-black/20 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500/15 rounded-xl flex items-center justify-center text-indigo-400">
              <Hash size={16} />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">{channelData.name}</h2>
              {channelData.description && (
                <p className="text-xs text-slate-500 leading-none mt-0.5">{channelData.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            {[Search, Users, Pin, Info, MoreVertical].map((Icon, i) => (
              <button key={i} className="p-2 rounded-xl hover:text-white hover:bg-white/8 transition-all">
                <Icon size={16} />
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5 space-y-5">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                <Hash size={28} className="text-slate-600" />
              </div>
              <p className="text-lg font-semibold text-slate-300">Start of # {channelData.name}</p>
              <p className="text-sm text-slate-500 mt-1">This is the beginning of the channel history.</p>
            </div>
          ) : (
            <>
              <div className="pb-4 border-b border-white/[0.04] mb-6">
                <h1 className="text-2xl font-extrabold text-white mb-1">#{channelData.name}</h1>
                <p className="text-slate-500 text-sm">Beginning of the channel.</p>
              </div>

              {messages.map((msg) => {
                const roleInfo = getRoleBadge(msg.senderRole);
                return (
                  <div
                    key={msg.id}
                    className="group flex gap-4 hover:bg-white/[0.015] -mx-3 px-3 py-2 rounded-2xl transition-colors relative"
                  >
                    <Avatar name={msg.senderName} size="md" className="shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-slate-100 hover:underline cursor-pointer">
                          {msg.senderName}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase ${roleInfo.color} text-white`}>
                          {roleInfo.label}
                        </span>
                        <span className="text-[10px] text-slate-600">{formatTimeAgo(msg.timestamp)}</span>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed break-words whitespace-pre-wrap">
                        {msg.text}
                      </p>
                      
                      {msg.type === 'file' && msg.fileUrl && (
                        <div className="mt-3 inline-flex items-center gap-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3 pr-5 group/file hover:bg-white/[0.05] transition-all cursor-pointer" onClick={() => window.open(msg.fileUrl, '_blank')}>
                          <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 group-hover/file:scale-110 transition-transform">
                            <Paperclip size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-200 truncate max-w-[200px]">{msg.fileName}</p>
                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">{formatFileSize(msg.fileSize)}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Hover Actions */}
                    <div className="absolute -top-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-slate-800/90 backdrop-blur-sm border border-white/[0.08] rounded-xl px-1.5 py-1 shadow-xl">
                      <button onClick={() => handleBookmark(msg)} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all">
                        <Bookmark size={14} />
                      </button>
                      <button onClick={() => setActiveThreadMsg(msg)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all">
                        <Reply size={14} />
                      </button>
                      <button className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-all">
                        <MoreVertical size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
              
              {typingUsers.length > 0 && (
                <div className="flex items-center gap-2 text-[10px] text-slate-500 italic animate-pulse px-2">
                  <div className="flex gap-0.5">
                    <div className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" />
                    <div className="w-1 h-1 bg-slate-500 rounded-full animate-bounce delay-75" />
                    <div className="w-1 h-1 bg-slate-500 rounded-full animate-bounce delay-150" />
                  </div>
                  {typingUsers.map(u => u.userId).join(', ')} is typing...
                </div>
              )}
              <div ref={scrollRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="px-5 pb-5 pt-2 shrink-0">
          <form
            onSubmit={handleSend}
            className="bg-white/[0.04] border border-white/[0.08] rounded-2xl focus-within:border-indigo-500/40 focus-within:bg-white/[0.06] transition-all shadow-lg"
          >
            <div className="flex items-end gap-2 px-4 py-3">
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 text-slate-500 hover:text-slate-200 rounded-xl transition-colors shrink-0 relative"
              >
                <Plus size={20} />
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileUpload} 
              />
              <textarea
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); }
                }}
                placeholder={`Message #${channelData.name}`}
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-slate-200 placeholder-slate-600 resize-none py-1 max-h-36 custom-scrollbar min-h-[28px] outline-none"
                rows={1}
              />
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" className="p-1.5 text-slate-500 hover:text-slate-200 rounded-xl transition-colors">
                  <Smile size={18} />
                </button>
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isSending}
                  className="p-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl disabled:opacity-40 transition-all shadow-lg shadow-indigo-600/25 active:scale-95"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </form>
          <p className="text-[10px] text-slate-600 mt-2 px-1">
            <span className="font-bold">Enter</span> to send · <span className="font-bold">Shift+Enter</span> for new line
          </p>
        </div>
      </div>

      {/* Thread Panel */}
      {activeThreadMsg && (
        <ThreadPanel
          channelId={activeChannelId}
          parentMsg={activeThreadMsg}
          onClose={() => setActiveThreadMsg(null)}
        />
      )}
    </div>
  );
}
