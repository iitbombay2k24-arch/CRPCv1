import React, { useState } from 'react';
import { Briefcase, Building2, Calendar, DollarSign, X, AlertCircle } from 'lucide-react';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { createPlacementDrive } from '../services/firestoreService';

export default function CreateDriveModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    date: '',
    package: '',
    status: 'Open'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.company || !formData.role || !formData.date || !formData.package) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await createPlacementDrive(formData);
      setFormData({ company: '', role: '', date: '', package: '', status: 'Open' });
      onClose();
    } catch (err) {
      console.error('Failed to create drive:', err);
      setError('Failed to create placement drive.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule Placement Drive" size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <p className="text-xs text-slate-500 mb-4">Announce a new placement or internship drive to the students.</p>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl flex items-center gap-3 text-rose-500 text-xs font-bold animate-shake">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Company Name</label>
            <div className="relative">
              <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="e.g. Google, Microsoft, TCS"
                className="w-full bg-slate-900 border border-slate-700/50 rounded-xl pl-9 pr-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500/50 text-sm"
              />
            </div>
          </div>

          <div className="col-span-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Role Offered</label>
            <div className="relative">
              <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                name="role"
                value={formData.role}
                onChange={handleChange}
                placeholder="e.g. Software Engineer, Analyst"
                className="w-full bg-slate-900 border border-slate-700/50 rounded-xl pl-9 pr-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500/50 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Drive Date</label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                name="date"
                value={formData.date}
                onChange={handleChange}
                placeholder="e.g. Oct 28 or 'Next Week'"
                className="w-full bg-slate-900 border border-slate-700/50 rounded-xl pl-9 pr-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500/50 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">CTC / Package</label>
            <div className="relative">
              <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                name="package"
                value={formData.package}
                onChange={handleChange}
                placeholder="e.g. 12 LPA"
                className="w-full bg-slate-900 border border-slate-700/50 rounded-xl pl-9 pr-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500/50 text-sm"
              />
            </div>
          </div>

          <div className="col-span-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Initial Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500/50 text-sm"
            >
              <option value="Open">Open (Accepting Applications)</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Selection Done">Selection Done</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
          <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
          <Button variant="primary" type="submit" loading={isLoading} icon={Briefcase}>
            Post Drive
          </Button>
        </div>
      </form>
    </Modal>
  );
}
