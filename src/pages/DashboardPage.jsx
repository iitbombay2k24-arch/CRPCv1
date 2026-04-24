import React, { useState, useEffect } from 'react';
import { Calendar, CheckSquare, Bell, Clock, ArrowRight, User } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useUIStore from '../store/uiStore';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { setActiveTab } = useUIStore();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const formattedDate = time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const formattedTime = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="h-full flex flex-col min-w-0 bg-transparent">
      {/* Header */}
      <div className="h-16 border-b border-white/[0.05] px-4 md:px-7 bg-black/30 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
            <User size={18} />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">Student Dashboard</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{formattedDate} · {formattedTime}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <Button variant="primary" size="sm" onClick={() => setActiveTab('tasks')}>View My Tasks</Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-7">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-7">
          
          {/* Left Column: Student Info & Quick Links */}
          <div className="xl:col-span-1 space-y-4 md:space-y-7">
            {/* Student Profile Card */}
            <div className="glass-card rounded-[2rem] p-6 border-white/[0.05]">
              <div className="flex flex-col items-center text-center">
                <Avatar name={user?.name} src={user?.avatarUrl} size="lg" className="w-20 h-20 mb-4 shadow-xl" />
                <h3 className="text-lg font-black text-white">{user?.name}</h3>
                <p className="text-xs text-indigo-400 font-bold mb-4">{user?.course || 'B.Tech CSE'} · Sem {user?.semester || 4}</p>
                
                <div className="w-full space-y-3 text-left">
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1">Enrollment No.</p>
                    <p className="text-xs font-medium text-slate-300">{user?.enrollmentNo || '20210802309'}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1">Batch</p>
                    <p className="text-xs font-medium text-slate-300">{user?.batch || '2024 - 2028'}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1">Division</p>
                    <p className="text-xs font-medium text-slate-300">{user?.division || 'C'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="glass-card rounded-[2rem] p-6 border-white/[0.05]">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <ArrowRight size={12} className="text-indigo-400" />
                 Quick Links
              </h4>
              <div className="space-y-2">
                {[
                  { id: 'profile', label: 'My Profile', icon: User },
                  { id: 'attendance', label: 'Attendance', icon: Clock },
                  { id: 'announcements', label: 'Announcements', icon: Bell },
                  { id: 'quizzes', label: 'Assessments', icon: CheckSquare }
                ].map(link => (
                  <button 
                    key={link.id}
                    onClick={() => setActiveTab(link.id)}
                    className="w-full flex items-center gap-3 p-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.02] hover:border-white/10 rounded-xl transition-all group"
                  >
                    <div className="p-1.5 bg-white/5 rounded-lg text-slate-400 group-hover:text-indigo-400 transition-colors">
                       <link.icon size={14} />
                    </div>
                    <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{link.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Content (Schedule, Tasks, Bulletin) */}
          <div className="xl:col-span-3 space-y-4 md:space-y-6">
            
            {/* Today's Schedule */}
            <div className="glass-card rounded-[2rem] border-white/[0.05] overflow-hidden">
              <div className="p-5 border-b border-white/[0.05] bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 border border-sky-500/20">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Today's Schedule</h3>
                    <p className="text-[10px] text-slate-500">Your timetable stays unloaded until you request it.</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('timetable')}>Load</Button>
              </div>
              <div className="p-0 bg-black/20 flex flex-col divide-y divide-white/[0.05]">
                {[
                  { time: '09:00 AM - 10:30 AM', subject: 'Data Structures Lab', room: 'Room 304', type: 'Lab', color: 'text-sky-400' },
                  { time: '11:00 AM - 12:30 PM', subject: 'Cloud Computing', room: 'Room 102', type: 'Lecture', color: 'text-indigo-400' },
                  { time: '02:00 PM - 03:00 PM', subject: 'Project Mentoring', room: 'Cabin A', type: 'Meeting', color: 'text-emerald-400' }
                ].map((session, i) => (
                  <div key={i} className="p-4 md:p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="text-right w-16 md:w-24">
                        <p className="text-xs font-black text-white">{session.time.split(' - ')[0]}</p>
                        <p className="text-[9px] font-bold text-slate-500">{session.time.split(' - ')[1]}</p>
                      </div>
                      <div className="w-1 h-8 bg-white/10 rounded-full" />
                      <div>
                        <p className="text-sm font-bold text-slate-200">{session.subject}</p>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${session.color}`}>{session.type} • {session.room}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="xs">Details</Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Tasks */}
            <div className="glass-card rounded-[2rem] border-white/[0.05] overflow-hidden">
              <div className="p-5 border-b border-white/[0.05] bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                    <CheckSquare size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Pending Tasks</h3>
                    <p className="text-[10px] text-slate-500">Student task tray items, loaded only when requested.</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('tasks')}>Load</Button>
              </div>
              <div className="p-0 bg-black/20 flex flex-col divide-y divide-white/[0.05]">
                {[
                  { title: 'Submit HCI Assignment', due: 'Today, 11:59 PM', priority: 'High', color: 'bg-rose-500' },
                  { title: 'Review Quiz 2 Answers', due: 'Tomorrow, 10:00 AM', priority: 'Medium', color: 'bg-amber-500' },
                  { title: 'Fill Feedback Form', due: 'In 3 days', priority: 'Low', color: 'bg-emerald-500' }
                ].map((task, i) => (
                  <div key={i} className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded border border-white/20 flex items-center justify-center shrink-0 hover:bg-emerald-500/20 hover:border-emerald-500 cursor-pointer transition-colors" />
                      <div>
                        <p className="text-sm font-bold text-slate-200">{task.title}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Due: {task.due}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${task.color} shadow-[0_0_8px_currentColor] opacity-80`} />
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{task.priority}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bulletin Board */}
            <div className="glass-card rounded-[2rem] border-white/[0.05] overflow-hidden">
              <div className="p-5 border-b border-white/[0.05] bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                    <Bell size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Bulletin Board</h3>
                    <p className="text-[10px] text-slate-500">Recent posts from the bulletin area.</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('announcements')}>Load</Button>
              </div>
              <div className="p-0 bg-black/20 flex flex-col divide-y divide-white/[0.05]">
                {[
                  { title: 'Mid-Semester Exam Schedule Released', author: 'Examination Cell', time: '2 hours ago', unread: true },
                  { title: 'Hackathon Registration Extended', author: 'Tech Club', time: '5 hours ago', unread: false },
                  { title: 'Campus Placement Drive: InfoSession', author: 'Placement Cell', time: '1 day ago', unread: false }
                ].map((post, i) => (
                  <div key={i} className="p-4 md:p-5 flex items-start gap-3 md:gap-4 hover:bg-white/[0.02] transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Bell size={14} className={post.unread ? 'text-amber-400' : 'text-slate-500'} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <p className={`text-sm font-bold ${post.unread ? 'text-white' : 'text-slate-300'}`}>{post.title}</p>
                        {post.unread && <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-1.5 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />}
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{post.author} • {post.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
