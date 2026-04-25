import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, ChevronDown, MoreVertical, 
  User, Shield, Mail, Globe, Book, Star, Clock, X
} from 'lucide-react';
import { onUsersChange, updateUserRole, createAuditLog } from '../../services/firestoreService';
import { ROLES } from '../../lib/rbac';
import useAuthStore from '../../store/authStore';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';

export default function UserManagement() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUpdating, setIsUpdating] = useState(null); // uid of user being updated

  useEffect(() => {
    const unsub = onUsersChange((data) => {
      setUsers(data);
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  const handleRoleChange = async (targetUser, newRole) => {
    if (newRole === targetUser.role) return;
    if (!window.confirm(`Escalate/De-escalate ${targetUser.name} to ${newRole}?`)) return;
    
    setIsUpdating(targetUser.id);
    try {
      await updateUserRole(targetUser.id, newRole);
      await createAuditLog({
        action: 'Role Management',
        actorName: currentUser.name,
        actorEmail: currentUser.email,
        details: `Updated ${targetUser.name} (${targetUser.email}) from ${targetUser.role} to ${newRole}.`
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'All' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (isLoading) return <div className="h-full flex items-center justify-center"><Spinner /></div>;

  return (
    <div className="h-full flex flex-col space-y-6 animate-fade-in relative">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text"
            placeholder="Search by name, email, or PRN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/[0.05] rounded-2xl py-2.5 pl-12 pr-4 text-xs text-white focus:outline-none focus:border-rose-500/30 transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-white/[0.03] border border-white/[0.05] rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 focus:outline-none"
          >
            <option value="All">All Roles</option>
            {Object.values(ROLES).map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/[0.03] border border-white/[0.05] rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 focus:outline-none"
          >
            <option value="All">All Status</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="flex-1 bg-white/[0.02] border border-white/[0.05] rounded-[2rem] overflow-hidden flex flex-col">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.05] bg-white/[0.01]">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Identity</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Access Control</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Institution</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Metrics</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar name={u.name} size="sm" />
                        <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0a0a0c] ${u.status === 'online' ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white leading-none mb-1">{u.name}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <select 
                        value={u.role || 'Student'}
                        disabled={isUpdating === u.id || u.id === currentUser.uid}
                        onChange={(e) => handleRoleChange(u, e.target.value)}
                        className="bg-rose-500/10 border border-rose-500/20 rounded-lg px-2 py-1 text-[10px] font-bold uppercase text-rose-400 focus:outline-none appearance-none cursor-pointer hover:bg-rose-500/20 transition-all"
                      >
                        {Object.values(ROLES).map(r => <option key={r} value={r} className="bg-slate-900">{r}</option>)}
                      </select>
                      <Badge variant="secondary" size="xs">L{u.roleLevel || 1}</Badge>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-300 uppercase truncate max-w-[120px]">{u.school || 'Engineering'}</span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Div {u.division || 'A'} • Sem {u.semester || 1}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-black text-white leading-none">{u.engagementScore || 0}</span>
                        <span className="text-[8px] font-black text-slate-500 uppercase">Score</span>
                      </div>
                      <div className="w-px h-6 bg-white/5" />
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Last Seen</span>
                        <span className="text-[9px] text-slate-600 font-medium">{u.lastSeen ? 'Recently' : 'Never'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedUser(u)}
                      className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-rose-500/20 transition-all"
                    >
                      <MoreVertical size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Drawer */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedUser(null)} />
          <div className="relative w-full max-w-md bg-slate-950 border-l border-rose-500/20 h-full flex flex-col shadow-2xl animate-slide-in-right">
            <div className="p-6 border-b border-rose-500/10 flex items-center justify-between bg-white/[0.01]">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Dossier: {selectedUser.name}</h3>
              <button onClick={() => setSelectedUser(null)} className="p-2 rounded-full hover:bg-white/5 text-slate-500 hover:text-white transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <div className="flex flex-col items-center text-center">
                <Avatar name={selectedUser.name} size="lg" className="w-24 h-24 mb-4 ring-4 ring-rose-500/20" />
                <h4 className="text-xl font-black text-white">{selectedUser.name}</h4>
                <p className="text-sm text-rose-500 font-bold uppercase tracking-wider mb-2">{selectedUser.role}</p>
                <Badge variant="secondary">{selectedUser.email}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-4">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Engagement</p>
                  <p className="text-lg font-black text-white">{selectedUser.engagementScore || 0}</p>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-4">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Streak</p>
                  <p className="text-lg font-black text-white">{selectedUser.streak || 0} Days</p>
                </div>
              </div>

              <div className="space-y-4">
                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Metadata Analysis</h5>
                <div className="space-y-3">
                  {[
                    { label: 'Division', value: selectedUser.division || 'A', icon: Globe },
                    { label: 'PRN', value: selectedUser.prn || 'Not Linked', icon: Shield },
                    { label: 'Course', value: selectedUser.course || 'B.Tech CSE', icon: Book },
                    { label: 'Batch', value: selectedUser.batch || '2024-2028', icon: Clock }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.03]">
                      <div className="flex items-center gap-3 text-slate-400">
                        <item.icon size={14} />
                        <span className="text-xs font-bold">{item.label}</span>
                      </div>
                      <span className="text-xs font-bold text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-rose-500/10 bg-rose-500/5">
               <button className="w-full py-3 rounded-xl bg-rose-500 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-rose-500/20 hover:scale-[1.02] transition-all">
                  Audit User Sessions
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
