import React, { useState, useEffect } from 'react';
import {
  Briefcase, TrendingUp, Users, Building2, DollarSign,
  Calendar, ArrowRight
} from 'lucide-react';
import { onSnapshot, collection, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { applyToDrive } from '../services/firestoreService';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import confetti from 'canvas-confetti';
import CreateDriveModal from '../modals/CreateDriveModal';
import { Plus } from 'lucide-react';
import { hasPermission } from '../lib/rbac';

const STATS = [
  { label: 'Total Placed', value: '412', icon: Users,     color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { label: 'Avg Package',  value: '12.4 LPA', icon: DollarSign, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
  { label: 'Top Package',  value: '45 LPA',  icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { label: 'Companies',    value: '86',      icon: Building2,  color: 'text-rose-400',  bg: 'bg-rose-500/10',  border: 'border-rose-500/20' },
];

const BARS = [
  { l: '3–6 LPA',   p: 45 },
  { l: '6–12 LPA',  p: 32 },
  { l: '12–20 LPA', p: 15 },
  { l: '20–30 LPA', p: 5 },
  { l: '30+ LPA',   p: 3 },
];

const SECTORS = [
  { label: 'Cloud & AI',      value: '42%', width: 42, color: 'from-indigo-500 to-violet-500' },
  { label: 'Cybersecurity',   value: '28%', width: 28, color: 'from-emerald-500 to-teal-500' },
  { label: 'Product Fintech', value: '18%', width: 18, color: 'from-rose-500 to-pink-500' },
];

export default function PlacementPage() {
  const { user } = useAuthStore();

  const { success, error } = useNotificationStore();
  const [activeView, setActiveView] = useState('Overview');
  const [realDrives, setRealDrives] = useState([]);
  const [isApplying, setIsApplying] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'placementDrives'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => setRealDrives(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  const handleApply = async (drive) => {
    if (!user) return;
    setIsApplying(drive.id);
    try {
      await applyToDrive(drive.id, {
        uid: user.uid,
        name: user.name,
        email: user.email,
        prn: user.prn,
        cgpa: user.cgpa
      });
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#d4a373', '#ccd5ae', '#8a9a86']
      });

      success(`Applied successfully for ${drive.company}!`, 'Good luck with your application.');
    } catch (err) {
      error(err.message || 'Failed to apply', 'Application Error');
    } finally {
      setIsApplying(null);
    }
  };

  const drives = realDrives; // Removed the dummy data array fallback

  return (
    <div className="h-full flex flex-col min-w-0 overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="sticky top-0 z-10 h-16 border-b border-white/[0.05] px-7 flex items-center justify-between bg-black/40 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-sky-500/10 border border-sky-500/20 rounded-xl flex items-center justify-center text-sky-400">
            <Briefcase size={18} />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">Placement Central</h2>
            <p className="text-[11px] text-slate-500">Strategic career orchestration</p>
          </div>
        </div>

        <div className="flex bg-white/[0.04] border border-white/[0.08] p-1 rounded-xl">
          {['Overview', 'Drives', 'My Application'].map((v) => (
            <button
              key={v}
              onClick={() => setActiveView(v)}
              className={`px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all
                ${activeView === v
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg'
                  : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="p-7 space-y-7 max-w-7xl mx-auto w-full">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <div key={i} className={`glass-card rounded-2xl p-5 relative overflow-hidden group`}>
              <div className={`absolute -top-4 -right-4 w-16 h-16 ${s.bg} rounded-full opacity-30 group-hover:scale-150 transition-transform duration-700`} />
              <div className={`w-9 h-9 ${s.bg} border ${s.border} rounded-xl flex items-center justify-center ${s.color} mb-3`}>
                <s.icon size={18} />
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{s.label}</p>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CTC Bar Chart */}
          <div className="lg:col-span-2 glass-card rounded-3xl p-7">
            <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
              <TrendingUp size={16} className="text-indigo-400" /> CTC Distribution
            </h3>
            <div className="h-52 flex items-end justify-between gap-4 border-b border-white/[0.05] pb-1">
              {BARS.map((bar, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                  <span className="text-[10px] font-black text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    {bar.p}%
                  </span>
                  <div className="w-full relative rounded-t-xl overflow-hidden" style={{ height: `${bar.p * 4}px` }}>
                    <div className="absolute inset-0 bg-white/[0.03]" />
                    <div
                      className="absolute bottom-0 w-full bg-gradient-to-t from-indigo-600 to-violet-500 rounded-t-xl transition-all duration-700 group-hover:from-indigo-500 group-hover:to-violet-400"
                      style={{ height: '100%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-3">
              {BARS.map((bar, i) => (
                <span key={i} className="flex-1 text-center text-[9px] font-bold text-slate-600 uppercase whitespace-nowrap">{bar.l}</span>
              ))}
            </div>
          </div>

          {/* Upcoming Drives */}
          <div className="glass-card rounded-3xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-white">Upcoming Drives</h3>
              {canManageDrives && (
                <Button size="sm" variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
                  Add Drive
                </Button>
              )}
            </div>
            
            <div className="space-y-3">
              {drives.length === 0 ? (
                <div className="py-10 flex flex-col items-center justify-center text-center border border-dashed border-white/[0.05] rounded-2xl">
                  <Briefcase size={24} className="text-slate-700 mb-2" />
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">No active drives</p>
                </div>
              ) : (
                drives.map((d, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:border-indigo-500/30 hover:bg-white/[0.05] transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-black text-white text-sm group-hover:text-indigo-300 transition-colors">{d.company}</h4>
                    <Badge
                      variant={d.status === 'Open' ? 'success' : d.status === 'Ongoing' ? 'warning' : 'neutral'}
                      size="xs"
                    >
                      {d.status}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 font-semibold uppercase">{d.role}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-slate-600">{d.date}</span>
                    <span className="text-sm font-black text-indigo-400">{d.package}</span>
                  </div>
                  
                  {d.status === 'Open' && (
                    <Button 
                      onClick={(e) => { e.stopPropagation(); handleApply(d); }}
                      variant="primary" 
                      size="sm" 
                      className="w-full mt-3 h-8 text-[11px]"
                      loading={isApplying === d.id}
                    >
                      Apply Now
                    </Button>
                  )}
                </div>
              ))
              )}
            </div>
            <Button variant="ghost" className="w-full mt-4 text-[11px]" iconRight={ArrowRight}>
              View all drives
            </Button>
          </div>
        </div>

        {/* Sector Breakdown */}
        <div className="glass-card rounded-3xl p-7">
          <h3 className="text-sm font-bold text-white mb-5">Sector-wise Placement</h3>
          <div className="space-y-4">
            {SECTORS.map((s, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300">{s.label}</span>
                  <span className="text-sm font-black text-white">{s.value}</span>
                </div>
                <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${s.color} rounded-full transition-all duration-1000`}
                    style={{ width: `${s.width}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <CreateDriveModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
