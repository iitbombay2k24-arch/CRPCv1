import React, { useState } from 'react';
import { 
  Hash, 
  Lock, 
  X, 
  MessageSquare, 
  BookOpen, 
  CheckSquare,
  ChevronRight
} from 'lucide-react';
import Modal from '../components/ui/Modal';
import { createChannel, logModerationEvent } from '../services/firestoreService';
import useAuthStore from '../store/authStore';
import Button from '../components/ui/Button';
import { moderateMessage } from '../services/moderationService';
import useNotificationStore from '../store/notificationStore';

export default function CreateChannelModal({ isOpen, onClose }) {
  const { user } = useAuthStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('text'); // text, voice, resource, assignment
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || isLoading) return;
    
    // RBAC: Extra layer of protection
    if (user?.roleLevel < 3) {
      alert('Only Admins can create channels.');
      return;
    }

    // Clean channel name (no spaces, lowercase)
    const rawName = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    // Moderation check on name
    const nameCheck = moderateMessage(rawName);
    if (nameCheck.isBlocked) {
      useNotificationStore.getState().warning(nameCheck.reason, 'Invalid Channel Name');
      logModerationEvent({
        userId: user.uid,
        userName: user.name,
        text: name,
        reason: nameCheck.reason,
        location: 'create_channel_name',
        type: 'block'
      });
      return;
    }

    // Moderation check on description
    const descCheck = moderateMessage(description.trim() || `Channel for ${rawName}`);
    if (descCheck.isBlocked) {
      useNotificationStore.getState().warning(descCheck.reason, 'Invalid Description');
      logModerationEvent({
        userId: user.uid,
        userName: user.name,
        text: description,
        reason: descCheck.reason,
        location: 'create_channel_desc',
        type: 'block'
      });
      return;
    }

    setIsLoading(true);
    try {
      await createChannel({
        name: nameCheck.cleanText,
        description: descCheck.cleanText,
        type: type,
        createdBy: user.uid,
        isLocked: isPrivate
      });

      // Reset and Close
      setName('');
      setDescription('');
      setType('text');
      setIsPrivate(false);
      onClose();
    } catch (error) {
      console.error('Error creating channel:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const channelTypes = [
    { id: 'text', label: 'Text Channel', description: 'Post messages, files, and links.', icon: MessageSquare, color: 'text-indigo-400' },
    { id: 'resource', label: 'Resource Library', description: 'Academic notes and PDF materials.', icon: BookOpen, color: 'text-emerald-400' },
    { id: 'assignment', label: 'Assignment Box', description: 'Submit and grade student tasks.', icon: CheckSquare, color: 'text-rose-400' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Channel" size="md">
      <form onSubmit={handleSubmit} className="p-1 space-y-6">
        <div>
          <header className="mb-4">
            <h2 className="text-xl font-bold text-slate-100 mb-1">Create a Channel</h2>
            <p className="text-xs text-slate-500">Channels are where your team communicates. They’re best when organized around a topic.</p>
          </header>

          <div className="space-y-4">
            {/* Channel Name */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Channel Name
              </label>
              <div className="relative group">
                <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. cloud-computing-2026"
                  required
                  className="w-full bg-slate-900 border border-slate-700/50 rounded-lg py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Description <span className="text-[10px] lowercase font-normal opacity-50">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this channel about?"
                rows={2}
                className="w-full bg-slate-900 border border-slate-700/50 rounded-lg py-2.5 px-4 text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-600 resize-none text-sm"
              />
            </div>

            {/* Type Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                Channel Type
              </label>
              <div className="grid grid-cols-1 gap-2">
                {channelTypes.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id)}
                    className={`flex items-center gap-4 p-3 rounded-xl border transition-all duration-200 text-left group
                      ${type === t.id 
                        ? 'bg-indigo-500/10 border-indigo-500/50 ring-1 ring-indigo-500/50' 
                        : 'bg-slate-900/50 border-slate-700/30 hover:border-slate-500/30'}`}
                  >
                    <div className={`p-2 rounded-lg bg-slate-800 ${t.color}`}>
                      <t.icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm ${type === t.id ? 'text-slate-100' : 'text-slate-300'}`}>{t.label}</p>
                      <p className="text-[11px] text-slate-500 truncate">{t.description}</p>
                    </div>
                    <ChevronRight size={16} className={`text-slate-600 transition-transform ${type === t.id ? 'translate-x-1 text-indigo-400' : ''}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Private Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isPrivate ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-800 text-slate-500'}`}>
                  <Lock size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-200">Private Channel</p>
                  <p className="text-[11px] text-slate-500 italic">Only invited students can see this.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPrivate(!isPrivate)}
                className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${isPrivate ? 'bg-indigo-600' : 'bg-slate-700'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${isPrivate ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            type="submit" 
            loading={isLoading}
            className="px-8 shadow-lg shadow-indigo-600/20"
          >
            Create Channel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
