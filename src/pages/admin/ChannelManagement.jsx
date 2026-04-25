import React, { useState, useEffect } from 'react';
import { 
  Hash, Plus, Trash2, Lock, Unlock, 
  Search, Filter, Users, MessageSquare, Clock
} from 'lucide-react';
import { onChannelsChange, deleteChannel, toggleChannelLock, sendMessage, createAuditLog } from '../../services/firestoreService';
import useAuthStore from '../../store/authStore';
import CreateChannelModal from '../../modals/CreateChannelModal';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';

export default function ChannelManagement() {
  const { user } = useAuthStore();
  const [channels, setChannels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [broadcastText, setBroadcastText] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  useEffect(() => {
    // Passing Level 4 user returns all channels
    const unsub = onChannelsChange(user, (data) => {
      setChannels(data);
      setIsLoading(false);
    });
    return () => unsub();
  }, [user]);

  const handleDelete = async (channel) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY DELETE #${channel.name}? This cannot be undone.`)) return;
    
    try {
      await deleteChannel(channel.id);
      await createAuditLog({
        action: 'Channel Management',
        actorName: user.name,
        actorEmail: user.email,
        details: `Deleted channel: #${channel.name}`
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleLock = async (channel) => {
    try {
      await toggleChannelLock(channel.id);
      await createAuditLog({
        action: 'Channel Management',
        actorName: user.name,
        actorEmail: user.email,
        details: `${channel.isLocked ? 'Unlocked' : 'Locked'} channel: #${channel.name}`
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastText.trim()) return;
    if (!window.confirm(`This will send a message to ALL ${channels.length} channels. Proceed?`)) return;

    setIsBroadcasting(true);
    try {
      for (const ch of channels) {
        await sendMessage({
          channelId: ch.id,
          text: `[SYSTEM BROADCAST] ${broadcastText}`,
          senderId: 'SYSTEM',
          senderName: 'Command Center',
          senderEmail: user.email,
          senderRole: 'SuperAdmin'
        });
      }
      setBroadcastText('');
      alert('Broadcast sent successfully!');
    } catch (err) {
      console.error(err);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const filteredChannels = channels.filter(ch => 
    ch.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ch.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return <div className="h-full flex items-center justify-center"><Spinner /></div>;

  return (
    <div className="h-full flex flex-col space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text"
            placeholder="Search channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/[0.05] rounded-2xl py-2.5 pl-12 pr-4 text-xs text-white focus:outline-none focus:border-rose-500/30 transition-all"
          />
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-500 text-white text-xs font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
        >
          <Plus size={16} />
          Provision New Channel
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 flex-1 min-h-0">
        {/* Channel Table */}
        <div className="xl:col-span-2 bg-white/[0.02] border border-white/[0.05] rounded-[2rem] overflow-hidden flex flex-col shadow-xl">
          <div className="overflow-y-auto custom-scrollbar h-full">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-slate-900 border-b border-white/[0.05] z-10">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Channel Name</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Access & Scope</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {filteredChannels.map(ch => (
                  <tr key={ch.id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                          <Hash size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white leading-none mb-1">{ch.name}</p>
                          <p className="text-[10px] text-slate-500 max-w-[150px] truncate">{ch.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                           <Badge variant={ch.visibility === 'Global' ? 'info' : 'secondary'} size="xs">{ch.visibility}</Badge>
                           {ch.isLocked && <Badge variant="danger" size="xs">Read Only</Badge>}
                        </div>
                        <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{ch.school || 'Platform Wide'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleToggleLock(ch)}
                          title={ch.isLocked ? "Unlock Channel" : "Lock Channel (Mute)"}
                          className={`p-2 rounded-lg transition-all ${ch.isLocked ? 'bg-amber-500/20 text-amber-500' : 'bg-white/5 text-slate-500 hover:text-white'}`}
                        >
                          {ch.isLocked ? <Unlock size={14} /> : <Lock size={14} />}
                        </button>
                        <button 
                          onClick={() => handleDelete(ch)}
                          className="p-2 rounded-lg bg-white/5 text-slate-500 hover:text-white hover:bg-rose-500/20 hover:text-rose-500 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar: Analytics & Broadcast */}
        <div className="space-y-6">
          {/* Broadcast Panel */}
          <div className="bg-rose-500/5 border border-rose-500/20 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl" />
            <h4 className="text-xs font-black text-rose-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <MessageSquare size={14} />
              Platform Broadcast
            </h4>
            <textarea 
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              placeholder="System-wide message to all channels..."
              className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-xs text-white focus:outline-none focus:border-rose-500/30 resize-none mb-4"
            />
            <button 
              onClick={handleBroadcast}
              disabled={isBroadcasting || !broadcastText.trim()}
              className="w-full py-3 rounded-xl bg-rose-500 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-500/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isBroadcasting ? <Spinner size="sm" /> : <Plus size={14} />}
              Transmit Broadcast
            </button>
          </div>

          {/* Quick Stats */}
          <div className="bg-white/[0.03] border border-white/[0.05] rounded-3xl p-6">
             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Infrastructure Stats</h4>
             <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
                   <div className="flex items-center gap-2 text-slate-400">
                      <Hash size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Total Nodes</span>
                   </div>
                   <span className="text-xs font-black text-white">{channels.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
                   <div className="flex items-center gap-2 text-slate-400">
                      <Lock size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Muted Channels</span>
                   </div>
                   <span className="text-xs font-black text-amber-500">{channels.filter(c => c.isLocked).length}</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      <CreateChannelModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
