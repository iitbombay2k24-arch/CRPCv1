import React, { useState } from 'react';
import { Send, Building2, Briefcase, Tags, AlertCircle, Sparkles } from 'lucide-react';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import useAuthStore from '../store/authStore';
import { createInterviewExperience } from '../services/firestoreService';

export default function CreateInterviewExperienceModal({ isOpen, onClose }) {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    preview: '',
    tags: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.company || !formData.role || !formData.preview) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      await createInterviewExperience({
        company: formData.company.trim(),
        role: formData.role.trim(),
        preview: formData.preview.trim(),
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        author: user.name,
        authorId: user.uid,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      });
      
      setFormData({ company: '', role: '', preview: '', tags: '' });
      onClose();
    } catch (err) {
      console.error('Failed to post experience:', err);
      setError('Failed to publish experience. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Interview Experience" size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <p className="text-xs text-slate-500 mb-4">Help your juniors by sharing insights from your interview process.</p>
        
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl flex items-center gap-3 text-rose-500 text-xs font-bold animate-shake">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Company</label>
            <div className="relative">
              <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="e.g. Amazon, Google, TCS"
                className="w-full bg-slate-900 border border-slate-700/50 rounded-xl pl-9 pr-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500/50 text-sm"
              />
            </div>
          </div>

          <div className="col-span-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Role Applied For</label>
            <div className="relative">
              <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                name="role"
                value={formData.role}
                onChange={handleChange}
                placeholder="e.g. SDE-1, Cloud Architect"
                className="w-full bg-slate-900 border border-slate-700/50 rounded-xl pl-9 pr-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500/50 text-sm"
              />
            </div>
          </div>

          <div className="col-span-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Experience Summary</label>
            <textarea 
              name="preview"
              value={formData.preview}
              onChange={handleChange}
              placeholder="Briefly describe the rounds, questions asked, and your experience..."
              rows={4}
              className="w-full bg-slate-900 border border-slate-700/50 rounded-xl p-4 text-slate-200 focus:outline-none focus:border-indigo-500/50 text-sm resize-none"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Tags (Comma Separated)</label>
            <div className="relative">
              <Tags size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="e.g. DSA, System Design, Off-campus"
                className="w-full bg-slate-900 border border-slate-700/50 rounded-xl pl-9 pr-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500/50 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
          <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
          <Button variant="primary" type="submit" loading={isLoading} icon={Sparkles}>
            Publish
          </Button>
        </div>
      </form>
    </Modal>
  );
}
