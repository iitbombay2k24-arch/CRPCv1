import React, { useState, useEffect } from 'react';
import {
  MessageSquare, Hash, Users, Bell, BookOpen, CheckSquare,
  HelpCircle, Settings, Plus, Search, Calendar, ClipboardCheck,
  ShieldAlert, Shield, Bookmark, Trophy, Briefcase, Medal, Timer,
  ChevronDown, LogOut, Sparkles, Zap, Home, User
} from 'lucide-react';

import { onUsersChange, onActiveDMs, searchUsers, onFriendsChange, addFriend, removeFriend } from '../../services/firestoreService';
import { logoutUser } from '../../services/authService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { UserPlus, UserMinus, UserCheck } from 'lucide-react';
import CreateChannelModal from '../../modals/CreateChannelModal';

import useUIStore from '../../store/uiStore';
import useChannelStore from '../../store/channelStore';
import useAuthStore from '../../store/authStore';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';

const NAV_SECTIONS = {
  communication: {
    title: 'Communication',
    icon: MessageSquare,
    items: [
      { id: 'announcements', label: 'Announcements', icon: Bell, color: 'text-amber-400' },
    ],
  },
  academic: {
    title: 'Academic',
    icon: BookOpen,
    items: [
      { id: 'timetable', label: 'Timetable', icon: Calendar, color: 'text-sky-400' },
      { id: 'attendance', label: 'Attendance', icon: ClipboardCheck, color: 'text-emerald-400' },
      { id: 'resources', label: 'Resources', icon: BookOpen, color: 'text-violet-400' },
      { id: 'quizzes', label: 'Assessments', icon: CheckSquare, color: 'text-emerald-400' },
      { id: 'live-quizzes', label: 'Live Quizzes', icon: Trophy, color: 'text-amber-400' },
    ],
  },
  productivity: {
    title: 'Productivity',
    icon: CheckSquare,
    items: [
      { id: 'tasks', label: 'Task Board', icon: CheckSquare, color: 'text-emerald-400' },
      { id: 'qa', label: 'Q&A Board', icon: HelpCircle, color: 'text-indigo-400' },
      { id: 'focus', label: 'Focus Lab', icon: Timer, color: 'text-rose-400' },
      { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark, color: 'text-amber-400' },
      { id: 'calendar', label: 'Personal Calendar', icon: Calendar, color: 'text-indigo-400' },
    ],
  },
  career: {
    title: 'Career',
    icon: Briefcase,
    items: [
      { id: 'placement', label: 'Placement', icon: Briefcase, color: 'text-sky-400' },
      { id: 'leaderboard', label: 'Leaderboard', icon: Medal, color: 'text-amber-400' },
      { id: 'interview-forum', label: 'Interview Forum', icon: MessageSquare, color: 'text-indigo-400' },
      { id: 'resume-analyzer', label: 'Resume Analyzer', icon: Sparkles, color: 'text-violet-400' },
    ],
  },
  support: {
    title: 'Support',
    icon: ShieldAlert,
    items: [
      { id: 'grievances', label: 'Grievances', icon: ShieldAlert, color: 'text-rose-400' },
      { id: 'group-study', label: 'Study Rooms', icon: Users, color: 'text-emerald-400' },
    ],
  },
  settings: {
    title: 'Settings',
    icon: Settings,
    items: [
      { id: 'security', label: 'Security & Privacy', icon: Shield, color: 'text-indigo-400' },
      { id: 'profile', label: 'My Profile', icon: User, color: 'text-emerald-400' },
    ],
  },
};

export default function Sidebar() {
  const { isSidebarOpen, activeTab, setActiveTab, setDmTarget } = useUIStore();
  const { channels, activeChannelId, selectChannel } = useChannelStore();
  const { user, setUser, setFirebaseUser } = useAuthStore();
  
  const [activeRail, setActiveRail] = useState('communication');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // DM State
  const [activeDMs, setActiveDMs] = useState([]);
  const [dmSearchTerm, setDmSearchTerm] = useState('');
  const [dmSearchResults, setDmSearchResults] = useState([]);
  const [isSearchingDMs, setIsSearchingDMs] = useState(false);
  const [showDMs, setShowDMs] = useState(true);

  // Friends State
  const [friends, setFriends] = useState([]);
  const [showFriends, setShowFriends] = useState(true);

  const isAdmin = user?.roleLevel >= 3;
  const isSuperAdmin = user?.roleLevel >= 4;

  // Listen for Friends
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onFriendsChange(user.uid, setFriends);
    return () => unsub();
  }, [user?.uid]);

  // Listen for Active DMs
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onActiveDMs(user.uid, async (dms) => {
      const resolvedDMs = await Promise.all(
        dms.map(async (dm) => {
          const recipientId = dm.participants.find(p => p !== user.uid);
          if (!recipientId) return null;
          const userDoc = await getDoc(doc(db, 'users', recipientId));
          return userDoc.exists() ? { ...userDoc.data(), uid: recipientId, dmId: dm.id } : null;
        })
      );
      setActiveDMs(resolvedDMs.filter(Boolean));
    });
    return () => unsub();
  }, [user?.uid]);

  // Handle DM Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (dmSearchTerm.length >= 2) {
        setIsSearchingDMs(true);
        const results = await searchUsers(dmSearchTerm);
        setDmSearchResults(results.filter(u => u.uid !== user?.uid));
        setIsSearchingDMs(false);
      } else {
        setDmSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [dmSearchTerm, user?.uid]);

  const handleDMClick = (recipient) => {
    setActiveTab('dm');
    setDmTarget(recipient);
    setDmSearchTerm('');
    setDmSearchResults([]);
  };

  const handleLogout = async () => {
    if (window.confirm('Log out of DYPIU Collab?')) {
      await logoutUser();
      setUser(null);
      setFirebaseUser(null);
    }
  };

  if (!isSidebarOpen) return null;

  const currentSection = NAV_SECTIONS[activeRail];

  return (
    <aside className="h-full flex shrink-0 w-80">
      {/* ─── Primary Rail (w-16) ─── */}
      <div className="w-16 h-full bg-black/60 backdrop-blur-3xl border-r border-white/[0.05] flex flex-col items-center py-4 space-y-4 relative z-10">
        
        {/* App Logo / Home */}
        <button
          onClick={() => { setActiveTab('dashboard'); setDmTarget(null); }}
          className={`relative w-10 h-10 rounded-2xl flex items-center justify-center transition-all group ${activeTab === 'dashboard' ? 'bg-indigo-500 shadow-lg shadow-indigo-500/40 text-white' : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'}`}
        >
          <Sparkles size={18} />
          {/* Tooltip */}
          <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-black/90 text-white text-[10px] font-bold tracking-wider uppercase rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
            Dashboard
          </div>
        </button>

        <div className="w-8 h-px bg-white/10" />

        {/* Rail Categories */}
        <div className="flex-1 w-full flex flex-col items-center gap-3">
          {Object.entries(NAV_SECTIONS).map(([key, section]) => {
            const isRailActive = activeRail === key;
            return (
              <button
                key={key}
                onClick={() => setActiveRail(key)}
                className="relative w-10 h-10 rounded-2xl flex items-center justify-center transition-all group"
              >
                {/* Active Indicator Notch */}
                {isRailActive && (
                  <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-white rounded-r-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                )}
                
                <div className={`w-full h-full rounded-2xl flex items-center justify-center transition-all ${isRailActive ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-transparent text-slate-500 hover:bg-white/10 hover:text-slate-300'}`}>
                  <section.icon size={20} />
                </div>

                {/* Tooltip */}
                <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-black/90 text-white text-[10px] font-bold tracking-wider uppercase rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {section.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* User Profile / Settings at Bottom */}
        <div className="w-full flex flex-col items-center gap-3 mt-auto">
          {isSuperAdmin && (
             <button
                onClick={() => { setActiveTab('admin'); setDmTarget(null); }}
                className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all group ${activeTab === 'admin' ? 'bg-rose-500 shadow-lg shadow-rose-500/40 text-white' : 'bg-white/5 hover:bg-rose-500/20 text-rose-400'}`}
             >
                <Shield size={18} />
                {/* Tooltip */}
                <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-black/90 text-rose-400 text-[10px] font-bold tracking-wider uppercase rounded-lg border border-rose-500/20 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  Admin Center
                </div>
             </button>
          )}
          <button 
            onClick={() => { setActiveTab('profile'); setDmTarget(null); }}
            className="relative w-10 h-10 rounded-full overflow-visible border-2 border-transparent hover:border-indigo-400 transition-all cursor-pointer group"
          >
            <Avatar name={user?.name || 'User'} size="sm" className="w-full h-full rounded-full overflow-hidden" />
            {user?.status === 'online' && (
               <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full" />
            )}
            {/* Tooltip */}
            <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-black/90 text-white text-[10px] font-bold tracking-wider uppercase rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
              Your Profile
            </div>
          </button>
        </div>
      </div>

      {/* ─── Secondary Rail (w-64) ─── */}
      <div className="flex-1 w-64 h-full bg-black/40 backdrop-blur-2xl border-r border-white/[0.05] flex flex-col relative">
        
        {/* Header */}
        <div className="h-16 px-5 border-b border-white/[0.05] flex items-center justify-between shrink-0">
          <h2 className="font-black text-white text-sm tracking-tight">{currentSection.title}</h2>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-global-search'))}
              className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition-all"
            >
              <Search size={14} />
            </button>
            <button
              onClick={() => window.alert('Universal Compose Modal Opened!')}
              className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 hover:scale-110 active:scale-95 transition-all"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Dynamic Context Menu */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-3 px-2 space-y-0.5">
          
          {/* General Items for the active Rail */}
          {currentSection.items.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setDmTarget(null); }}
                className={`
                  relative w-[calc(100%-16px)] mx-auto flex items-center gap-2.5 px-3 py-2 rounded-2xl
                  text-[13px] font-medium transition-all duration-200 group/nav
                  ${isActive
                    ? 'bg-indigo-500/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] border border-indigo-500/20'
                    : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200 border border-transparent'
                  }
                `}
              >
                {isActive && (
                  <div className="absolute -left-[1px] top-1/2 -translate-y-1/2 w-1.5 h-6 bg-gradient-to-b from-indigo-400 to-violet-500 rounded-r-full shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                )}
                <item.icon
                  size={16}
                  className={`flex-shrink-0 transition-colors ${isActive ? item.color : 'text-slate-500 group-hover/nav:text-slate-300'}`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}

          {/* If Communication Rail is active, also show Channels & DMs */}
          {activeRail === 'communication' && (
            <>
              {/* Channels */}
              <div className="mt-4 pt-4 border-t border-white/[0.04]">
                <div className="flex items-center justify-between px-3 mb-2">
                  <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] flex items-center gap-1.5">
                    <Hash size={9} /> Text Channels
                  </h3>
                  {isAdmin && (
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="p-1 rounded-lg text-slate-600 hover:text-white hover:bg-white/8 transition-all"
                    >
                      <Plus size={12} />
                    </button>
                  )}
                </div>
                <div className="space-y-0.5">
                  {channels.map((chan) => (
                    <button
                      key={chan.id}
                      onClick={() => { selectChannel(chan.id); setActiveTab('chat'); setDmTarget(null); }}
                      className={`
                        relative w-[calc(100%-16px)] mx-auto flex items-center gap-2.5 px-3 py-1.5 rounded-2xl text-[13px] transition-all duration-200 group/nav
                        ${activeChannelId === chan.id && activeTab === 'chat'
                          ? 'bg-indigo-500/10 text-white font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] border border-indigo-500/20'
                          : 'text-slate-500 hover:bg-white/[0.04] hover:text-slate-300 border border-transparent'
                        }
                      `}
                    >
                      {activeChannelId === chan.id && activeTab === 'chat' && (
                        <div className="absolute -left-[1px] top-1/2 -translate-y-1/2 w-1.5 h-6 bg-gradient-to-b from-indigo-400 to-violet-500 rounded-r-full shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                      )}
                      <Hash size={13} className={`flex-shrink-0 transition-colors ${activeChannelId === chan.id && activeTab === 'chat' ? 'text-indigo-400' : 'text-slate-600 group-hover/nav:text-slate-400'}`} />
                      <span className="truncate">{chan.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* DMs */}
              <div className="mt-4 pt-4 border-t border-white/[0.04]">
                <div className="px-3 mb-3">
                  <button
                    onClick={() => setShowDMs(!showDMs)}
                    className="w-full flex items-center justify-between mb-2"
                  >
                    <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] flex items-center gap-1.5">
                      <Users size={9} /> Direct Messages
                    </h3>
                    <ChevronDown size={9} className={`text-slate-600 transition-transform duration-200 ${showDMs ? '' : '-rotate-90'}`} />
                  </button>

                  {showDMs && (
                    <div className="relative group">
                      <Search size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                      <input
                        type="text"
                        value={dmSearchTerm}
                        onChange={(e) => setDmSearchTerm(e.target.value)}
                        placeholder="Find a user..."
                        className="w-full bg-white/4 border border-white/5 rounded-lg py-1.5 pl-8 pr-3 text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500/30 transition-all placeholder:text-slate-700"
                      />
                    </div>
                  )}
                </div>

                {showDMs && (
                  <div className="space-y-0.5 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {dmSearchTerm.length >= 2 && (
                      <div className="px-2 mb-2">
                        <p className="px-2 text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Search Results</p>
                        {isSearchingDMs ? (
                          <p className="px-2 text-[10px] text-slate-600 italic">Searching...</p>
                        ) : dmSearchResults.length > 0 ? (
                          dmSearchResults.map((u) => {
                            const isFriend = friends.some(f => f.uid === u.uid);
                            return (
                              <div key={u.uid} className="w-[calc(100%-16px)] mx-auto flex items-center justify-between px-3 py-1.5 rounded-2xl text-[13px] text-slate-300 hover:bg-indigo-500/10 hover:text-white transition-all border border-transparent hover:border-indigo-500/20 group/search">
                                <button
                                  onClick={() => handleDMClick(u)}
                                  className="flex-1 flex items-center gap-2.5 min-w-0"
                                >
                                  <Avatar name={u.name} size="xs" status={u.status} />
                                  <span className="truncate">{u.name}</span>
                                </button>
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (isFriend) {
                                      await removeFriend(user.uid, u.uid);
                                    } else {
                                      await addFriend(user.uid, u.uid);
                                    }
                                  }}
                                  className={`shrink-0 p-1.5 rounded-xl transition-all ${isFriend ? 'text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300' : 'text-slate-500 hover:bg-indigo-500/20 hover:text-indigo-300'}`}
                                  title={isFriend ? 'Remove Friend' : 'Add Friend'}
                                >
                                  {isFriend ? <UserCheck size={14} /> : <UserPlus size={14} />}
                                </button>
                              </div>
                            );
                          })
                        ) : (
                          <p className="px-2 text-[10px] text-slate-600 italic">No users found</p>
                        )}
                        <div className="h-px bg-white/5 my-2 mx-2" />
                      </div>
                    )}

                    {activeDMs.length > 0 ? (
                      activeDMs.map((u) => (
                        <button
                          key={u.uid}
                          onClick={() => handleDMClick(u)}
                          className="w-[calc(100%-16px)] mx-auto flex items-center gap-2.5 px-3 py-1.5 rounded-2xl text-[13px] text-slate-400 hover:bg-white/[0.04] hover:text-slate-200 transition-all border border-transparent hover:border-white/5 group/dm"
                        >
                          <div className="relative">
                            <Avatar name={u.name} size="xs" />
                            {u.status === 'online' && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-[1.5px] border-[#1a1c23] shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse" />
                            )}
                          </div>
                          <span className="truncate group-hover/dm:text-white transition-colors">{u.name}</span>
                        </button>
                      ))
                    ) : dmSearchTerm.length < 2 && (
                      <p className="px-5 text-[10px] text-slate-600 italic py-2">No active conversations</p>
                    )}
                  </div>
                )}
              </div>

              {/* Friends List */}
              <div className="mt-4 pt-4 border-t border-white/[0.04] mb-4">
                <div className="px-3 mb-3">
                  <button
                    onClick={() => setShowFriends(!showFriends)}
                    className="w-full flex items-center justify-between mb-2"
                  >
                    <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] flex items-center gap-1.5">
                      <UserCheck size={9} /> Friends List
                    </h3>
                    <ChevronDown size={9} className={`text-slate-600 transition-transform duration-200 ${showFriends ? '' : '-rotate-90'}`} />
                  </button>
                </div>

                {showFriends && (
                  <div className="space-y-0.5 max-h-[200px] overflow-y-auto custom-scrollbar">
                    {friends.length > 0 ? (
                      friends.map((f) => (
                        <div
                          key={f.uid}
                          className="w-[calc(100%-16px)] mx-auto flex items-center justify-between px-3 py-1.5 rounded-2xl text-[13px] text-slate-400 hover:bg-white/[0.04] hover:text-slate-200 transition-all border border-transparent hover:border-white/5 group/dm"
                        >
                          <button
                            onClick={() => handleDMClick(f)}
                            className="flex-1 flex items-center gap-2.5 min-w-0"
                          >
                            <div className="relative shrink-0">
                              <Avatar name={f.name} size="xs" />
                              {f.status === 'online' && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-[1.5px] border-[#1a1c23] shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse" />
                              )}
                            </div>
                            <span className="truncate group-hover/dm:text-white transition-colors">{f.name}</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); removeFriend(user.uid, f.uid); }}
                            className="opacity-0 group-hover/dm:opacity-100 p-1 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/20 transition-all"
                            title="Remove Friend"
                          >
                            <UserMinus size={12} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="px-5 text-[10px] text-slate-600 italic py-2">No friends added yet. Use the search above to find peers!</p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

        </div>

        {/* Quick Footer Action (Logout) inside Secondary Rail */}
        <div className="p-3 border-t border-white/[0.05] shrink-0 bg-black/20 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <Avatar name={user?.name || 'User'} size="sm" />
              <div className="min-w-0">
                 <p className="text-[11px] font-bold text-white truncate leading-tight">{user?.name || 'Loading...'}</p>
                 <p className="text-[9px] text-slate-500 font-medium truncate">Logged in</p>
              </div>
           </div>
           <button
             onClick={handleLogout}
             className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
             title="Log Out"
           >
             <LogOut size={14} />
           </button>
        </div>
      </div>

      <CreateChannelModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </aside>
  );
}
