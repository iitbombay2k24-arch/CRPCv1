import React, { useState } from 'react';
import { BookOpen, Type, Target, Trash2, PlusCircle, CheckCircle2, Send } from 'lucide-react';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { createSyllabusSubject } from '../services/firestoreService';

export default function CreateSyllabusModal({ isOpen, onClose }) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState(1);
  const [topics, setTopics] = useState([
    { id: 't1', name: '', status: 'pending' }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const addTopic = () => {
    const newId = 't' + (topics.length + 1) + '_' + Math.random().toString(36).substr(2, 5);
    setTopics([...topics, { id: newId, name: '', status: 'pending' }]);
  };

  const removeTopic = (idx) => {
    setTopics(topics.filter((_, i) => i !== idx));
  };

  const updateTopic = (idx, value) => {
    const next = [...topics];
    next[idx].name = value;
    setTopics(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || topics.some(t => !t.name.trim()) || isLoading) return;

    setIsLoading(true);
    try {
      await createSyllabusSubject({
        title: title.trim(),
        priority: Number(priority),
        topics
      });
      setTitle('');
      setPriority(1);
      setTopics([{ id: 't1', name: '', status: 'pending' }]);
      onClose();
    } catch (error) {
      console.error('Error creating syllabus subject:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Curriculum Subject" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6 flex flex-col max-h-[80vh]">
        <div className="flex-1 overflow-y-auto custom-scrollbar px-1 space-y-6">
          <p className="text-xs text-slate-500 mb-4">Create a new subject and define its major units/topics for syllabus tracking.</p>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Subject Name</label>
              <div className="relative group">
                <BookOpen size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400" />
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Database Management Systems"
                  className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all text-sm font-bold"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Display Priority</label>
              <input 
                type="number" 
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
                required
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest flex items-center gap-2">
                  <Target size={16} className="text-indigo-400" /> Course Units / Topics
               </h3>
            </div>

            <div className="space-y-3">
               {topics.map((t, idx) => (
                 <div key={idx} className="flex items-center gap-3 relative group">
                   <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-black text-xs shrink-0">
                     {idx + 1}
                   </div>
                   <input 
                     type="text" 
                     value={t.name}
                     onChange={(e) => updateTopic(idx, e.target.value)}
                     placeholder={`Topic ${idx + 1} name...`}
                     className="flex-1 bg-slate-900 border border-slate-700/50 rounded-xl py-2.5 px-4 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50"
                     required
                   />
                   {topics.length > 1 && (
                     <button 
                       type="button" 
                       onClick={() => removeTopic(idx)}
                       className="p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                     >
                       <Trash2 size={16} />
                     </button>
                   )}
                 </div>
               ))}
            </div>

            <button 
              type="button" 
              onClick={addTopic}
              className="mt-4 w-full py-3 border border-dashed border-slate-700 rounded-xl text-slate-500 hover:border-indigo-500/30 hover:text-indigo-400 transition-all flex items-center justify-center gap-2 text-xs font-bold"
            >
               <PlusCircle size={16} /> Add Topic
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-700/50">
          <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
          <Button 
            variant="primary" 
            type="submit" 
            loading={isLoading} 
            icon={Send}
          >
            Create Subject
          </Button>
        </div>
      </form>
    </Modal>
  );
}
