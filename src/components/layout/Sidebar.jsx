import React, { useState, useEffect } from 'react';
import {
  MessageSquare, Hash, Users, Bell, BookOpen, CheckSquare,
  HelpCircle, Settings, Plus, Search, Calendar, ClipboardCheck,
  ShieldAlert, Shield, Bookmark, Trophy, Briefcase, Medal, Timer,
  ChevronDown, LogOut, Sparkles, Zap
} from 'lucide-react';

import { onUsersChange } from '../../services/firestoreService';
import { logoutUser } from '../../services/authService';
import CreateChannelModal from '../../modals/CreateChannelModal';

import useUIStore from '../../store/uiStore';
import useChannelStore from '../../store/channelStore';
import useAuthStore from '../../store/authStore';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';

const NAV_SECTIONS = [
  {
    title: 'Communication',
    items: [
      { id: 'chat', label: 'Channels', icon: MessageSquare, color: 'text-indigo-400' },
      { id: 'announcements', label: 'Announcements', icon: Bell, color: 'text-amber-400' },
    ],
  },
  {
    title: 'Academic',
    items: [
      { id: 'timetable', label: 'Timetable', icon: Calendar, color: 'text-sky-400' },
      { id: 'attendance', label: 'Attendance', icon: ClipboardCheck, color: 'text-emerald-400' },
      { id: 'resources', label: 'Resources', icon: BookOpen, color: 'text-violet-400' },
      { id: 'quizzes', label: 'Live Quizzes', icon: Trophy, color: 'text-amber-400' },
    ],
  },
  {
    title: 'Productivity',
    items: [
      { id: 'tasks', label: 'Task Board', icon: CheckSquare, color: 'text-emerald-400' },
      { id: 'qa', label: 'Q&A Board', icon: HelpCircle, color: 'text-indigo-400' },
      { id: 'focus', label: 'Focus Lab', icon: Timer, color: 'text-rose-400' },
      { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark, color: 'text-amber-400' },
    ],
  },
  {
    title: 'Career',
    items: [
      { id: 'placement', label: 'Placement', icon: Briefcase, color: 'text-sky-400' },
      { id: 'leaderboard', label: 'Leaderboard', icon: Medal, color: 'text-amber-400' },
      { id: 'interview-forum', label: 'Interview Forum', icon: MessageSquare, color: 'text-indigo-400' },
      { id: 'resume-analyzer', label: 'Resume Analyzer', icon: Sparkles, color: 'text-violet-400' },
    ],
  },
  {
    title: 'Support',
    items: [
      { id: 'grievances', label: 'Grievances', icon: ShieldAlert, color: 'text-rose-400' },
      { id: 'group-study', label: 'Study Rooms', icon: Users, color: 'text-emerald-400' },
    ],
  },
];

export default function Sidebar() {
  const { isSidebarOpen, activeTab, setActiveTab, setDmTarget } = useUIStore();
  const { channels, activeChannelId, selectChannel } = useChannelStore();
  const { user, setUser, setFirebaseUser } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [realUsers, setRealUsers] = useState([]);
  const [collapsedSections, setCollapsedSections] = useState({});
  const [showDMs, setShowDMs] = useState(true);

  const isAdmin = user?.roleLevel >= 3;

  useEffect(() => {
    const unsub = onUsersChange((data) => {
      setRealUsers(data.filter((u) => u.uid !== user?.uid));
    });
    return () => unsub();
  }, [user]);

  const handleDMClick = (recipient) => {
    setActiveTab('dm');
    setDmTarget(recipient);
  };

  const handleLogout = async () => {
    if (window.confirm('Log out of DYPIU Collab?')) {
      await logoutUser();
      setUser(null);
      setFirebaseUser(null);
    }
  };

  const toggleSection = (title) =>
    setCollapsedSections((prev) => ({ ...prev, [title]: !prev[title] }));

  if (!isSidebarOpen) return null;

  return (
    <aside
      className="
        w-72 h-full flex flex-col shrink-0
        bg-black/40 backdrop-blur-2xl
        border-r border-white/[0.05]
      "
    >
      {/* ─── Brand Header ─── */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-white/[0.05] shrink-0 relative overflow-hidden">
        {/* Subtle glow behind logo */}
        <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-20 h-20 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Sparkles size={18} className="text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-black text-white tracking-tighter leading-none">
            DYPIU <span className="premium-gradient-text">COLLAB</span>
          </h1>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.25em] mt-0.5">
            Intelligence · Unity
          </p>
        </div>

        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-global-search'))}
          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition-all"
        >
          <Search size={14} />
        </button>
      </div>

      {/* ─── Navigation ─── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar py-3 px-2 space-y-0.5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-1">
            <button
              onClick={() => toggleSection(section.title)}
              className="
                w-full flex items-center gap-1.5 px-3 py-1.5
                text-[9px] font-black uppercase tracking-[0.15em]
                text-slate-600 hover:text-slate-400
                transition-colors
              "
            >
              <ChevronDown
                size={9}
                className={`transition-transform duration-200 ${collapsedSections[section.title] ? '-rotate-90' : ''}`}
              />
              {section.title}
            </button>

            {!collapsedSections[section.title] && (
              <div className="space-y-0.5 mt-0.5">
                {section.items.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id); setDmTarget(null); }}
                      className={`
                        relative w-full flex items-center gap-2.5 px-3 py-2 rounded-xl
                        text-[13px] font-medium transition-all duration-200
                        ${isActive
                          ? 'bg-white/8 text-white'
                          : 'text-slate-400 hover:bg-white/4 hover:text-slate-200'
                        }
                      `}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-indigo-400 to-violet-500 rounded-r-full" />
                      )}
                      <item.icon
                        size={16}
                        className={`flex-shrink-0 transition-colors ${isActive ? item.color : 'text-slate-500'}`}
                      />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {/* Admin */}
        {isAdmin && (
          <div className="mt-1 pt-1 border-t border-white/[0.04]">
            <button
              onClick={() => { setActiveTab('admin'); setDmTarget(null); }}
              className={`
                relative w-full flex items-center gap-2.5 px-3 py-2 rounded-xl
                text-[13px] font-medium transition-all duration-200
                ${activeTab === 'admin'
                  ? 'bg-rose-500/10 text-rose-300'
                  : 'text-slate-400 hover:bg-white/4 hover:text-slate-200'
                }
              `}
            >
              {activeTab === 'admin' && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-rose-400 rounded-r-full" />
              )}
              <Shield size={16} className={`shrink-0 ${activeTab === 'admin' ? 'text-rose-400' : 'text-slate-500'}`} />
              <span>Admin Panel</span>
              <Badge variant="danger" size="xs" className="ml-auto text-[9px]">
                L{user?.roleLevel}
              </Badge>
            </button>
          </div>
        )}

        {/* Channel List */}
        {activeTab === 'chat' && (
          <div className="mt-3 pt-3 border-t border-white/[0.04]">
            <div className="flex items-center justify-between px-3 mb-2">
              <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] flex items-center gap-1.5">
                <Hash size={9} /> Text Channels
              </h3>
              <button
                onClick={() => setIsModalOpen(true)}
                className="p-1 rounded-lg text-slate-600 hover:text-white hover:bg-white/8 transition-all"
              >
                <Plus size={12} />
              </button>
            </div>
            <div className="space-y-0.5">
              {channels.map((chan) => (
                <button
                  key={chan.id}
                  onClick={() => selectChannel(chan.id)}
                  className={`
                    w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-[13px] transition-all
                    ${activeChannelId === chan.id
                      ? 'bg-white/6 text-white font-medium'
                      : 'text-slate-500 hover:bg-white/4 hover:text-slate-300'
                    }
                  `}
                >
                  <Hash size={13} className="text-slate-600" />
                  <span className="truncate">{chan.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Direct Messages */}
        <div className="mt-3 pt-3 border-t border-white/[0.04]">
          <button
            onClick={() => setShowDMs(!showDMs)}
            className="w-full flex items-center justify-between px-3 mb-2"
          >
            <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] flex items-center gap-1.5">
              <Users size={9} /> Direct Messages
            </h3>
            <ChevronDown size={9} className={`text-slate-600 transition-transform duration-200 ${showDMs ? '' : '-rotate-90'}`} />
          </button>

          {showDMs && (
            <div className="space-y-0.5">
              {realUsers.slice(0, 8).map((u) => (
                <button
                  key={u.uid}
                  onClick={() => handleDMClick(u)}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-[13px] text-slate-400 hover:bg-white/4 hover:text-slate-200 transition-all"
                >
                  <Avatar name={u.name} size="xs" status={u.status} />
                  <span className="truncate">{u.name}</span>
                  {u.status === 'online' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-auto shrink-0 shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
                  )}
                </button>
              ))}
              {realUsers.length > 8 && (
                <p className="text-[10px] text-slate-600 px-3 py-1">+{realUsers.length - 8} more</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── User Footer ─── */}
      <div className="p-2.5 border-t border-white/[0.05] shrink-0 bg-black/20">
        <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/5 transition-all group cursor-pointer">
          <div onClick={() => { setActiveTab('profile'); setDmTarget(null); }}>
            <Avatar name={user?.name || 'User'} status={user?.status || 'online'} size="sm" />
          </div>
          <div
            className="flex-1 min-w-0"
            onClick={() => { setActiveTab('profile'); setDmTarget(null); }}
          >
            <p className="text-[13px] font-semibold text-slate-200 truncate group-hover:text-white leading-none">
              {user?.name || 'Loading...'}
            </p>
            <p className="text-[10px] text-slate-500 truncate mt-0.5">{user?.role || 'Member'}</p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => { setActiveTab('profile'); setDmTarget(null); }}
              className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition-all"
            >
              <Settings size={14} />
            </button>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>

      <CreateChannelModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </aside>
  );
}
