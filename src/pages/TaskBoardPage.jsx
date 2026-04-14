import React, { useState, useEffect } from 'react';
import {
  CheckSquare, Plus, MoreVertical, Clock, Calendar, ChevronRight, Layout, Trash2, Sparkles
} from 'lucide-react';
import { onBoardTasksChange, updateBoardTaskStatus, deleteBoardTask, seedInitialTasks } from '../services/firestoreService';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import AddTaskModal from '../modals/AddTaskModal';
import Spinner from '../components/ui/Spinner';

const COLUMNS = [
  { id: 'todo',     label: 'To Do',       dot: 'bg-slate-500',   accentFrom: 'from-slate-500' },
  { id: 'progress', label: 'In Progress', dot: 'bg-indigo-500',  accentFrom: 'from-indigo-500' },
  { id: 'done',     label: 'Done',        dot: 'bg-emerald-500', accentFrom: 'from-emerald-500' },
];

const PRIORITY_STYLES = {
  High:   'text-rose-300 bg-rose-500/10 border-rose-500/20',
  Medium: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
  Low:    'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
};

export default function TaskBoardPage() {
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub = onBoardTasksChange({ year: 'General' }, (data) => { setTasks(data); setIsLoading(false); });
    return () => unsub();
  }, []);

  const moveTask = async (tId, direction) => {
    const order = ['todo', 'progress', 'done'];
    const col = tasks.find((t) => t.id === tId);
    if (!col) return;
    const idx = order.indexOf(col.status);
    const next = order[idx + direction];
    if (next) await updateBoardTaskStatus(tId, next);
  };

  const handleDelete = async (tId) => {
    if (window.confirm('Delete this task?')) await deleteBoardTask(tId);
  };

  return (
    <div className="h-full flex flex-col min-w-0">
      {/* Header */}
      <div className="h-16 border-b border-white/[0.05] px-7 flex items-center justify-between bg-black/20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
            <CheckSquare size={18} />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">Task Board</h2>
            <p className="text-[11px] text-slate-500">Collaborative project management</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={seedInitialTasks} variant="secondary" icon={Sparkles} size="sm">Seed 10 Tasks</Button>
          <Button onClick={() => setIsModalOpen(true)} variant="primary" icon={Plus}>New Task</Button>
        </div>
      </div>

      {/* Kanban */}
      <div className="flex-1 overflow-x-auto custom-scrollbar p-6">
        <div className="flex gap-5 h-full min-w-max">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);
            return (
              <div key={col.id} className="w-80 flex flex-col h-full">
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.dot} shadow-[0_0_8px_currentColor]`} />
                    <h3 className="text-xs font-black text-slate-200 uppercase tracking-widest">{col.label}</h3>
                    <span className="text-[10px] font-bold bg-white/[0.05] text-slate-500 border border-white/[0.08] px-1.5 py-0.5 rounded-lg">
                      {colTasks.length}
                    </span>
                  </div>
                  <button className="text-slate-600 hover:text-white transition-colors">
                    <MoreVertical size={15} />
                  </button>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
                  {isLoading ? (
                    <div className="py-16 flex justify-center"><Spinner /></div>
                  ) : colTasks.length === 0 ? (
                    <div className="py-16 border border-dashed border-white/[0.05] rounded-2xl flex flex-col items-center justify-center text-center">
                      <Layout size={24} className="text-slate-700 mb-2" />
                      <p className="text-[10px] text-slate-700 font-bold uppercase">Empty</p>
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <div
                        key={task.id}
                        className="glass-card rounded-2xl p-4 group relative cursor-default"
                      >
                        {/* Top accent strip */}
                        <div className={`absolute top-0 left-4 right-4 h-0.5 bg-gradient-to-r ${col.accentFrom} to-transparent rounded-full`} />

                        <div className="flex items-start justify-between mb-3">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-wide ${PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.Low}`}>
                            {task.priority || 'Low'}
                          </span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {col.id !== 'todo' && (
                              <button
                                onClick={() => moveTask(task.id, -1)}
                                className="p-1 hover:bg-white/8 rounded-lg text-slate-500 hover:text-white transition-all"
                              >
                                <ChevronRight size={13} className="rotate-180" />
                              </button>
                            )}
                            {col.id !== 'done' && (
                              <button
                                onClick={() => moveTask(task.id, 1)}
                                className="p-1 hover:bg-white/8 rounded-lg text-slate-500 hover:text-white transition-all"
                              >
                                <ChevronRight size={13} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(task.id)}
                              className="p-1 hover:bg-rose-500/20 rounded-lg text-slate-500 hover:text-rose-400 transition-all ml-1"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        <h4 className="text-sm font-bold text-slate-200 mb-1.5 leading-tight">{task.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">{task.description}</p>

                        <div className="flex items-center justify-between border-t border-white/[0.04] pt-3">
                          <div className="flex -space-x-1.5">
                            <Avatar name={task.createdBy || 'U'} size="xs" />
                            {task.assignee && <Avatar name={task.assignee} size="xs" />}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                            <Clock size={11} className="text-slate-600" />
                            {task.deadline
                              ? new Date(task.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                              : 'No date'}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AddTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
