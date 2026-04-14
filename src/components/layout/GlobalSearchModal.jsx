import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  User, 
  FileText, 
  MessageSquare,
  ChevronRight,
  Hash
} from 'lucide-react';
import { globalSearch } from '../../services/firestoreService';
import useUIStore from '../../store/uiStore';

import Avatar from '../ui/Avatar';

export default function GlobalSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ users: [], resources: [], messages: [] });
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef(null);
  
  const { setActiveTab } = useUIStore();


  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ users: [], resources: [], messages: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isOpen) onClose(); 
        else window.dispatchEvent(new CustomEvent('open-global-search'));
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    const search = async () => {
      if (!query.trim()) {
        setResults({ users: [], resources: [], messages: [] });
        return;
      }
      setIsSearching(true);
      try {
        const res = await globalSearch(query);
        setResults(res);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  if (!isOpen) return null;

  const { setActiveTab, setDmTarget } = useUIStore();

  const handleSelectResult = (type, data) => {
    if (type === 'resource') {
      setActiveTab('resources');
    } else if (type === 'user') {
      setDmTarget(data);
      setActiveTab('dm');
    }
    onClose();
  };

  const hasResults = results.users.length > 0 || results.resources.length > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 sm:pt-32 px-4 animate-fade-in">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/50 flex flex-col rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
        
        {/* Search Input Box */}
        <div className="flex items-center px-4 border-b border-slate-700/50 bg-slate-800/50">
           <Search size={20} className="text-slate-400" />
           <input
             ref={inputRef}
             type="text"
             value={query}
             onChange={(e) => setQuery(e.target.value)}
             placeholder="Search users, resources, or messages..."
             className="flex-1 bg-transparent border-none py-4 px-4 text-white focus:outline-none focus:ring-0 placeholder-slate-500 text-lg"
           />
           <button onClick={onClose} className="p-1 px-2 bg-slate-800 text-[10px] font-black text-slate-400 rounded cursor-pointer hover:bg-slate-700 hover:text-white transition-colors">
              ESC
           </button>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
           {!query.trim() ? (
             <div className="p-8 text-center text-slate-500">
                <Search size={32} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm font-bold">Start typing to search across the platform</p>
                <p className="text-[10px] mt-1 uppercase tracking-widest">Find peers, faculty, lectures, and chat history.</p>
             </div>
           ) : isSearching ? (
             <div className="p-8 text-center">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-black">Scanning Matrix...</p>
             </div>
           ) : !hasResults ? (
             <div className="p-8 text-center text-slate-500">
                <p className="text-sm font-bold text-slate-300">No results found for "{query}"</p>
                <p className="text-[10px] mt-1 uppercase tracking-widest">Try a different keyword.</p>
             </div>
           ) : (
             <div className="space-y-4 p-2">
                
                {/* Users Section */}
                {results.users.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-2">People</h3>
                    <div className="space-y-1">
                      {results.users.map(u => (
                        <button 
                          key={u.id}
                          onClick={() => handleSelectResult('user', u)}
                          className="w-full text-left flex items-center justify-between p-3 rounded-xl hover:bg-slate-800 transition-colors group"
                        >
                           <div className="flex items-center gap-3">
                              <Avatar name={u.name} size="sm" />
                              <div>
                                 <p className="text-sm font-bold text-slate-200 group-hover:text-white">{u.name}</p>
                                 <p className="text-xs text-slate-500">{u.role} • {u.division || 'No Division'}</p>
                              </div>
                           </div>
                           <ChevronRight size={16} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resources Section */}
                {results.resources.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-2 mt-4">Resources</h3>
                    <div className="space-y-1">
                      {results.resources.map(r => (
                        <button 
                          key={r.id}
                          onClick={() => handleSelectResult('resource', r)}
                          className="w-full text-left flex items-center justify-between p-3 rounded-xl hover:bg-slate-800 transition-colors group"
                        >
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                <FileText size={18} />
                              </div>
                              <div>
                                 <p className="text-sm font-bold text-slate-200 group-hover:text-white line-clamp-1">{r.title}</p>
                                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{r.subject} • {r.type}</p>
                              </div>
                           </div>
                           <ChevronRight size={16} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

             </div>
           )}
        </div>
      </div>
    </div>
  );
}
