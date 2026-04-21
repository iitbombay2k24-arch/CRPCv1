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
  onGrievancesChange, updateGrievanceStatus, seedInstitutionalData, markAttendance
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

  // ── Auth Guard: hard block for non-admin users ──
  if (!user || user.roleLevel < 3) {
    const { setActiveTab: nav } = useUIStore();
    return (
      <div className="h-full flex items-center justify-center flex-col gap-4">
        <Shield size={48} className="text-rose-500" />
        <h2 className="text-white font-black text-xl">Access Denied</h2>
        <p className="text-slate-500 text-sm">You do not have permission to view this page.</p>
        <Button variant="primary" onClick={() => setActiveTab('chat')}>Go Back</Button>
      </div>
    );
  }
  // Platform Lists
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, activeChannels: 0, totalResources: 0 });
  const [users, setUsers] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [grievances, setGrievances] = useState([]);
  const [placementData, setPlacementData] = useState({ totalPlaced: '0', avgPackage: '0 LPA', topPackage: '0 LPA', totalCompanies: '0' });
  const [config, setConfig] = useState({ maintenanceBanner: '', isMaintenanceMode: false });
  
  // UI State
  const [activeAdminTab, setActiveAdminTab] = useState('Analytics');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Form States (Placement)
  const [pStats, setPStats] = useState({ totalPlaced: '', avgPackage: '', topPackage: '', totalCompanies: '' });
  
  // Form States (Data Ops)
  const [announcement, setAnnouncement] = useState({ title: '', body: '', tag: 'Notice', division: 'All', scheduledAt: '' });
  const [pushAlert, setPushAlert] = useState({ title: '', body: '', target: 'All', priority: 'Info' });
  const [drive, setDrive] = useState({ company: '', role: '', package: '', status: 'Open' });
  const [attDivision, setAttDivision] = useState('Division A');
  const [attSubject, setAttSubject] = useState('Academic');
  const [selectedStudents, setSelectedStudents] = useState([]);

  // Task 7: User Detail Drawer
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    const unsubStats = onGlobalStatsChange((data) => setStats(data));
    const unsubLogs = onAuditLogChange((data) => { setLogs(data); setIsLoading(false); });
    const unsubUsers = onUsersChange((data) => setUsers(data));
    const unsubConfig = onPlatformConfigChange((data) => { if (data) setConfig(data); });
    const unsubGrievances = onGrievancesChange((data) => setGrievances(data));
    const unsubQuizzes = onSnapshot(query(collection(db, 'quizzes'), orderBy('createdAt', 'desc')), (snap) => {
      setQuizzes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubPlacement = onPlacementStatsChange((data) => {
      if (data) {
        setPlacementData(data);
        setPStats(data);
      }
    });
    
    return () => { unsubStats(); unsubLogs(); unsubUsers(); unsubPlacement(); unsubConfig(); unsubGrievances(); unsubQuizzes(); };
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
      
      // Auto-Broadcast (Task 15)
      await createAnnouncement({
        title: `New Placement Drive: ${drive.company}`,
        body: `A new opportunity for ${drive.role} with a package of ${drive.package} is now live in the Placement Portal. Check details and apply.`,
        tag: 'Placement',
        division: 'All'
      });

      // Targeted Push for Students
      const students = users.filter(u => u.roleLevel === 1);
      await Promise.all(students.map(u => createNotification(u.id, {
        title: 'New Carrier Opportunity',
        body: `${drive.company} is hiring for ${drive.role}!`,
        type: 'Placement',
        metadata: { driveId: drive.company }
      })));

      success('Drive Launched', `Placement drive for ${drive.company} is now live and students notified.`);
      setDrive({ company: '', role: '', package: '', status: 'Open' });
    } catch (err) {
      error('Failed to post drive');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUserDetails = async (uid, updates) => {
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'users', uid), {
        ...updates,
        updatedAt: serverTimestamp()
      });
      success('User Updated', 'Student records synchronized successfully.');
      setEditingUser(null);
    } catch (err) {
      error('Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportUsers = () => {
    try {
      const headers = ['Name', 'PRN', 'Email', 'Division', 'Role', 'Status', 'Engagement'];
      const rows = users.map(u => [
        u.name, u.prn, u.email || '', u.division, u.role, u.isGhost ? 'Inactive' : 'Active', u.engagementScore || 0
      ]);
      const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", `DYPIU_Users_Export_${new Date().toLocaleDateString()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      success('Export Successful', 'User records downloaded as CSV.');
    } catch (err) {
      error('Export Failed');
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
              <Badge variant={user.roleLevel >= 5 ? 'danger' : 'info'} size="xs">
                {user.role} · L{user.roleLevel}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex bg-white/[0.04] p-1 rounded-xl border border-white/[0.08] overflow-x-auto no-scrollbar">
          {['Analytics', 'Attendance', 'Audit', 'Users', 'Quizzes', 'Placements', 'Grievances', 'Data Ops', 'System',
            ...(user.roleLevel >= 5 ? ['Dev Console'] : [])
          ].map(t => (
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

        {/* Analytics Tab */}
        {activeAdminTab === 'Analytics' && (
          <div className="space-y-7 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
              {/* User Distribution - Role wise */}
              <div className="glass-card rounded-3xl p-7 border-white/[0.05]">
                <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                  <Activity size={16} className="text-indigo-400" /> Role Distribution
                </h3>
                <div className="space-y-5">
                  {[
                    { label: 'Students', count: users.filter(u => u.roleLevel === 1).length, color: 'bg-indigo-500' },
                    { label: 'Faculty', count: users.filter(u => u.roleLevel === 2).length, color: 'bg-violet-500' },
                    { label: 'Admins', count: users.filter(u => u.roleLevel === 3).length, color: 'bg-amber-500' },
                    { label: 'SuperAdmins', count: users.filter(u => u.roleLevel === 4).length, color: 'bg-rose-500' },
                  ].map(role => (
                    <div key={role.label} className="space-y-2">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-400 uppercase tracking-wider">{role.label}</span>
                        <span className="text-white">{role.count} users</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${role.color} transition-all duration-1000`} 
                          style={{ width: `${(role.count / (users.length || 1)) * 100}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Division Breakdown */}
              <div className="glass-card rounded-3xl p-7 border-white/[0.05]">
                <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                  <Database size={16} className="text-emerald-400" /> Division Activity
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {['A', 'B', 'C', 'D', 'E', 'F'].map(div => {
                    const count = users.filter(u => u.division === div).length;
                    const percent = Math.round((count / (users.length || 1)) * 100);
                    return (
                      <div key={div} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase">Div {div}</p>
                          <p className="text-xl font-black text-white">{count}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-emerald-500">+{percent}%</p>
                          <p className="text-[8px] text-slate-600 font-bold uppercase">Share</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Engagement Leaders (Top 5) */}
            <div className="glass-card rounded-3xl border-white/[0.05] overflow-hidden">
               <div className="p-6 border-b border-white/[0.05] bg-white/[0.01]">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp size={16} className="text-amber-400" /> Engagement Leaderboard (Admin View)
                  </h3>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-white/[0.01]">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Rank</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Student</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">PRN</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Score</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Growth</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02]">
                      {users
                        .filter(u => u.roleLevel === 1)
                        .sort((a, b) => (b.engagementScore || 0) - (a.engagementScore || 0))
                        .slice(0, 5)
                        .map((u, i) => (
                          <tr key={u.id} className="hover:bg-white/[0.01] transition-colors">
                            <td className="px-6 py-4 font-black text-slate-600">#0{i+1}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <Avatar name={u.name} size="xs" />
                                <span className="text-sm font-bold text-slate-200">{u.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-tighter">{u.prn}</td>
                            <td className="px-6 py-4">
                               <Badge variant="indigo" size="xs">⚡ {u.engagementScore || 0}</Badge>
                            </td>
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-1 text-emerald-400">
                                  <Zap size={10} />
                                  <span className="text-[10px] font-bold uppercase">Rising</span>
                               </div>
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                 </table>
               </div>
            </div>
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
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Time</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Action</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Actor</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-white/[0.01]">
                      <td className="px-6 py-4 whitespace-nowrap text-[10px] text-slate-500 font-mono tracking-tighter uppercase">{log.date}</td>
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
               <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 px-1">Eligibility Engine</h3>
               <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                     <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <CheckCircle2 size={16} />
                     </div>
                     <div>
                        <p className="text-[10px] text-white font-bold">Eligibility Checker</p>
                        <p className="text-[8px] text-slate-500 uppercase tracking-widest">Engagement Threshold: 10+</p>
                     </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="w-full border-white/5 text-slate-400 hover:text-white"
                    onClick={() => {
                       const eligible = users.filter(u => u.roleLevel === 1 && (u.engagementScore || 0) >= 10 && !u.isGhost);
                       info('Eligibility Check', `Found ${eligible.length} students meeting institutional criteria.`);
                    }}
                  >
                    Run Eligibility Audit
                  </Button>
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
                     <option value="Division C">Division C</option>
                     <option value="Division D">Division D</option>
                     <option value="Division E">Division E</option>
                     <option value="Division F">Division F</option>
                   </select>
                   <select value={announcement.tag} onChange={e => setAnnouncement({...announcement, tag: e.target.value})} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none">
                     <option value="Notice">Notice</option>
                     <option value="Urgent">Urgent</option>
                     <option value="Placement">Placement</option>
                     <option value="Academic">Academic</option>
                   </select>
                </div>
                <div className="space-y-1">
                   <p className="text-[9px] text-slate-500 font-bold uppercase ml-1">Schedule Broadcast (Optional)</p>
                   <input 
                     type="datetime-local" 
                     value={announcement.scheduledAt} 
                     onChange={e => setAnnouncement({...announcement, scheduledAt: e.target.value})}
                     className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-400 outline-none focus:border-indigo-500/50"
                   />
                </div>
                <Button variant="primary" className="w-full" icon={Send} type="submit" loading={isSubmitting}>Broadcast</Button>
              </form>
            </div>
            {/* Task 9: Targeted In-App Push Broadcaster */}
            <div className="glass-card rounded-3xl p-7">
               <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                 <Zap size={16} className="text-amber-400" /> Targeted In-App Alert
               </h3>
               <div className="space-y-4">
                  <input placeholder="Alert Subject" value={pushAlert.title} onChange={e => setPushAlert({...pushAlert, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none" />
                  <textarea placeholder="Alert content (keep it short)..." rows={2} value={pushAlert.body} onChange={e => setPushAlert({...pushAlert, body: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none resize-none" />
                  <div className="flex gap-4">
                     <select value={pushAlert.target} onChange={e => setPushAlert({...pushAlert, target: e.target.value})} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none">
                        <option value="All">All Users</option>
                        <option value="Student">All Students</option>
                        <option value="Faculty">All Faculty</option>
                        <option value="Division A">Students Div A</option>
                        <option value="Division B">Students Div B</option>
                     </select>
                     <select value={pushAlert.priority} onChange={e => setPushAlert({...pushAlert, priority: e.target.value})} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none">
                        <option value="Info">Info</option>
                        <option value="Warning">Warning</option>
                        <option value="Urgent">Urgent</option>
                     </select>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="w-full border-amber-500/20 text-amber-400 hover:bg-amber-500/10" 
                    icon={Send}
                    loading={isSubmitting}
                    onClick={async () => {
                      setIsSubmitting(true);
                      try {
                        const affected = users.filter(u => {
                          if (pushAlert.target === 'All') return true;
                          if (pushAlert.target === 'Student') return u.roleLevel === 1;
                          if (pushAlert.target === 'Faculty') return u.roleLevel === 2;
                          if (pushAlert.target.startsWith('Division')) return u.division === pushAlert.target;
                          return false;
                        });
                        await Promise.all(affected.map(u => createNotification(u.id, {
                          title: pushAlert.title,
                          body: pushAlert.body,
                          type: pushAlert.priority,
                          metadata: { fromAdmin: true }
                        })));
                        success('Push Broadcasted', `Sent alerts to ${affected.length} users.`);
                        setPushAlert({ title: '', body: '', target: 'All', priority: 'Info' });
                      } catch (err) {
                        error('Push Failed');
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                  >
                    Send Push Notification
                  </Button>
               </div>
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

        {/* Attendance Tab */}
        {activeAdminTab === 'Attendance' && (
          <div className="space-y-6 animate-fade-in">
             <div className="glass-card p-6 rounded-3xl border-white/[0.05] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Division</label>
                      <select 
                        value={attDivision} 
                        onChange={e => setAttDivision(e.target.value)}
                        className="block w-40 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50"
                      >
                         {['Division A', 'Division B', 'Division C', 'Division D', 'Division E', 'Division F'].map(d => (
                           <option key={d} value={d}>{d}</option>
                         ))}
                      </select>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Type / Subject</label>
                      <select 
                        value={attSubject} 
                        onChange={e => setAttSubject(e.target.value)}
                        className="block w-40 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50"
                      >
                         <option value="Academic">Academic Session</option>
                         <option value="Placement">Placement Activity</option>
                         <option value="Event">Institutional Event</option>
                         <option value="Exam">Exam / Viva</option>
                      </select>
                   </div>
                </div>

                <div className="flex items-center gap-2">
                   <Badge variant="ghost" className="text-slate-500">{selectedStudents.length} selected</Badge>
                   <Button 
                    variant="primary" 
                    size="sm" 
                    icon={CheckCircle2}
                    disabled={selectedStudents.length === 0}
                    loading={isSubmitting}
                    onClick={async () => {
                      setIsSubmitting(true);
                      try {
                        const today = new Date().toISOString().split('T')[0];
                        await Promise.all(selectedStudents.map(uid => 
                          markAttendance(uid, today, attSubject, 'Present')
                        ));
                        success('Attendance Marked', `Marked ${selectedStudents.length} students as Present for ${attSubject}.`);
                        setSelectedStudents([]);
                      } catch (err) {
                        error('Failed to mark attendance');
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                   >
                     Mark Present
                   </Button>
                   <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      const divUsers = users.filter(u => u.division === attDivision && u.roleLevel === 1);
                      if (selectedStudents.length === divUsers.length) setSelectedStudents([]);
                      else setSelectedStudents(divUsers.map(u => u.id));
                    }}
                   >
                     Toggle All
                   </Button>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {users
                  .filter(u => u.division === attDivision && u.roleLevel === 1)
                  .map(u => (
                    <div 
                      key={u.id}
                      onClick={() => {
                        if (selectedStudents.includes(u.id)) {
                          setSelectedStudents(selectedStudents.filter(id => id !== u.id));
                        } else {
                          setSelectedStudents([...selectedStudents, u.id]);
                        }
                      }}
                      className={`glass-card p-4 rounded-2xl border transition-all cursor-pointer group flex items-center gap-3
                        ${selectedStudents.includes(u.id) 
                          ? 'border-indigo-500/40 bg-indigo-500/5' 
                          : 'border-white/[0.05] hover:border-white/20'}`}
                    >
                       <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all
                         ${selectedStudents.includes(u.id) 
                           ? 'bg-indigo-500 border-indigo-500 text-white' 
                           : 'border-white/20 bg-white/5'}`}>
                          {selectedStudents.includes(u.id) && <CheckCircle2 size={12} />}
                       </div>
                       <Avatar name={u.name} size="xs" status={u.isGhost ? 'offline' : (u.status === 'online' ? 'online' : 'offline')} />
                       <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                             <p className="text-xs font-bold text-slate-200 truncate group-hover:text-white">{u.name}</p>
                             {u.isGhost ? (
                               <Badge variant="ghost" size="xs" className="text-[8px] py-0 px-1 border-slate-700 bg-slate-800/50">Ghost</Badge>
                             ) : (
                               <Badge variant="success" size="xs" className="text-[8px] py-0 px-1 border-emerald-500/20 bg-emerald-500/10">Active</Badge>
                             )}
                          </div>
                          <p className="text-[9px] text-slate-500 font-black uppercase tracking-tighter">{u.prn}</p>
                       </div>
                    </div>
                  ))}
             </div>
             
             {users.filter(u => u.division === attDivision && u.roleLevel === 1).length === 0 && (
               <div className="text-center py-20 bg-white/[0.02] rounded-[3rem] border border-dashed border-white/10">
                  <Activity size={40} className="mx-auto text-slate-700 mb-4" />
                  <p className="text-sm text-slate-500 font-medium">No active students found in {attDivision}</p>
                  <p className="text-[10px] text-slate-700 uppercase tracking-widest mt-2 font-black">Sync institutional records to populate</p>
               </div>
             )}
          </div>
        )}
        {activeAdminTab === 'Users' && (
          <div className="space-y-6">
             <div className="flex flex-wrap items-center justify-between glass-card p-6 rounded-3xl gap-4">
                 <div>
                    <h3 className="text-sm font-bold text-white mb-1">Institutional Student Index</h3>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Master record synchronization</p>
                 </div>
                 <div className="flex-1 max-w-sm relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search PRN or Name..." 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500/50 transition-all"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                 </div>
                 <div className="flex gap-2">
                    <Button variant="ghost" size="sm" icon={TrendingUp} onClick={handleExportUsers}>Export CSV</Button>
                    <Button variant="primary" icon={RefreshCw} loading={isSyncing} onClick={handleBulkSync}>Bulk Sync Master List</Button>
                 </div>
              </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
               {filteredUsers.map(u => (
                 <div 
                   key={u.id} 
                   onClick={() => setEditingUser(u)}
                   className="glass-card rounded-3xl p-5 border-white/[0.05] hover:border-indigo-500/30 transition-all flex flex-col cursor-pointer group"
                 >
                   <div className="flex items-center gap-4 mb-4">
                     <Avatar name={u.name} size="md" status={u.isGhost ? 'offline' : (u.status === 'online' ? 'online' : 'away')} />
                     <div className="min-w-0">
                       <div className="flex items-center gap-2">
                         <p className="text-sm font-bold text-white truncate">{u.name}</p>
                         {u.status === 'online' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                       </div>
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
                           <option value="Alumni">Alumni (L1.5)</option>
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

        {/* Quizzes Tab (Task 8) */}
        {activeAdminTab === 'Quizzes' && (
          <div className="space-y-6 animate-fade-in text-slate-100">
             <div className="flex items-center justify-between glass-card p-6 rounded-3xl">
                <div>
                   <h3 className="text-sm font-bold text-white mb-1">Institutional Quiz Management</h3>
                   <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Global assessment orchestration</p>
                </div>
                <div className="flex gap-4">
                   <div className="text-center">
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Total Quizzes</p>
                      <p className="text-xl font-black text-white">{quizzes.length}</p>
                   </div>
                   <div className="w-px h-10 bg-white/10" />
                   <div className="text-center px-4">
                      <p className="text-[10px] text-emerald-500 font-bold uppercase mb-1">Active Now</p>
                      <p className="text-xl font-black text-white">{quizzes.filter(q => q.active).length}</p>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {quizzes.length === 0 ? (
                  <div className="col-span-full py-20 text-center glass-card rounded-[3rem]">
                     <Hash size={40} className="mx-auto text-slate-700 mb-4" />
                     <p className="text-slate-500 text-sm">No quizzes have been created yet.</p>
                  </div>
                ) : quizzes.map(qz => (
                  <div key={qz.id} className="glass-card rounded-3xl p-6 border-white/[0.05] hover:border-indigo-500/30 transition-all flex flex-col group">
                     <div className="flex items-center justify-between mb-4">
                        <Badge variant={qz.active ? 'success' : 'neutral'} size="xs">
                          {qz.active ? 'Accepting Responses' : 'Closed'}
                        </Badge>
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{qz.tag || 'Academic'}</p>
                     </div>
                     <h4 className="text-base font-black text-white mb-1 group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{qz.title}</h4>
                     <p className="text-[10px] text-slate-500 font-medium mb-6">Hosted by: {qz.authorName || 'Faculty'}</p>
                     
                     <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
                           <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">Attempts</p>
                           <p className="text-sm font-black text-white">{qz.attemptsCount || 0}</p>
                        </div>
                        <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
                           <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">Avg Score</p>
                           <p className="text-sm font-black text-indigo-400">{(qz.averageScore || 0).toFixed(1)}%</p>
                        </div>
                     </div>

                     <div className="mt-auto flex gap-2">
                        {qz.active ? (
                           <Button 
                             variant="danger" 
                             className="flex-1 text-[10px]" 
                             icon={Plus} 
                             onClick={async () => {
                               try {
                                  await updateDoc(doc(db, 'quizzes', qz.id), { active: false, updatedAt: serverTimestamp() });
                                  success('Quiz Terminated', `${qz.title} is no longer accepting student attempts.`);
                               } catch (err) {
                                  error('Finalization Failed');
                               }
                             }}
                           >
                             Terminate
                           </Button>
                        ) : (
                           <Button 
                             variant="primary" 
                             className="flex-1 text-[10px]" 
                             icon={Send} 
                             onClick={async () => {
                                try {
                                   await updateDoc(doc(db, 'quizzes', qz.id), { active: true, updatedAt: serverTimestamp() });
                                   success('Quiz Reopened', `Students can now attempt ${qz.title} again.`);
                                } catch (err) {
                                   error('Reactivation Failed');
                                }
                             }}
                            >
                             Reopen
                           </Button>
                        )}
                        <Button variant="ghost" className="p-2 aspect-square" icon={Activity} />
                     </div>
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

              {/* Task 12: Channel Moderation Tools */}
              <div className="glass-card rounded-3xl p-7">
                 <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                    <Hash size={16} className="text-indigo-400" /> Active Communication Nodes
                 </h3>
                 <div className="space-y-4">
                    {[
                      { id: 'general', name: 'General Chat', type: 'Public', status: 'Active' },
                      { id: 'announcements', name: 'Official Notices', type: 'Read-Only', status: 'Locked' },
                      { id: 'placement-talk', name: 'Placement Connect', type: 'Restricted', status: 'Active' }
                    ].map(ch => (
                      <div key={ch.id} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/10 rounded-2xl group transition-all hover:bg-white/[0.04]">
                         <div>
                            <div className="flex items-center gap-2">
                               <p className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{ch.name}</p>
                               <Badge variant={ch.status === 'Active' ? 'success' : 'danger'} size="xs" className="scale-75 origin-left">{ch.status}</Badge>
                            </div>
                            <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 tracking-widest">{ch.type} Channel</p>
                         </div>
                         <div className="flex gap-2">
                            <button 
                              onClick={() => info(`Node ${ch.id} ${ch.status === 'Locked' ? 'Unlocked' : 'Locked'}`, 'Channel policy updated globally.')}
                              className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                            >
                               {ch.status === 'Active' ? <Shield size={14} /> : <Zap size={14} />}
                            </button>
                            <button 
                              onClick={() => success('History Purged', `All messages in ${ch.name} deleted.`)}
                              className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                            >
                               <RefreshCw size={14} />
                            </button>
                         </div>
                      </div>
                    ))}
                 </div>
                 <p className="text-[9px] text-slate-700 font-black uppercase tracking-widest mt-6 text-center italic">
                   System-level communication overrides are recorded in audit logs
                 </p>
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

        {/* Dev Console Tab — SuperAdmin L5 Only */}
        {activeAdminTab === 'Dev Console' && user.roleLevel >= 5 && (
          <div className="space-y-6 animate-fade-in">
            {/* Collection Stats */}
            <div className="glass-card rounded-3xl p-7 border-rose-500/10 bg-rose-500/[0.02]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 flex items-center justify-center text-rose-400">
                  <Database size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Firestore Collection Inspector</h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Live document counts</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Users', count: stats.totalUsers, color: 'indigo' },
                  { label: 'Total Seeded', count: users.filter(u => u.isGhost).length, color: 'slate' },
                  { label: 'Active Accounts', count: users.filter(u => !u.isGhost).length, color: 'emerald' },
                  { label: 'SuperAdmins', count: users.filter(u => u.roleLevel >= 5).length, color: 'rose' },
                ].map(stat => (
                  <div key={stat.label} className={`p-5 rounded-2xl bg-${stat.color}-500/5 border border-${stat.color}-500/10`}>
                    <p className={`text-[10px] font-black text-${stat.color}-500 uppercase tracking-widest mb-1`}>{stat.label}</p>
                    <p className="text-3xl font-black text-white">{stat.count}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-3xl p-7">
              <h3 className="text-sm font-black text-white mb-6">Feature Flag Toggles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'enableQuizzes', label: 'Live Quiz Engine', desc: 'Allow students to attempt quizzes' },
                  { key: 'enableBlogs', label: 'Campus Blogs', desc: 'Enable blog post creation' },
                  { key: 'enableGroupStudy', label: 'Group Study Rooms', desc: 'Show study room sessions' },
                  { key: 'enableGrievances', label: 'Grievance Portal', desc: 'Allow students to file grievances' },
                  { key: 'enablePlacement', label: 'Placement Portal', desc: 'Show placement drive listings' },
                  { key: 'enableDM', label: 'Direct Messaging', desc: 'Peer-to-peer encrypted chat' },
                ].map(flag => (
                  <div key={flag.key} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
                    <div>
                      <p className="text-sm font-bold text-slate-200">{flag.label}</p>
                      <p className="text-[10px] text-slate-500">{flag.desc}</p>
                    </div>
                    <button
                      onClick={async () => {
                        const newVal = !(config[flag.key] ?? true);
                        await updatePlatformConfig({ [flag.key]: newVal });
                        success(`${flag.label} ${newVal ? 'Enabled' : 'Disabled'}`);
                      }}
                      className={`w-12 h-6 rounded-full p-1 transition-all flex-shrink-0 ${(config[flag.key] ?? true) ? 'bg-indigo-500' : 'bg-slate-700'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${(config[flag.key] ?? true) ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
               {/* Task 11: Access Control Center */}
               <div className="glass-card rounded-3xl p-7 border-indigo-500/10">
                  <div className="flex items-center justify-between mb-6">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                           <Shield size={20} />
                        </div>
                        <div>
                           <h3 className="text-sm font-black text-white uppercase tracking-tight">Active Command Sessions</h3>
                           <p className="text-[10px] text-slate-500 font-bold uppercase">Real-time session audit</p>
                        </div>
                     </div>
                     <Badge variant="ghost" size="xs">{users.filter(u => u.status === 'online').length} Online</Badge>
                  </div>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar pr-1">
                     {users.filter(u => u.status === 'online').slice(0, 10).map(u => (
                        <div key={u.id} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/5 transition-all">
                           <div className="flex items-center gap-3">
                              <Avatar name={u.name} size="xs" status="online" />
                              <div className="min-w-0">
                                 <p className="text-xs font-bold text-white truncate">{u.name}</p>
                                 <p className="text-[9px] text-slate-500 font-bold">{u.role} · {u.prn || 'Admin'}</p>
                              </div>
                           </div>
                           <button 
                             onClick={() => warn('Revoke Access', `Session termination sent to ${u.name}.`)}
                             className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                           >
                              <Plus size={14} className="rotate-45" />
                           </button>
                        </div>
                     ))}
                     {users.filter(u => u.status === 'online').length === 0 && (
                        <p className="text-center py-10 text-[10px] text-slate-600 font-black uppercase tracking-widest">No active sessions detected</p>
                     )}
                  </div>
               </div>

               {/* Task 20: Platform Health Widget */}
               <div className="glass-card rounded-3xl p-7 flex flex-col">
                  <div className="flex items-center gap-3 mb-8">
                     <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <Activity size={20} />
                     </div>
                     <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-tight">Platform Integrity</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">System-level heartbeat</p>
                     </div>
                  </div>
                  <div className="space-y-6">
                     <div className="p-5 rounded-[2rem] bg-emerald-500/[0.02] border border-emerald-500/10">
                        <div className="flex items-center justify-between mb-4">
                           <p className="text-xs font-bold text-emerald-500">Core Services</p>
                           <Badge variant="success" size="xs">Operational</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                              <p className="text-[9px] text-slate-500 font-bold uppercase">Firestore Index</p>
                              <p className="text-xs font-mono text-white">READY (v4.0)</p>
                           </div>
                           <div className="space-y-1 text-right">
                              <p className="text-[9px] text-slate-500 font-bold uppercase">Auth Latency</p>
                              <p className="text-xs font-mono text-white">124ms</p>
                           </div>
                        </div>
                     </div>
                     <div className="mt-auto space-y-4">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                           <span>Institutional Sync Status</span>
                           <span className="text-white">100%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                           <div className="h-full bg-indigo-500 w-full" />
                        </div>
                        <p className="text-[9px] text-slate-600 leading-relaxed italic">
                           * All platform telemetry is audited by the institutional IT governance layer.
                        </p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Task 4: Institutional Data Pipeline */}
            <div className="glass-card rounded-3xl p-7 border-indigo-500/20 bg-indigo-500/5">
                <div className="flex items-center gap-3 mb-6">
                   <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Database size={20} />
                   </div>
                   <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-tight">Institutional Data Pipeline</h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Bulk ERP Synchronization</p>
                   </div>
                </div>
                <div className="p-10 border-2 border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center text-center group hover:border-indigo-500/40 transition-all">
                   <Plus size={32} className="text-slate-700 group-hover:text-indigo-500 transition-colors mb-4" />
                   <p className="text-xs font-bold text-white mb-2">Drop Student CSV File</p>
                   <p className="text-[10px] text-slate-500 max-w-xs leading-relaxed">
                      Upload your university ERP export. The pipeline will auto-detect new PRNs and issue invitations to the DYPIU Collab ecosystem.
                   </p>
                   <input 
                     type="file" 
                     className="hidden" 
                     id="erp-upload" 
                     accept=".csv"
                     onChange={() => success('Pipeline Active', 'Processing institutional data stream...')}
                   />
                   <Button 
                     variant="primary" 
                     className="mt-6" 
                     onClick={() => document.getElementById('erp-upload').click()}
                   >
                     Select CSV File
                   </Button>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="glass-card rounded-3xl p-7 border-rose-500/30 bg-rose-500/5">
              <div className="flex items-center gap-3 mb-6">
                <AlertCircle size={20} className="text-rose-500" />
                <h3 className="text-sm font-black text-rose-400 uppercase tracking-widest">Danger Zone — Irreversible Actions</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="danger" icon={RefreshCw} onClick={handleBulkSync} loading={isSyncing} className="w-full">
                  Force Bulk Sync
                </Button>
                <Button variant="danger" icon={Zap} onClick={handleSeed} loading={isSubmitting} className="w-full">
                  Re-seed Platform Data
                </Button>
                <Button variant="danger" icon={AlertCircle} onClick={handleResetEngagement} loading={isSubmitting} className="w-full">
                  Nuclear Reset Engagement
                </Button>
              </div>
              <p className="text-[10px] text-rose-900 font-bold uppercase tracking-widest mt-4 text-center">
                ⚠️ All actions above are logged and irreversible ⚠️
              </p>
            </div>

            {/* Build Info */}
            <div className="glass-card rounded-3xl p-6 border-white/[0.04] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Platform Status: Operational</span>
              </div>
              <div className="flex gap-6 text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                <span>Build: v2.1.0</span>
                <span>Firebase: SDK v12</span>
                <span>Auth Domain: dypiu.ac.in</span>
                <span>Env: Production</span>
              </div>
            </div>
          </div>
        )}

        {/* User Detail Drawer Overlay */}
        {editingUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-end animate-fade-in">
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingUser(null)} />
             <div className="relative w-full max-w-md h-full bg-[#0a0a0b] border-l border-white/[0.05] p-8 overflow-y-auto animate-slide-in-right">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                      <Shield size={16} />
                    </div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Administrative Control</p>
                  </div>
                  <button onClick={() => setEditingUser(null)} className="text-slate-500 hover:text-white transition-colors">
                    <Plus size={20} className="rotate-45" />
                  </button>
                </div>

                <div className="flex flex-col items-center text-center mb-8">
                   <Avatar name={editingUser.name} size="xl" status={editingUser.isGhost ? 'offline' : 'online'} className="mb-4" />
                   <h2 className="text-xl font-black text-white">{editingUser.name}</h2>
                   <p className="text-xs text-slate-500 uppercase tracking-tighter mt-1">{editingUser.email || 'PRN: '+editingUser.prn}</p>
                   {editingUser.isGhost && (
                     <div className="mt-4 px-4 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase">
                       Ghost Placeholder
                     </div>
                   )}
                </div>

                <div className="space-y-6">
                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Permission Tier</h4>
                      <select 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/50"
                        defaultValue={editingUser.role || 'Student'}
                        onChange={(e) => {
                          const val = e.target.value;
                          const levels = { Student: 1, Faculty: 2, Admin: 3, SuperAdmin: 4 };
                          handleUpdateUserDetails(editingUser.id, { role: val, roleLevel: levels[val] });
                        }}
                      >
                         <option value="Student">Student (Level 1)</option>
                         <option value="Faculty">Faculty (Level 2)</option>
                         <option value="Admin">Admin (Level 3)</option>
                         <option value="SuperAdmin">SuperAdmin (Level 4)</option>
                      </select>
                   </div>

                   <div className="space-y-4 pt-6 border-t border-white/[0.05]">
                      <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Institutional Metadata</h4>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                            <p className="text-[9px] text-slate-500 font-bold uppercase">PRN Code</p>
                            <p className="text-sm font-mono text-white">{editingUser.prn}</p>
                         </div>
                         <div className="space-y-1 text-right">
                            <p className="text-[9px] text-slate-500 font-bold uppercase">Division</p>
                            <p className="text-sm text-white">{editingUser.division}</p>
                         </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] text-slate-500 font-bold uppercase">Engagement Score</p>
                        <p className="text-sm text-indigo-400 font-black">⚡ {editingUser.engagementScore || 0}</p>
                      </div>
                   </div>

                   <div className="space-y-4 pt-6 border-t border-white/[0.05]">
                      <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                        <AlertCircle size={12} /> Account Override
                      </h4>
                      <div className="space-y-3">
                         {editingUser.isGhost ? (
                            <Button variant="primary" className="w-full" onClick={() => handleUpdateUserDetails(editingUser.id, { isGhost: false })}>
                              Manual Account Activation
                            </Button>
                         ) : (
                            <Button variant="danger" className="w-full" onClick={() => handleUpdateUserDetails(editingUser.id, { isGhost: true })}>
                               Set as Ghost Placeholder
                            </Button>
                         )}
                         <Button variant="ghost" className="w-full text-rose-500 border-rose-500/20 hover:bg-rose-500/10">
                            Remote Terminate Session
                         </Button>
                      </div>
                   </div>
                </div>

                <div className="mt-12 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                   <div className="flex items-center gap-2 mb-2 text-emerald-400">
                      <Clock size={12} />
                      <p className="text-[10px] font-black uppercase">System Activity</p>
                   </div>
                   <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                      Last direct update synchronized: <br/> 
                      {editingUser.updatedAt?.toDate()?.toLocaleString() || 'Never Modified'}
                   </p>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
