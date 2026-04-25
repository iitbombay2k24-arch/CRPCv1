import React, { useState, useEffect } from 'react';
import { 
  Users, Hash, MessageSquare, Database, 
  AlertTriangle, ShieldAlert, Activity, Clock,
  ShieldCheck, HardDrive, Wifi, Shield, User,
  Mail, Calendar, Briefcase, ChevronRight,
  BookOpen, CheckSquare, FileText, MessageCircle,
  Code, CreditCard, ShoppingCart, Package, Box,
  Bell, UserCheck, LayoutGrid, GraduationCap,
  Trophy, Book, Smartphone, Globe, Settings, AlertCircle
} from 'lucide-react';
import { onGlobalStatsChange, onUsersChange, onAuditLogChange, onGrievancesChange } from '../services/firestoreService';
import useAuthStore from '../store/authStore';
import useUIStore from '../store/uiStore';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { setActiveTab, setActiveAdminTab } = useUIStore();
  const [onlineCount, setOnlineCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubUsers = onUsersChange((users) => {
      setOnlineCount(users.filter(u => u.status === 'online').length);
      setIsLoading(false);
    });
    return () => unsubUsers();
  }, []);

  const isStudent = user?.roleLevel < 3;
  const isAdmin = user?.roleLevel >= 3;

  const quickLinks = isStudent ? [
    { id: 'academics', label: 'Academics', icon: BookOpen, target: 'timetable' },
    { id: 'attendance', label: 'Attendance', icon: CheckSquare, target: 'attendance' },
    { id: 'assessments', label: 'Assessments', icon: Trophy, target: 'quizzes' },
    { id: 'timetable', label: 'Scheduler', icon: Calendar, target: 'timetable' },
    { id: 'announcements', label: 'Bulletin', icon: Bell, target: 'announcements' },
    { id: 'q&a', label: 'Q&A Board', icon: MessageSquare, target: 'qa' },
    { id: 'placement', label: 'Career Hub', icon: Briefcase, target: 'placement' },
    { id: 'grievances', label: 'Support', icon: ShieldAlert, target: 'grievances' },
    { id: 'resources', label: 'Library', icon: Book, target: 'resources' },
    { id: 'profile', label: 'My Profile', icon: User, target: 'profile' },
    { id: 'focus', label: 'Focus Mode', icon: Smartphone, target: 'focus' },
    { id: 'leaderboard', label: 'Rankings', icon: Globe, target: 'leaderboard' },
    { id: 'tasks', label: 'Task Board', icon: FileText, target: 'tasks' },
    { id: 'interview-forum', label: 'Interviews', icon: MessageCircle, target: 'interview-forum' },
    { id: 'resume-analyzer', label: 'AI Resume', icon: Activity, target: 'resume-analyzer' },
    { id: 'study-rooms', label: 'Study Rooms', icon: Users, target: 'group-study' },
  ] : [
    { id: 'scheduler', label: 'Scheduler', icon: Calendar, target: 'admin', targetAdminTab: 'scheduler' },
    { id: 'academics-admin', label: 'Academics', icon: BookOpen, target: 'admin', targetAdminTab: 'academics' },
    { id: 'user-mgmt', label: 'Muster', icon: Users, target: 'admin', targetAdminTab: 'users' },
    { id: 'moderation', label: 'Moderation', icon: ShieldAlert, target: 'admin', targetAdminTab: 'moderation' },
    { id: 'channels', label: 'Channels', icon: Hash, target: 'admin', targetAdminTab: 'channels' },
    { id: 'placements', label: 'Career Hub', icon: Briefcase, target: 'admin', targetAdminTab: 'placements' },
    { id: 'grievances-admin', label: 'Grievances', icon: AlertCircle, target: 'admin', targetAdminTab: 'grievances' },
    { id: 'audit-log', label: 'Audit Log', icon: FileText, target: 'admin', targetAdminTab: 'system' },
    { id: 'api-mgmt', label: 'API / Sys', icon: Code, target: 'admin', targetAdminTab: 'system' },
    { id: 'monitoring', label: 'Monitoring', icon: Activity, target: 'admin', targetAdminTab: 'overview' },
  ];

  if (isLoading) return <div className="h-full flex items-center justify-center"><Spinner /></div>;

  return (
    <div className="h-full flex flex-col space-y-6 p-4 md:p-8 animate-fade-in overflow-y-auto custom-scrollbar bg-transparent">
       {/* ─── Profile Header (ERP Style) ─── */}
       <div className="bg-white/[0.02] border border-white/[0.05] rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row shadow-2xl shrink-0">
          <div className="w-full md:w-64 bg-indigo-500/10 border-r border-white/[0.05] flex flex-col items-center justify-center p-8 text-center">
             <div className="w-24 h-24 rounded-3xl bg-indigo-500 flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-indigo-500/20 mb-4 border-4 border-white/10">
                {user?.name?.substring(0, 2).toUpperCase() || 'ST'}
             </div>
             <Badge variant={isAdmin ? 'danger' : 'info'} size="xs" className="font-black uppercase tracking-widest mb-1">
                {user?.role || 'Student'}
             </Badge>
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">ID: {user?.enrollmentNo || user?.uid?.substring(0, 8)}</p>
          </div>
          
          <div className="flex-1 p-8">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
                <ProfileItem label={isStudent ? "Enrollment ID" : "Employee ID"} value={user?.enrollmentNo || user?.email} />
                <ProfileItem label="Full Name" value={user?.name} />
                <ProfileItem label={isStudent ? "Current Programme" : "Official Post"} value={isStudent ? (user?.course || 'B.Tech Computer Science') : (user?.role === 'SuperAdmin' ? 'Visiting Faculty (Super Admin)' : user?.role)} />
                <ProfileItem label="Official Email" value={user?.email} />
                <ProfileItem label={isStudent ? "Current Semester" : "Department"} value={isStudent ? `Semester ${user?.semester || '4'}` : 'Computer Science & Engineering'} />
                <ProfileItem label="Contact Verification" value="+91 7005XXXXXX" />
             </div>
          </div>
       </div>

       {/* ─── Secondary Info Grid ─── */}
       <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 shrink-0">
          {/* Section 1: Role/Status */}
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-[2rem] overflow-hidden">
             <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.01]">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Shield size={14} className="text-indigo-500" />
                  {isStudent ? 'Academic Information' : 'Role Information'}
                </h3>
                <span className="text-[10px] font-bold text-slate-600">Active Status</span>
             </div>
             <table className="w-full text-left text-[11px]">
                <thead>
                   <tr className="border-b border-white/[0.03] text-slate-500 font-black uppercase tracking-tighter">
                      <th className="px-6 py-3">Sr.No</th>
                      <th className="px-6 py-3">Attribute</th>
                      <th className="px-6 py-3">Details</th>
                   </tr>
                </thead>
                <tbody className="text-slate-300">
                   <tr className="hover:bg-white/[0.02]">
                      <td className="px-6 py-3">1</td>
                      <td className="px-6 py-3 font-bold text-white">{isStudent ? 'Batch' : 'Level'}</td>
                      <td className="px-6 py-3">{isStudent ? (user?.batch || '2021-2025') : 'Department Level'}</td>
                   </tr>
                   <tr className="hover:bg-white/[0.02]">
                      <td className="px-6 py-3">2</td>
                      <td className="px-6 py-3 font-bold text-white">{isStudent ? 'Division' : 'Permissions'}</td>
                      <td className="px-6 py-3">{isStudent ? (user?.division || 'C') : 'Full Platform Access'}</td>
                   </tr>
                </tbody>
             </table>
          </div>

          {/* Section 2: Programme/Associations */}
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-[2rem] overflow-hidden">
             <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.01]">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Users size={14} className="text-indigo-500" />
                  Associated Programmes
                </h3>
                <span className="text-[10px] font-bold text-slate-600">Registered</span>
             </div>
             <table className="w-full text-left text-[11px]">
                <thead>
                   <tr className="border-b border-white/[0.03] text-slate-500 font-black uppercase tracking-tighter">
                      <th className="px-6 py-3">Sr.No</th>
                      <th className="px-6 py-3">Programme Description</th>
                   </tr>
                </thead>
                <tbody className="text-slate-300">
                   <tr className="hover:bg-white/[0.02]">
                      <td className="px-6 py-2">1</td>
                      <td className="px-6 py-2">DY Patil International University (Akrundi Campus)</td>
                   </tr>
                   <tr className="hover:bg-white/[0.02]">
                      <td className="px-6 py-2">2</td>
                      <td className="px-6 py-2">{user?.course || 'B. Tech Computer Science & Engineering'}</td>
                   </tr>
                </tbody>
             </table>
          </div>
       </div>

       {/* ─── Status Row ─── */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
          <StatusCard title={isStudent ? "Course Coordinator" : "Class Coordinator"} count={0} />
          <StatusCard title="Today's Timetable" count={0} />
       </div>

       {/* ─── Quick Links Matrix (Universal) ─── */}
       <div className="bg-white/[0.02] border border-white/[0.05] rounded-[2.5rem] p-8 shadow-2xl shrink-0">
          <h3 className="text-xs font-black text-indigo-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
            <LayoutGrid size={18} />
            University Resource Matrix
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 border border-white/[0.05] rounded-3xl overflow-hidden shadow-inner bg-black/20">
             {quickLinks.map((link, i) => (
               <button
                 key={link.id}
                 onClick={() => {
                   if (isAdmin && link.targetAdminTab) {
                      setActiveAdminTab(link.targetAdminTab);
                      setActiveTab('admin');
                   } else {
                      setActiveTab(link.target);
                   }
                 }}
                 className="flex flex-col items-center justify-center gap-3 p-6 border border-white/[0.03] hover:bg-indigo-500/10 hover:border-indigo-500/20 transition-all group"
               >
                 <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-slate-500 group-hover:text-indigo-400 group-hover:scale-110 transition-all">
                   <link.icon size={24} />
                 </div>
                 <span className="text-[9px] font-black text-slate-500 group-hover:text-white uppercase tracking-widest text-center leading-tight">
                   {link.label}
                 </span>
               </button>
             ))}
          </div>
       </div>

       {/* ─── Footer Connectivity ─── */}
       <div className="flex flex-wrap items-center justify-center gap-12 pt-6 opacity-40 pb-10">
          <FooterStat label="Infrastructure" value="AWS Cloud" icon={Database} />
          <FooterStat label="Node Status" value="Stable" icon={Wifi} />
          <FooterStat label="Platform Load" value={`${onlineCount} Live`} icon={Activity} />
          <FooterStat label="System Version" value="v1.0.4-stable" icon={ShieldCheck} />
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
       <Icon size={16} className="text-indigo-400" />
       <div>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">{label}</p>
          <p className="text-[11px] font-bold text-white leading-none">{value}</p>
       </div>
    </div>
  );
}
