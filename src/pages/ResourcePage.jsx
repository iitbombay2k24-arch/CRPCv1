import React, { useState, useEffect } from 'react';
import {
  BookOpen, Search, Plus, FileText, File as FileIcon,
  Download, Eye, MoreVertical, Clock, User, SearchX, Layers, Folder
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { onResourcesChange, incrementDownload } from '../services/firestoreService';
import { hasPermission } from '../lib/rbac';
import { formatFileSize, formatTimeAgo } from '../lib/utils';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import UploadResourceModal from '../modals/UploadResourceModal';
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
  const [resources, setResources] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');

  useEffect(() => {
    const unsub = onResourcesChange((data) => { setResources(data); setIsLoading(false); });
    return () => unsub();
  }, []);

  const filtered = resources.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      (r.title.toLowerCase().includes(q) || r.subject.toLowerCase().includes(q)) &&
      (filterType === 'All' || r.type === filterType)
    );
  });

  const canUpload = hasPermission(user.role, 'UPLOAD_RESOURCES');

  const handleDownload = async (res) => {
    window.open(res.fileUrl, '_blank');
    await incrementDownload(res.id);
  };

  return (
    <div className="h-full flex flex-col min-w-0">
      {/* Header */}
      <div className="h-16 border-b border-white/[0.05] px-7 flex items-center justify-between bg-black/20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center text-violet-400">
            <BookOpen size={18} />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">Academic Resources</h2>
            <p className="text-[11px] text-slate-500">Centralized repository for all course materials</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden lg:block group">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resources…"
              className="bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 w-72 transition-all"
            />
          </div>
          {canUpload && (
            <Button onClick={() => setIsModalOpen(true)} variant="primary" icon={Plus}>
              Upload
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-7">
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
                  className="glass-card rounded-2xl p-5 flex flex-col h-full"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 ${typeBg} rounded-2xl ${typeColor} group-hover:scale-110 transition-transform`}>
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
                    <h3 className="text-sm font-bold text-white mb-1 line-clamp-2 leading-snug">
                      {res.title}
                    </h3>
                    <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wide">{res.subject}</p>
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
                          onClick={() => window.open(res.fileUrl, '_blank')}
                          className="p-1.5 bg-white/[0.04] text-slate-400 hover:text-white rounded-xl transition-all border border-white/[0.06] hover:border-white/[0.12]"
                        >
                          <Eye size={15} />
                        </button>
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
      </div>

      <UploadResourceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
