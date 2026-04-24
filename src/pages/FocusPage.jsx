import React, { useState, useEffect, useRef } from 'react';
import { Timer, Play, Pause, RotateCcw, Brain, Target, Bell, Settings, History, Flame, Music, Volume2, CloudRain, Coffee, Trees, Trophy } from 'lucide-react';
import Badge from '../components/ui/Badge';
import { doc, getDoc, getDocs, collection, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import useAuthStore from '../store/authStore';
import { saveFocusSession, getFocusSessionCount } from '../services/firestoreService';

const SOUNDS = [
  { id: 'none', label: 'Silence', icon: Music, url: '' },
  { id: 'lofi', label: 'Lo-Fi', icon: Music, url: 'https://stream.zeno.fm/f3wvbb79y8quv' },
  { id: 'rain', label: 'Rain', icon: CloudRain, url: 'https://www.soundjay.com/nature/rain-01.mp3' },
  { id: 'cafe', label: 'Cafe', icon: Coffee, url: 'https://www.soundjay.com/ambient/coffee-shop-1.mp3' },
  { id: 'forest', label: 'Forest', icon: Trees, url: 'https://www.soundjay.com/nature/forest-1.mp3' },
];

const MODES = [
  { label: 'Focus',       minutes: 25, color: 'text-indigo-400' },
  { label: 'Short Break', minutes: 5,  color: 'text-emerald-400' },
  { label: 'Long Break',  minutes: 15, color: 'text-sky-400' },
];

export default function FocusPage() {
  const { user } = useAuthStore();
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [modeIdx, setModeIdx] = useState(0);
  const [sessions, setSessions] = useState(0);
  const [isSavingSession, setIsSavingSession] = useState(false);
  const [activeSound, setActiveSound] = useState('none');
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef(null);
  const [focusLeaderboard, setFocusLeaderboard] = useState([]);

  const mode = MODES[modeIdx];
  const totalTime = mode.minutes * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  // Audio Effect
  useEffect(() => {
    if (activeSound === 'none') {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      return;
    }

    const sound = SOUNDS.find(s => s.id === activeSound);
    if (sound?.url) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(sound.url);
      audioRef.current.loop = true;
      audioRef.current.volume = volume;
      audioRef.current.play().catch(e => console.warn('Audio play blocked:', e));
    }
  }, [activeSound]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Load persisted session count and Leaderboard
  useEffect(() => {
    if (!user?.uid) return;
    getFocusSessionCount(user.uid)
      .then(count => setSessions(count))
      .catch(err => console.warn('Could not load focus session count:', err));

    // Fetch Focus Leaderboard (Simulated for now based on engagementScore or focus sessions)
    const fetchFocusLeaders = async () => {
      try {
        const q = query(collection(db, 'users'), orderBy('engagementScore', 'desc'), limit(5));
        const snap = await getDocs(q);
        setFocusLeaderboard(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
      } catch (e) { console.error('Focus leaderboard error:', e); }
    };
    fetchFocusLeaders();
  }, [user?.uid]);

  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;
    const t = setInterval(() => {
      setTimeLeft((p) => {
        if (p <= 1) {
          clearInterval(t);
          setIsActive(false);
          // Only persist completed Focus sessions (not breaks)
          if (modeIdx === 0) {
            handleSessionComplete();
          }
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, modeIdx]);

  const handleSessionComplete = async () => {
    setSessions(prev => prev + 1);
    if (!user?.uid) return;
    setIsSavingSession(true);
    try {
      await saveFocusSession(user.uid, { durationMinutes: 25, mode: 'Focus' });
    } catch (err) {
      console.warn('Could not save focus session:', err);
    } finally {
      setIsSavingSession(false);
    }
  };

  const handleMode = (idx) => {
    setModeIdx(idx);
    setTimeLeft(MODES[idx].minutes * 60);
    setIsActive(false);
  };

  const reset = () => {
    setIsActive(false);
    setTimeLeft(mode.minutes * 60);
  };

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');

  const circumference = 2 * Math.PI * 140;
  const strokeDashoffset = circumference - (circumference * progress) / 100;

  return (
    <div className="h-full flex flex-col min-w-0">
      {/* Header */}
      <div className="h-16 border-b border-white/[0.05] px-7 flex items-center justify-between bg-black/20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center text-rose-400">
            <Brain size={18} />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">Deep Focus Lab</h2>
            <p className="text-[11px] text-slate-500">Augmenting cognitive performance</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-end gap-1">
              <Flame size={10} className="text-orange-400" /> Sessions
            </p>
            <p className="text-2xl font-black text-white">
              {isSavingSession ? (
                <span className="text-lg text-indigo-400 animate-pulse">Saving...</span>
              ) : sessions}
            </p>
          </div>
          <button className="p-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-slate-400 hover:text-white transition-all">
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row p-7 gap-7">
         
         {/* Left Sidebar: Sound Mixer */}
         <div className="w-full lg:w-72 shrink-0 space-y-6">
            <div className="glass-card rounded-3xl p-6 border border-white/[0.06] bg-gradient-to-b from-indigo-500/[0.02] to-transparent">
               <div className="flex items-center gap-3 mb-6">
                  <Music className="text-indigo-400" size={16} />
                  <h3 className="font-black text-[10px] text-white uppercase tracking-widest">Ambient Scapes</h3>
               </div>
               
               <div className="space-y-2">
                  {SOUNDS.map((s) => (
                     <button
                        key={s.id}
                        onClick={() => setActiveSound(s.id)}
                        className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between group
                           ${activeSound === s.id 
                              ? 'bg-indigo-500/10 border-indigo-500/30 text-white' 
                              : 'bg-white/[0.02] border-white/[0.04] text-slate-500 hover:border-white/10 hover:text-slate-300'}`}
                     >
                        <div className="flex items-center gap-3">
                           <s.icon size={16} className={activeSound === s.id ? 'text-indigo-400' : 'text-slate-600'} />
                           <span className="text-xs font-bold">{s.label}</span>
                        </div>
                        {activeSound === s.id && (
                           <div className="flex gap-0.5">
                              {[1, 2, 3].map(i => (
                                 <div key={i} className="w-0.5 h-3 bg-indigo-400 animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                              ))}
                           </div>
                        )}
                     </button>
                  ))}
               </div>

               {activeSound !== 'none' && (
                  <div className="mt-8 pt-6 border-t border-white/[0.05]">
                     <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Volume Control</p>
                        <Volume2 size={12} className="text-slate-600" />
                     </div>
                     <input 
                        type="range" 
                        min="0" max="1" step="0.01"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-full accent-indigo-500 bg-white/10 rounded-lg h-1 appearance-none cursor-pointer"
                     />
                  </div>
               )}
            </div>
         </div>

         {/* Center: The Timer */}
         <div className="flex-1 flex flex-col items-center justify-center">
            <div className="max-w-md w-full flex flex-col items-center">
               {/* Mode tabs */}
               <div className="flex bg-white/[0.04] border border-white/[0.08] p-1.5 rounded-2xl mb-12 shadow-xl">
                  {MODES.map((m, i) => (
                  <button
                     key={m.label}
                     onClick={() => handleMode(i)}
                     className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all
                        ${modeIdx === i
                           ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/20'
                           : 'text-slate-500 hover:text-slate-300'
                        }`}
                  >
                     {m.label}
                  </button>
                  ))}
               </div>

               {/* SVG Timer Ring */}
               <div className="relative w-72 h-72 mb-12">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 320 320">
                  <circle cx="160" cy="160" r="140" fill="none" className="stroke-white/[0.05]" strokeWidth="14" />
                  <circle
                     cx="160" cy="160" r="140"
                     fill="none"
                     stroke="url(#timerGrad)"
                     strokeWidth="14"
                     strokeDasharray={circumference}
                     strokeDashoffset={strokeDashoffset}
                     strokeLinecap="round"
                     className="transition-all duration-900"
                  />
                  <defs>
                     <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#d4a373" />
                        <stop offset="100%" stopColor="#ccd5ae" />
                     </linearGradient>
                  </defs>
                  </svg>
                  <div className="absolute inset-0 rounded-full" style={{ boxShadow: 'inset 0 0 60px rgba(99,102,241,0.05)' }} />

                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-black text-white tracking-tighter tabular-nums">
                     {mins}:{secs}
                  </span>
                  <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2">
                     {mode.label.toUpperCase()}
                  </p>
                  </div>
               </div>

               {/* Controls */}
               <div className="flex items-center gap-5">
                  <button
                  onClick={reset}
                  className="w-14 h-14 bg-white/[0.05] border border-white/[0.08] rounded-2xl text-slate-400 hover:text-white hover:bg-white/[0.09] transition-all shadow-lg active:scale-90"
                  >
                  <RotateCcw size={22} className="mx-auto" />
                  </button>

                  <button
                  onClick={() => setIsActive(!isActive)}
                  className={`w-24 h-24 rounded-3xl text-white shadow-2xl transition-all active:scale-95 flex items-center justify-center
                     ${isActive
                        ? 'bg-white/[0.08] border border-white/[0.12] hover:bg-white/[0.12]'
                        : 'bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-600/30'
                     }`}
                  >
                  {isActive
                     ? <Pause size={40} fill="white" />
                     : <Play size={40} fill="white" className="translate-x-1" />
                  }
                  </button>

                  <button className="w-14 h-14 bg-white/[0.05] border border-white/[0.08] rounded-2xl text-slate-400 hover:text-white hover:bg-white/[0.09] transition-all shadow-lg active:scale-90">
                  <Bell size={22} className="mx-auto" />
                  </button>
               </div>
            </div>
         </div>

         {/* Right Sidebar: Focus Leaders */}
         <div className="w-full lg:w-72 shrink-0">
            <div className="glass-card rounded-3xl p-6 h-full border border-white/[0.06] bg-gradient-to-b from-emerald-500/[0.02] to-transparent">
               <div className="flex items-center gap-3 mb-6">
                  <Trophy className="text-amber-400" size={16} />
                  <h3 className="font-black text-[10px] text-white uppercase tracking-widest">Study Legends</h3>
               </div>

               <div className="space-y-5">
                  {focusLeaderboard.map((u, i) => (
                     <div key={u.uid} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                           <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-amber-400 animate-pulse' : 'bg-slate-700'}`} />
                           <Avatar name={u.name} size="xs" />
                           <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-200 truncate group-hover:text-indigo-400 transition-colors">{u.name}</p>
                              <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">{u.branch || 'DYPIU Student'}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-xs font-black text-indigo-400 tabular-nums">#{i + 1}</p>
                        </div>
                     </div>
                  ))}
                  {focusLeaderboard.length === 0 && (
                     <p className="text-center text-[10px] text-slate-700 italic py-10">Waiting for masters...</p>
                  )}
               </div>

               <div className="mt-10 p-5 bg-white/[0.02] border border-white/[0.04] rounded-2xl">
                  <div className="flex items-center gap-2 mb-3">
                     <Flame size={12} className="text-orange-500" />
                     <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Your Streak</p>
                  </div>
                  <div className="flex items-baseline gap-2">
                     <p className="text-3xl font-black text-white">{user.streak || 0}</p>
                     <p className="text-xs font-bold text-slate-600">DAYS</p>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Footer */}
      <div className="h-16 bg-black/20 border-t border-white/[0.05] px-10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Target size={16} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocol</p>
            <p className="text-xs font-semibold text-slate-400">Deep Work Sequence</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="info" size="xs">AUTO-SYNC ON</Badge>
          <History size={16} className="text-slate-600" />
        </div>
      </div>
    </div>
  );
}
