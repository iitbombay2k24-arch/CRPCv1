import React, { useState, useEffect } from 'react';
import { Search, X, User, ArrowRight, ShieldCheck, Mail, Hash, Loader2 } from 'lucide-react';
import { searchUsers } from '../services/firestoreService';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';

export default function UserSearchModal({ isOpen, onClose, onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true);
      const data = await searchUsers(query);
      setResults(data);
      setIsLoading(false);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in" 
        onClick={onClose} 
      />
      
      <div className="w-full max-w-xl bg-[#0a0c14] border border-white/[0.08] rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-zoom-in">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
        
        {/* Header */}
        <div className="p-6 pb-0 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Search size={20} className="text-indigo-400" />
              Find Peer or Faculty
            </h2>
            <p className="text-[11px] text-slate-500 uppercase tracking-widest font-bold mt-1">
              Search by PRN, Name, or Institutional Email
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-6">
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-indigo-400 text-slate-500">
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
            </div>
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex: 20240802001 or Sharvani..."
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all"
            />
          </div>

          {/* Results List */}
          <div className="mt-4 max-h-[350px] overflow-y-auto custom-scrollbar space-y-2">
            {results.length > 0 ? (
              results.map((user) => (
                <button
                  key={user.uid}
                  onClick={() => {
                    onSelect(user);
                    onClose();
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-[1.5rem] bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all group"
                >
                  <Avatar name={user.name} size="md" status={user.status} />
                  
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">
                        {user.name}
                      </h3>
                      <Badge variant={user.role === 'Admin' || user.role === 'SuperAdmin' ? 'danger' : 'indigo'} size="xs">
                        {user.role}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[11px] text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Hash size={11} className="text-slate-600" /> {user.prn}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail size={11} className="text-slate-600" /> {user.email}
                      </span>
                      {user.division && (
                        <span className="flex items-center gap-1">
                          <ShieldCheck size={11} className="text-emerald-500" /> Div {user.division}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition-all text-indigo-400">
                    <ArrowRight size={18} />
                  </div>
                </button>
              ))
            ) : query.length >= 2 && !isLoading ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 bg-white/[0.03] border border-white/[0.06] rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                  <User size={24} />
                </div>
                <p className="text-sm text-slate-400 font-medium">No students found matching "{query}"</p>
                <p className="text-xs text-slate-600 mt-1">Try searching by PRN or official university email.</p>
              </div>
            ) : query.length < 2 ? (
              <div className="py-12 text-center text-slate-600">
                <p className="text-xs uppercase tracking-widest font-black opacity-40">Start typing to search users...</p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-black/40 border-t border-white/[0.05] flex items-center justify-between">
           <div className="flex items-center gap-4 text-[10px] text-slate-600 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> PRN</span>
              <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Name</span>
              <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Email</span>
           </div>
           <p className="text-[10px] text-slate-700 italic">Institutional Database Access Only</p>
        </div>
      </div>
    </div>
  );
}
