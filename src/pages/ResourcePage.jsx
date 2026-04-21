import React, { useState, useEffect } from 'react';
import {
  BookOpen, Search, Plus, FileText, File as FileIcon,
  Download, Eye, MoreVertical, Clock, User, SearchX, Layers, Folder,
  CheckCircle2, Circle, ChevronDown, ChevronUp, Target, ExternalLink, Globe, HardDrive
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { onResourcesChange, incrementDownload, onSyllabusChange, updateTopicStatus, onCourseArchivesChange } from '../services/firestoreService';
import { hasPermission } from '../lib/rbac';
import { formatFileSize, formatTimeAgo } from '../lib/utils';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import UploadResourceModal from '../modals/UploadResourceModal';
import CreateSyllabusModal from '../modals/CreateSyllabusModal';
import CreateCourseArchiveModal from '../modals/CreateCourseArchiveModal';
import Spinner from '../components/ui/Spinner';

const TYPE_CONFIG = {
  All:   { icon: Layers,   color: 'text-slate-400',  bg: 'bg-slate-500/10' },
  Notes: { icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  Paper: { icon: FileIcon, color: 'text-rose-400',    bg: 'bg-rose-500/10' },
  Book:  { icon: BookOpen, color: 'text-sky-400',     bg: 'bg-sky-500/10' },
};

const TYPES = [
  { id: 'All',   label: 'All Files' },
  { id: 'Notes', label: 'Lecture Notes' },
  { id: 'Paper', label: 'Past Papers' },
  { id: 'Book',  label: 'E-Books' },
];

export default function ResourcePage() {
  const { user } = useAuthStore();
  const [activeSegment, setActiveSegment] = useState('Files'); // 'Files', 'Syllabus', 'DMS'
  const [resources, setResources] = useState([]);
  const [syllabus, setSyllabus] = useState([]);
  const [courseArchives, setCourseArchives] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyllabusModalOpen, setIsSyllabusModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [expandedSyllabus, setExpandedSyllabus] = useState({});
  const [activePattern, setActivePattern] = useState('Pattern 2024');

  useEffect(() => {
    const unsubRes = onResourcesChange((data) => { setResources(data); setIsLoading(false); });
    const unsubSyl = onSyllabusChange((data) => { setSyllabus(data); });
    const unsubArc = onCourseArchivesChange((data) => { setCourseArchives(data); });
    return () => { unsubRes(); unsubSyl(); unsubArc(); };
  }, []);

  const filtered = resources.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      (r.title.toLowerCase().includes(q) || r.subject.toLowerCase().includes(q)) &&
      (filterType === 'All' || r.type === filterType)
    );
  });

  const canUpload = hasPermission(user.role, 'UPLOAD_RESOURCES');
  const canUpdateSyllabus = user.role === 'Faculty' || user.roleLevel >= 3;

  const handleDownload = async (res) => {
    if (!res.fileUrl) return;
    window.open(res.fileUrl, '_blank');
    await incrementDownload(res.id);
  };

  const toggleTopic = async (syllabusId, topicId, currentStatus) => {
    if (!canUpdateSyllabus) return;
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    await updateTopicStatus(syllabusId, topicId, nextStatus);
  };

  return (
    <div className="h-full flex flex-col min-w-0">
      {/* Header */}
      <div className="h-16 border-b border-white/[0.05] px-7 flex items-center justify-between bg-black/20 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center text-violet-400">
              <BookOpen size={18} />
            </div>
            <div>
               <h2 className="font-bold text-sm text-white italic">Academic DMS</h2>
            </div>
          </div>

          <div className="flex bg-white/[0.04] p-1 rounded-xl border border-white/[0.05]">
             {['Files', 'Syllabus', 'Course Files'].map(s => (
               <button
                 key={s}
                 onClick={() => setActiveSegment(s)}
                 className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all
                   ${activeSegment === s ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}
               >
                 {s}
               </button>
             ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeSegment === 'Files' && (
            <>
              <div className="relative hidden lg:block group">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search repository…"
                  className="bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 w-72 transition-all"
                />
              </div>
              {canUpload && (
                <Button onClick={() => setIsModalOpen(true)} variant="primary" icon={Plus}>
                  Upload
                </Button>
              )}
            </>
          )}

          {activeSegment === 'Course Files' && (
             <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-1 rounded-xl">
                {['Pattern 2023', 'Pattern 2024', 'Pattern 2025'].map(p => (
                   <button 
                     key={p} 
                     onClick={() => setActivePattern(p)}
                     className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activePattern === p ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                   >
                      {p}
                   </button>
                ))}
             </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-7">
        {activeSegment === 'Files' && (
          <>
            {/* Subject Folders */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mb-10">
              {['DBMS', 'Networking', 'Cloud AI', 'OS', 'DSA', 'Discrete Math'].map(sub => (
                <button 
                  key={sub}
                  onClick={() => setSearchQuery(sub)}
                  className="glass-card p-4 rounded-2xl flex flex-col items-center gap-3 hover:border-indigo-500/30 transition-all hover:-translate-y-1"
                >
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                    <Folder size={24} fill="currentColor" fillOpacity={0.15} />
                  </div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{sub}</span>
                </button>
              ))}
            </div>

            {/* Type Filters */}
            <div className="flex items-center gap-2 mb-7 overflow-x-auto pb-1">
              {TYPES.map((t) => {
                const cfg = TYPE_CONFIG[t.id];
                const Icon = cfg.icon;
                const isActive = filterType === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setFilterType(t.id)}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap
                      ${isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/25'
                        : 'bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-white/[0.07]'
                      }
                    `}
                  >
                    <Icon size={15} />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Grid */}
            {isLoading ? (
              <div className="h-64 flex items-center justify-center"><Spinner size="lg" /></div>
            ) : filtered.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center">
                <SearchX size={48} className="text-slate-700 mb-3" />
                <p className="text-slate-400 font-semibold">No resources found</p>
                <p className="text-slate-600 text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                {filtered.map((res) => {
                  const TypeIcon = TYPE_CONFIG[res.type]?.icon || FileIcon;
                  const typeColor = TYPE_CONFIG[res.type]?.color || 'text-slate-400';
                  const typeBg = TYPE_CONFIG[res.type]?.bg || 'bg-slate-500/10';

                  return (
                    <div
                      key={res.id}
                      className="glass-card rounded-2xl p-5 flex flex-col h-full group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 ${typeBg} rounded-2xl ${typeColor} group-hover:scale-110 transition-transform duration-500`}>
                          <TypeIcon size={22} />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">{res.type}</span>
                          <button className="p-1.5 text-slate-600 hover:text-white transition-colors rounded-lg">
                            <MoreVertical size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-white mb-1 line-clamp-2 leading-snug group-hover:text-indigo-400 transition-colors">
                          {res.title}
                        </h3>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">{res.subject}</p>
                      </div>

                      <div className="mt-4 pt-4 border-t border-white/[0.05] space-y-3">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                          <div className="flex items-center gap-1"><User size={11} /> {res.uploadedByName}</div>
                          <div className="flex items-center gap-1"><Clock size={11} /> {formatTimeAgo(res.createdAt?.toDate())}</div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-500">
                            <span className="text-slate-300 font-semibold">{formatFileSize(res.fileSize)}</span> · {res.downloadCount || 0} dls
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleDownload(res)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/15 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-xl transition-all text-xs font-bold border border-indigo-500/20"
                            >
                              <Download size={14} /> Get
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeSegment === 'Syllabus' && (
          <div className="max-w-4xl mx-auto space-y-6">
              <div className="p-8 glass-card rounded-[2.5rem] bg-indigo-600/5 border-indigo-500/20 flex flex-col md:flex-row items-center justify-between gap-8 mb-10">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="w-20 h-20 bg-indigo-500/20 rounded-3xl flex items-center justify-center text-indigo-400 shrink-0">
                     <Target size={40} />
                  </div>
                  <div>
                     <h3 className="text-2xl font-black text-white mb-2">Curriculum Tracker</h3>
                     <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
                        Real-time visibility into the current academic term. Track completion percentage across core subjects.
                     </p>
                  </div>
                </div>
                {canUpdateSyllabus && (
                  <Button onClick={() => setIsSyllabusModalOpen(true)} variant="primary" icon={Plus}>Add Subject</Button>
                )}
              </div>

              {syllabus.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center border border-dashed border-white/[0.05] rounded-[2.5rem]">
                  <BookOpen size={48} className="text-slate-700 mb-4" />
                  <p className="text-sm font-bold text-slate-300">No syllabus topics tracked yet.</p>
                  <p className="text-xs text-slate-500 mt-1">Faculty can add subjects to begin tracking curriculum progress.</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {syllabus.sort((a, b) => (a.priority || 0) - (b.priority || 0)).map(sub => {
                    const completed = sub.topics.filter(t => t.status === 'completed').length;
                    const total = sub.topics.length || 1;
                  const percent = Math.round((completed / total) * 100);
                  const isExpanded = expandedSyllabus[sub.id];

                  return (
                    <div key={sub.id} className="glass-card rounded-3xl overflow-hidden group">
                       <button 
                         onClick={() => setExpandedSyllabus({...expandedSyllabus, [sub.id]: !isExpanded})}
                         className="w-full text-left p-6 flex flex-col gap-4 hover:bg-white/[0.01] transition-colors"
                       >
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-white/[0.04] flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
                                   <BookOpen size={20} />
                                </div>
                                <h4 className="font-bold text-white">{sub.title}</h4>
                             </div>
                             {isExpanded ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
                          </div>
                          <div className="space-y-2">
                             <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{percent}% Done</p>
                                <p className="text-[10px] font-bold text-indigo-400">{completed}/{total} Units</p>
                             </div>
                             <div className="h-2 w-full bg-white/[0.04] rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-1000 ease-out"
                                  style={{ width: `${percent}%` }}
                                />
                             </div>
                          </div>
                       </button>

                       {isExpanded && (
                         <div className="px-6 pb-6 pt-2 border-t border-white/[0.04] bg-black/10 animate-in fade-in slide-in-from-top-2">
                            <div className="space-y-1">
                               {sub.topics.map(topic => (
                                 <div 
                                   key={topic.id}
                                   className={`flex items-center justify-between p-3 rounded-2xl transition-all
                                     ${topic.status === 'completed' ? 'bg-emerald-500/5 text-emerald-400/80' : 'text-slate-500 hover:bg-white/[0.02]'}`}
                                 >
                                    <div className="flex items-center gap-3">
                                       <button 
                                         disabled={!canUpdateSyllabus}
                                         onClick={() => toggleTopic(sub.id, topic.id, topic.status)}
                                         className={`transition-transform active:scale-95 ${canUpdateSyllabus ? '' : 'cursor-default'}`}
                                       >
                                          {topic.status === 'completed' 
                                            ? <CheckCircle2 size={18} className="text-emerald-500" /> 
                                            : <Circle size={18} className="text-slate-700" />
                                          }
                                       </button>
                                       <span className={`text-xs font-semibold ${topic.status === 'completed' ? 'line-through opacity-50' : ''}`}>
                                          {topic.name}
                                       </span>
                                    </div>
                                    {topic.status === 'completed' && <Badge variant="success" size="xs">UNIT DONE</Badge>}
                                 </div>
                               ))}
                            </div>
                         </div>
                       )}
                    </div>
                  );
                })}
              </div>
              )}
          </div>
        )}

        {activeSegment === 'Course Files' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Search External Digital Library */}
            <div className="glass-card p-6 rounded-3xl border-violet-500/20 bg-violet-500/5 flex items-center justify-between gap-6">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-violet-500/20 rounded-2xl text-violet-400">
                     <Globe size={24} />
                  </div>
                  <div>
                     <h4 className="text-sm font-bold text-white">Digital Library WEB-OPAC</h4>
                     <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">Cross-institutional asset search</p>
                  </div>
               </div>
               <div className="flex-1 max-w-md relative group">
                  <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Search library catalog..."
                    className="w-full bg-black/40 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-xs text-white focus:outline-none focus:border-violet-500/50 transition-all shadow-inner"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-violet-500/10 hover:bg-violet-500/20 rounded-xl text-violet-400 transition-all">
                     <ExternalLink size={12} />
                  </button>
               </div>
            </div>

            <div className="space-y-4">
               <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                     <HardDrive size={16} className="text-slate-500" />
                     <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Institutional File Archive ({activePattern})</h3>
                  </div>
                  {canUpdateSyllabus && (
                     <Button onClick={() => setIsArchiveModalOpen(true)} variant="ghost" size="sm" icon={Plus}>Add Archive</Button>
                  )}
               </div>

               {courseArchives.filter(a => a.pattern === activePattern).length === 0 ? (
                 <div className="py-12 text-center border border-dashed border-white/5 rounded-[2rem]">
                    <HardDrive size={32} className="mx-auto text-slate-600 mb-3 opacity-50" />
                    <p className="text-slate-400 font-bold text-sm">No archives for {activePattern}</p>
                 </div>
               ) : courseArchives.filter(a => a.pattern === activePattern).map((course, idx) => (
                 <div key={idx} className="glass-card rounded-[2rem] overflow-hidden border-white/[0.03]">
                    <div className="p-6 bg-white/[0.01] border-b border-white/[0.03] flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                             <FileText size={18} />
                          </div>
                          <div>
                             <h5 className="text-sm font-bold text-slate-200">{course.title} <span className="text-slate-600 font-medium ml-2">({activePattern})</span></h5>
                             <p className="text-[10px] text-indigo-400 uppercase font-black tracking-widest mt-0.5">Semester {course.sem} Academic Cycle</p>
                          </div>
                       </div>
                       <Button variant="ghost" size="sm" icon={ExternalLink}>View Archive</Button>
                    </div>
                    <div className="p-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                       {course.sections.map(section => (
                         <div key={section} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/[0.03] transition-all group">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-white transition-colors">
                                  <Layers size={14} />
                               </div>
                               <span className="text-xs font-bold text-slate-400 group-hover:text-slate-200">Section-{section}</span>
                            </div>
                            <button className="px-4 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all shadow-sm">
                               Load
                            </button>
                         </div>
                       ))}
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}
      </div>

      <UploadResourceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <CreateSyllabusModal isOpen={isSyllabusModalOpen} onClose={() => setIsSyllabusModalOpen(false)} />
      <CreateCourseArchiveModal isOpen={isArchiveModalOpen} onClose={() => setIsArchiveModalOpen(false)} />
    </div>
  );
}
