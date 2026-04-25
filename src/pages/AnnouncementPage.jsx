import React, { useState, useEffect } from 'react';
import {
  Bell, Search, Plus, Megaphone, Pin, Clock, User, MoreHorizontal
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { onAnnouncementsChange, deleteAnnouncement } from '../services/firestoreService';
import { hasPermission } from '../lib/rbac';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import PostAnnouncementModal from '../modals/PostAnnouncementModal';
import Spinner from '../components/ui/Spinner';

export default function AnnouncementPage() {
  const { user } = useAuthStore();
  const [announcements, setAnnouncements] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub = onAnnouncementsChange((data) => { setAnnouncements(data); setIsLoading(false); });
    return () => unsub();
  }, []);

  const canPost = hasPermission(user.role, 'POST_ANNOUNCEMENT');

  const tagVariant = (tag) => {
    if (tag === 'Examination' || tag === 'Urgent') return 'danger';
    if (tag === 'Syllabus' || tag === 'Course') return 'info';
    if (tag === 'Academic') return 'primary';
    return 'neutral';
  };

  return (
    <div className="h-full flex flex-col min-w-0">
      {/* Header */}
      <div className="h-16 border-b border-white/[0.05] px-7 flex items-center justify-between bg-black/20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400">
            <Bell size={18} />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">Official Announcements</h2>
            <p className="text-[11px] text-slate-500">Verified notices from Faculty & Administration</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block group">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <input
              type="text"
              placeholder="Search notices…"
              className="bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 focus:bg-white/[0.06] w-56 transition-all"
            />
          </div>
          {canPost && (
            <Button onClick={() => setIsModalOpen(true)} variant="primary" icon={Plus}>
              Post Notice
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-7">
        {/* Stats Strip */}
        <div className="flex items-center gap-4 mb-8">
          <div className="glass-card px-5 py-3 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
              <Megaphone size={16} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Notices</p>
              <p className="text-xl font-black text-white leading-none">{announcements.length}</p>
            </div>
          </div>
          <div className="glass-card px-5 py-3 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-400">
              <Pin size={16} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pinned</p>
              <p className="text-xl font-black text-white leading-none">{announcements.filter((a) => a.isPinned).length}</p>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="max-w-4xl space-y-4">
          {isLoading ? (
            <div className="h-64 flex items-center justify-center"><Spinner size="lg" /></div>
          ) : announcements.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center border border-dashed border-white/[0.06] rounded-3xl">
              <Bell size={40} className="text-slate-700 mb-3" />
              <p className="text-slate-400 font-semibold">No announcements yet</p>
              <p className="text-slate-600 text-sm">Everything is quiet for now.</p>
            </div>
          ) : (
            announcements.map((ann) => (
              <article
                key={ann.id}
                className={`
                  glass-card rounded-3xl p-6 transition-all group relative overflow-hidden
                  ${ann.isPinned ? 'border-amber-500/20 shadow-amber-500/5' : ''}
                `}
              >
                {/* Pinned top accent */}
                {ann.isPinned && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
                )}

                <div className="flex items-start gap-5">
                  {/* Date badge */}
                  <div className="hidden sm:flex flex-col items-center justify-center w-14 h-14 bg-white/[0.03] rounded-2xl border border-white/[0.06] shrink-0">
                    <span className="text-[9px] font-black text-slate-500 uppercase">
                      {new Date(ann.createdAt?.toDate()).toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    <span className="text-xl font-bold text-slate-200">
                      {new Date(ann.createdAt?.toDate()).getDate()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                      <Badge variant={tagVariant(ann.tag)} size="xs">{ann.tag || 'Notice'}</Badge>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Clock size={11} /> {ann.time}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-indigo-400 font-bold">
                        <User size={11} /> {ann.author}
                      </div>
                      {ann.isPinned && (
                        <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                          <Pin size={10} fill="currentColor" /> Pinned
                        </div>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                      {ann.title}
                    </h3>

                    <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap line-clamp-3 group-hover:line-clamp-none transition-all">
                      {ann.body}
                    </p>

                    <div className="mt-4 flex items-center justify-between border-t border-white/[0.04] pt-3">
                      <button className="text-xs text-slate-500 hover:text-indigo-400 font-semibold transition-colors">
                        Read full details →
                      </button>
                      {canPost && (
                        <button
                          onClick={async () => { if (window.confirm('Archive this notice?')) await deleteAnnouncement(ann.id); }}
                          className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      <PostAnnouncementModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
