import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Search, Filter, MessageCircle, Heart, Share2, 
  Clock, User, Bookmark, ChevronRight, BookOpen, Crown, Zap, Plus
} from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import useAuthStore from '../store/authStore';
import { onBlogsChange } from '../services/firestoreService';
import CreateBlogModal from '../modals/CreateBlogModal';
import Spinner from '../components/ui/Spinner';

export default function CampusBlogPage() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState('All');
  const [blogs, setBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const unsub = onBlogsChange((data) => {
      setBlogs(data);
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  const tags = ['All', 'Artificial Intelligence', 'Campus Update', 'Placements', 'Career', 'Programming'];

  const filteredBlogs = blogs.filter(b => {
    const matchesSearch = b.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = activeTag === 'All' || b.tags?.includes(activeTag);
    return matchesSearch && matchesTag;
  });

  const featuredPost = filteredBlogs.find(p => p.featured) || filteredBlogs[0];
  const otherPosts = filteredBlogs.filter(p => p.id !== featuredPost?.id);

  return (
    <div className="h-full flex flex-col min-w-0">
      {/* Header */}
      <div className="h-16 border-b border-white/[0.05] px-7 flex items-center justify-between bg-black/20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400">
            <Sparkles size={18} />
          </div>
          <h2 className="font-bold text-sm text-white italic tracking-tight">Institutional Blogs</h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group hidden md:block">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search insights..."
              className="bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-amber-500/40 w-64 transition-all"
            />
          </div>
          {(user?.roleLevel >= 3 || user?.role === 'Faculty') && (
            <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>New Post</Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-7 space-y-10">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center"><Spinner size="lg" /></div>
        ) : blogs.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center">
            <BookOpen size={48} className="text-slate-700 mb-3" />
            <p className="text-slate-400 font-semibold">No blogs found</p>
            <p className="text-slate-600 text-sm">Be the first to share your insights with the campus!</p>
            {(user?.roleLevel >= 3 || user?.role === 'Faculty') && (
              <Button variant="primary" className="mt-4" icon={Plus} onClick={() => setIsModalOpen(true)}>Create First Post</Button>
            )}
          </div>
        ) : (
          <>
            {/* Featured Hero */}
        {featuredPost && (
          <div className="group relative h-[400px] rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl transition-all duration-700 hover:border-amber-500/30">
            <img 
              src={featuredPost.image} 
              alt={featuredPost.title}
              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-[2s]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
            
            <div className="relative h-full flex flex-col justify-end p-10 max-w-4xl">
              <div className="flex items-center gap-2 mb-4">
                 <Badge variant="warning" size="xs" icon={Crown}>EDITOR'S CHOICE</Badge>
                 <div className="h-4 w-px bg-white/20" />
                 <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{featuredPost.date}</span>
              </div>
              <h1 className="text-4xl font-black text-white mb-4 leading-tight">
                {featuredPost.title}
              </h1>
              <p className="text-slate-300 text-lg mb-8 line-clamp-2 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                {featuredPost.excerpt}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <Avatar name={featuredPost.author} size="md" />
                   <div>
                      <p className="text-sm font-bold text-white">{featuredPost.author}</p>
                      <p className="text-[10px] text-amber-400 font-black uppercase tracking-widest leading-none mt-1">{featuredPost.role}</p>
                   </div>
                </div>
                <Button variant="primary" icon={ChevronRight}>Read Analysis</Button>
              </div>
            </div>
          </div>
        )}

        {/* Tags Filter */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
           <div className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-400">
              <Filter size={14} />
           </div>
           {tags.map(t => (
             <button
               key={t}
               onClick={() => setActiveTag(t)}
               className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap
                 ${activeTag === t ? 'bg-white text-slate-950 shadow-xl' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
             >
               {t}
             </button>
           ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
           {otherPosts.map(post => (
             <div key={post.id} className="glass-card rounded-[2rem] overflow-hidden flex flex-col md:flex-row group hover:border-amber-500/20 transition-all duration-500">
                <div className="md:w-1/3 relative h-48 md:h-auto overflow-hidden">
                   <img 
                     src={post.image} 
                     className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1s]" 
                   />
                   <div className="absolute inset-0 bg-slate-950/20" />
                </div>
                <div className="flex-1 p-6 flex flex-col justify-between">
                   <div>
                      <div className="flex items-center justify-between mb-4">
                         <Badge variant="ghost" size="xs" className="text-amber-500">{post.tags[0]}</Badge>
                         <span className="text-[10px] text-slate-600 font-bold">{post.readTime}</span>
                      </div>
                      <h3 className="text-lg font-black text-white mb-2 leading-tight group-hover:text-amber-400 transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-6">
                        {post.excerpt}
                      </p>
                   </div>
                   
                   <div className="flex items-center justify-between pt-4 border-t border-white/[0.03]">
                      <div className="flex items-center gap-2">
                         <Avatar name={post.author} size="xs" />
                         <div>
                            <p className="text-[11px] font-bold text-slate-300">{post.author}</p>
                            <p className="text-[8px] text-slate-600 font-black uppercase">{post.role}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-1">
                         <button className="p-2 text-slate-600 hover:text-rose-400 transition-all"><Heart size={14} /></button>
                         <button className="p-2 text-slate-600 hover:text-blue-400 transition-all"><Share2 size={14} /></button>
                      </div>
                   </div>
                </div>
             </div>
           ))}
        </div>

        {/* Contribute CTA */}
        <div className="p-10 glass-card rounded-[2.5rem] bg-indigo-600/5 border-indigo-500/20 flex flex-col md:flex-row items-center justify-between gap-8 mt-10">
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-indigo-500/20 rounded-3xl flex items-center justify-center text-indigo-400">
                 <Zap size={32} />
              </div>
              <div>
                 <h3 className="text-xl font-black text-white">Share Your Research</h3>
                 <p className="text-slate-400 text-sm max-w-sm">Every Faculty, Researcher and Lead Student is encouraged to use this space for official knowledge synthesis.</p>
              </div>
           </div>
           <Button variant="primary" icon={Sparkles} onClick={() => setIsModalOpen(true)}>Become a Contributor</Button>
        </div>
          </>
        )}
      </div>
      <CreateBlogModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
