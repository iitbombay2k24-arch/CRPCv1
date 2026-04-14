import React, { useState } from 'react';
import { 
  BookOpen, 
  MapPin, 
  User, 
  Clock, 
  Calendar,
  Send
} from 'lucide-react';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import useAuthStore from '../store/authStore';
import { createTimetableSlot } from '../services/firestoreService';

export default function AddTimetableSlotModal({ isOpen, onClose, division }) {
  const { user } = useAuthStore();
  const [subject, setSubject] = useState('');
  const [faculty, setFaculty] = useState(user.name);
  const [room, setRoom] = useState('');
  const [day, setDay] = useState('Monday');
  const [timeStart, setTimeStart] = useState('09:00');
  const [timeEnd, setTimeEnd] = useState('10:00');
  const [type, setType] = useState('Lecture');
  const [mode, setMode] = useState('Offline');
  const [isLoading, setIsLoading] = useState(false);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const types = ['Lecture', 'Lab', 'Seminar', 'Tutorial'];
  const modes = ['Offline', 'Online', 'Hybrid'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || isLoading) return;

    setIsLoading(true);
    try {
      await createTimetableSlot({
        subject: subject.trim(),
        faculty: faculty.trim(),
        room: room.trim(),
        day,
        timeStart,
        timeEnd,
        type,
        mode,
        division,
        createdBy: user.uid
      });
      setSubject('');
      setRoom('');
      onClose();
    } catch (error) {
      console.error('Error adding slot:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Class Slot" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <header className="mb-4">
          <p className="text-xs text-slate-500 italic">Adding a new class for <strong>{division}</strong>. This will be visible to all students in this division.</p>
        </header>

        <div className="space-y-5">
          {/* Subject & Faculty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Subject Name</label>
                <div className="relative group">
                  <BookOpen size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400" />
                  <input 
                    type="text" 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Cloud Computing"
                    className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-2 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
                    required
                  />
                </div>
             </div>
             <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Faculty Name</label>
                <div className="relative group">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400" />
                  <input 
                    type="text" 
                    value={faculty}
                    onChange={(e) => setFaculty(e.target.value)}
                    placeholder="e.g. Dr. Patil"
                    className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-2 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all text-sm font-semibold text-slate-400"
                    required
                  />
                </div>
             </div>
          </div>

          {/* Day & Time */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
             <div className="col-span-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Day of Week</label>
                <select 
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-2 px-4 text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all text-sm appearance-none"
                >
                  {days.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
             </div>
             <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Start Time</label>
                <input 
                  type="time" 
                  value={timeStart}
                  onChange={(e) => setTimeStart(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-2 px-2 text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all text-sm appearance-none"
                  required
                />
             </div>
             <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">End Time</label>
                <input 
                  type="time" 
                  value={timeEnd}
                  onChange={(e) => setTimeEnd(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-2 px-2 text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all text-sm appearance-none"
                  required
                />
             </div>
          </div>

          {/* Room, Type, Mode */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Location / Room</label>
                <div className="relative group">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400" />
                  <input 
                    type="text" 
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="e.g. Lab 402"
                    className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-2 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
                    required
                  />
                </div>
             </div>
             <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Type</label>
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-2 px-4 text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all text-sm appearance-none"
                >
                  {types.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
             </div>
             <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Mode</label>
                <select 
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-2 px-4 text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all text-sm appearance-none"
                >
                  {modes.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
             </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-700/50">
          <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
          <Button 
            variant="primary" 
            type="submit" 
            loading={isLoading} 
            icon={Send}
            className="px-10"
          >
            Create Slot
          </Button>
        </div>
      </form>
    </Modal>
  );
}
