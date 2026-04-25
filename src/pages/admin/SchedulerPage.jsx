import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Users, CheckCircle, AlertCircle, 
  Search, Filter, ChevronLeft, Download, Plus,
  MoreVertical, UserCheck, Share2, Paperclip,
  LayoutGrid, List, Table as TableIcon
} from 'lucide-react';
import { onSchedulerSessionsChange, markAttendance, createAuditLog } from '../../services/firestoreService';
import useAuthStore from '../../store/authStore';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';

export default function SchedulerPage() {
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('schedule');
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);


  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ 
    from: new Date().toISOString().split('T')[0], 
    to: new Date().toISOString().split('T')[0] 
  });

  useEffect(() => {
    const unsub = onSchedulerSessionsChange(dateRange, (data) => {
      setSessions(data);
      setIsLoading(false);
    });
    return () => unsub();
  }, [dateRange]);

  const handleMarkAttendance = async (session) => {
    // Simulated attendance marking for demo
    const presentCount = Math.floor(Math.random() * 80) + 20;
    const totalStudents = 120;
    
    try {
      await markAttendance(session.id, {
        presentCount,
        totalStudents,
        attendanceList: [] // Detailed list omitted for demo
      });
      
      await createAuditLog({
        action: 'Attendance Marking',
        actorName: currentUser.name,
        actorEmail: currentUser.email,
        details: `Marked attendance for ${session.courseName} - ${session.programme}`
      });
    } catch (err) {
      console.error(err);
    }
  };

  const tabs = [
    { id: 'schedule', label: 'Schedule' },
    { id: 'timetable', label: 'Term-Wise Time Table' },
    { id: 'alternate', label: 'Alternate Employee' },
    { id: 'worksheet', label: 'Worksheet' },
    { id: 'workload', label: 'Faculty workload' },
  ];

  if (isLoading) return <div className="h-full flex items-center justify-center"><Spinner /></div>;

  if (currentUser?.roleLevel < 3) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-20 text-center animate-fade-in">
        <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mb-6 border border-rose-500/20">
          <AlertCircle size={40} className="text-rose-500" />
        </div>
        <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Access Denied</h2>
        <p className="text-sm text-slate-500 max-w-xs uppercase font-bold tracking-widest leading-relaxed">
          Administrative Authorization Level 3+ Required to View Institutional Scheduler.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-950 animate-fade-in">
       {/* ─── Header Header ─── */}
       <div className="bg-indigo-900 border-b border-white/10 px-6 py-2 shrink-0">
          <h1 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Scheduler Management Console</h1>
       </div>

       {/* ─── Navigation & Back ─── */}
       <div className="p-4 border-b border-white/[0.05] bg-black/40 flex items-center gap-4 shrink-0 overflow-x-auto no-scrollbar">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 text-[10px] font-bold uppercase transition-all">
             <ChevronLeft size={14} /> Back
          </button>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex items-center gap-1">
             {tabs.map(tab => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id)}
                 className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                   activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                 }`}
               >
                 {tab.label}
               </button>
             ))}
          </div>
       </div>

       {/* ─── Filters Row ─── */}
       <div className="p-6 bg-white/[0.02] border-b border-white/[0.05] space-y-4 shrink-0">
          <div className="flex flex-wrap items-center gap-8">
             <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">From Date :</span>
                <input 
                   type="date" 
                   value={dateRange.from}
                   onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                   className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                />
             </div>
             <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">To Date :</span>
                <input 
                   type="date" 
                   value={dateRange.to}
                   onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                   className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                />
             </div>
             <button className="px-6 py-2 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-700 transition-all border border-white/10">
                Get Schedule
             </button>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/[0.03]">
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                   <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Today View Active</span>
                </div>
                <button className="flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-indigo-500/20 transition-all">
                  <UserCheck size={14} /> Mark Attendance
                </button>
             </div>
             <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="text"
                  placeholder="Search schedule..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white/[0.03] border border-white/[0.05] rounded-xl py-1.5 pl-9 pr-4 text-xs text-white w-64 focus:outline-none"
                />
             </div>
          </div>
       </div>

       {/* ─── Scheduler Table ─── */}
       <div className="flex-1 overflow-hidden flex flex-col">
          <div className="overflow-x-auto overflow-y-auto custom-scrollbar h-full">
             <table className="w-full text-left border-collapse min-w-[1400px]">
                <thead className="sticky top-0 bg-slate-900 border-b border-white/[0.05] z-20">
                   <tr className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em]">
                      <th className="px-4 py-3 text-center border-r border-white/5 w-12">Sr.No</th>
                      <th className="px-4 py-3 border-r border-white/5">Session Date</th>
                      <th className="px-4 py-3 border-r border-white/5">Programme</th>
                      <th className="px-4 py-3 border-r border-white/5">Course & Subject</th>
                      <th className="px-4 py-3 border-r border-white/5">Details</th>
                      <th className="px-4 py-3 border-r border-white/5">Session & Time</th>
                      <th className="px-4 py-3 border-r border-white/5 text-center">Session Status</th>
                      <th className="px-4 py-3 border-r border-white/5 text-center">Attendance</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                   {sessions.length === 0 ? (
                      <tr>
                         <td colSpan="9" className="py-20 text-center">
                            <Calendar size={48} className="text-slate-800 mx-auto mb-4" />
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">No schedule data available for selected range</p>
                         </td>
                      </tr>
                   ) : (
                      sessions.map((session, i) => (
                        <tr key={session.id} className="hover:bg-white/[0.01] transition-colors group">
                           <td className="px-4 py-4 text-center text-slate-600 font-bold border-r border-white/5">{i + 1}</td>
                           <td className="px-4 py-4 border-r border-white/5">
                              <span className="text-[10px] font-black text-white uppercase tracking-tighter">{session.date}</span>
                           </td>
                           <td className="px-4 py-4 border-r border-white/5">
                              <Badge variant="info" size="xs" className="font-black tracking-tighter uppercase">{session.programme}</Badge>
                           </td>
                           <td className="px-4 py-4 border-r border-white/5">
                              <p className="text-[11px] font-bold text-white mb-0.5">{session.courseName}</p>
                              <p className="text-[9px] text-slate-500 font-bold uppercase">({session.courseCode}) • {session.type || 'Lecture'}</p>
                           </td>
                           <td className="px-4 py-4 border-r border-white/5">
                              <div className="space-y-1 text-[9px] font-bold text-slate-400">
                                 <p className="uppercase tracking-widest"><span className="text-slate-600">Year:</span> {session.academicYear || '2025-26'}</p>
                                 <p className="uppercase tracking-widest"><span className="text-slate-600">Section:</span> {session.section || 'N/A'}</p>
                                 <p className="uppercase tracking-widest"><span className="text-slate-600">Infra:</span> {session.room || 'Classroom'}</p>
                              </div>
                           </td>
                           <td className="px-4 py-4 border-r border-white/5">
                              <div className="flex flex-col gap-1.5">
                                 <Badge variant="secondary" size="xs" className="w-fit font-black">No. {session.sessionNo || '1'}</Badge>
                                 <div className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase">
                                    <Clock size={12} />
                                    {session.time || '10:00 AM - 12:00 PM'}
                                 </div>
                              </div>
                           </td>
                           <td className="px-4 py-4 border-r border-white/5 text-center">
                              <div className="flex flex-col items-center gap-2">
                                 <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                    session.status === 'Session Conducted' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                 }`}>
                                    {session.status || 'Session Added'}
                                 </span>
                                 {session.status !== 'Session Conducted' && (
                                    <button className="text-[8px] font-bold text-indigo-500 hover:underline uppercase tracking-widest">Delegate</button>
                                 )}
                              </div>
                           </td>
                           <td className="px-4 py-4 border-r border-white/5 text-center">
                              {session.attendanceStatus === 'Done' ? (
                                 <div className="flex flex-col items-center gap-1">
                                    <Badge variant="success" size="xs" className="font-black">Done</Badge>
                                    <div className="text-[9px] font-bold text-slate-400 space-y-0.5 mt-1">
                                       <p>Present: <span className="text-white">{session.presentCount}</span></p>
                                       <p>Total: <span className="text-white">{session.totalStudents}</span></p>
                                       <p className="text-emerald-500 font-black">{session.percentage}%</p>
                                    </div>
                                    <button className="text-[8px] font-black text-indigo-400 hover:text-white uppercase tracking-widest mt-1">View Log</button>
                                 </div>
                              ) : (
                                 <button 
                                    onClick={() => handleMarkAttendance(session)}
                                    className="px-3 py-1.5 bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-rose-500/10 hover:bg-rose-600 transition-all"
                                 >
                                    Mark Presence
                                 </button>
                              )}
                           </td>
                           <td className="px-4 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                 <button title="Attachments" className="p-2 text-slate-500 hover:text-white bg-white/5 rounded-lg"><Paperclip size={14} /></button>
                                 <button title="Settings" className="p-2 text-slate-500 hover:text-indigo-400 bg-white/5 rounded-lg"><MoreVertical size={14} /></button>
                              </div>
                           </td>
                        </tr>
                      ))
                   )}
                </tbody>
             </table>
          </div>
       </div>
    </div>
  );
}
