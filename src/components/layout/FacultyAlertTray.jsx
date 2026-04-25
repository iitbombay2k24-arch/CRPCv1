import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  AlertCircle, 
  MapPin, 
  ChevronRight, 
  X, 
  Play, 
  CheckCircle,
  Video
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useUIStore from '../../store/uiStore';
import { onSchedulerSessionsChange } from '../../services/firestoreService';
import Badge from '../ui/Badge';

export default function FacultyAlertTray() {
  const { user } = useAuthStore();
  const { setActiveTab } = useUIStore();
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [isVisible, setIsVisible] = useState(true);

  const isFaculty = user?.roleLevel >= 2;

  useEffect(() => {
    if (!isFaculty) return;
    const today = new Date().toISOString().split('T')[0];
    const unsub = onSchedulerSessionsChange({ from: today, to: today }, (sessions) => {
      const facultySessions = sessions.filter(s =>
        (s.facultyName === user?.name || s.facultyId === user?.uid) &&
        s.status !== 'Session Conducted'
      );
      const sorted = facultySessions.sort((a, b) => a.time.localeCompare(b.time));
      setUpcomingSessions(sorted);
    });
    return () => unsub();
  }, [user, isFaculty]);

  // Only render for Faculty or higher, and only when sessions exist
  if (!isFaculty || upcomingSessions.length === 0 || !isVisible) return null;

  const nextSession = upcomingSessions[0];

  return (
    <div className="fixed bottom-24 right-8 z-[100] animate-slide-up">
       <div className="w-80 bg-slate-900/90 backdrop-blur-2xl border border-indigo-500/30 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-600 px-5 py-3 flex items-center justify-between">
             <div className="flex items-center gap-2">
                <AlertCircle size={14} className="text-white animate-pulse" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Faculty Alert Hub</span>
             </div>
             <button onClick={() => setIsVisible(false)} className="text-white/60 hover:text-white transition-colors">
                <X size={14} />
             </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
             <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                   <Clock size={24} />
                </div>
                <div className="min-w-0">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Upcoming Lecture</p>
                   <h3 className="text-sm font-bold text-white truncate">{nextSession.subject}</h3>
                   <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1 text-[10px] text-indigo-400 font-bold">
                         <MapPin size={10} /> {nextSession.classSection}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                         <Clock size={10} /> {nextSession.time}
                      </div>
                   </div>
                </div>
             </div>

             <div className="h-px bg-white/5" />

             <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setActiveTab('admin'); setIsVisible(false); }}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                >
                   <Play size={12} fill="currentColor" /> Start Session
                </button>
                <button 
                  onClick={() => window.alert('Launching Virtual Classroom...')}
                  className="w-10 h-10 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl flex items-center justify-center transition-all"
                >
                   <Video size={16} />
                </button>
             </div>

             <p className="text-[9px] text-slate-500 text-center uppercase font-bold tracking-tighter">
                Click 'Start Session' to begin attendance tracking
             </p>
          </div>
       </div>
    </div>
  );
}
