import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, Clock, Search, Filter, Plus, AlertTriangle,
  History, CheckCircle2, Lock, User, Timer
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { onGrievancesChange, updateGrievanceStatus } from '../services/firestoreService';
import { hasPermission } from '../lib/rbac';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import SubmitGrievanceModal from '../modals/SubmitGrievanceModal';
import Spinner from '../components/ui/Spinner';

const PRIORITY_STYLES = {
  High:   'text-rose-300 bg-rose-500/10 border-rose-500/20',
  Medium: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
  Low:    'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
};

const STATUS_STYLES = {
  Open:         'text-slate-300 bg-white/[0.04] border-white/[0.08]',
  'In-Progress':'text-amber-300 bg-amber-500/10 border-amber-500/20',
  Resolved:     'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
};

export default function GrievancePage() {
  const { user } = useAuthStore();
  const [grievances, setGrievances] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsub = onGrievancesChange((data) => {
      setGrievances(
        user.roleLevel < 2
          ? data.filter((g) => g.authorId === user.uid)
          : data.filter((g) => g.division === (user.division || 'Division A') || g.division === 'All')
      );
      setIsLoading(false);
    });
    return () => unsub();
  }, [user]);

  const canManage = hasPermission(user.role, 'VIEW_GRIEVANCES');
  
  const handleStatus = async (id, status) => {
    try {
      await updateGrievanceStatus(id, status);
      // Optional: Audit log this
    } catch(err) {
      console.error(err);
    }
  };

  const filteredGrievances = grievances.filter(g => 
    g.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const STATS = [
    { label: 'Open',        value: grievances.filter((g) => g.status === 'Open').length,        color: 'text-slate-300', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
    { label: 'In Progress', value: grievances.filter((g) => g.status === 'In-Progress').length, color: 'text-amber-300', bg: 'bg-amber-500/10',  border: 'border-amber-500/20' },
    { label: 'Resolved',    value: grievances.filter((g) => g.status === 'Resolved').length,    color: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { label: 'High Priority', value: grievances.filter((g) => g.priority === 'High' && g.status !== 'Resolved').length, color: 'text-rose-300', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  ];

  return (
    <div className="h-full flex flex-col min-w-0">
      {/* Header */}
      <div className="h-16 border-b border-white/[0.05] px-7 flex items-center justify-between bg-black/20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center text-rose-400">
            <ShieldAlert size={18} />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">Grievances & Support</h2>
            <p className="text-[11px] text-slate-500">Report issues and track resolutions</p>
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="primary" icon={Plus}>New Ticket</Button>
      </div>

      {/* Stats */}
      <div className="px-7 py-4 border-b border-white/[0.05] bg-black/10 shrink-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATS.map((s) => (
            <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-4`}>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-7">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">
              Active Requests ({grievances.length})
            </h3>
            <div className="flex gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter tickets..."
                  className="bg-white/[0.04] border border-white/[0.06] rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/30 w-48 transition-all"
                />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="h-64 flex items-center justify-center"><Spinner size="lg" /></div>
          ) : grievances.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center border border-dashed border-white/[0.06] rounded-3xl">
              <History size={40} className="text-slate-700 mb-3" />
              <p className="text-slate-400 font-semibold">No grievances recorded</p>
              <p className="text-slate-600 text-sm">Great! No pending issues.</p>
            </div>
          ) : (
            filteredGrievances.map((ticket) => (
              <div
                key={ticket.id}
                className="glass-card rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-5 group"
              >
                {/* Status + ID */}
                <div className="flex flex-row md:flex-col items-center md:items-start gap-3 md:min-w-[120px]">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-widest ${STATUS_STYLES[ticket.status] || STATUS_STYLES.Open}`}>
                    {ticket.status}
                  </span>
                  <span className="text-[10px] font-bold text-slate-600 uppercase">
                    #{ticket.id.slice(-6).toUpperCase()}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-wide ${PRIORITY_STYLES[ticket.priority] || PRIORITY_STYLES.Low}`}>
                      {ticket.priority} Priority
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Clock size={11} /> {ticket.time || 'recently'}
                    </div>
                    {ticket.slaDeadline && ticket.status !== 'Resolved' && (
                      <div className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-lg
                        ${ticket.slaDeadline?.toDate() < new Date() ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        <Timer size={11} />
                        {ticket.slaDeadline?.toDate() < new Date() ? 'SLA Breached' : 'SLA Active'}
                      </div>
                    )}
                    {ticket.isAnonymous ? (
                      <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold"><Lock size={10} /> Anonymous</div>
                    ) : (
                      <div className="flex items-center gap-1 text-[10px] text-slate-500"><User size={10} /> {ticket.authorName}</div>
                    )}
                  </div>
                  <h4 className="text-base font-bold text-white mb-1 group-hover:text-rose-300 transition-colors">{ticket.title}</h4>
                  <p className="text-sm text-slate-400 line-clamp-1">{ticket.description}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {canManage && (
                    <>
                      <button
                        onClick={() => handleStatus(ticket.id, 'In-Progress')}
                        className="p-2.5 bg-white/[0.04] border border-white/[0.06] text-slate-500 hover:text-amber-400 hover:border-amber-500/30 rounded-xl transition-all"
                        title="Mark In-Progress"
                      >
                        <AlertTriangle size={16} />
                      </button>
                      <button
                        onClick={() => handleStatus(ticket.id, 'Resolved')}
                        className="p-2.5 bg-white/[0.04] border border-white/[0.06] text-slate-500 hover:text-emerald-400 hover:border-emerald-500/30 rounded-xl transition-all"
                        title="Resolve"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    </>
                  )}
                  <button className="px-4 py-2 bg-white/[0.04] border border-white/[0.06] text-slate-300 text-xs font-bold rounded-xl hover:bg-white/[0.07] transition-all">
                    View
                  </button>
                </div>
              </div>
            ))
          )}
          
          {filteredGrievances.length === 0 && searchQuery && (
            <div className="py-20 text-center opacity-40">
              <p className="text-sm font-bold">No tickets match "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>

      <SubmitGrievanceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
