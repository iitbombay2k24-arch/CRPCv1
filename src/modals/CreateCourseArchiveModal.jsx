import React, { useState } from 'react';
import { HardDrive, Send, Layers } from 'lucide-react';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { createCourseArchive } from '../services/firestoreService';

export default function CreateCourseArchiveModal({ isOpen, onClose }) {
  const [title, setTitle] = useState('');
  const [sem, setSem] = useState('1');
  const [pattern, setPattern] = useState('Pattern 2024');
  const [sections, setSections] = useState('A, B, C');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !sections.trim()) return;

    setIsLoading(true);
    try {
      await createCourseArchive({
        title: title.trim(),
        sem: sem.trim(),
        pattern,
        sections: sections.split(',').map(s => s.trim()).filter(Boolean)
      });
      setTitle('');
      setSem('1');
      setSections('A, B, C');
      onClose();
    } catch (error) {
      console.error('Error creating course archive:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Course Archive" size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <p className="text-xs text-slate-500 mb-4">Create a structured institutional archive block for course materials.</p>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Course Title</label>
            <div className="relative group">
              <HardDrive size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400" />
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Professional Skills - I"
                className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all text-sm font-bold"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Semester</label>
            <input 
              type="text" 
              value={sem}
              onChange={(e) => setSem(e.target.value)}
              placeholder="e.g. 4"
              className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Academic Pattern</label>
            <select 
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all text-sm appearance-none"
            >
              <option value="Pattern 2023">Pattern 2023</option>
              <option value="Pattern 2024">Pattern 2024</option>
              <option value="Pattern 2025">Pattern 2025</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Layers size={12} /> Sections / Batches (Comma Separated)
            </label>
            <input 
              type="text" 
              value={sections}
              onChange={(e) => setSections(e.target.value)}
              placeholder="e.g. A, B, C or BATCH-1, BATCH-2"
              className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
              required
            />
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
            Create Archive
          </Button>
        </div>
      </form>
    </Modal>
  );
}
