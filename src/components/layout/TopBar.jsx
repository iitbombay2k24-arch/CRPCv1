import React from 'react';
import { 
  Menu, 
  X, 
  Bell, 
  Search, 
  MoreVertical, 
  Hash, 
  UserPlus, 
  Video, 
  Phone,
  LayoutGrid
} from 'lucide-react';
import useUIStore from '../../store/uiStore';
import useChannelStore from '../../store/channelStore';
import useAuthStore from '../../store/authStore';
import Badge from '../ui/Badge';

export default function TopBar() {
  const { toggleSidebar, isSidebarOpen, activeTab } = useUIStore();
  const { activeChannel, channelsData } = useChannelStore();
  const { user } = useAuthStore();

  const channelInfo = activeChannel ? channelsData[activeChannel] : null;

  return (
    <header className="h-12 bg-slate-800/50 border-b border-slate-700/30 flex items-center justify-between px-4 backdrop-blur-sm z-40">
      <div className="flex items-center gap-4 min-w-0">
        <button 
          onClick={toggleSidebar}
          className="p-1 px-1.5 -ml-1 text-slate-400 hover:text-white rounded-md lg:hidden transition-colors"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="flex items-center gap-2 min-w-0">
          {activeTab === 'chat' && activeChannel && (
            <>
              <Hash size={20} className="text-slate-500 shrink-0" />
              <h2 className="font-bold text-sm text-slate-100 truncate">{activeChannel}</h2>
              {channelInfo?.isAssignment && (
                <Badge variant="warning" size="sm" className="hidden sm:inline-flex">Assignment</Badge>
              )}
              <div className="hidden md:block h-4 w-px bg-slate-700 mx-2" />
              <p className="hidden md:block text-xs text-slate-400 truncate max-w-sm">
                {channelInfo?.description || 'Collaborate with your peers'}
              </p>
            </>
          )}
          {activeTab !== 'chat' && (
            <h2 className="font-bold text-sm text-slate-100 capitalize">{activeTab}</h2>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <div className="hidden sm:flex items-center bg-slate-900 border border-slate-700/50 rounded-lg px-2 py-1 gap-2 w-48 focus-within:w-64 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
          <Search size={14} className="text-slate-500" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none w-full"
          />
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {activeTab === 'chat' && (
            <>
              <button className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                <Phone size={18} />
              </button>
              <button className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                <Video size={18} />
              </button>
            </>
          )}
          <button className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
            <Bell size={18} />
          </button>
          <button className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
            <LayoutGrid size={18} />
          </button>
          <button className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
            <MoreVertical size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
