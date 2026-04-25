import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, MessageSquare, Megaphone, HelpCircle, 
  Trash2, CheckCircle, AlertTriangle, UserMinus, Pin,
  Clock, Briefcase
} from 'lucide-react';
import { 
  onFlaggedMessagesChange, onAnnouncementsChange, onQuestionsChange, onInterviewExperiencesChange,
  deleteMessage, approveMessage, deleteAnnouncement, deleteInterviewExperience, resolveQuestion,
  createAuditLog
} from '../../services/firestoreService';
import useAuthStore from '../../store/authStore';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';

export default function ContentModeration() {
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('flagged');
  const [flagged, setFlagged] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubFlagged = onFlaggedMessagesChange(setFlagged);
    const unsubAnnouncements = onAnnouncementsChange(setAnnouncements);
    const unsubQuestions = onQuestionsChange(setQuestions);
    const unsubExperiences = onInterviewExperiencesChange(setExperiences);
    
    setIsLoading(false);
    return () => {
      unsubFlagged();
      unsubAnnouncements();
      unsubQuestions();
      unsubExperiences();
    };
  }, []);

  const handleAction = async (type, action, item) => {
    if (!window.confirm(`Are you sure you want to ${action} this item?`)) return;

    try {
      if (type === 'flagged') {
        if (action === 'delete') await deleteMessage(item.containerId, item.id, item.containerId.includes('_'));
        else await approveMessage(item.containerId, item.id, item.containerId.includes('_'));
      } else if (type === 'announcement') {
        await deleteAnnouncement(item.id);
      } else if (type === 'question') {
        await resolveQuestion(item.id);
      } else if (type === 'experience') {
        await deleteInterviewExperience(item.id);
      }

      await createAuditLog({
        action: 'Content Moderation',
        actorName: currentUser.name,
        actorEmail: currentUser.email,
        details: `${action} ${type} item: ${item.title || item.text || item.company}`
      });
    } catch (err) {
      console.error(err);
    }
  };

  const tabs = [
    { id: 'flagged', label: 'Flagged Messages', icon: ShieldAlert, count: flagged.length },
    { id: 'announcements', label: 'Announcements', icon: Megaphone, count: announcements.length },
    { id: 'questions', label: 'Q&A Board', icon: HelpCircle, count: questions.length },
    { id: 'experiences', label: 'Experiences', icon: MessageSquare, count: experiences.length },
  ];

  if (isLoading) return <div className="h-full flex items-center justify-center"><Spinner /></div>;

  return (
    <div className="h-full flex flex-col space-y-6 animate-fade-in">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 p-1.5 bg-white/[0.03] border border-white/[0.05] rounded-2xl self-start">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id 
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' 
              : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
            {tab.count > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-black/20 text-[10px]">{tab.count}</span>}
          </button>
        ))}
      </div>

      <div className="flex-1 bg-white/[0.02] border border-white/[0.05] rounded-[2rem] overflow-hidden flex flex-col shadow-xl">
        <div className="overflow-y-auto custom-scrollbar h-full">
          {activeTab === 'flagged' && (
            <div className="p-6 space-y-4">
              {flagged.length === 0 ? (
                <EmptyState icon={CheckCircle} title="Clean Slate" description="No messages flagged by the DLP engine." />
              ) : (
                flagged.map(msg => (
                  <div key={msg.id} className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex items-start justify-between group">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0">
                        <AlertTriangle size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-white">{msg.senderName}</span>
                          <Badge size="xs" variant="secondary">{msg.containerId?.includes('_') ? 'Direct Message' : 'Channel'}</Badge>
                        </div>
                        <p className="text-sm text-slate-400 bg-black/20 p-3 rounded-xl border border-white/5 italic max-w-2xl">
                          "{msg.text}"
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button 
                        onClick={() => handleAction('flagged', 'approve', msg)}
                        title="Approve & Clear Flag"
                        className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button 
                        onClick={() => handleAction('flagged', 'delete', msg)}
                        title="Delete Message"
                        className="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-slate-900 border-b border-white/[0.05]">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Announcement Title</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Author</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Tag</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {announcements.map(ann => (
                    <tr key={ann.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-white max-w-xs truncate">{ann.title}</td>
                      <td className="px-6 py-4 text-xs text-slate-400">{ann.author}</td>
                      <td className="px-6 py-4">
                        <Badge size="xs" variant="neutral">{ann.tag}</Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleAction('announcement', 'delete', ann)} className="text-rose-500 hover:bg-rose-500/10 p-2 rounded-lg transition-all">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'questions' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-slate-900 border-b border-white/[0.05]">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Question</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Author</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Stats</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {questions.map(q => (
                    <tr key={q.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-xs font-bold text-white truncate">{q.title}</p>
                        <div className="flex gap-1 mt-1">
                          {q.tags?.slice(0, 2).map(t => <span key={t} className="text-[8px] text-slate-500 uppercase font-black">#{t}</span>)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">{q.authorName}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-3">
                          <span className="text-[10px] text-slate-500 font-bold">{q.upvotes?.length || 0} Votes</span>
                          <span className="text-[10px] text-slate-500 font-bold">{q.answerCount || 0} Ans</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleAction('question', 'resolve', q)} className="text-emerald-500 hover:bg-emerald-500/10 p-2 rounded-lg transition-all">
                          <CheckCircle size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'experiences' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-slate-900 border-b border-white/[0.05]">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Company & Role</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Author</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Summary</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {experiences.map(exp => (
                    <tr key={exp.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <Briefcase size={14} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white uppercase">{exp.company}</p>
                            <p className="text-[10px] text-slate-500">{exp.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">{exp.authorName}</td>
                      <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate italic">"{exp.fullText?.substring(0, 50)}..."</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleAction('experience', 'delete', exp)} className="text-rose-500 hover:bg-rose-500/10 p-2 rounded-lg transition-all">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="h-64 flex flex-col items-center justify-center text-center">
      <Icon size={48} className="text-slate-700 mb-4" />
      <h3 className="text-slate-400 font-bold uppercase tracking-widest text-sm">{title}</h3>
      <p className="text-[10px] text-slate-600 mt-1 uppercase tracking-[0.2em]">{description}</p>
    </div>
  );
}
