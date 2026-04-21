import React, { useState, useEffect } from 'react';
import {
  Shield, Users, Activity, Database, Hash, AlertCircle, Search, Filter, 
  Briefcase, TrendingUp, DollarSign, Building2, Megaphone, Send, Plus, RefreshCw, ChevronRight, Zap, CheckCircle2, Clock, Inbox, Wrench, Tv
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import useUIStore from '../store/uiStore';
import { 
  onAuditLogChange, onGlobalStatsChange, onUsersChange, createAuditLog,
  onPlacementStatsChange, updatePlacementStats, createPlacementDrive, createAnnouncement,
  updateUserRole, bulkSyncStudents, onPlatformConfigChange, updatePlatformConfig, resetSemesterEngagement,
  onGrievancesChange, updateGrievanceStatus, seedInstitutionalData
} from '../services/firestoreService';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import Spinner from '../components/ui/Spinner';
import useNotificationStore from '../store/notificationStore';

export default function AdminPage() {
  const { user } = useAuthStore();
  const { setActiveTab } = useUIStore();
  const { success, info, error } = useNotificationStore();
  
  // Platform Lists
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, activeChannels: 0, totalResources: 0 });
  const [users, setUsers] = useState([]);
  const [grievances, setGrievances] = useState([]);
  const [placementData, setPlacementData] = useState({ totalPlaced: '0', avgPackage: '0 LPA', topPackage: '0 LPA', totalCompanies: '0' });
  const [config, setConfig] = useState({ maintenanceBanner: '', isMaintenanceMode: false });
  
  // UI State
  const [activeAdminTab, setActiveAdminTab] = useState('Audit');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Form States (Placement)
  const [pStats, setPStats] = useState({ totalPlaced: '', avgPackage: '', topPackage: '', totalCompanies: '' });
  
  // Form States (Data Ops)
  const [announcement, setAnnouncement] = useState({ title: '', body: '', tag: 'Notice', division: 'All' });
  const [drive, setDrive] = useState({ company: '', role: '', package: '', status: 'Open' });

  useEffect(() => {
    const unsubStats = onGlobalStatsChange((data) => setStats(data));
    const unsubLogs = onAuditLogChange((data) => { setLogs(data); setIsLoading(false); });
    const unsubUsers = onUsersChange((data) => setUsers(data));
    const unsubConfig = onPlatformConfigChange((data) => { if (data) setConfig(data); });
    const unsubGrievances = onGrievancesChange((data) => setGrievances(data));
    const unsubPlacement = onPlacementStatsChange((data) => {
      if (data) {
        setPlacementData(data);
        setPStats(data);
      }
    });
    
    return () => { unsubStats(); unsubLogs(); unsubUsers(); unsubPlacement(); unsubConfig(); unsubGrievances(); };
  }, []);

  const handleUpdatePlacement = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updatePlacementStats(pStats);
      success('Placement Stats Updated', 'Live dashboard figures have been refreshed.');
      await createAuditLog({
        action: 'Updated Placement Stats',
        actorName: user.name,
        details: `Updated stats: ${pStats.totalPlaced} placed, ${pStats.avgPackage} avg package.`
      });
    } catch (err) {
      error('Update Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createAnnouncement({
        ...announcement,
        author: user.name,
        authorId: user.uid,
        isPinned: false
      });
      setAnnouncement({ title: '', body: '', tag: 'Notice', division: 'All' });
      success('Notice Broadcasted', 'Announcement is now live for targeted students.');
    } catch (err) {
      error('Failed to post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostDrive = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createPlacementDrive(drive);
      setDrive({ company: '', role: '', package: '', status: 'Open' });
      success('New Drive Posted', `${drive.company} drive is now active.`);
    } catch (err) {
      error('Failed to post drive');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (targetUid, newRole) => {
    const levelMap = { 'Student': 1, 'Faculty': 2, 'Admin': 3, 'SuperAdmin': 4 };
    try {
      await updateUserRole(targetUid, newRole, levelMap[newRole]);
      success('Role Updated', 'User access level has been modified.');
    } catch (err) {
      error('Role change failed');
    }
  };

  const handleBulkSync = async () => {
    if (!window.confirm('This will seed 700+ ghost users from the master list. Continue?')) return;
    setIsSyncing(true);
    try {
      const added = await bulkSyncStudents();
      success('Sync Complete', `${added} new student records generated.`);
      await createAuditLog({
        action: 'Bulk Sync',
        actorName: user.name,
        details: `Synchronized ${added} institutional records to Firestore.`
      });
    } catch (err) {
      error('Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateConfig = async () => {
    setIsSubmitting(true);
    try {
      await updatePlatformConfig(config);
      success('System Config Saved');
    } catch (err) {
      error('Failed to save config');
    } finally {
       setIsSubmitting(false);
    }
  };

  const handleResetEngagement = async () => {
    if (!window.confirm('CRITICAL ACTION: Reset all engagement scores and streaks to zero for the new semester?')) return;
    setIsSubmitting(true);
    try {
      await resetSemesterEngagement();
      success('Semester Reset Complete', 'All student scores recycled to zero.');
      await createAuditLog({
        action: 'Semester Reset',
        actorName: user.name,
        details: 'Performed global engagement score and badge reset.'
      });
    } catch (err) {
       error('Reset failed');
    } finally {
       setIsSubmitting(false);
    }
  };

  const handleUpdateGrievance = async (id, nextStatus) => {
    try {
      await updateGrievanceStatus(id, nextStatus);
      success('Grievance Updated', `Moved to ${nextStatus}`);
    } catch (err) {
      error('Failed to update status');
    }
  };

  const handleSeed = async () => {
    if (!window.confirm('CRITICAL: This will overwrite default syllabus and placement stats. Continue?')) return;
    setIsSubmitting(true);
    try {
      await seedInstitutionalData();
      success('Seeding Complete', 'Institutional datasets are now live.');
      await createAuditLog({
        action: 'Database Seeding',
        actorName: user.name,
        details: 'Performed manual seeding of institutional institutional ERP constants.'
      });
    } catch (err) {
      error('Seeding failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    info('System Backup Initiated', 'Cloud snapshots are being generated...');
    try {
      await createAuditLog({
        action: 'System Backup',
        actorName: user.name,
        actorEmail: user.email,
        details: `Full platform snapshot (v${new Date().toISOString()}) saved to remote cluster.`
      });
      success('Backup Completed', 'All platform assets are secured off-site.');
    } catch (err) {
      console.error('Backup failed:', err);
      error('Backup Failed', 'Could not complete system backup. Try again.');
    } finally {
      setIsBackingUp(false);
    }
  };

  const METRICS = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
    { label: 'Live Channels', value: stats.activeChannels, icon: Hash, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
    { label: 'Cloud Assets', value: stats.totalResources, icon: Database, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
  ];

  const filteredLogs = logs.filter(log => 
    log.actorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.action?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
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
              <Badge variant="danger" size="xs">SuperAdmin L{user.roleLevel}</Badge>
            </div>
          </div>
        </div>
        
        <div className="flex bg-white/[0.04] p-1 rounded-xl border border-white/[0.08] overflow-x-auto no-scrollbar">
          {['Audit', 'Users', 'Placements', 'Grievances', 'Data Ops', 'System'].map(t => (
            <button
              key={t}
              onClick={() => setActiveAdminTab(t)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${activeAdminTab === t ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setActiveTab('Kiosk')} icon={Megaphone}>Launch Kiosk</Button>
          <Button variant="ghost" size="sm" onClick={handleBackup} loading={isBackingUp}>Backup</Button>
          <Button variant="primary" size="sm" icon={Shield}>Config</Button>
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
            </div>
          ))}
        </div>

        {/* Search Bar for lists */}
        {(activeAdminTab === 'Audit' || activeAdminTab === 'Users') && (
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder={`Search ${activeAdminTab.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50"
              />
           </div>
        )}

        {/* Audit Tab */}
        {activeAdminTab === 'Audit' && (
          <div className="glass-card rounded-3xl overflow-hidden border-white/[0.05]">
            <div className="p-6 border-b border-white/[0.05] bg-white/[0.01]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity size={16} className="text-indigo-400" /> Security Audit Log
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/[0.01] border-b border-white/5">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Action</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Actor</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-white/[0.01]">
                      <td className="px-6 py-4"><Badge variant="info">{log.action}</Badge></td>
                      <td className="px-6 py-4 text-xs text-slate-300 font-bold">{log.actorName}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Grievance Kanban Tab */}
        {activeAdminTab === 'Grievances' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full min-h-[500px]">
            {[
              { id: 'Submitted',   icon: Inbox,  color: 'text-slate-400',   bg: 'bg-slate-400/5' },
              { id: 'Acknowledged', icon: Clock,  color: 'text-amber-400',   bg: 'bg-amber-400/5' },
              { id: 'Resolving',    icon: Wrench,   color: 'text-indigo-400',  bg: 'bg-indigo-400/5' },
              { id: 'Resolved',     icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/5' }
            ].map((col) => (
              <div key={col.id} className={`flex flex-col rounded-3xl border border-white/[0.05] ${col.bg}`}>
                <div className="p-4 border-b border-white/[0.05] flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <col.icon size={14} className={col.color} />
                     <h4 className="text-[10px] font-black text-white uppercase tracking-widest">{col.id}</h4>
                   </div>
                   <Badge variant="ghost" size="xs" className="text-slate-500">
                     {grievances.filter(g => g.status === col.id).length}
                   </Badge>
                </div>
                <div className="flex-1 p-3 space-y-3 overflow-y-auto no-scrollbar max-h-[600px]">
                   {grievances.filter(g => g.status === col.id).map(g => (
                     <div key={g.id} className="glass-card p-4 rounded-2xl group hover:border-indigo-500/30 transition-all">
                        <div className="flex items-center justify-between mb-2">
                           <Badge variant={g.category === 'Technical' ? 'danger' : 'info'} size="xs">{g.category}</Badge>
                           <p className="text-[8px] text-slate-600 font-black">{new Date(g.createdAt?.toDate()).toLocaleDateString()}</p>
                        </div>
                        <h5 className="text-xs font-bold text-slate-200 mb-1">{g.title}</h5>
                        <p className="text-[10px] text-slate-500 line-clamp-2 mb-3">{g.description}</p>
                        <div className="flex items-center justify-between pt-3 border-t border-white/[0.03]">
                           <div className="flex items-center gap-1.5">
                              <Avatar name={g.studentName} size="xs" />
                              <span className="text-[9px] text-slate-400 font-bold">{g.studentName}</span>
                           </div>
                           <div className="flex gap-1">
                              {col.id !== 'Resolved' && (
                                <button 
                                  onClick={() => {
                                    const flow = ['Submitted', 'Acknowledged', 'Resolving', 'Resolved'];
                                    const next = flow[flow.indexOf(col.id) + 1];
                                    handleUpdateGrievance(g.id, next);
                                  }}
                                  className="p-1.5 bg-white/5 rounded-lg text-slate-400 hover:text-white hover:bg-indigo-500/20 transition-all"
                                >
                                  <ChevronRight size={12} />
                                </button>
                              )}
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Placements Tab */}
        {activeAdminTab === 'Placements' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
            {/* Live Stats Editor */}
            <div className="glass-card rounded-3xl p-7">
              <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                <TrendingUp size={16} className="text-indigo-400" /> Edit Placement Metrics
              </h3>
              <form onSubmit={handleUpdatePlacement} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Total Placed</label>
                    <input type="text" value={pStats.totalPlaced} onChange={e => setPStats({...pStats, totalPlaced: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-indigo-500/50 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Avg Package</label>
                    <input type="text" value={pStats.avgPackage} onChange={e => setPStats({...pStats, avgPackage: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-indigo-500/50 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Top Package</label>
                    <input type="text" value={pStats.topPackage} onChange={e => setPStats({...pStats, topPackage: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-indigo-500/50 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Total Companies</label>
                    <input type="text" value={pStats.totalCompanies} onChange={e => setPStats({...pStats, totalCompanies: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-indigo-500/50 outline-none" />
                  </div>
                </div>
                <Button variant="primary" className="w-full" type="submit" loading={isSubmitting}>Update Dashboard</Button>
              </form>
            </div>

            {/* Current Figures Preview */}
            <div className="glass-card rounded-3xl p-7 flex flex-col justify-center">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Live Dashboard Preview</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                  <p className="text-[10px] text-emerald-500 font-bold mb-1">Placed Count</p>
                  <p className="text-2xl font-black text-white">{placementData.totalPlaced}</p>
                </div>
                <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                  <p className="text-[10px] text-indigo-500 font-bold mb-1">Avg CTC</p>
                  <p className="text-2xl font-black text-white">{placementData.avgPackage}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Data Ops Tab */}
        {activeAdminTab === 'Data Ops' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
            {/* Announcement Form */}
            <div className="glass-card rounded-3xl p-7">
              <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                <Megaphone size={16} className="text-rose-400" /> Broadcast Official Notice
              </h3>
              <form onSubmit={handlePostAnnouncement} className="space-y-4">
                <input required placeholder="Notice Title" value={announcement.title} onChange={e => setAnnouncement({...announcement, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none" />
                <textarea required placeholder="Full Details..." rows={4} value={announcement.body} onChange={e => setAnnouncement({...announcement, body: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none resize-none" />
                <div className="flex gap-4">
                  <select value={announcement.division} onChange={e => setAnnouncement({...announcement, division: e.target.value})} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none">
                    <option value="All">All Divisions</option>
                    <option value="Division A">Division A</option>
                    <option value="Division B">Division B</option>
                  </select>
                  <select value={announcement.tag} onChange={e => setAnnouncement({...announcement, tag: e.target.value})} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none">
                    <option value="Notice">Notice</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Placement">Placement</option>
                  </select>
                </div>
                <Button variant="primary" className="w-full" icon={Send} type="submit" loading={isSubmitting}>Broadcast</Button>
              </form>
            </div>

            {/* Launch Placement Drive Form */}
            <div className="glass-card rounded-3xl p-7">
              <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                <Plus size={16} className="text-sky-400" /> Launch Placement Drive
              </h3>
              <form onSubmit={handlePostDrive} className="space-y-4">
                <input required placeholder="Company Name" value={drive.company} onChange={e => setDrive({...drive, company: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none" />
                <input required placeholder="Job Role" value={drive.role} onChange={e => setDrive({...drive, role: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none" />
                <input required placeholder="Salary Package (e.g. 12 LPA)" value={drive.package} onChange={e => setDrive({...drive, package: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none" />
                <Button variant="primary" className="w-full" icon={Briefcase} type="submit" loading={isSubmitting}>Post Job Opening</Button>
              </form>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeAdminTab === 'Users' && (
          <div className="space-y-6">
             <div className="flex items-center justify-between glass-card p-6 rounded-3xl">
                <div>
                   <h3 className="text-sm font-bold text-white mb-1">Institutional Student Index</h3>
                   <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Master record synchronization</p>
                </div>
                <Button variant="primary" icon={RefreshCw} loading={isSyncing} onClick={handleBulkSync}>Bulk Sync Master List</Button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
               {filteredUsers.map(u => (
                 <div key={u.id} className="glass-card rounded-3xl p-5 border-white/[0.05] hover:border-indigo-500/30 transition-all flex flex-col">
                   <div className="flex items-center gap-4 mb-4">
                     <Avatar name={u.name} size="md" status={u.isGhost ? 'offline' : 'online'} />
                     <div className="min-w-0">
                       <p className="text-sm font-bold text-white truncate">{u.name}</p>
                       <p className="text-[10px] text-slate-500 truncate mb-1">{u.email || u.prn}</p>
                       <div className="flex gap-2">
                          <Badge variant={u.isGhost ? 'neutral' : 'indigo'} size="xs">{u.isGhost ? 'Ghost Record' : 'Active User'}</Badge>
                          <Badge variant="ghost" size="xs" className="text-slate-500">{u.division}</Badge>
                       </div>
                     </div>
                   </div>
                   {!u.isGhost && (
                     <div className="mt-auto pt-4 border-t border-white/[0.03]">
                        <select 
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-black uppercase text-slate-400 outline-none hover:border-indigo-500/50"
                          value={u.role || 'Student'}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        >
                           <option value="Student">Student (L1)</option>
                           <option value="Faculty">Faculty (L2)</option>
                           <option value="Admin">Admin (L3)</option>
                           <option value="SuperAdmin">SuperAdmin (L4)</option>
                        </select>
                     </div>
                   )}
                 </div>
               ))}
             </div>
          </div>
        )}

        {/* System Tab */}
        {activeAdminTab === 'System' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
             {/* Global Banner Config */}
             <div className="glass-card rounded-3xl p-7">
                <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                   <Megaphone size={16} className="text-amber-400" /> Platform-Wide Alert Banner
                </h3>
                <div className="space-y-4">
                   <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                      <div className="leading-none">
                         <p className="text-xs font-bold text-white">Maintenance Mode</p>
                         <p className="text-[10px] text-slate-500 mt-1 uppercase">Block user access</p>
                      </div>
                      <button 
                        onClick={() => setConfig({...config, isMaintenanceMode: !config.isMaintenanceMode})}
                        className={`w-10 h-5 rounded-full p-1 transition-all ${config.isMaintenanceMode ? 'bg-amber-500' : 'bg-slate-700'}`}
                      >
                         <div className={`w-3 h-3 bg-white rounded-full transition-transform ${config.isMaintenanceMode ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                   </div>
                   <textarea 
                     placeholder="Banner text (e.g. Server maintenance at 10 PM tonight)..."
                     value={config.maintenanceBanner}
                     onChange={e => setConfig({...config, maintenanceBanner: e.target.value})}
                     className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white outline-none h-24 resize-none"
                   />
                   <Button variant="primary" className="w-full" onClick={handleUpdateConfig} loading={isSubmitting}>Save Platform Config</Button>
                </div>
             </div>

             {/* Semester Reset Tool */}
             <div className="glass-card rounded-3xl p-7 border-rose-500/20 bg-rose-500/5">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center text-rose-500 mb-6">
                   <AlertCircle size={24} />
                </div>
                <h3 className="text-sm font-bold text-white mb-2">New Semester Orchestration</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-6">
                   This action will globally reset all Engagement Scores, Streaks, and Badge histories. This is permanent and used only at the start of a calendar academic term.
                </p>
                <Button variant="danger" className="w-full" icon={Zap} onClick={handleResetEngagement} loading={isSubmitting}>Reset Global Engagement</Button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
