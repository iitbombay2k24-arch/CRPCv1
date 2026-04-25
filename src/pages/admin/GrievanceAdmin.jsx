import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, CheckCircle, Clock, Search, Filter, 
  MessageSquare, User, Shield, ChevronRight, XCircle
} from 'lucide-react';
import { onGrievancesChange, updateGrievanceStatus, createAuditLog } from '../../services/firestoreService';
import useAuthStore from '../../store/authStore';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';

export default function GrievanceAdmin() {
  const { user: currentUser } = useAuthStore();
  const [grievances, setGrievances] = useState([]);
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adminResponse, setAdminResponse] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsub = onGrievancesChange(setGrievances);
    setIsLoading(false);
    return () => unsub();
  }, []);

  const handleUpdateStatus = async (item, status) => {
    try {
      await updateGrievanceStatus(item.id, status, adminResponse);
      await createAuditLog({
        action: 'Grievance Resolution',
        actorName: currentUser.name,
        actorEmail: currentUser.email,
        details: `Updated grievance [${item.title}] status to ${status}. Response: ${adminResponse || 'No response provided.'}`
      });
      setSelectedGrievance(null);
      setAdminResponse('');
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = grievances.filter(g => 
    g.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.authorName?.toLowerCase().includes(searchQuery.toLowerCase())
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
              placeholder="Filter by ticket title or student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.05] rounded-2xl py-2.5 pl-12 pr-4 text-xs text-white focus:outline-none focus:border-rose-500/30 transition-all"
            />
          </div>
       </div>

       <div className="flex-1 min-h-0 flex flex-col xl:flex-row gap-8">
          {/* Main Table */}
          <div className="flex-1 bg-white/[0.02] border border-white/[0.05] rounded-[2rem] overflow-hidden flex flex-col shadow-2xl">
             <div className="overflow-y-auto custom-scrollbar h-full">
                <table className="w-full text-left border-collapse">
                   <thead className="sticky top-0 bg-slate-900 border-b border-white/[0.05] z-10">
                     <tr>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Issue Ticket</th>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Student</th>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Priority</th>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-white/[0.02]">
                     {filtered.map(g => (
                       <tr 
                         key={g.id} 
                         onClick={() => { setSelectedGrievance(g); setAdminResponse(g.adminResponse || ''); }}
                         className={`hover:bg-white/[0.03] transition-colors cursor-pointer group ${selectedGrievance?.id === g.id ? 'bg-rose-500/5' : ''}`}
                       >
                         <td className="px-6 py-4">
                            <p className="text-xs font-bold text-white mb-1 leading-tight">{g.title}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Ref: {g.id.substring(0, 8)}</p>
                         </td>
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                               <div className="w-7 h-7 rounded-lg bg-slate-800 border border-white/5 flex items-center justify-center text-[10px] font-black text-slate-400">
                                 {g.authorName?.substring(0,1).toUpperCase()}
                               </div>
                               <span className="text-xs text-slate-400 font-bold">{g.authorName}</span>
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            <Badge variant={g.priority === 'High' ? 'danger' : 'neutral'} size="xs" className="font-black uppercase tracking-widest">{g.priority}</Badge>
                         </td>
                         <td className="px-6 py-4">
                            <div className="flex justify-center">
                               <Badge variant={g.status === 'Resolved' ? 'success' : g.status === 'In Progress' ? 'info' : 'warning'} size="xs" className="font-black uppercase tracking-widest">
                                 {g.status}
                               </Badge>
                            </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                </table>
                
                {filtered.length === 0 && (
                   <div className="p-20 text-center">
                      <AlertCircle size={48} className="text-slate-800 mx-auto mb-4" />
                      <h3 className="text-slate-500 font-black uppercase tracking-widest text-sm">No Grievances Found</h3>
                      <p className="text-[10px] text-slate-600 mt-2 uppercase tracking-widest">Platform is running smoothly</p>
                   </div>
                )}
             </div>
          </div>

          {/* Resolution Drawer */}
          {selectedGrievance && (
             <div className="w-full xl:w-[450px] bg-slate-950/50 border border-white/[0.05] rounded-[2rem] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
                <div className="p-6 border-b border-white/[0.05] flex items-center justify-between bg-rose-500/10 rounded-t-[2rem]">
                   <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-widest">Resolution Console</h4>
                      <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest">Ticket #{selectedGrievance.id.substring(0, 8)}</p>
                   </div>
                   <button onClick={() => setSelectedGrievance(null)} className="p-2 text-slate-500 hover:text-white bg-white/5 rounded-xl transition-colors"><XCircle size={18} /></button>
                </div>
                
                <div className="flex-1 p-6 space-y-6">
                   <div>
                      <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Student Description</h5>
                      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                         <p className="text-xs text-slate-300 leading-relaxed italic">"{selectedGrievance.description}"</p>
                      </div>
                   </div>

                   <div>
                      <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Official Response</h5>
                      <textarea 
                        value={adminResponse}
                        onChange={(e) => setAdminResponse(e.target.value)}
                        placeholder="Explain the resolution or ask for more details..."
                        className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-xs text-white focus:outline-none focus:border-rose-500/30 resize-none font-medium"
                      />
                   </div>

                   <div className="flex flex-col gap-3 pt-4">
                      <button 
                         onClick={() => handleUpdateStatus(selectedGrievance, 'In Progress')}
                         className="w-full py-3 rounded-xl bg-white/5 text-slate-300 font-black uppercase tracking-widest text-[10px] border border-white/10 hover:bg-white/10 transition-all"
                      >
                         Update to In Progress
                      </button>
                      <button 
                         onClick={() => handleUpdateStatus(selectedGrievance, 'Resolved')}
                         className="w-full py-3 rounded-xl bg-emerald-500 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                      >
                         Finalize & Resolve Ticket
                      </button>
                   </div>
                </div>
             </div>
          )}
       </div>
    </div>
  );
}
