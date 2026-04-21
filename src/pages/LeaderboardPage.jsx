import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, TrendingUp, Star, Users } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';

export default function LeaderboardPage() {
  const { user } = useAuthStore();
  const [activeSegment, setActiveSegment] = useState('Global');
  const [realLeaders, setRealLeaders] = useState([]);
  const [divisionLeaders, setDivisionLeaders] = useState([]);

  useEffect(() => {
    // Global/Individual Leaders
    const qGlobal = query(collection(db, 'users'), orderBy('engagementScore', 'desc'), limit(20));
    const unsubGlobal = onSnapshot(qGlobal, (snap) => {
      setRealLeaders(snap.docs.map((d, i) => ({ 
        rank: i + 1, 
        id: d.id, 
        score: d.data().engagementScore || 0,
        ...d.data() 
      })));
    });

    // Division Aggregation (House Cup)
    const qDiv = query(collection(db, 'users'));
    const unsubDivs = onSnapshot(qDiv, (snap) => {
      const divMap = {};
      snap.docs.forEach(doc => {
        const d = doc.data();
        const div = d.division || 'Unknown';
        if (!divMap[div]) divMap[div] = 0;
        divMap[div] += (d.engagementScore || 0);
      });

      const sortedDivs = Object.entries(divMap)
        .map(([name, score]) => ({ name, score }))
        .sort((a, b) => b.score - a.score)
        .map((d, i) => ({ ...d, rank: i + 1, type: 'Division' }));
      
      setDivisionLeaders(sortedDivs);
    });

    return () => { unsubGlobal(); unsubDivs(); };
  }, []);

  const leaders = activeSegment === 'Division' ? divisionLeaders : (realLeaders.length > 0 ? realLeaders : [
    { name: 'SHARVANI GHUGARE', score: 1420, rank: 1, trend: 'up',     division: 'Div A' },
    { name: 'SWARAJ SHASTRI',   score: 1385, rank: 2, trend: 'stable', division: 'Div A' },
    { name: 'RISHI KUMAR PANDA',score: 1340, rank: 3, trend: 'down',   division: 'Div A' },
    { name: 'MISHTI GOEL',      score: 1290, rank: 4, trend: 'up',     division: 'Div A' },
    { name: 'ADARSH RANJAN',    score: 1255, rank: 5, trend: 'up',     division: 'Div A' },
  ]);

  const PODIUM = [
    { idx: 1, heightClass: 'h-72', ringColor: 'border-slate-400/40', topAccent: 'bg-slate-400', badge: 'text-slate-300', label: 'RANK #2' },
    { idx: 0, heightClass: 'h-80', ringColor: 'border-amber-500/60', topAccent: 'bg-amber-500', badge: 'text-amber-300', label: 'CHAMPION' },
    { idx: 2, heightClass: 'h-64', ringColor: 'border-orange-500/40', topAccent: 'bg-orange-600', badge: 'text-orange-300', label: 'RANK #3' },
  ];

  const rankColors = ['text-amber-400', 'text-slate-300', 'text-orange-400'];
  const rankIcons = { 1: Crown, 2: Medal, 3: Medal };

  return (
    <div className="h-full flex flex-col min-w-0">
      {/* Header */}
      <div className="h-16 border-b border-white/[0.05] px-7 flex items-center justify-between bg-black/20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400">
            <Trophy size={18} />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">Hall of Excellence</h2>
            <p className="text-[11px] text-slate-500">Real-time performance hierarchy</p>
          </div>
        </div>
        <div className="flex bg-white/[0.04] border border-white/[0.08] p-1 rounded-xl">
          {['Global', 'Division', 'Monthly'].map((seg) => (
            <button
              key={seg}
              onClick={() => setActiveSegment(seg)}
              className={`px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all
                ${activeSegment === seg
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20'
                  : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              {seg}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-7">
        <div className="max-w-4xl mx-auto space-y-10">
          {/* Podium */}
          {leaders.length >= 3 && (
            <div className="grid grid-cols-3 gap-4 items-end pt-6">
              {PODIUM.map(({ idx, heightClass, ringColor, topAccent, badge, label }) => {
                const l = leaders[idx];
                const isFirst = idx === 0;
                return (
                  <div
                    key={idx}
                    className={`
                      glass-card rounded-3xl flex flex-col items-center justify-center text-center p-6
                      relative overflow-hidden border ${ringColor}
                      ${heightClass} group hover:-translate-y-2 transition-transform duration-300
                      ${isFirst ? 'shadow-xl shadow-amber-500/10' : ''}
                    `}
                  >
                    <div className={`absolute top-0 left-0 right-0 h-1 ${topAccent}`} />
                    {isFirst && <div className="absolute -top-8 -right-8 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl" />}
                    <Avatar name={l.name} size={isFirst ? 'xl' : 'lg'} className="mb-3" />
                    <h4 className={`font-black text-white mb-1 ${isFirst ? 'text-base' : 'text-sm'}`}>{l.name}</h4>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${badge}`}>{label}</span>
                    <p className={`font-black mt-2 tracking-tighter ${rankColors[idx]} ${isFirst ? 'text-2xl' : 'text-xl'}`}>
                      {l.score} <span className="text-[10px] text-slate-600 uppercase">pts</span>
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full Table */}
          <div className="glass-card rounded-3xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/[0.05] bg-black/20">
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4 hidden md:table-cell">Department</th>
                  <th className="px-6 py-4 hidden sm:table-cell">Trend</th>
                  <th className="px-6 py-4 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {leaders.map((l) => {
                  const isMe = l.name === user?.name;
                  const RankIcon = rankIcons[l.rank];
                  return (
                    <tr
                      key={l.rank}
                      className={`group transition-colors ${isMe ? 'bg-indigo-500/5' : 'hover:bg-white/[0.01]'}`}
                    >
                      <td className="px-6 py-4">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center border font-black
                          ${l.rank === 1 ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' :
                            l.rank === 2 ? 'bg-slate-400/10 border-slate-400/20 text-slate-300' :
                            l.rank === 3 ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                            'bg-white/[0.03] border-white/[0.06] text-slate-500'
                          }`}>
                          {RankIcon ? <RankIcon size={14} /> : <span className="text-[11px]">{l.rank}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={l.name} size="sm" border={isMe} />
                          <div>
                            <span className={`text-sm font-black ${isMe ? 'text-indigo-300' : 'text-slate-200'} uppercase tracking-tight`}>
                              {l.name} {isMe && <span className="text-indigo-500">(ME)</span>}
                            </span>
                            <p className="text-[10px] text-slate-600">{l.division || 'Year 3'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase">
                          <Users size={11} className="text-slate-600" /> Computer Eng.
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <div className={`flex items-center gap-1.5 text-[10px] font-black
                          ${l.trend === 'up' ? 'text-emerald-400' : l.trend === 'down' ? 'text-rose-400' : 'text-slate-600'}`}>
                          <TrendingUp size={12} className={l.trend === 'down' ? 'rotate-180' : ''} />
                          {(l.trend || 'stable').toUpperCase()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-lg font-black text-white">{l.score}</span>
                          <Star size={13} className="text-amber-400 fill-amber-400" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Participation', value: '92%', color: 'text-indigo-400' },
              { label: 'Challenges Solved', value: '12,402', color: 'text-emerald-400' },
              { label: 'Platform Karma', value: 'High', color: 'text-amber-400' },
            ].map((s) => (
              <div key={s.label} className="glass-card rounded-2xl p-5 text-center">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
