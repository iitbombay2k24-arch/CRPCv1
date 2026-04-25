import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin, 
  Bell, 
  Trash2, 
  CheckCircle, 
  AlertTriangle,
  BookOpen,
  Trophy
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import useNotificationStore from '../store/notificationStore';

const HOLIDAYS_2026 = [
  // January 2026
  { date: '2026-01-01', name: "New Year's Day", type: 'Holiday' },
  { date: '2026-01-05', name: "Commencement of Winter Semester", type: 'Academic' },
  { date: '2026-01-07', name: "Supplementary Exams Start", type: 'Exam' },
  { date: '2026-01-08', name: "Last Date: Winter Semester Fees", type: 'Admin' },
  { date: '2026-01-14', name: "Makar Sankranti", type: 'Holiday' },
  { date: '2026-01-15', name: "Last Date: Fees with Late Fine", type: 'Admin' },
  { date: '2026-01-16', name: "Cultural & Sports Events Start", type: 'Event' },
  { date: '2026-01-20', name: "PhD Presentations / Registration Validation", type: 'Academic' },
  { date: '2026-01-26', name: "Republic Day", type: 'Holiday' },
  
  // February 2026
  { date: '2026-02-05', name: "Convocation Ceremony", type: 'Event' },
  { date: '2026-02-19', name: "Shivaji Maharaj Jayanti", type: 'Holiday' },
  { date: '2026-02-28', name: "National Science Day", type: 'Event' },
  
  // March 2026
  { date: '2026-03-04', name: "Holi (2nd Day)", type: 'Holiday' },
  { date: '2026-03-10', name: "Mid-Semester Exams Start", type: 'Exam' },
  { date: '2026-03-13', name: "Foundation Day", type: 'Event' },
  { date: '2026-03-18', name: "Mid-Semester Results", type: 'Academic' },
  { date: '2026-03-19', name: "Gudi Padwa", type: 'Holiday' },
  { date: '2026-03-26', name: "Ram Navami", type: 'Holiday' },
  
  // April 2026
  { date: '2026-04-03', name: "Good Friday", type: 'Holiday' },
  { date: '2026-04-14', name: "Dr. B. R. Ambedkar Jayanti", type: 'Holiday' },
  { date: '2026-04-22', name: "Eligible List to Exam Cell", type: 'Admin' },
  { date: '2026-04-25', name: "Practical/Oral Exams Start", type: 'Exam' },
  { date: '2026-04-30', name: "Eligible List to COE", type: 'Admin' },
  
  // May 2026
  { date: '2026-05-01', name: "Maharashtra Day / Buddha Purnima", type: 'Holiday' },
  { date: '2026-05-05', name: "Last Instructional Day", type: 'Academic' },
  { date: '2026-05-07', name: "End-Term Exams Start", type: 'Exam' },
  { date: '2026-05-11', name: "National Technology Day", type: 'Event' },
  { date: '2026-05-25', name: "Result Declaration / PhD Qualifying", type: 'Academic' },
  { date: '2026-05-27', name: "Bakrid", type: 'Holiday' },
  { date: '2026-05-28', name: "PhD Progress Presentations", type: 'Academic' },
  
  // June 2026
  { date: '2026-06-02', name: "Supplementary Exams Start", type: 'Exam' },
  { date: '2026-06-23', name: "Supplementary Results", type: 'Academic' },
  { date: '2026-06-24', name: "Monsoon Semester Registration Start", type: 'Admin' },
  
  // July 2026
  { date: '2026-07-15', name: "Commencement of Monsoon Semester", type: 'Academic' },
  { date: '2026-07-22', name: "Monsoon Fees: Last Day Late Fine", type: 'Admin' },
  { date: '2026-07-30', name: "Validation of Registration", type: 'Admin' },
];

export default function CalendarPage() {
  const { user } = useAuthStore();
  const { success, error, info } = useNotificationStore();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Event Form State
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'Task',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    description: ''
  });

  // Listen for personal events
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'personalEvents'), where('userId', '==', user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEvents(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  // Alert Checker (runs every minute)
  useEffect(() => {
    const checkAlerts = () => {
      const now = new Date();
      const currentIsoDate = now.toISOString().split('T')[0];
      const currentIsoTime = now.toTimeString().split(' ')[0].substring(0, 5);

      events.forEach(event => {
        if (event.date === currentIsoDate && event.time === currentIsoTime && !event.notified) {
          // Trigger browser notification or toast
          if (Notification.permission === 'granted') {
             new Notification(`Event Started: ${event.title}`, { body: event.description });
          }
          info(`Active Event: ${event.title}`, event.description || 'Your scheduled task is starting now.');
          // Marking as notified would require a Firestore update, for demo we just show the toast
        }
      });
    };

    const interval = setInterval(checkAlerts, 60000);
    return () => clearInterval(interval);
  }, [events, info]);

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const handleAddEvent = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'personalEvents'), {
        ...newEvent,
        userId: user.uid,
        createdAt: serverTimestamp()
      });
      setIsModalOpen(false);
      success('Event Scheduled', 'Syncing with your personal university calendar.');
      setNewEvent({ title: '', type: 'Task', date: new Date().toISOString().split('T')[0], time: '09:00', description: '' });
    } catch (err) {
      error('Failed to Save', err.message);
    }
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    
    const days = [];
    for (let i = 0; i < startDay; i++) days.push(<div key={`empty-${i}`} className="h-24 sm:h-32 bg-white/[0.01]" />);
    
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = new Date().toISOString().split('T')[0] === dateStr;
      const dayEvents = events.filter(e => e.date === dateStr);
      const holiday = HOLIDAYS_2026.find(h => h.date === dateStr);

      days.push(
        <div key={day} className={`h-24 sm:h-32 border border-white/[0.03] p-2 relative hover:bg-white/[0.02] transition-colors group ${isToday ? 'bg-indigo-500/5' : ''}`}>
          <div className="flex justify-between items-start">
             <span className={`text-xs font-black ${isToday ? 'bg-indigo-500 text-white w-6 h-6 rounded-lg flex items-center justify-center' : 'text-slate-500'}`}>
                {day}
             </span>
             {holiday && <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" title={holiday.name} />}
          </div>

          <div className="mt-2 space-y-1 overflow-y-auto max-h-[calc(100%-24px)] no-scrollbar">
             {holiday && (
               <div className="text-[9px] bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded border border-rose-500/20 truncate font-black uppercase">
                 {holiday.name}
               </div>
             )}
             {dayEvents.map(event => (
               <div key={event.id} className={`text-[9px] px-1.5 py-0.5 rounded truncate font-bold border ${
                 event.type === 'Assignment' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                 event.type === 'Quiz' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
               }`}>
                 {event.time} • {event.title}
               </div>
             ))}
          </div>

          <button 
            onClick={() => { setNewEvent({...newEvent, date: dateStr}); setIsModalOpen(true); }}
            className="absolute bottom-2 right-2 p-1 bg-white/5 rounded-lg text-slate-600 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
          >
            <Plus size={12} />
          </button>
        </div>
      );
    }
    return days;
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 animate-fade-in overflow-hidden">
      {/* Header */}
      <div className="h-16 px-8 border-b border-white/[0.05] flex items-center justify-between shrink-0 bg-black/20">
         <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
               <CalendarIcon size={18} />
            </div>
            <div>
               <h2 className="text-sm font-black text-white uppercase tracking-widest">Personal Workspace Calendar</h2>
               <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Syncing Personal Reminders & Academic Deadlines</p>
            </div>
         </div>

         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               <button onClick={handlePrevMonth} className="p-2 hover:bg-white/5 rounded-xl transition-all text-slate-500 hover:text-white"><ChevronLeft size={20} /></button>
               <h3 className="text-sm font-black text-white uppercase tracking-widest min-w-[140px] text-center">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
               </h3>
               <button onClick={handleNextMonth} className="p-2 hover:bg-white/5 rounded-xl transition-all text-slate-500 hover:text-white"><ChevronRight size={20} /></button>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>Add Event</Button>
         </div>
      </div>

      {/* Legend & Stats */}
      <div className="px-8 py-3 bg-white/[0.02] border-b border-white/[0.05] flex items-center gap-6">
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Assignments</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Quizzes</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Personal Tasks</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Holidays</span>
         </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
         <div className="grid grid-cols-7 bg-white/[0.02] border-b border-white/[0.05]">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-3 text-center text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">{day}</div>
            ))}
         </div>
         <div className="grid grid-cols-7 auto-rows-fr">
            {renderCalendar()}
         </div>
      </div>

      {/* Event Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule Event" size="md">
         <form onSubmit={handleAddEvent} className="space-y-6">
            <div className="space-y-4">
               <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Event Title</label>
                  <input 
                    type="text" 
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                    placeholder="e.g. Physics Assignment Submission"
                    className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none focus:border-indigo-500/50 text-sm"
                    required
                  />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Category</label>
                     <select 
                       value={newEvent.type}
                       onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}
                       className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none focus:border-indigo-500/50 text-sm"
                     >
                        <option value="Task">Personal Task</option>
                        <option value="Assignment">Assignment</option>
                        <option value="Quiz">Quiz Reminder</option>
                     </select>
                  </div>
                  <div>
                     <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Start Time (24h)</label>
                     <input 
                       type="time" 
                       value={newEvent.time}
                       onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                       className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none focus:border-indigo-500/50 text-sm"
                       required
                     />
                  </div>
               </div>

               <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Date</label>
                  <input 
                    type="date" 
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none focus:border-indigo-500/50 text-sm"
                    required
                  />
               </div>

               <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Brief Description</label>
                  <textarea 
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                    placeholder="Provide context for this reminder..."
                    rows={3}
                    className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none focus:border-indigo-500/50 text-sm resize-none"
                  />
               </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
               <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Discard</Button>
               <Button variant="primary" type="submit">Synchronize to Calendar</Button>
            </div>
         </form>
      </Modal>
    </div>
  );
}
