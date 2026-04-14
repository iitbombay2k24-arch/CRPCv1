import React, { useState } from 'react';
import {
  User, Settings, Shield, Mail, MapPin, Calendar, Camera, Save, LogOut,
  Bell, Lock, Smartphone, Trophy, Activity, Award, Star, Edit2, Flame
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { logoutUser } from '../services/authService';
import { uploadFile } from '../services/firestoreService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import useNotificationStore from '../store/notificationStore';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { updateUserStatus } from '../services/firestoreService';

const STATS = [
  { icon: Flame,    label: 'Login Streak',    color: 'text-orange-500',  border: 'hover:border-orange-500/20',  key: 'streak' },
  { icon: Trophy,   label: 'Platform Score', color: 'text-amber-400',   border: 'hover:border-amber-500/20',   key: 'engagementScore' },
  { icon: Activity, label: 'Attendance',      color: 'text-emerald-400', border: 'hover:border-emerald-500/20', fixed: '92%' },
  { icon: Award,    label: 'Quizzes Taken',   color: 'text-rose-400',    border: 'hover:border-rose-500/20',    key: 'quizzesTaken' },
];

export default function ProfilePage() {
  const { user, setUser, setFirebaseUser } = useAuthStore();
  const { success, error } = useNotificationStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    division: user?.division || '',
    year: user?.year || '',
    bio: user?.bio || 'Proud student of DYPIU, dedicated to learning and collaboration.',
  });

  const handleLogout = async () => {
    if (window.confirm('Log out of your secure session?')) {
      await logoutUser();
      setUser(null);
      setFirebaseUser(null);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), formData);
      setUser({ ...user, ...formData });
      setIsEditing(false);
      success('Profile Updated', 'Your changes have been saved to our core matrix.');
    } catch (err) {
      error('Update Failed', 'An error occurred while synchronizing your profile.');
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setIsUploading(true);
    try {
      const url = await uploadFile(file, `avatars/${user.uid}`);
      await updateDoc(doc(db, 'users', user.uid), { avatarUrl: url });
      setUser({ ...user, avatarUrl: url });
      success('Avatar Updated', 'Your visual identity has been refreshed.');
    } catch (err) {
      error('Upload Failed', 'Matrix rejected the media stream.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar flex flex-col min-w-0">
      {/* Banner */}
      <div className="h-40 bg-gradient-to-r from-indigo-900/60 via-violet-900/40 to-slate-900 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2" />
      </div>

      {/* Avatar overlapping banner */}
      <div className="px-10 relative">
        <div className="-mt-16 mb-4 relative inline-block">
          <div className="p-1.5 bg-[#03040b] rounded-3xl shadow-2xl">
            <Avatar name={user?.name} src={user?.avatarUrl} size="xl" className="w-28 h-28 rounded-2xl" />
          </div>
          <input type="file" id="avatar-input" className="hidden" accept="image/*" onChange={handleAvatarChange} />
          <label 
            htmlFor="avatar-input"
            className="absolute bottom-2 right-2 w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-xl hover:scale-110 cursor-pointer transition-transform border-2 border-[#03040b]"
          >
            {isUploading ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Camera size={14} />}
          </label>
        </div>
      </div>

      <div className="px-10 pb-10 flex flex-col lg:flex-row gap-10">
        {/* Left */}
        <div className="flex-1 space-y-8">
          {/* Status Picker */}
          <div className="flex gap-2">
            {['online', 'away', 'busy'].map(s => (
              <button
                key={s}
                onClick={async () => {
                  await updateUserStatus(user.uid, s);
                  setUser({ ...user, status: s });
                  success('Presence Updated', `Status changed to ${s}`);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all
                  ${user?.status === s 
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' 
                    : 'bg-white/[0.02] border-white/[0.05] text-slate-500 hover:text-slate-300'
                  }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${s === 'online' ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]' : s === 'away' ? 'bg-amber-500 shadow-[0_0_6px_#f59e0b]' : 'bg-rose-500 shadow-[0_0_6px_#ef4444]'}`} />
                {s}
              </button>
            ))}
          </div>

          {/* Name & Bio */}
          <div>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">{user?.name}</h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                  Level {user?.roleLevel} · {user?.role}
                </p>
              </div>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button variant="primary" size="sm" icon={Save} onClick={handleSave}>Save</Button>
                  </>
                ) : (
                  <Button variant="secondary" size="sm" icon={Edit2} onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
            {isEditing ? (
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/40 resize-none"
              />
            ) : (
              <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">{user?.bio || formData.bio}</p>
            )}
          </div>

          {/* Academic & Security Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-white/[0.05] pt-7">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Academic Context</h4>
              {[
                { icon: Shield,   label: 'Registration ID', value: user?.uid.slice(0, 10).toUpperCase() },
                { icon: MapPin,   label: 'Division',        value: user?.division || 'Not Assigned' },
                { icon: Calendar, label: 'Academic Year',   value: user?.year || 'Freshman' },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-500 shrink-0">
                    <row.icon size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">{row.label}</p>
                    <p className="text-sm font-bold text-slate-200">{row.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Security & Contact</h4>
              {[
                { icon: Mail,       label: 'Primary Email', value: user?.email },
                { icon: Smartphone, label: '2FA / Device',  value: 'Enabled', badge: <Badge variant="success" size="xs">SECURE</Badge> },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-500 shrink-0">
                    <row.icon size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">{row.label}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-200">{row.value}</p>
                      {row.badge}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <Button variant="danger" icon={LogOut} onClick={handleLogout}>Log Out of System</Button>
          </div>
        </div>

        {/* Right */}
        <div className="w-full lg:w-80 space-y-5">
          {/* Performance Grid */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Academic Performance</h3>
            <div className="grid grid-cols-2 gap-3">
              {STATS.map((s) => (
                <div
                  key={s.label}
                  className={`bg-white/[0.03] border border-white/[0.06] ${s.border} p-4 rounded-2xl flex flex-col items-center text-center group cursor-default transition-all`}
                >
                  <s.icon size={20} className={`${s.color} mb-1.5 group-hover:scale-110 transition-transform`} />
                  <p className="text-xl font-black text-slate-200">
                    {s.fixed || (s.badgesKey ? user?.badges?.length || 0 : user?.[s.key] || 0)}
                  </p>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-wide mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Preferences */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-5">System Preferences</h3>
            <div className="space-y-5">
              {[
                { icon: Bell,       label: 'Desktop Notifications', on: true,  color: 'bg-indigo-500/10 text-indigo-400' },
                { icon: Lock,       label: 'Incognito Mode',         on: false, color: 'bg-white/[0.05] text-slate-500' },
                { icon: Smartphone, label: 'Mobile Sync',            on: true,  color: 'bg-emerald-500/10 text-emerald-400' },
              ].map((pref) => (
                <div key={pref.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${pref.color}`}>
                      <pref.icon size={14} />
                    </div>
                    <p className="text-sm font-semibold text-slate-300">{pref.label}</p>
                  </div>
                  <button className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-all
                    ${pref.on ? 'bg-indigo-600 justify-end' : 'bg-white/10 justify-start'}`}>
                    <div className="w-4 h-4 bg-white rounded-full shadow" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 glass-card rounded-2xl border-indigo-500/15">
            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Governance Note</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed italic">
              Role clearance upgrades require verification at the Registrar's Office.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
