import React, { useState, useEffect } from 'react';
import {
  Menu, X, Bell, Search, MoreVertical, Hash,
  Video, Phone, LayoutGrid
} from 'lucide-react';
import useUIStore from '../../store/uiStore';
import useChannelStore from '../../store/channelStore';
import useAuthStore from '../../store/authStore';
import useNotificationStore from '../../store/notificationStore';
import Badge from '../ui/Badge';
import NotificationPanel from './NotificationPanel';
import { onNotificationsChange } from '../../services/firestoreService';

const PAGE_TITLES = {
  chat: 'Channels',
  announcements: 'Announcements',
  timetable: 'Class Timetable',
  attendance: 'Attendance',
  resources: 'Resources',
  tasks: 'Task Board',
  qa: 'Q&A Board',
  focus: 'Focus Lab',
  bookmarks: 'Bookmarks',
  placement: 'Placement Central',
  leaderboard: 'Leaderboard',
  grievances: 'Grievances',
  admin: 'Command Center',
  dm: 'Direct Message',
  profile: 'My Profile',
  quizzes: 'Live Quizzes',
};

export default function TopBar() {
  const { toggleSidebar, isSidebarOpen, activeTab } = useUIStore();
  const { activeChannel, channelsData } = useChannelStore();
  const { user } = useAuthStore();
  const { info } = useNotificationStore();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const channelInfo = activeChannel ? channelsData?.[activeChannel] : null;

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onNotificationsChange(user.uid, (notifs) => {
      setUnreadCount(notifs.filter((n) => !n.isRead).length);
    });
    return () => unsub();
  }, [user?.uid]);

  const pageTitle = activeTab === 'chat' && activeChannel
    ? `# ${activeChannel}`
    : PAGE_TITLES[activeTab] || activeTab;

  return (
    <header className="
      h-14 bg-black/30 backdrop-blur-xl
      border-b border-white/[0.05]
      flex items-center justify-between px-5
      z-40 relative shrink-0
    ">
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={toggleSidebar}
          className="p-1.5 -ml-1 text-slate-400 hover:text-white rounded-lg lg:hidden transition-colors"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="flex items-center gap-2.5 min-w-0">
          <h2 className="font-bold text-sm text-white truncate">{pageTitle}</h2>
          {activeTab === 'chat' && activeChannel && (
            <>
              {channelInfo?.isAssignment && (
                <Badge variant="warning" size="xs">Assignment</Badge>
              )}
              {channelInfo?.description && (
                <>
                  <div className="hidden md:block h-3.5 w-px bg-white/10" />
                  <p className="hidden md:block text-xs text-slate-500 truncate max-w-xs">
                    {channelInfo.description}
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Global Search */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-global-search'))}
          className="
            hidden sm:flex items-center gap-2 bg-white/[0.04] border border-white/[0.08]
            rounded-xl px-3 py-1.5 w-44 hover:w-56 hover:bg-white/[0.06]
            ring-1 ring-transparent hover:ring-indigo-500/20
            transition-all duration-300 cursor-pointer
          "
        >
          <Search size={13} className="text-slate-500 shrink-0" />
          <span className="text-[12px] text-slate-500 truncate">Search (Ctrl+K)…</span>
        </button>

        {/* Center: Next Class Bar */}
        <div className="hidden xl:flex items-center gap-4 bg-white/[0.03] border border-white/[0.05] rounded-2xl px-4 py-1.5 hover:bg-white/[0.06] transition-all cursor-crosshair group">
           <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
              <Clock size={16} />
           </div>
           <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5">Up Next</p>
              <p className="text-[11px] font-bold text-slate-200">Cloud Computing <span className="text-slate-500 mx-1">/</span> <span className="text-orange-400">10:45 AM</span></p>
           </div>
        </div>

        <div className="flex items-center gap-1">
          {activeTab === 'chat' && activeChannel && (
            <>
              <button 
                onClick={() => info('Voice Call', 'Voice channels coming soon')}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/8 transition-all"
              >
                <Phone size={17} />
              </button>
              <button 
                onClick={() => info('Video Call', 'Video integration coming soon')}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/8 transition-all"
              >
                <Video size={17} />
              </button>
            </>
          )}

          {/* Notifications Bell */}
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/8 transition-all"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="
                absolute top-1.5 right-1.5 w-2 h-2 
                bg-indigo-500 rounded-full 
                shadow-[0_0_6px_rgba(99,102,241,0.8)]
                border-2 border-[#03040b]
              " />
            )}
          </button>

          <button 
            onClick={() => info('View Options', 'Grid layout feature coming soon')}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/8 transition-all"
          >
            <LayoutGrid size={17} />
          </button>
          <button 
            onClick={() => info('More Settings', 'Advanced context menu coming soon')}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/8 transition-all"
          >
            <MoreVertical size={17} />
          </button>
        </div>
      </div>

      <NotificationPanel
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
      />
    </header>
  );
}
