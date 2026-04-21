import React, { useState, useRef, useEffect } from 'react';
import { 
  Users, Music, MessageCircle, Play, Pause, Volume2, 
  Wind, Coffee, CloudRain, Moon, Sparkles, Send, Mic
} from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import useNotificationStore from '../store/notificationStore';
import useAuthStore from '../store/authStore';
import { onChannelMessages, sendMessage } from '../services/firestoreService';

const AMBIENT_SOUNDS = [
  { id: 'rain', name: 'Lofi Rain', track: 'Night Rain in Mumbai', icon: CloudRain, color: 'text-blue-400' },
  { id: 'cafe', name: 'Cafe Hubbub', track: 'DYPIU Canteen Ambience', icon: Coffee, color: 'text-amber-500' },
  { id: 'wind', name: 'Mountain Breeze', track: 'Lonavala Morning', icon: Wind, color: 'text-sky-400' },
  { id: 'night', name: 'Summer Night', track: 'Pune Silence v2', icon: Moon, color: 'text-indigo-400' },
];

export default function GroupStudyPage() {
  const [activeSound, setActiveSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const chatRef = useRef(null);
  const { info } = useNotificationStore();
  const { user } = useAuthStore();

  const ROOM_ID = 'group_study_main';

  useEffect(() => {
    const unsub = onChannelMessages(ROOM_ID, (data) => {
      setMessages(data);
    });
    return () => unsub();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    const text = newMessage.trim();
    setNewMessage('');
    try {
      await sendMessage({
        channelId: ROOM_ID,
        text,
        senderId: user.uid,
        senderName: user.name,
        senderRole: user.role,
        type: 'channel'
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  return (
    <div className="h-full flex flex-col min-w-0">
      <div className="h-16 border-b border-white/[0.05] px-7 flex items-center justify-between bg-black/20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500">
            <Users size={18} />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">Interactive Group Study</h2>
            <p className="text-[11px] text-slate-500">Collaborate with ambient sounds and real-time audio</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="success" className="animate-pulse">32 Active Students</Badge>
          <Button onClick={() => info('Voice Connected', 'You have joined the study room audio channel.')} variant="primary" icon={Mic} size="sm">Join Voice</Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content: Ambient Console */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-12">
          {/* Ambient Player Card */}
          <div className="glass-card rounded-[3rem] p-10 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent border-indigo-500/10 relative overflow-hidden text-center max-w-2xl mx-auto">
             <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
             
             <div className="relative z-10">
                <div className="w-20 h-20 bg-white shadow-xl shadow-indigo-500/20 rounded-full mx-auto flex items-center justify-center mb-6">
                  {isPlaying ? (
                    <div className="flex gap-1 items-center">
                      <div className="w-1 h-6 bg-indigo-500 rounded-full animate-[bounce_1s_infinite]" />
                      <div className="w-1 h-10 bg-indigo-500 rounded-full animate-[bounce_0.8s_infinite]" />
                      <div className="w-1 h-8 bg-indigo-500 rounded-full animate-[bounce_1.2s_infinite]" />
                    </div>
                  ) : <Music className="text-indigo-500" size={32} />}
                </div>

                <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Focus Laboratory</h3>
                <p className="text-sm text-slate-400 mb-10 max-w-sm mx-auto">
                   {isPlaying ? (
                     <span className="text-indigo-400 font-bold animate-pulse">Now Playing: {AMBIENT_SOUNDS.find(s=>s.id === activeSound)?.track || 'Studio Feed'}</span>
                   ) : 'Select an ambient soundscape to boost your shared productivity.'}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
                  {AMBIENT_SOUNDS.map(s => (
                    <button 
                      key={s.id}
                      onClick={() => { setActiveSound(s.id); setIsPlaying(true); }}
                      className={`
                        p-4 rounded-[2rem] flex flex-col items-center gap-2 transition-all
                        ${activeSound === s.id ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-white/[0.03] text-slate-500 hover:bg-white/10 hover:text-slate-200'}
                      `}
                    >
                      <s.icon size={24} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{s.name}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-6">
                   <button 
                     onClick={() => setIsPlaying(!isPlaying)}
                     className="w-14 h-14 bg-white text-indigo-600 rounded-2xl flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all"
                   >
                     {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                   </button>
                   <div className="flex items-center gap-3 grow max-w-[200px]">
                      <Volume2 size={18} className="text-slate-500" />
                      <input 
                        type="range" 
                        min="0" max="100" 
                        value={volume} 
                        onChange={(e) => setVolume(e.target.value)}
                        className="w-full h-1.5 bg-white/[0.08] rounded-full appearance-none cursor-pointer accent-indigo-500"
                      />
                   </div>
                </div>
             </div>
          </div>
          
          {/* Active Participants */}
          <div className="max-w-2xl mx-auto">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Listening Together Now</h4>
            <div className="flex flex-wrap gap-4">
              {['Aryan', 'Sakshi', 'Omkar', 'Tanmay', 'Ishani', 'Siddhant'].map((name, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                   <Avatar name={name} size="md" className="border-2 border-emerald-500/20" />
                   <span className="text-[10px] text-slate-500 font-bold">{name}</span>
                </div>
              ))}
              <div className="w-10 h-10 bg-white/[0.02] border border-dashed border-white/10 rounded-full flex items-center justify-center text-slate-600 text-[10px] font-black">
                +26
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Mini Chat */}
        <div className="w-80 border-l border-white/[0.05] bg-black/10 flex flex-col shrink-0">
          <div className="p-4 border-b border-white/[0.05]">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <MessageCircle size={14} /> Room Chat
            </h3>
          </div>
          <div ref={chatRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center p-8">
                <Sparkles size={24} className="text-slate-800 mx-auto mb-2 opacity-20" />
                <p className="text-[11px] text-slate-600 italic">This session is private to the active study room.</p>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={m.id || i} className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-indigo-400">{m.senderName}</span>
                    <span className="text-[9px] text-slate-600">{m.time || 'now'}</span>
                  </div>
                  <p className="text-sm text-slate-300">{m.text}</p>
                </div>
              ))
            )}
          </div>
          <div className="p-4 bg-black/20">
            <form onSubmit={handleSend} className="relative">
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Message room..."
                className="w-full h-10 bg-white/[0.04] border border-white/[0.08] rounded-xl pl-4 pr-10 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/30 transition-all"
              />
              <button disabled={!newMessage.trim()} type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-500 hover:text-indigo-400 disabled:text-slate-600 transition-colors">
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
