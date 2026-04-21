import React, { useState, useEffect } from 'react';
import {
  MessageSquare, ArrowUp, Briefcase,
  Filter, Search, PlusCircle, Bookmark, X, Tag,
  AlertCircle, Loader2
} from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import Spinner from '../components/ui/Spinner';
import useNotificationStore from '../store/notificationStore';
import useAuthStore from '../store/authStore';
import {
  onInterviewExperiencesChange,
  voteInterviewExperience,
  postInterviewExperience
} from '../services/firestoreService';

// ── Share Experience Modal ──────────────────────────────
function ShareExperienceModal({ isOpen, onClose, user, onSuccess }) {
  const [form, setForm] = useState({ company: '', role: '', fullText: '', tags: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error } = useNotificationStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.company.trim() || !form.fullText.trim()) return;
    setIsSubmitting(true);
    try {
      await postInterviewExperience({
        company: form.company.trim(),
        role: form.role.trim() || 'Software Engineer',
        fullText: form.fullText.trim(),
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        authorId: user.uid,
        authorName: user.name
      });
      success('Experience Shared!', 'Your interview experience is now live.');
      setForm({ company: '', role: '', fullText: '', tags: '' });
      onSuccess?.();
      onClose();
    } catch (err) {
      error('Failed to post', err.message || 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0d0f1a] border border-white/[0.08] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-fade-in">
        <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400">
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Share Interview Experience</h3>
              <p className="text-[11px] text-slate-500">Help your peers prepare for placements</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors rounded-xl hover:bg-white/[0.05]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Company *</label>
              <input
                type="text"
                value={form.company}
                onChange={e => setForm(p => ({ ...p, company: e.target.value }))}
                placeholder="e.g. Google, Microsoft"
                required
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/40 placeholder-slate-600"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Role / Position</label>
              <input
                type="text"
                value={form.role}
                onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                placeholder="e.g. SWE Intern, Data Analyst"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/40 placeholder-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Interview Experience *</label>
            <textarea
              value={form.fullText}
              onChange={e => setForm(p => ({ ...p, fullText: e.target.value }))}
              placeholder="Describe the interview process, rounds, questions asked, tips for others..."
              rows={6}
              required
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-3 px-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/40 placeholder-slate-600 resize-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">
              <Tag size={10} className="inline mr-1" />Tags (comma separated)
            </label>
            <input
              type="text"
              value={form.tags}
              onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
              placeholder="e.g. DSA, System Design, Networking"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/40 placeholder-slate-600"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" loading={isSubmitting} icon={PlusCircle}>
              Publish Experience
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────
export default function InterviewForumPage() {
  const { user } = useAuthStore();
  const { success } = useNotificationStore();
  const [experiences, setExperiences] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [votingId, setVotingId] = useState(null);

  useEffect(() => {
    const unsub = onInterviewExperiencesChange((data) => {
      setExperiences(data);
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  const handleUpvote = async (exp) => {
    if (votingId === exp.id) return;
    setVotingId(exp.id);
    try {
      await voteInterviewExperience(exp.id, user.uid);
    } finally {
      setVotingId(null);
    }
  };

  const filtered = experiences.filter(e =>
    e.company?.toLowerCase().includes(search.toLowerCase()) ||
    e.role?.toLowerCase().includes(search.toLowerCase()) ||
    e.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="h-full flex flex-col min-w-0">
      {/* Header */}
      <div className="h-16 border-b border-white/[0.05] px-7 flex items-center justify-between bg-black/20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-500">
            <MessageSquare size={18} />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">Interview Experience Forum</h2>
            <p className="text-[11px] text-slate-500">
              {isLoading ? 'Loading...' : `${experiences.length} shared experiences`}
            </p>
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="primary" icon={PlusCircle}>
          Share Experience
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-7">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Search & Filter */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search company, role, or tech stack..."
                className="w-full h-12 bg-white/[0.04] border border-white/[0.08] rounded-2xl pl-12 pr-4 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/40"
              />
            </div>
            <button className="w-12 h-12 bg-white/[0.04] border border-white/[0.08] rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all">
              <Filter size={18} />
            </button>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center border border-dashed border-white/[0.06] rounded-3xl">
              <AlertCircle size={40} className="text-slate-700 mb-3" />
              <p className="text-slate-400 font-semibold">
                {search ? `No results for "${search}"` : 'No experiences shared yet'}
              </p>
              <p className="text-slate-600 text-sm mt-1">
                {search ? 'Try a different search term.' : 'Be the first to share your interview experience!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filtered.map((exp) => {
                const hasVoted = exp.upvotes?.includes(user.uid);
                const isVoting = votingId === exp.id;

                return (
                  <div
                    key={exp.id}
                    className="glass-card rounded-3xl p-6 group hover:border-indigo-500/20 transition-all flex gap-6"
                  >
                    {/* Upvote Column */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleUpvote(exp)}
                        disabled={isVoting}
                        className={`p-2 rounded-xl transition-all active:scale-95 ${
                          hasVoted
                            ? 'bg-indigo-500/20 text-indigo-400'
                            : 'bg-white/[0.03] text-slate-500 hover:bg-indigo-500/10 hover:text-indigo-400'
                        }`}
                      >
                        {isVoting ? <Loader2 size={20} className="animate-spin" /> : <ArrowUp size={20} />}
                      </button>
                      <span className="text-xs font-black text-slate-400">{exp.upvotes?.length || 0}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors uppercase tracking-tight">
                            {exp.company}
                          </h3>
                          <div className="w-1 h-1 bg-slate-700 rounded-full" />
                          <span className="text-sm font-medium text-slate-400">{exp.role}</span>
                        </div>
                        <button
                          onClick={() => success('Saved', 'Experience bookmarked for later viewing')}
                          className="text-slate-600 hover:text-amber-400 transition-colors"
                        >
                          <Bookmark size={18} />
                        </button>
                      </div>

                      <p className="text-sm text-slate-400 leading-relaxed mb-4 line-clamp-3 italic">
                        "{exp.fullText}"
                      </p>

                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-2">
                          <Avatar name={exp.authorName} size="xs" />
                          <span className="text-xs font-bold text-slate-300">{exp.authorName}</span>
                          <span className="text-[10px] text-slate-600">{exp.date || 'Recently'}</span>
                        </div>
                        <div className="flex gap-2 flex-wrap justify-end">
                          {exp.tags?.map(tag => (
                            <span
                              key={tag}
                              onClick={() => setSearch(tag)}
                              className="px-2 py-0.5 bg-white/[0.04] text-slate-500 rounded text-[10px] uppercase font-black tracking-widest cursor-pointer hover:bg-indigo-500/10 hover:text-indigo-400 transition-colors"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer */}
          {!isLoading && filtered.length > 0 && (
            <div className="p-10 text-center glass-card rounded-[2.5rem] border-dashed border-2 border-white/[0.05]">
              <h4 className="text-slate-300 font-bold mb-1">End of Current Archive</h4>
              <p className="text-xs text-slate-600 mb-6">Share your own experience to help fellow students prepare.</p>
              <Button
                onClick={() => setIsModalOpen(true)}
                variant="secondary"
                icon={PlusCircle}
                className="px-8"
              >
                Add Experience
              </Button>
            </div>
          )}
        </div>
      </div>

      <ShareExperienceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={user}
      />
    </div>
  );
}
