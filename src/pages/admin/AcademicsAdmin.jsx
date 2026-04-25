import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Calendar, CheckSquare, FileText, 
  Plus, Trash2, Edit, ChevronRight, Filter, Search,
  Download, ExternalLink, Clock, Play, Square
} from 'lucide-react';
import { 
  onQuizzesChange, onResourcesChange, onTimetableChange, onBoardTasksChange,
  deleteQuiz, toggleQuizStatus, deleteResource, deleteTimetableSlot, deleteBoardTask,
  createAuditLog
} from '../../services/firestoreService';
import useAuthStore from '../../store/authStore';
import CreateQuizModal from '../../modals/CreateQuizModal';
import AddTimetableSlotModal from '../../modals/AddTimetableSlotModal';
import UploadResourceModal from '../../modals/UploadResourceModal';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';

export default function AcademicsAdmin() {
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('quizzes');
  const [quizzes, setQuizzes] = useState([]);
  const [resources, setResources] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);

  useEffect(() => {
    const unsubQuizzes = onQuizzesChange(setQuizzes);
    const unsubResources = onResourcesChange(setResources);
    const unsubTimetable = onTimetableChange('All', setTimetable);
    const unsubTasks = onBoardTasksChange({ year: 'General' }, setTasks);
    
    setIsLoading(false);
    return () => {
      unsubQuizzes();
      unsubResources();
      unsubTimetable();
      unsubTasks();
    };
  }, []);

  const handleAction = async (type, action, item) => {
    if (!window.confirm(`Are you sure you want to ${action} this item?`)) return;

    try {
      if (type === 'quiz') {
        if (action === 'delete') await deleteQuiz(item.id);
        else await toggleQuizStatus(item.id, !item.active);
      } else if (type === 'resource') {
        await deleteResource(item.id);
      } else if (type === 'timetable') {
        await deleteTimetableSlot(item.id);
      } else if (type === 'task') {
        await deleteBoardTask(item.id);
      }

      await createAuditLog({
        action: 'Academic Management',
        actorName: currentUser.name,
        actorEmail: currentUser.email,
        details: `${action} ${type}: ${item.title || item.subject || 'Item'}`
      });
    } catch (err) {
      console.error(err);
    }
  };

  const tabs = [
    { id: 'quizzes', label: 'Assessments', icon: CheckSquare, count: quizzes.length },
    { id: 'timetable', label: 'Class Schedule', icon: Calendar, count: timetable.length },
    { id: 'resources', label: 'Digital Library', icon: BookOpen, count: resources.length },
    { id: 'tasks', label: 'Admin Tasks', icon: FileText, count: tasks.length },
  ];

  if (isLoading) return <div className="h-full flex items-center justify-center"><Spinner /></div>;

  return (
    <div className="h-full flex flex-col space-y-6 animate-fade-in">
       {/* Tab Navigation & Add Buttons */}
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 p-1.5 bg-white/[0.03] border border-white/[0.05] rounded-2xl overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'quizzes' && (
              <button onClick={() => setIsQuizModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/10">
                <Plus size={14} /> New Assessment
              </button>
            )}
            {activeTab === 'timetable' && (
              <button onClick={() => setIsSlotModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/10">
                <Plus size={14} /> Add Class Slot
              </button>
            )}
            {activeTab === 'resources' && (
              <button onClick={() => setIsResourceModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/10">
                <Plus size={14} /> Upload Resource
              </button>
            )}
          </div>
       </div>

       <div className="flex-1 bg-white/[0.02] border border-white/[0.05] rounded-[2rem] overflow-hidden flex flex-col shadow-2xl">
          <div className="overflow-y-auto custom-scrollbar h-full">
            {activeTab === 'quizzes' && (
               <table className="w-full text-left">
                  <thead className="sticky top-0 bg-slate-900 border-b border-white/[0.05] z-10">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Assessment Name</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Metric</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {quizzes.map(q => (
                      <tr key={q.id} className="hover:bg-white/[0.01] transition-colors group">
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-white mb-1">{q.title}</p>
                          <p className="text-[10px] text-slate-500 font-medium">Created by {q.creatorName || 'Admin'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <Badge variant={q.active ? 'success' : 'neutral'} size="xs" className="font-black uppercase tracking-widest">{q.active ? 'Active' : 'Closed'}</Badge>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                             {q.questions?.length || 0} Questions
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                             <button 
                                onClick={() => handleAction('quiz', q.active ? 'close' : 'open', q)} 
                                title={q.active ? 'Close Quiz' : 'Activate Quiz'}
                                className={`p-2 rounded-lg transition-all ${q.active ? 'text-amber-500 bg-amber-500/10' : 'text-emerald-500 bg-emerald-500/10'}`}
                             >
                               {q.active ? <Square size={14} /> : <Play size={14} />}
                             </button>
                             <button onClick={() => handleAction('quiz', 'delete', q)} className="p-2 rounded-lg text-rose-500 bg-rose-500/10 hover:bg-rose-500 hover:text-white transition-all">
                               <Trash2 size={14} />
                             </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            )}

            {activeTab === 'timetable' && (
               <table className="w-full text-left">
                  <thead className="sticky top-0 bg-slate-900 border-b border-white/[0.05] z-10">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Division</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Subject & Type</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Timing</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {timetable.map(slot => (
                      <tr key={slot.id} className="hover:bg-white/[0.01] transition-colors group">
                        <td className="px-6 py-4"><Badge variant="info" size="xs" className="font-black uppercase tracking-widest">{slot.division}</Badge></td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-white">{slot.subject}</p>
                          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">{slot.room || 'TBD'}</p>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                             <Clock size={12} className="text-rose-500" />
                             {slot.timeStart} - {slot.timeEnd}
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => handleAction('timetable', 'delete', slot)} className="p-2 rounded-lg text-rose-500 bg-rose-500/10 hover:bg-rose-500 hover:text-white transition-all">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            )}

            {activeTab === 'resources' && (
               <table className="w-full text-left">
                  <thead className="sticky top-0 bg-slate-900 border-b border-white/[0.05] z-10">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Resource</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Uploader</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Downloads</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {resources.map(res => (
                      <tr key={res.id} className="hover:bg-white/[0.01] transition-colors group">
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                <FileText size={16} />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-white leading-none mb-1">{res.title}</p>
                                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">{res.subject}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400 font-medium">{res.uploadedByName || 'Admin'}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs font-black text-white tabular-nums tracking-tighter">{res.downloadCount || 0}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                             <a href={res.fileUrl} target="_blank" rel="noreferrer" className="p-2 rounded-lg text-slate-500 hover:text-white bg-white/5 transition-all">
                               <ExternalLink size={14} />
                             </a>
                             <button onClick={() => handleAction('resource', 'delete', res)} className="p-2 rounded-lg text-rose-500 bg-rose-500/10 hover:bg-rose-500 hover:text-white transition-all">
                               <Trash2 size={14} />
                             </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            )}
          </div>
       </div>

       {/* Modals */}
       <CreateQuizModal isOpen={isQuizModalOpen} onClose={() => setIsQuizModalOpen(false)} />
       <AddTimetableSlotModal isOpen={isSlotModalOpen} onClose={() => setIsSlotModalOpen(false)} />
       <UploadResourceModal isOpen={isResourceModalOpen} onClose={() => setIsResourceModalOpen(false)} />
    </div>
  );
}
