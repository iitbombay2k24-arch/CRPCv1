import React, { useState } from 'react';
import { 
  ClipboardList, 
  Type, 
  Calendar, 
  User, 
  Flag,
  Send
} from 'lucide-react';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import useAuthStore from '../store/authStore';
import { addBoardTask } from '../services/firestoreService';

export default function AddTaskModal({ isOpen, onClose }) {
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [assignee, setAssignee] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const priorities = ['Low', 'Medium', 'High'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || isLoading) return;

    setIsLoading(true);
    try {
      await addBoardTask({
        title: title.trim(),
        description: description.trim(),
        priority,
        assignee: assignee.trim(),
        deadline,
        status: 'todo',
        year: 'General',
        createdBy: user.uid,
        createdByName: user.name
      });
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setAssignee('');
      setDeadline('');
      onClose();
    } catch (error) {
      console.error('Error adding task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Initialize Project Task" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <header className="mb-4">
          <p className="text-xs text-slate-500 italic">Break down your project into manageable chunks. Define clearly what needs to be done.</p>
        </header>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Task Title</label>
            <div className="relative group">
              <Type size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400" />
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Design UI components for Auth flow"
                className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm mb-1"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Task Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What exactly needs to be complete for this task? Any references?"
              className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm resize-none"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* Assignee */}
             <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Assignee</label>
                <div className="relative group">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400" />
                  <input 
                    type="text" 
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-2 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
                  />
                </div>
             </div>

             {/* Deadline */}
             <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Deadline</label>
                <div className="relative group">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400" />
                  <input 
                    type="date" 
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-2 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all text-sm appearance-none"
                  />
                </div>
             </div>
          </div>

          {/* Priority */}
          <div>
             <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Task Priority</label>
             <div className="flex gap-2">
                {priorities.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all
                      ${priority === p 
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' 
                        : 'bg-slate-900 border-slate-800 text-slate-600 hover:border-slate-700 hover:text-slate-300'}`}
                  >
                    {p}
                  </button>
                ))}
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
            Create Task
          </Button>
        </div>
      </form>
    </Modal>
  );
}
