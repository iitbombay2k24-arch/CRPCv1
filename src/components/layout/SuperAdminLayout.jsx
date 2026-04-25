import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, ShieldAlert, Hash, 
  BookOpen, Briefcase, AlertCircle, Settings,
  LogOut, User, Menu, X, Bell, Activity, ExternalLink, Calendar
} from 'lucide-react';
import useUIStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';
import OverviewDashboard from '../../pages/admin/OverviewDashboard';
import UserManagement from '../../pages/admin/UserManagement';
import AuditLogPage from '../../pages/admin/AuditLogPage';
import ContentModeration from '../../pages/admin/ContentModeration';
import ChannelManagement from '../../pages/admin/ChannelManagement';
import AcademicsAdmin from '../../pages/admin/AcademicsAdmin';
import PlacementsAdmin from '../../pages/admin/PlacementsAdmin';
import GrievanceAdmin from '../../pages/admin/GrievanceAdmin';
import SchedulerPage from '../../pages/admin/SchedulerPage';

const ADMIN_NAV = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'scheduler', label: 'Scheduler', icon: Calendar },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'moderation', label: 'Moderation', icon: ShieldAlert },
  { id: 'channels', label: 'Channels', icon: Hash },
  { id: 'academics', label: 'Academics', icon: BookOpen },
  { id: 'placements', label: 'Placements', icon: Briefcase },
  { id: 'grievances', label: 'Grievances', icon: AlertCircle },
  { id: 'system', label: 'System', icon: Settings },
];

export default function SuperAdminLayout({ children }) {
  const { setActiveTab, setIsAdminView, activeAdminTab, setActiveAdminTab } = useUIStore();
  const { user } = useAuthStore();

  const handleSwitchToStudent = () => {
    setIsAdminView(false);
    setActiveTab('dashboard');
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 overflow-hidden font-sans text-slate-200">
      {/* Admin Sidebar */}
      <aside className="w-64 flex flex-col border-r border-rose-500/10 bg-black/40 backdrop-blur-xl shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-rose-500/10">
          <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center mr-3 border border-rose-500/30">
            <ShieldAlert size={18} className="text-rose-500" />
          </div>
          <span className="font-black tracking-tighter text-white uppercase text-sm">Command Center</span>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {ADMIN_NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveAdminTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all group ${
                activeAdminTab === item.id 
                ? 'bg-rose-500/10 text-white border border-rose-500/20 shadow-lg shadow-rose-500/5' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
              }`}
            >
              <item.icon size={18} className={activeAdminTab === item.id ? 'text-rose-500' : 'group-hover:text-rose-400'} />
              <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-rose-500/10 bg-rose-500/5">
          <button 
            onClick={handleSwitchToStudent}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-all group"
          >
            <div className="flex items-center gap-2">
              <ExternalLink size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Student View</span>
            </div>
            <div className="w-2 h-2 rounded-full bg-rose-500 group-hover:bg-white animate-pulse" />
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-rose-500/10 px-8 flex items-center justify-between bg-black/20">
          <div>
            <h1 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">DYPIU Platform Orchestration</h1>
            <h2 className="text-lg font-bold text-white capitalize">{activeAdminTab} Module</h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">1,204 Online</span>
            </div>
            
            <div className="flex items-center gap-3 border-l border-white/10 pl-6">
              <div className="text-right">
                <p className="text-xs font-bold text-white leading-none">{user?.name}</p>
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-1">SuperAdmin</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-500">
                <User size={18} />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar p-8">
          {activeAdminTab === 'overview' ? (
            <OverviewDashboard onTabChange={setActiveAdminTab} />
          ) : activeAdminTab === 'users' ? (
            <UserManagement />
          ) : activeAdminTab === 'scheduler' ? (
            <SchedulerPage />
          ) : activeAdminTab === 'moderation' ? (
            <ContentModeration />
          ) : activeAdminTab === 'channels' ? (
            <ChannelManagement />
          ) : activeAdminTab === 'academics' ? (
            <AcademicsAdmin />
          ) : activeAdminTab === 'placements' ? (
            <PlacementsAdmin />
          ) : activeAdminTab === 'grievances' ? (
            <GrievanceAdmin />
          ) : activeAdminTab === 'system' ? (
            <AuditLogPage />
          ) : (
            <div className="h-full w-full border-2 border-dashed border-rose-500/10 rounded-3xl flex items-center justify-center">
              <div className="text-center">
                <Activity size={48} className="text-rose-500/20 mx-auto mb-4" />
                <h3 className="text-slate-500 font-bold uppercase tracking-widest">Module Under Construction</h3>
                <p className="text-xs text-slate-600 mt-2 italic">Building the real-time data stream for {activeAdminTab}...</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
