import React, { useState, useEffect } from 'react';
import { Timer, Play, Pause, RotateCcw, Brain, Target, Bell, Settings, History } from 'lucide-react';
import Badge from '../components/ui/Badge';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';
import { saveFocusSession } from '../services/firestoreService';

const MODES = [
  { label: 'Focus',       minutes: 25, color: 'text-indigo-400' },
  { label: 'Short Break', minutes: 5,  color: 'text-emerald-400' },
  { label: 'Long Break',  minutes: 15, color: 'text-sky-400' },
];

export default function FocusPage() {
  const { user } = useAuthStore();
  const { success } = useNotificationStore();
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [modeIdx, setModeIdx] = useState(0);
  const [sessions, setSessions] = useState(0);

  const mode = MODES[modeIdx];
  const totalTime = mode.minutes * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;
    const t = setInterval(() => {
      setTimeLeft((p) => {
        if (p <= 1) {
          clearInterval(t);
          setIsActive(false);
          if (modeIdx === 0) {
            setSessions((s) => s + 1);
            if (user?.uid) {
              saveFocusSession(user.uid, MODES[0].minutes, user.name);
              success('+3 Engagement Points', 'Focus session completed!');
            }
          }
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isActive, modeIdx, timeLeft, user?.uid, user?.name, success]);

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
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sessions</p>
            <p className="text-2xl font-black text-white">{sessions}</p>
          </div>
          <button className="p-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-slate-400 hover:text-white transition-all">
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="max-w-lg w-full flex flex-col items-center">
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
              {/* Track */}
              <circle cx="160" cy="160" r="140" fill="none" className="stroke-white/[0.05]" strokeWidth="14" />
              {/* Glow ring */}
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
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
            {/* Filter glow */}
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
