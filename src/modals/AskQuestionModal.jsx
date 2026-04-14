import React, { useState } from 'react';
import { 
  HelpCircle, 
  Type, 
  Hash, 
  Send,
  AlertCircle
} from 'lucide-react';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import useAuthStore from '../store/authStore';
import { createQuestion } from '../services/firestoreService';

export default function AskQuestionModal({ isOpen, onClose }) {
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(/,/g, '');
      if (val && !tags.includes(val) && tags.length < 5) {
        setTags([...tags, val]);
        setTagInput('');
      }
    }
  };

  const removeTag = (t) => {
    setTags(tags.filter(tag => tag !== t));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || isLoading) return;

    setIsLoading(true);
    try {
      await createQuestion({
        title: title.trim(),
        body: body.trim(),
        tags,
        authorId: user.uid,
        authorName: user.name
      });
      setTitle('');
      setBody('');
      setTags([]);
      onClose();
    } catch (error) {
      console.error('Error creating question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ask a New Question" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <header className="mb-4">
          <div className="flex items-center gap-3 p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 mb-2">
            <AlertCircle className="text-indigo-400" size={20} />
            <p className="text-xs text-slate-400">
              <span className="font-bold text-slate-200">Tip:</span> Start your question with "How", "What", or "Why" to help others find it. Add relevant tags to categorize your topic.
            </p>
          </div>
        </header>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Subject Title</label>
            <div className="relative group">
              <Type size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400" />
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. How to implement real-time listeners in Firebase?"
                className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm mb-1"
                required
              />
            </div>
          </div>

          {/* Body */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Details</label>
            <textarea 
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Describe your question in detail... (include examples or code if necessary)"
              className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm resize-none"
              rows={8}
              required
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Tags <span className="text-[9px] lowercase opacity-50">(max 5)</span></label>
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map(t => (
                <span key={t} className="flex items-center gap-1 px-2 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-bold rounded-lg group">
                  {t}
                  <button type="button" onClick={() => removeTag(t)} className="hover:text-white transition-colors"><X size={12} /></button>
                </span>
              ))}
            </div>
            <div className="relative group">
              <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400" />
              <input 
                type="text" 
                value={tagInput}
                onKeyDown={handleAddTag}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tags (press Enter or comma to add)"
                className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
              />
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
            Ask Board
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function X({ size = 12, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}
