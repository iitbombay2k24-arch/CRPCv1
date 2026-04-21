import React, { useState, useEffect } from 'react';
import { 
  Trophy, Megaphone, TrendingUp, Shield, Clock, Users,
  ChevronRight, Building2, Flame
} from 'lucide-react';
import { 
  onAnnouncementsChange, onUsersChange, onPlacementStatsChange 
} from '../services/firestoreService';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';

export default function KioskPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [houseCup, setHouseCup] = useState([]);
  const [placementData, setPlacementData] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const unsubAnn = onAnnouncementsChange(setAnnouncements);
    const unsubPlace = onPlacementStatsChange(setPlacementData);
    const unsubUsers = onUsersChange((users) => {
      const divMap = {};
      users.forEach(u => {
        const div = u.division || 'General';
        divMap[div] = (divMap[div] || 0) + (u.engagementScore || 0);
      });
      const sorted = Object.entries(divMap)
        .map(([name, score]) => ({ name, score }))
        .sort((a, b) => b.score - a.score);
      setHouseCup(sorted);
    });

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const rotator = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % 3); // Rotate between 3 main view types
    }, 15000); // 15 seconds per view

    return () => {
      unsubAnn(); unsubPlace(); unsubUsers();
      clearInterval(timer); clearInterval(rotator);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-[#03040b] text-white overflow-hidden flex flex-col font-sans">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,rgba(79,70,229,0.1),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(139,92,246,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 h-24 border-b border-white/10 flex items-center justify-between px-16 bg-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Shield size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic">DYPIU <span className="text-indigo-500">Collab</span></h1>
            <p className="text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase">Intelligence • Unity • Performance</p>
          </div>
        </div>

        <div className="flex items-center gap-12">
           <div className="text-right">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Live Campus Feed</p>
              <div className="flex items-center gap-2 text-indigo-400">
                 <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
                 <span className="text-sm font-black tracking-widest uppercase">Operational v8.0.8</span>
              </div>
           </div>
           <div className="text-center min-w-[200px]">
              <p className="text-3xl font-black tracking-widest tabular-nums">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
           </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 p-16 flex gap-12 overflow-hidden">
        
        {/* Left Side: Active Feature View (The rotator) */}
        <div className="flex-[3] relative">
          
          {/* VIEW 1: ANNOUNCEMENTS */}
          {activeIndex === 0 && (
            <div className="h-full flex flex-col justify-center animate-in fade-in slide-in-from-left-20 duration-1000">
               <div className="flex items-center gap-4 mb-8">
                  <div className="p-4 bg-rose-500/10 rounded-3xl text-rose-500 border border-rose-500/20">
                     <Megaphone size={40} />
                  </div>
                  <h2 className="text-6xl font-black tracking-tighter uppercase leading-none">Institutional<br/><span className="text-rose-500">Broadcasts</span></h2>
               </div>
               <div className="space-y-6">
                  {announcements.slice(0, 3).map((ann, i) => (
                    <div key={ann.id} className="glass-card p-10 rounded-[3rem] border-white/10 bg-white/5 backdrop-blur-3xl">
                       <div className="flex items-center gap-3 mb-4">
                          <Badge variant="danger" size="md">{ann.tag || 'Notice'}</Badge>
                          <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">{new Date(ann.createdAt?.toDate()).toLocaleDateString()}</span>
                       </div>
                       <h3 className="text-4xl font-black text-white mb-4 leading-tight">{ann.title}</h3>
                       <p className="text-xl text-slate-400 line-clamp-2 leading-relaxed">{ann.body}</p>
                    </div>
                  ))}
                  {announcements.length === 0 && (
                     <p className="text-2xl text-slate-600 font-bold italic uppercase tracking-widest">Awaiting central directives...</p>
                  )}
               </div>
            </div>
          )}

          {/* VIEW 2: PLACEMENT SUCCESS */}
          {activeIndex === 1 && (
            <div className="h-full flex flex-col justify-center animate-in fade-in slide-in-from-top-20 duration-1000 text-center items-center">
               <div className="p-6 bg-emerald-500/10 rounded-full text-emerald-500 border border-emerald-500/20 mb-8">
                  <TrendingUp size={64} />
               </div>
               <h2 className="text-7xl font-black tracking-tighter uppercase leading-none mb-4 italic">Career <span className="text-emerald-500">Momentum</span></h2>
               <p className="text-slate-500 font-bold uppercase tracking-[0.4em] mb-16">Placement Intelligence Dashboard</p>
               
               <div className="grid grid-cols-2 gap-10 w-full max-w-4xl">
                  <div className="glass-card p-12 rounded-[4rem] bg-emerald-500/5 transition-transform hover:scale-105">
                     <p className="text-[14px] font-black text-emerald-500 uppercase tracking-widest mb-2">Institutional CTC</p>
                     <p className="text-7xl font-black text-white leading-none">{placementData?.avgPackage || '12.4 LPA'}</p>
                     <p className="text-slate-600 font-bold uppercase text-[10px] mt-4">Average Package (2024-25)</p>
                  </div>
                  <div className="glass-card p-12 rounded-[4rem] bg-indigo-500/5 transition-transform hover:scale-105">
                     <p className="text-[14px] font-black text-indigo-400 uppercase tracking-widest mb-2">Top Performance</p>
                     <p className="text-7xl font-black text-white leading-none">{placementData?.topPackage || '45 LPA'}</p>
                     <p className="text-slate-600 font-bold uppercase text-[10px] mt-4">Peak Compensation Package</p>
                  </div>
               </div>

               <div className="mt-16 flex items-center gap-12 text-slate-500">
                  <div className="flex items-center gap-3">
                     <Building2 size={24} />
                     <span className="text-2xl font-black italic">{placementData?.totalCompanies || 140}+ Recrutiers</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <Users size={24} />
                     <span className="text-2xl font-black italic">{placementData?.totalPlaced || 600}+ Placed</span>
                  </div>
               </div>
            </div>
          )}

          {/* VIEW 3: THE HOUSE CUP */}
          {activeIndex === 2 && (
             <div className="h-full flex flex-col justify-center animate-in fade-in slide-in-from-right-20 duration-1000">
                <div className="flex items-center gap-5 mb-12">
                   <div className="p-6 bg-amber-500/10 rounded-[2.5rem] text-amber-500 border border-amber-500/20 shadow-2xl shadow-amber-500/10">
                      <Trophy size={48} />
                   </div>
                   <div>
                      <h2 className="text-7xl font-black tracking-tighter uppercase leading-none italic">The <span className="text-amber-500">House Cup</span></h2>
                      <p className="text-slate-500 font-bold uppercase tracking-[0.4em] mt-2">Division Aggregated Intelligence</p>
                   </div>
                </div>

                <div className="grid gap-6">
                   {houseCup.slice(0, 4).map((div, i) => (
                      <div key={div.name} className="flex items-center gap-8 group">
                         <div className={`text-6xl font-black italic w-20 text-center ${i === 0 ? 'text-amber-500' : 'text-slate-700'}`}>
                           {i + 1}
                         </div>
                         <div className="flex-1 glass-card p-8 rounded-[2.5rem] bg-white/[0.03] border-white/5 flex items-center justify-between transition-all group-hover:bg-white/[0.06] group-hover:border-white/20">
                            <div>
                               <h4 className="text-3xl font-black text-white">{div.name}</h4>
                               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Division Alignment</p>
                            </div>
                            <div className="text-right">
                               <div className="flex items-center gap-3 justify-end text-amber-500">
                                  <Flame size={24} fill="currentColor" fillOpacity={0.2} />
                                  <p className="text-5xl font-black tabular-nums">{div.score.toLocaleString()}</p>
                               </div>
                               <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Aggregated Engagement</p>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

        </div>

        {/* Right Side: Campus Stats Sidebar */}
        <div className="flex-1 space-y-10">
           <div className="glass-card p-10 rounded-[3rem] bg-indigo-600/5 border-indigo-500/20">
              <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-8">System Uptime</h4>
              <div className="space-y-6">
                 {[
                   { label: 'Cloud Storage', val: '99.9%', status: 'Operational' },
                   { label: 'Real-time Sync', val: '12ms', status: 'Excellent' },
                   { label: 'Security Layer', val: 'AES-256', status: 'Secure' }
                 ].map(s => (
                   <div key={s.label}>
                      <div className="flex justify-between items-center mb-2">
                         <span className="text-xs font-bold text-slate-500">{s.label}</span>
                         <span className="text-[10px] font-black uppercase text-emerald-500">{s.status}</span>
                      </div>
                      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 w-[95%] rounded-full" />
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="glass-card p-10 rounded-[3rem] bg-indigo-600/5 border-indigo-500/20 text-center">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 italic">Next Cycle Update</p>
              <div className="relative inline-block">
                 <svg className="w-24 h-24 rotate-[-90deg]">
                    <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
                    <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray="276" strokeDashoffset="69" className="text-indigo-500" />
                 </svg>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-black italic">15s</span>
                 </div>
              </div>
           </div>

           <div className="p-8 text-center opacity-40 grayscale group hover:opacity-100 hover:grayscale-0 transition-all border border-dashed border-white/10 rounded-[2.5rem]">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Developed by</p>
              <p className="text-sm font-black text-white italic tracking-tighter">ANTIGRAVITY CORE</p>
           </div>
        </div>
      </main>

      {/* Footer Ticker */}
      <footer className="relative z-10 h-16 border-t border-white/10 bg-black flex items-center overflow-hidden">
        <div className="whitespace-nowrap flex animate-marquee">
           {[...Array(6)].map((_, i) => (
             <div key={i} className="flex items-center gap-12 px-12">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-3">
                   <Clock size={14} className="text-indigo-500" /> Live Feed Synchronization Complete
                </span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-3">
                   <Shield size={14} className="text-indigo-500" /> All Platform nodes operational
                </span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-3 text-indigo-400">
                   <TrendingUp size={14} /> Congratulations to the Class of 2024 on 600+ placements!
                </span>
             </div>
           ))}
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
      `}} />
    </div>
  );
}
