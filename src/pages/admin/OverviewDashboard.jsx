import React, { useState, useEffect } from 'react';
import { 
  Users, Hash, MessageSquare, Database, 
  AlertTriangle, ShieldAlert, Activity, Clock,
  ShieldCheck, HardDrive, Wifi, Shield, User,
  Mail, Calendar, Briefcase, ChevronRight,
  BookOpen, CheckSquare, FileText, MessageCircle,
  Code, CreditCard, ShoppingCart, Package, Box,
  Bell, UserCheck, LayoutGrid
} from 'lucide-react';
import { onGlobalStatsChange, onUsersChange, onAuditLogChange, onGrievancesChange } from '../../services/firestoreService';
import useAuthStore from '../../store/authStore';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';

export default function OverviewDashboard({ onTabChange }) {
  const { user: currentUser } = useAuthStore();
  const [stats, setStats] = useState({ totalUsers: 0, activeChannels: 0, totalResources: 0 });
  const [onlineCount, setOnlineCount] = useState(0);
  const [logs, setLogs] = useState([]);
  const [grievances, setGrievances] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubStats = onGlobalStatsChange(setStats);
    const unsubUsers = onUsersChange((users) => {
      setOnlineCount(users.filter(u => u.status === 'online').length);
    });
    const unsubLogs = onAuditLogChange((data) => {
      setLogs(data.slice(0, 5));
      setIsLoading(false);
    });
    const unsubGrievances = onGrievancesChange(setGrievances);

    return () => {
      unsubStats();
      unsubUsers();
      unsubLogs();
      unsubGrievances();
    };
  }, []);

  const quickLinks = [
    { id: 'academics', label: 'Academics', icon: BookOpen, target: 'academics' },
    { id: 'workload', label: 'Workload', icon: Activity, target: 'overview' },
    { id: 'worksheet', label: 'Worksheet', icon: FileText, target: 'overview' },
    { id: 'scheduler', label: 'Scheduler', icon: Calendar, target: 'academics' },
    { id: 'memo', label: 'Memo', icon: MessageSquare, target: 'moderation' },
    { id: 'self-appraisal', label: 'Self Appraisal', icon: UserCheck, target: 'overview' },
    { id: 'manager-feedback', label: 'Manager Feedback', icon: Shield, target: 'overview' },
    { id: 'student-feedback', label: 'Student Feedback', icon: MessageCircle, target: 'grievances' },
    { id: 'library', label: 'Library', icon: BookOpen, target: 'academics' },
    { id: 'api', label: 'API', icon: Code, target: 'system' },
    { id: 'leave-history', label: 'Leave History', icon: Clock, target: 'overview' },
    { id: 'muster', label: 'Muster', icon: Users, target: 'users' },
    { id: 'finance', label: 'Finance', icon: CreditCard, target: 'overview' },
    { id: 'purchase', label: 'Purchase', icon: ShoppingCart, target: 'overview' },
    { id: 'deadstock', label: 'DeadStock', icon: Package, target: 'overview' },
    { id: 'inventory', label: 'Inventory', icon: Box, target: 'overview' },
    { id: 'committee', label: 'Committee', icon: Users, target: 'overview' },
    { id: 'event', label: 'Event', icon: Bell, target: 'moderation' },
  ];

  if (isLoading) return <div className="h-full flex items-center justify-center"><Spinner /></div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-[1600px] mx-auto pb-10">
      {/* ─── Profile Header (ERP Style Modernized) ─── */}
      <div className="bg-white/[0.02] border border-white/[0.05] rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row shadow-2xl">
        <div className="w-full md:w-64 bg-rose-500/10 border-r border-white/[0.05] flex flex-col items-center justify-center p-8 text-center">
          <div className="w-24 h-24 rounded-3xl bg-rose-500 flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-rose-500/20 mb-4 border-4 border-white/10">
            {currentUser?.name?.substring(0, 2).toUpperCase() || 'AD'}
          </div>
          <Badge variant="success" size="xs" className="font-black uppercase tracking-widest mb-1">Authenticated</Badge>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Global UID: {currentUser?.uid?.substring(0, 8)}</p>
        </div>
        
        <div className="flex-1 p-8">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
              <ProfileItem label="Employee ID" value={currentUser?.email} />
              <ProfileItem label="Employee Name" value={currentUser?.name} />
              <ProfileItem label="Post" value={currentUser?.role === 'SuperAdmin' ? 'Visiting Faculty (Super Admin)' : currentUser?.role} />
              <ProfileItem label="Email" value={currentUser?.email} />
              <ProfileItem label="DOB" value="Not Disclosed" />
              <ProfileItem label="Contact" value="+91 7005XXXXXX" />
           </div>
        </div>
      </div>

      {/* ─── Secondary Info Grid ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
         {/* Role Information */}
         <div className="bg-white/[0.02] border border-white/[0.05] rounded-[2rem] overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.01]">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Shield size={14} className="text-rose-500" />
                 Role Information
               </h3>
               <span className="text-[10px] font-bold text-slate-600">Total Role : 1</span>
            </div>
            <table className="w-full text-left text-[11px]">
               <thead>
                  <tr className="border-b border-white/[0.03] text-slate-500 font-black uppercase tracking-tighter">
                     <th className="px-6 py-3">Sr.No</th>
                     <th className="px-6 py-3">Name</th>
                     <th className="px-6 py-3">Level</th>
                  </tr>
               </thead>
               <tbody className="text-slate-300">
                  <tr className="hover:bg-white/[0.02]">
                     <td className="px-6 py-3">1</td>
                     <td className="px-6 py-3 font-bold text-white">Faculty</td>
                     <td className="px-6 py-3">Department Level</td>
                  </tr>
               </tbody>
            </table>
         </div>

         {/* Working with Programme */}
         <div className="bg-white/[0.02] border border-white/[0.05] rounded-[2rem] overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.01]">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Users size={14} className="text-rose-500" />
                 Working With Programme
               </h3>
               <span className="text-[10px] font-bold text-slate-600">Total : 4</span>
            </div>
            <table className="w-full text-left text-[11px]">
               <thead>
                  <tr className="border-b border-white/[0.03] text-slate-500 font-black uppercase tracking-tighter">
                     <th className="px-6 py-3">Sr.No</th>
                     <th className="px-6 py-3">Programme Name</th>
                  </tr>
               </thead>
               <tbody className="text-slate-300">
                  <tr className="hover:bg-white/[0.02]">
                     <td className="px-6 py-2">1</td>
                     <td className="px-6 py-2">Visiting Faculty ( D Y Patil International University )</td>
                  </tr>
                  <tr className="hover:bg-white/[0.02]">
                     <td className="px-6 py-2">2</td>
                     <td className="px-6 py-2">B. Tech CSE ( D Y Patil International University )</td>
                  </tr>
                  <tr className="hover:bg-white/[0.02]">
                     <td className="px-6 py-2">3</td>
                     <td className="px-6 py-2">BCA ( D Y Patil International University )</td>
                  </tr>
               </tbody>
            </table>
         </div>
      </div>

      {/* ─── Status Row ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <StatusCard title="Class Coordinator" count={0} />
         <StatusCard title="Today's Timetable" count={0} />
      </div>

      {/* ─── Quick Links Matrix (Core Implementation) ─── */}
      <div className="bg-white/[0.02] border border-white/[0.05] rounded-[2.5rem] p-8 shadow-2xl">
         <h3 className="text-xs font-black text-rose-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
           <LayoutGrid size={18} />
           Administrative Quick Links Matrix
         </h3>
         
         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 border border-white/[0.05] rounded-3xl overflow-hidden shadow-inner bg-black/20">
            {quickLinks.map((link, i) => (
              <button
                key={link.id}
                onClick={() => onTabChange(link.target)}
                className="flex flex-col items-center justify-center gap-3 p-4 border border-white/[0.03] hover:bg-rose-500/10 hover:border-rose-500/20 transition-all group"
              >
                <div className="w-10 h-10 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-slate-500 group-hover:text-rose-500 group-hover:scale-110 transition-all">
                  <link.icon size={20} />
                </div>
                <span className="text-[9px] font-black text-slate-500 group-hover:text-white uppercase tracking-widest text-center leading-tight">
                  {link.label}
                </span>
              </button>
            ))}
         </div>
      </div>

      {/* ─── Footer Stats ─── */}
      <div className="flex flex-wrap items-center justify-center gap-12 pt-6 opacity-40">
         <FooterStat label="Infrastructure" value="AWS Cluster 01" icon={Database} />
         <FooterStat label="Network Status" value="Stable" icon={Wifi} />
         <FooterStat label="Live Sessions" value={onlineCount} icon={Activity} />
         <FooterStat label="System Uptime" value="99.9%" icon={Clock} />
      </div>
    </div>
  );
}

function ProfileItem({ label, value }) {
  return (
    <div className="flex flex-col border-b border-white/[0.03] pb-2">
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</span>
      <span className="text-xs font-bold text-white">{value || 'N/A'}</span>
    </div>
  );
}

function StatusCard({ title, count }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.05] rounded-[1.5rem] overflow-hidden">
       <div className="px-6 py-3 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.01]">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</h3>
          <span className="text-[10px] font-bold text-slate-600">Total : {count}</span>
       </div>
       <div className="p-6 text-center italic">
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
             <AlertTriangle size={12} className="text-amber-500/40" />
             No Data Available
          </p>
       </div>
    </div>
  );
}

function FooterStat({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center gap-3">
       <Icon size={16} className="text-rose-500" />
       <div>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">{label}</p>
          <p className="text-[11px] font-bold text-white leading-none">{value}</p>
       </div>
    </div>
  );
}
