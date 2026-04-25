import React, { useState, useEffect } from 'react';
import { 
  Briefcase, Users, FileCheck, Trash2, Plus, 
  ExternalLink, Search, Filter, Calendar, MapPin,
  Building, CheckCircle, XCircle, Clock
} from 'lucide-react';
import { 
  onDrivesChange, onDriveApplications, deletePlacementDrive, updateApplicationStatus,
  createAuditLog
} from '../../services/firestoreService';
import useAuthStore from '../../store/authStore';
import CreateDriveModal from '../../modals/CreateDriveModal';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';

export default function PlacementsAdmin() {
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('drives');
  const [drives, setDrives] = useState([]);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);

  useEffect(() => {
    const unsubDrives = onDrivesChange(setDrives);
    setIsLoading(false);
    return () => unsubDrives();
  }, []);

  useEffect(() => {
    if (selectedDrive) {
      const unsubApps = onDriveApplications(selectedDrive.id, setApplications);
      return () => unsubApps();
    }
  }, [selectedDrive]);

  const handleAction = async (type, action, item, extra) => {
    if (action === 'delete' && !window.confirm(`Are you sure you want to delete ${item.company}?`)) return;

    try {
      if (type === 'drive') {
        if (action === 'delete') await deletePlacementDrive(item.id);
      } else if (type === 'application') {
        await updateApplicationStatus(selectedDrive.id, item.id, extra);
      }

      await createAuditLog({
        action: 'Placement Management',
        actorName: currentUser.name,
        actorEmail: currentUser.email,
        details: `${action} ${type}: ${item.company || item.name}`
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return <div className="h-full flex items-center justify-center"><Spinner /></div>;

  return (
    <div className="h-full flex flex-col space-y-6 animate-fade-in">
       {/* Header Controls */}
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 p-1.5 bg-white/[0.03] border border-white/[0.05] rounded-2xl">
             <button 
               onClick={() => { setActiveTab('drives'); setSelectedDrive(null); }}
               className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                 activeTab === 'drives' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-slate-500 hover:text-slate-300'
               }`}
             >
               <Building size={14} /> Active Drives
             </button>
             <button 
               onClick={() => setActiveTab('applicants')}
               className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                 activeTab === 'applicants' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-slate-500 hover:text-slate-300'
               }`}
             >
               <Users size={14} /> Global Applicant Pool
             </button>
          </div>

          <button onClick={() => setIsDriveModalOpen(true)} className="flex items-center gap-2 px-6 py-2.5 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20">
            <Plus size={16} /> Commission Drive
          </button>
       </div>

       <div className="flex-1 min-h-0 flex flex-col xl:flex-row gap-8">
          {/* Main Content Area */}
          <div className="flex-1 bg-white/[0.02] border border-white/[0.05] rounded-[2rem] overflow-hidden flex flex-col shadow-2xl">
             <div className="overflow-y-auto custom-scrollbar h-full">
                {activeTab === 'drives' && (
                   <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-slate-900 border-b border-white/[0.05] z-10">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Corporation & Role</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Eligibility</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Pipeline</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.02]">
                        {drives.map(drive => (
                          <tr 
                            key={drive.id} 
                            onClick={() => setSelectedDrive(drive)}
                            className={`hover:bg-white/[0.03] transition-colors cursor-pointer group ${selectedDrive?.id === drive.id ? 'bg-rose-500/5 border-l-4 border-l-rose-500' : ''}`}
                          >
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                                    <Building size={20} />
                                  </div>
                                  <div>
                                    <p className="text-xs font-black text-white uppercase tracking-tight">{drive.company}</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{drive.role}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               <div className="space-y-1">
                                  <Badge variant="neutral" size="xs" className="font-black uppercase tracking-widest">{drive.batch || '2025'}</Badge>
                                  <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em]">Min CGPA: {drive.minCgpa || '6.5'}</p>
                               </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                               <div className="inline-flex flex-col items-center">
                                  <span className="text-xs font-black text-white tabular-nums tracking-tighter">{drive.applicantsCount || 0}</span>
                                  <span className="text-[8px] text-slate-600 uppercase font-black tracking-widest">Applications</span>
                               </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                               <button onClick={(e) => { e.stopPropagation(); handleAction('drive', 'delete', drive); }} className="p-2 rounded-lg text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100">
                                 <Trash2 size={16} />
                               </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                )}
                
                {drives.length === 0 && (
                   <div className="p-20 text-center">
                      <Briefcase size={48} className="text-slate-800 mx-auto mb-4" />
                      <h3 className="text-slate-500 font-black uppercase tracking-widest text-sm">No Active Drives</h3>
                      <p className="text-[10px] text-slate-600 mt-2 uppercase tracking-widest">Provision a new drive to begin recruitment</p>
                   </div>
                )}
             </div>
          </div>

          {/* Side Drawer: Applicants for selected drive */}
          {selectedDrive && (
             <div className="w-full xl:w-[450px] bg-slate-950/50 border border-white/[0.05] rounded-[2rem] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
                <div className="p-6 border-b border-white/[0.05] flex items-center justify-between bg-rose-500/10 rounded-t-[2rem]">
                   <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-widest">{selectedDrive.company}</h4>
                      <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest">Application Roster</p>
                   </div>
                   <button onClick={() => setSelectedDrive(null)} className="p-2 text-slate-500 hover:text-white transition-colors bg-white/5 rounded-xl"><XCircle size={18} /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                   {applications.length === 0 ? (
                      <div className="py-20 text-center opacity-30">
                         <Users size={32} className="mx-auto mb-2" />
                         <p className="text-[10px] font-black uppercase tracking-widest">No applicants yet</p>
                      </div>
                   ) : (
                      applications.map(app => (
                        <div key={app.id} className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl flex items-center justify-between group hover:border-rose-500/30 transition-all">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center text-[10px] font-black text-slate-400">
                                 {app.name?.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                 <p className="text-xs font-black text-white tracking-tight leading-none mb-1">{app.name}</p>
                                 <p className="text-[10px] text-slate-500 font-medium">{app.email}</p>
                                 <div className="mt-1.5">
                                    <Badge 
                                      variant={app.status === 'Hired' ? 'success' : app.status === 'Rejected' ? 'danger' : 'info'} 
                                      size="xs"
                                      className="font-black uppercase tracking-tighter"
                                    >
                                      {app.status}
                                    </Badge>
                                 </div>
                              </div>
                           </div>
                           <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleAction('application', 'update', app, 'Shortlisted')} className="px-2 py-1 bg-emerald-500/10 text-[8px] font-black uppercase tracking-widest text-emerald-500 rounded-md hover:bg-emerald-500 hover:text-white transition-all">Shortlist</button>
                              <button onClick={() => handleAction('application', 'update', app, 'Rejected')} className="px-2 py-1 bg-rose-500/10 text-[8px] font-black uppercase tracking-widest text-rose-500 rounded-md hover:bg-rose-500 hover:text-white transition-all">Reject</button>
                           </div>
                        </div>
                      ))
                   )}
                </div>
             </div>
          )}
       </div>

       <CreateDriveModal isOpen={isDriveModalOpen} onClose={() => setIsDriveModalOpen(false)} />
    </div>
  );
}
