import React, { useState } from 'react';
import { 
  Megaphone, 
  Tag as TagIcon, 
  Pin, 
  Send,
  Layout,
  Type
} from 'lucide-react';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import useAuthStore from '../store/authStore';
import { createAnnouncement } from '../services/firestoreService';

export default function PostAnnouncementModal({ isOpen, onClose }) {
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tag, setTag] = useState('Notice');
  const [division, setDivision] = useState('All');
  const [isPinned, setIsPinned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const tags = ['Academic', 'Course', 'Syllabus', 'Examination', 'Urgent'];
  const divisions = ['All', 'Division A', 'Division B', 'Faculty Only'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || isLoading) return;

    setIsLoading(true);
    try {
      await createAnnouncement({
        title: title.trim(),
        body: body.trim(),
        tag,
        division,
        isPinned,
        author: user.name,
        authorId: user.uid
      });
      setTitle('');
      setBody('');
      onClose();
    } catch (error) {
      console.error('Error posting announcement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Post Official Notice" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <header className="mb-4">
          <p className="text-xs text-slate-500">This notice will be visible to all students in the selected division. Use clear, concise language.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Title & Body */}
          <div className="space-y-4 md:col-span-1">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Subject Title</label>
              <div className="relative group">
                <Type size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400" />
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Schedule for Mid-Term Exams"
                  className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm mb-1"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Full Details</label>
              <textarea 
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Provide all necessary information here..."
                className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm resize-none"
                rows={10}
                required
              />
            </div>
          </div>

          {/* Right Column: Meta Info */}
          <div className="space-y-6">
             {/* Tag Selection */}
             <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Notice Tag</label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTag(t)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border
                        ${tag === t 
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20 scale-105' 
                          : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
             </div>

             {/* Division Selection */}
             <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Target Audience</label>
                <div className="grid grid-cols-2 gap-2">
                   {divisions.map((d) => (
                     <button
                        key={d}
                        type="button"
                        onClick={() => setDivision(d)}
                        className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all
                          ${division === d 
                            ? 'bg-slate-700 border-slate-600 text-slate-100 ring-2 ring-indigo-500/20' 
                            : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:bg-slate-800'}`}
                     >
                       {d}
                     </button>
                   ))}
                </div>
             </div>

             {/* Pin Toggle */}
             <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
               <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-lg ${isPinned ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-800 text-slate-600'}`}>
                   <Pin size={18} />
                 </div>
                 <div className="leading-none">
                    <p className="text-sm font-bold text-slate-200">Pin to Top</p>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase">Always visible</p>
                 </div>
               </div>
               <button
                  type="button"
                  onClick={() => setIsPinned(!isPinned)}
                  className={`w-11 h-6 rounded-full p-1 transition-all duration-300 ${isPinned ? 'bg-amber-500' : 'bg-slate-700'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${isPinned ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
             </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-700/50">
          <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
          <Button 
            variant="primary" 
            type="submit" 
            loading={isLoading} 
            icon={Send}
            className="px-10"
          >
            Broadcast Notice
          </Button>
        </div>
      </form>
    </Modal>
  );
}
