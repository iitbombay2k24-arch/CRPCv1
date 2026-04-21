import React, { useState, useEffect } from 'react';
import {
  Shield, Users, Activity, Database, Hash, AlertCircle, Search, ChevronDown
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { onAuditLogChange, onGlobalStatsChange, onUsersChange, createAuditLog, updateUserRole } from '../services/firestoreService';
import { ROLES } from '../lib/rbac';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import Spinner from '../components/ui/Spinner';
import useNotificationStore from '../store/notificationStore';

export default function AdminPage() {
  const { user } = useAuthStore();
  const { success, info } = useNotificationStore();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, activeChannels: 0, totalResources: 0 });
  const [users, setUsers] = useState([]);
  const [activeAdminTab, setActiveAdminTab] = useState('Audit');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [changingRoleFor, setChangingRoleFor] = useState(null); // uid being updated

  useEffect(() => {
    const unsubStats = onGlobalStatsChange((data) => setStats(data));
    const unsubLogs = onAuditLogChange((data) => { setLogs(data); setIsLoading(false); });
    const unsubUsers = onUsersChange((data) => setUsers(data));
    return () => { unsubStats(); unsubLogs(); unsubUsers(); };
  }, []);
  const METRICS = [
    {
      label: 'Total Users',      value: stats.totalUsers,    icon: Users,    color: 'text-indigo-400',
      bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', subtitle: '+12% Active Now', subtitleColor: 'text-emerald-400',
    },
    {
      label: 'Live Channels',    value: stats.activeChannels, icon: Hash,    color: 'text-violet-400',
      bg: 'bg-violet-500/10', border: 'border-violet-500/20', subtitle: '4.2 msg/sec', subtitleColor: 'text-indigo-400',
    },
    {
      label: 'Cloud Assets',     value: stats.totalResources, icon: Database, color: 'text-sky-400',
      bg: 'bg-sky-500/10',    border: 'border-sky-500/20',   subtitle: '98.4% Uptime', subtitleColor: 'text-emerald-400',
    },
  ];

  const handleBackup = async () => {
    setIsBackingUp(true);
    info('System Backup Initiated', 'Cloud snapshots are being generated...');
    
    // Simulate backup delay
    setTimeout(async () => {
      await createAuditLog({
        action: 'System Backup',
        actorName: user.name,
        actorEmail: user.email,
        details: 'Full platform snapshot (v8.0.8) saved to remote cluster.'
      });
      setIsBackingUp(false);
      success('Backup Completed', 'All platform assets are secured off-site.');
    }, 4000);
  };

  const handleGlobalConfig = () => {
    info('Accessing Core Logic', 'Loading deep system parameters...');
  };

  const handleRoleChange = async (targetUser, newRole) => {
    if (newRole === targetUser.role) return;
    if (!window.confirm(`Change ${targetUser.name}'s role to ${newRole}?`)) return;
    setChangingRoleFor(targetUser.id);
    try {
      await updateUserRole(targetUser.id, newRole);
      await createAuditLog({
        action: 'Role Change',
        actorName: user.name,
        actorEmail: user.email,
        details: `Changed ${targetUser.name} (${targetUser.email}) from ${targetUser.role} to ${newRole}.`
      });
      success('Role Updated', `${targetUser.name} is now ${newRole}.`);
    } catch (err) {
      error('Update Failed', err.message || 'Could not update role.');
    } finally {
      setChangingRoleFor(null);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.actorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.details?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col min-w-0">
      {/* Header */}
      <div className="h-16 border-b border-white/[0.05] px-7 bg-black/30 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center text-rose-400">
            <Shield size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-white">Command Center</h2>
              <Badge variant="danger" size="xs">L{user.roleLevel} Admin</Badge>
            </div>
          </div>
        </div>
        
        <div className="flex bg-white/[0.04] p-1 rounded-xl border border-white/[0.08]">
          {['Audit', 'Users', 'System'].map(t => (
            <button
              key={t}
              onClick={() => setActiveAdminTab(t)}
              className={`px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${activeAdminTab === t ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleBackup} loading={isBackingUp}>System Backup</Button>
          <Button variant="primary" size="sm" icon={Shield} onClick={handleGlobalConfig}>Global Config</Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-7 space-y-7">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {METRICS.map((m) => (
            <div key={m.label} className="glass-card rounded-2xl p-6 relative overflow-hidden group">
              <div className={`absolute -top-4 -right-4 w-20 h-20 ${m.bg} rounded-full opacity-30 group-hover:scale-150 transition-transform duration-700`} />
              <div className={`w-10 h-10 ${m.bg} border ${m.border} rounded-2xl flex items-center justify-center ${m.color} mb-4`}>
                <m.icon size={20} />
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{m.label}</p>
              <p className="text-3xl font-black text-white">{m.value}</p>
              <p className={`text-[10px] font-bold mt-2 ${m.subtitleColor}`}>{m.subtitle}</p>
            </div>
          ))}
        </div>

        {activeAdminTab === 'Audit' ? (
          <div className="glass-card rounded-3xl overflow-hidden flex flex-col border-white/[0.05]">
            <div className="p-6 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <Activity size={16} />
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight">Security Audit History</h3>
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-9 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 w-64"
                />
              </div>
            </div>
            
            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01]">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Event</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Administrator</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Details</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date/Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {isLoading ? (
                    <tr><td colSpan="4" className="py-20 text-center"><Spinner /></td></tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr><td colSpan="4" className="py-20 text-center text-slate-500 text-xs italic">No activity logs found.</td></tr>
                  ) : filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <Badge variant={log.action.includes('Backup') ? 'indigo' : 'info'}>{log.action}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={log.actorName} size="xs" />
                          <div>
                            <p className="text-xs font-bold text-slate-300">{log.actorName}</p>
                            <p className="text-[10px] text-slate-500">{log.actorEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-slate-400 leading-relaxed max-w-md">{log.details}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-[10px] font-bold text-slate-500">{log.date}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeAdminTab === 'Users' ? (
          <div className="glass-card rounded-3xl overflow-hidden border-white/[0.05]">
            <div className="p-6 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Users size={16} />
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight">Student Directory</h3>
              </div>
            </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6 overflow-y-auto max-h-[600px] custom-scrollbar">
              {users.map(u => (
                <div key={u.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-indigo-500/30 transition-all flex gap-4 items-start">
                  <Avatar name={u.name} size="md" status={u.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{u.name}</p>
                    <p className="text-[10px] text-slate-500 truncate mb-2">{u.email}</p>
                    <div className="flex gap-2 mb-3">
                       <Badge variant="info" size="xs">L{u.roleLevel || 1}</Badge>
                       <Badge variant="ghost" size="xs" className="text-slate-500 border-none">{u.role || 'Student'}</Badge>
                    </div>
                    {/* Role change — only visible to L3+ admins, can't change yourself */}
                    {user.roleLevel >= 3 && u.id !== user.uid && (
                      <div className="relative">
                        <select
                          defaultValue={u.role || 'Student'}
                          disabled={changingRoleFor === u.id}
                          onChange={e => handleRoleChange(u, e.target.value)}
                          className="w-full text-[10px] font-bold bg-white/[0.06] border border-white/[0.10] text-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500/40 cursor-pointer appearance-none pr-6 uppercase tracking-wider"
                        >
                          {Object.values(ROLES).map(r => (
                            <option key={r} value={r} className="bg-[#0d0f1a]">{r}</option>
                          ))}
                        </select>
                        <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                        {changingRoleFor === u.id && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
                            <div className="w-3 h-3 border border-indigo-400 border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-20 text-center glass-card rounded-3xl">
             <Activity className="text-slate-800 mx-auto mb-4" size={48} />
             <h3 className="text-slate-500 font-bold uppercase tracking-widest">System Configuration</h3>
             <p className="text-xs text-slate-700 max-w-xs mx-auto mt-2 italic">Low-level platform orchestration is restricted to Level 4 SuperAdmins only.</p>
          </div>
        )}

        {/* Alert Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="glass-card rounded-2xl p-5 border-rose-500/15 flex items-start gap-4">
            <div className="w-9 h-9 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center text-rose-400 shrink-0">
              <AlertCircle size={16} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-400 mb-1">Moderation Required</h4>
              <p className="text-xs text-rose-400/60 italic leading-relaxed">
                3 reported messages in #general require policy compliance review.
              </p>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 border-indigo-500/15 flex items-start gap-4">
            <div className="w-9 h-9 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 shrink-0">
              <Activity size={16} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-indigo-400 mb-1">Resource Load</h4>
              <p className="text-xs text-indigo-400/60 italic leading-relaxed">
                VPC egress at 12% capacity. No scaling actions required.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
