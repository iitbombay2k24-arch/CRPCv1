import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Type, 
  Lock, 
  Send,
  Flag,
  Globe
} from 'lucide-react';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import useAuthStore from '../store/authStore';
import { createGrievance } from '../services/firestoreService';

export default function SubmitGrievanceModal({ isOpen, onClose }) {
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [division, setDivision] = useState(user.division || 'Division A');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const priorities = ['Low', 'Medium', 'High'];
  const divisions = ['Division A', 'Division B', 'All'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || isLoading) return;

    setIsLoading(true);
    try {
      await createGrievance({
        title: title.trim(),
        description: description.trim(),
        authorId: user.uid,
        authorName: user.name,
        division,
        priority,
        isAnonymous
      });
      setTitle('');
      setDescription('');
      onClose();
    } catch (error) {
      console.error('Error submitting grievance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report Official Grievance" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <header className="mb-4">
          <p className="text-xs text-slate-500">Your concerns are important. Report any issues securely. Anonymous reports are taken just as seriously as verified ones.</p>
        </header>

        <div className="space-y-4">
           {/* Anonymous Toggle */}
           <div 
             onClick={() => setIsAnonymous(!isAnonymous)}
             className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between
               ${isAnonymous ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-900 border-slate-700/50 hover:bg-slate-800'}`}
           >
              <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-xl ${isAnonymous ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-600'}`}>
                    <Lock size={18} />
                 </div>
                 <div>
                    <p className={`text-sm font-bold ${isAnonymous ? 'text-amber-500' : 'text-slate-200'}`}>Anonymous Submission</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Your identity will be hidden from staff</p>
                 </div>
              </div>
              <div className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${isAnonymous ? 'bg-amber-500' : 'bg-slate-700'}`}>
                 <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${isAnonymous ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
           </div>

           {/* Title */}
           <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Issue Subject</label>
              <div className="relative group">
                <Type size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400" />
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Broken projector in Room 402"
                  className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm mb-1"
                  required
                />
              </div>
           </div>

           {/* Description */}
           <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Detail Description</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide as much detail as possible to help the management resolve this quickly..."
                className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm resize-none"
                rows={5}
                required
              />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Priority */}
              <div>
                 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Priority Level</label>
                 <div className="flex gap-2">
                    {priorities.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all
                          ${priority === p 
                            ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/20' 
                            : 'bg-slate-900 border-slate-800 text-slate-600 hover:border-slate-700 hover:text-slate-300'}`}
                      >
                        {p}
                      </button>
                    ))}
                 </div>
              </div>

              {/* Division */}
              <div>
                 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Relevant Division</label>
                 <select 
                   value={division}
                   onChange={(e) => setDivision(e.target.value)}
                   className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-2 px-4 text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all text-sm appearance-none"
                 >
                   {divisions.map(d => <option key={d} value={d}>{d}</option>)}
                 </select>
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
            File Ticket
          </Button>
        </div>
      </form>
    </Modal>
  );
}
