import React, { useState } from 'react';
import { Sparkles, X, Plus, AlertCircle } from 'lucide-react';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import useAuthStore from '../store/authStore';
import { createBlogPost } from '../services/firestoreService';

export default function CreateBlogModal({ isOpen, onClose }) {
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [tags, setTags] = useState('Campus Update');
  const [image, setImage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !excerpt.trim() || isLoading) return;

    setIsLoading(true);
    try {
      await createBlogPost({
        title: title.trim(),
        excerpt: excerpt.trim(),
        author: user.name,
        role: user.role,
        authorId: user.uid,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        readTime: '5 min read',
        tags: tags.split(',').map(t => t.trim()),
        featured: false,
        image: image || 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?q=80&w=600&auto=format&fit=crop'
      });
      
      setTitle('');
      setExcerpt('');
      setTags('Campus Update');
      setImage('');
      onClose();
    } catch (err) {
      console.error('Failed to create blog:', err);
      setError('Failed to publish post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Publish Campus Blog" size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <p className="text-xs text-slate-500 mb-4">Share your research, insights, or campus updates with the institution.</p>
        
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl flex items-center gap-3 text-rose-500 text-xs font-bold animate-shake">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Title</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. The Future of AI in DYPIU"
            className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none focus:border-amber-500/50 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Excerpt (Content)</label>
          <textarea 
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Write a brief summary or the main content..."
            rows={4}
            className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none focus:border-amber-500/50 text-sm resize-none"
            required
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Tags (Comma separated)</label>
          <input 
            type="text" 
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. Placements, Career, AI"
            className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none focus:border-amber-500/50 text-sm"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Cover Image URL (Optional)</label>
          <input 
            type="text" 
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://images.unsplash.com/..."
            className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none focus:border-amber-500/50 text-sm"
          />
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
