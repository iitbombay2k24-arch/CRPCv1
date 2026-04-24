import React, { useState } from 'react';
import { CheckSquare, Filter, Clock, CheckCircle2, ChevronRight, FileText } from 'lucide-react';
import useAuthStore from '../store/authStore';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';

export default function AssessmentsPage() {
  const { user } = useAuthStore();
  const [filter, setFilter] = useState('pending');

  const assessments = [
    { id: 1, title: 'HCI Assignment 3', subject: 'Human Computer Interaction', type: 'Assignment', dueDate: 'Today, 11:59 PM', status: 'pending', score: null },
    { id: 2, title: 'Cloud Architecture Diagram', subject: 'Cloud Computing', type: 'Project', dueDate: 'Tomorrow, 5:00 PM', status: 'pending', score: null },
    { id: 3, title: 'Mid-Term Quiz 1', subject: 'Data Structures', type: 'Quiz', dueDate: 'Past', status: 'completed', score: 18, total: 20 },
    { id: 4, title: 'Network Topologies Essay', subject: 'Computer Networks', type: 'Assignment', dueDate: 'Past', status: 'completed', score: 85, total: 100 },
  ];

  const filtered = assessments.filter(a => a.status === filter);

  return (
    <div className="h-full flex flex-col min-w-0 bg-transparent">
      {/* Header */}
      <div className="h-16 border-b border-white/[0.05] px-7 bg-black/30 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
            <CheckSquare size={18} />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">Assessments</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Assignments & Grades</p>
          </div>
        </div>
        
        <div className="flex bg-white/[0.04] p-1 rounded-xl border border-white/[0.08]">
          {['pending', 'completed'].map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${filter === t ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-7">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {filtered.length === 0 ? (
            <div className="glass-card rounded-[2rem] p-12 text-center flex flex-col items-center">
              <CheckCircle2 size={48} className="text-emerald-500/50 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">All Caught Up!</h3>
              <p className="text-sm text-slate-400">You have no {filter} assessments at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filtered.map(assessment => (
                <div key={assessment.id} className="glass-card rounded-2xl p-5 border-white/[0.05] hover:border-white/10 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group">
                  
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${assessment.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}`}>
                      {assessment.type === 'Assignment' ? <FileText size={20} /> : <CheckSquare size={20} />}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">{assessment.title}</h3>
                      <p className="text-xs text-slate-400">{assessment.subject}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                    {assessment.status === 'pending' ? (
                      <>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Due Date</p>
                          <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold">
                            <Clock size={12} />
                            {assessment.dueDate}
                          </div>
                        </div>
                        <Button variant="primary" size="sm" iconRight={ChevronRight}>Submit</Button>
                      </>
                    ) : (
                      <>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Grade</p>
                          <p className="text-lg font-black text-emerald-400 leading-none">
                            {assessment.score}<span className="text-xs text-slate-500">/{assessment.total}</span>
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">View Feedback</Button>
                      </>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
