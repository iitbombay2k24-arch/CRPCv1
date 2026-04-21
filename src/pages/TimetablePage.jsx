import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, Plus, Trash2, BookOpen } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { onTimetableChange, deleteTimetableSlot } from '../services/firestoreService';
import { hasPermission } from '../lib/rbac';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import AddTimetableSlotModal from '../modals/AddTimetableSlotModal';
import Spinner from '../components/ui/Spinner';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DAY_SHORT = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat' };

const TYPE_STYLES = {
  Lab:     'info',
  Lecture: 'neutral',
  Tutorial: 'purple',
};

export default function TimetablePage() {
  const { user } = useAuthStore();
  const [slots, setSlots] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const [selectedDay, setSelectedDay] = useState(today || 'Monday');

  useEffect(() => {
    const unsub = onTimetableChange(user.division || 'Division A', (data) => { setSlots(data); setIsLoading(false); });
    return () => unsub();
  }, [user.division]);

  const canEdit = hasPermission(user.role, 'CREATE_TIMETABLE');
  const handleDelete = async (id) => { if (window.confirm('Remove this slot?')) await deleteTimetableSlot(id); };

  const getGoogleCalendarLink = (slot) => {
    const todayStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const startTime = slot.timeStart.replace(/:/g, '') + '00';
    const endTime = slot.timeEnd.replace(/:/g, '') + '00';
    const text = encodeURIComponent(`DYPIU: ${slot.subject} (${slot.type})`);
    const details = encodeURIComponent(`Faculty: ${slot.faculty}\nRoom: ${slot.room}\nMode: ${slot.mode}`);
    const location = encodeURIComponent(slot.room || 'DYPIU Campus');
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${text}&details=${details}&location=${location}&dates=${todayStr}T${startTime}/${todayStr}T${endTime}`;
  };

  const filteredSlots = slots
    .filter((s) => s.day === selectedDay)
    .sort((a, b) => a.timeStart.localeCompare(b.timeStart));

  return (
    <div className="h-full flex flex-col min-w-0">
      {/* Header */}
      <div className="h-16 border-b border-white/[0.05] px-7 flex items-center justify-between bg-black/20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-sky-500/10 border border-sky-500/20 rounded-xl flex items-center justify-center text-sky-400">
            <Calendar size={18} />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">Class Timetable</h2>
            <p className="text-[11px] text-slate-500">{user.division || 'Division A'} schedule</p>
          </div>
        </div>
        {canEdit && (
          <Button onClick={() => setIsModalOpen(true)} variant="primary" icon={Plus}>Add Slot</Button>
        )}
      </div>

      {/* Day Tabs */}
      <div className="px-7 py-3.5 border-b border-white/[0.05] bg-black/10 shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {DAYS.map((day) => {
            const isActive = selectedDay === day;
            const isToday = day === today;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`
                  flex-1 min-w-[80px] py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap
                  ${isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-white/[0.07]'
                  }
                `}
              >
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{DAY_SHORT[day]}</span>
                {isToday && !isActive && (
                  <span className="ml-1 w-1 h-1 bg-indigo-400 rounded-full inline-block align-middle" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Schedule */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-7">
        <div className="max-w-3xl mx-auto space-y-4">
          {isLoading ? (
            <div className="h-64 flex items-center justify-center"><Spinner size="lg" /></div>
          ) : filteredSlots.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center border border-dashed border-white/[0.06] rounded-3xl">
              <Clock size={40} className="text-slate-700 mb-3" />
              <p className="text-slate-400 font-semibold">No classes on {selectedDay}</p>
              <p className="text-slate-600 text-sm">Enjoy your free time!</p>
            </div>
          ) : (
            filteredSlots.map((slot) => (
              <div
                key={slot.id}
                className="glass-card rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-5 group relative overflow-hidden"
              >
                {/* Left: Time */}
                <div className="flex flex-row sm:flex-col items-center sm:items-center justify-start sm:justify-center sm:min-w-[100px] sm:bg-white/[0.03] sm:border sm:border-white/[0.06] sm:rounded-2xl sm:py-3 px-0 sm:px-2 gap-3 sm:gap-0.5">
                  <span className="text-base font-black text-white">{slot.timeStart}</span>
                  <span className="text-[10px] font-bold text-slate-600 uppercase sm:block hidden">to</span>
                  <span className="text-xs text-slate-400 font-bold">{slot.timeEnd}</span>
                  <span className="sm:hidden text-slate-600">—</span>
                </div>

                {/* Right: Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant={TYPE_STYLES[slot.type] || 'neutral'} size="xs">{slot.type || 'Lecture'}</Badge>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold">
                      <MapPin size={11} className="text-indigo-400" /> {slot.room || 'TBD'}
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-white mb-1 uppercase tracking-tight">{slot.subject}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5"><User size={12} className="text-slate-600" />{slot.faculty}</span>
                    <span className="text-slate-700">·</span>
                    <span className="italic text-slate-600">{slot.mode || 'Offline'}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-[10px] px-3 py-1.5 border border-white/5 opacity-40 group-hover:opacity-100 hover:border-indigo-500/30 transition-all"
                    icon={Calendar}
                    onClick={() => window.open(getGoogleCalendarLink(slot), '_blank')}
                  >
                    Sync to GV
                  </Button>
                  {canEdit && (
                    <button
                      onClick={() => handleDelete(slot.id)}
                      className="p-1.5 text-slate-700 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all self-end"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AddTimetableSlotModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} division={user.division || 'Division A'} />
    </div>
  );
}
