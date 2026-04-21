import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Users, Star, ArrowUp, Briefcase, 
  ChevronRight, Filter, Search, PlusCircle, Bookmark
} from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import useNotificationStore from '../store/notificationStore';
import { onInterviewExperiencesChange, upvoteInterviewExperience } from '../services/firestoreService';
import useAuthStore from '../store/authStore';
import CreateInterviewExperienceModal from '../modals/CreateInterviewExperienceModal';
import Spinner from '../components/ui/Spinner';

export default function InterviewForumPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [experiences, setExperiences] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { success } = useNotificationStore();

  useEffect(() => {
    const unsub = onInterviewExperiencesChange((data) => {
      setExperiences(data);
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  const handleUpvote = async (id) => {
    if (!user) return;
    await upvoteInterviewExperience(id, user.uid);
  };

  const filtered = experiences.filter(e => 
    e.company.toLowerCase().includes(search.toLowerCase()) || 
    e.role.toLowerCase().includes(search.toLowerCase()) ||
    e.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="h-full flex flex-col min-w-0">
      <div className="h-16 border-b border-white/[0.05] px-7 flex items-center justify-between bg-black/20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-500">
            <MessageSquare size={18} />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">Interview Experience Forum</h2>
            <p className="text-[11px] text-slate-500">Learn from seniors who cleared top companies</p>
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="primary" icon={PlusCircle}>Share Experience</Button>
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
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search company, role, or tech stack..."
                className="w-full h-12 bg-white/[0.04] border border-white/[0.08] rounded-2xl pl-12 pr-4 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/40"
              />
            </div>
            <button className="w-12 h-12 bg-white/[0.04] border border-white/[0.08] rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all">
              <Filter size={18} />
            </button>
          </div>

          {/* Cards */}
          {isLoading ? (
            <div className="py-20 flex justify-center"><Spinner size="lg" /></div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filtered.map((exp, i) => (
              <div 
                key={i}
                className="glass-card rounded-3xl p-6 group cursor-pointer hover:border-indigo-500/30 transition-all flex gap-6"
              >
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <button 
                    onClick={() => handleUpvote(exp.id)}
                    className={`p-2 rounded-xl transition-all active:scale-95 border
                      ${exp.upvotedBy?.includes(user?.uid) 
                        ? 'bg-indigo-500 text-white border-indigo-400' 
                        : 'bg-white/[0.03] text-slate-500 border-transparent group-hover:bg-indigo-500/10 group-hover:text-indigo-400'
                      }`}
                  >
                    <ArrowUp size={20} />
                  </button>
                  <span className={`text-xs font-black ${exp.upvotedBy?.includes(user?.uid) ? 'text-indigo-400' : 'text-slate-400'}`}>
                    {exp.upvotes || 0}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors uppercase tracking-tight">{exp.company}</h3>
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

                  <p className="text-sm text-slate-400 leading-relaxed mb-4 line-clamp-2 italic">
                    "{exp.preview}"
                  </p>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                      <Avatar name={exp.author} size="xs" />
                      <span className="text-xs font-bold text-slate-300">{exp.author}</span>
                      <span className="text-[10px] text-slate-600">{exp.date}</span>
                    </div>
                    <div className="flex gap-2">
                      {exp.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-white/[0.04] text-slate-500 rounded text-[10px] uppercase font-black tracking-widest">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}

          {filtered.length === 0 && (
            <div className="py-20 text-center opacity-40">
              <p className="text-sm font-bold">No experiences found for "{search}"</p>
            </div>
          )}

          <div className="p-10 text-center glass-card rounded-[2.5rem] border-dashed border-2 border-white/[0.05]">
            <h4 className="text-slate-300 font-bold mb-1">End of Current Archive</h4>
            <p className="text-xs text-slate-600 mb-6">More experiences are being verified by T&P coordinators.</p>
            <Button onClick={() => document.querySelector('.custom-scrollbar').scrollTo({top: 0, behavior: 'smooth'})} variant="secondary" className="px-8" icon={ArrowUp}>Back to Top</Button>
          </div>
        </div>
      </div>
      
      <CreateInterviewExperienceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
