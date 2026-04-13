import React from 'react';
import { 
  MessageSquare, 
  Hash, 
  Users, 
  Bell, 
  BookOpen, 
  CheckSquare, 
  HelpCircle, 
  Settings, 
  Plus, 
  Search,
  ChevronDown
} from 'lucide-react';
import useUIStore from '../../store/uiStore';
import useChannelStore from '../../store/channelStore';
import useAuthStore from '../../store/authStore';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';

export default function Sidebar() {
  const { isSidebarOpen, activeTab, setActiveTab } = useUIStore();
  const { channels, activeChannel, setActiveChannel } = useChannelStore();
  const { user } = useAuthStore();

  const navItems = [
    { id: 'chat', label: 'Channels', icon: MessageSquare },
    { id: 'announcements', label: 'Announcements', icon: Bell },
    { id: 'resources', label: 'Resources', icon: BookOpen },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'qa', label: 'Q&A Board', icon: HelpCircle },
  ];

  if (!isSidebarOpen) return null;

  return (
    <aside className="w-72 bg-slate-900 border-r border-slate-700/50 flex flex-col h-full animate-fade-in shadow-xl z-50">
      {/* Workspace Header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-slate-700/50 hover:bg-white/5 transition-colors cursor-pointer group">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center font-bold text-xs text-white">DC</div>
          <h1 className="font-bold text-sm truncate text-slate-100 uppercase tracking-wider">DYPIU Collab</h1>
        </div>
        <ChevronDown size={14} className="text-slate-400 group-hover:text-white transition-colors" />
      </div>

      {/* Main Nav */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 
                  ${isActive 
                    ? 'bg-indigo-600/15 text-indigo-400' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Channels Section */}
        {activeTab === 'chat' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Channels</span>
              <button className="p-1 hover:bg-white/10 rounded-md text-slate-500 hover:text-white transition-all">
                <Plus size={14} />
              </button>
            </div>
            
            <div className="space-y-0.5">
              {channels.length === 0 ? (
                <p className="px-3 text-xs text-slate-500 italic">No channels yet</p>
              ) : (
                channels.map((name) => (
                  <button
                    key={name}
                    onClick={() => setActiveChannel(name)}
                    className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm transition-all duration-200
                      ${activeChannel === name 
                        ? 'bg-slate-800 text-white font-medium' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                  >
                    <Hash size={16} className={activeChannel === name ? 'text-indigo-400' : ''} />
                    <span className="truncate">{name}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Direct Messages Placeholder */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Direct Messages</span>
            <button className="p-1 hover:bg-white/10 rounded-md text-slate-500 hover:text-white transition-all">
              <Search size={14} />
            </button>
          </div>
          <div className="space-y-1">
             <p className="px-3 text-xs text-slate-500 italic">Coming soon...</p>
          </div>
        </div>
      </div>

      {/* User Sidebar Bottom */}
      <div className="p-3 border-t border-slate-700/50 bg-slate-900/50">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
          <Avatar 
            name={user?.name || 'User'} 
            status={user?.status || 'online'} 
            size="sm" 
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-200 truncate group-hover:text-white">{user?.name || 'Loading...'}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.role || 'Member'}</p>
          </div>
          <Settings size={14} className="text-slate-500 group-hover:text-white transition-colors" />
        </div>
      </div>
    </aside>
  );
}
