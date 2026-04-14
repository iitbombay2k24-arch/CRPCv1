import React, { useState, useEffect } from 'react';
import {
  Bookmark, Search, Trash2, Clock, ExternalLink, SearchX, MessageCircle
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { onBookmarksChange, toggleBookmark } from '../services/firestoreService';
import Avatar from '../components/ui/Avatar';
import Spinner from '../components/ui/Spinner';

export default function BookmarksPage() {
  const { user } = useAuthStore();
  const [bookmarks, setBookmarks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsub = onBookmarksChange(user.uid, (data) => { setBookmarks(data); setIsLoading(false); });
    return () => unsub();
  }, [user.uid]);

  const filtered = bookmarks.filter((b) =>
    b.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.senderName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRemove = async (msg) => await toggleBookmark(user.uid, msg);

  return (
    <div className="h-full flex flex-col min-w-0">
      {/* Header */}
      <div className="h-16 border-b border-white/[0.05] px-7 flex items-center justify-between bg-black/20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400">
            <Bookmark size={18} />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">Saved Bookmarks</h2>
            <p className="text-[11px] text-slate-500">{bookmarks.length} saved items</p>
          </div>
        </div>
        <div className="relative group hidden lg:block">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bookmarks…"
            className="bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 w-72 transition-all"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-7">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center">
            <SearchX size={48} className="text-slate-700 mb-3" />
            <p className="text-slate-400 font-semibold">{searchQuery ? 'No results found' : 'No bookmarks yet'}</p>
            <p className="text-slate-600 text-sm mt-1">
              {searchQuery ? 'Try a different search term' : 'Save messages in chat to see them here'}
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {filtered.map((b) => (
              <div
                key={b.bookmarkId}
                className="glass-card rounded-2xl p-5 group flex flex-col gap-4"
              >
                {/* Author row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={b.senderName} size="sm" />
                    <div>
                      <p className="text-sm font-bold text-slate-200">{b.senderName}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wide mt-0.5">
                        <Clock size={11} /> {b.time}
                        <span className="text-slate-700">·</span>
                        <span className="text-indigo-400 flex items-center gap-1">
                          <MessageCircle size={10} />
                          {b.type === 'dm' ? 'DM' : 'Channel'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-slate-500 hover:text-slate-200 rounded-xl hover:bg-white/8 transition-all">
                      <ExternalLink size={14} />
                    </button>
                    <button
                      onClick={() => handleRemove(b)}
                      className="p-2 text-slate-500 hover:text-rose-400 rounded-xl hover:bg-rose-500/10 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Message */}
                <div className="border-l-4 border-indigo-500/40 rounded-r-2xl bg-black/20 px-4 py-3 text-sm text-slate-300 italic whitespace-pre-wrap leading-relaxed">
                  {b.text}
                </div>

                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest text-right">
                  Saved {new Date(b.savedAt?.toDate()).toLocaleString('en-IN', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
