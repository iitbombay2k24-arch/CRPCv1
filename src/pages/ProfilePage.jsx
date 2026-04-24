import React, { useState } from 'react';
import {
  User, Settings, Shield, Mail, MapPin, Calendar, Camera, Save, LogOut,
  Bell, Lock, Smartphone, Trophy, Activity, Award, Star, Edit2, Flame, CheckCircle, PenTool
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
  
  // Flattening personalDetails into formData for easier editing
  const pd = user?.personalDetails || {};
  const [formData, setFormData] = useState({
    bio: user?.bio || 'Proud student of DYPIU, dedicated to learning and collaboration.',
    firstName: pd.firstName || user?.name || '',
    middleName: pd.middleName || '',
    lastName: pd.lastName || '',
    nameOnMarksheet: pd.nameOnMarksheet || user?.name || '',
    personalEmail: pd.personalEmail || '',
    mothersName: pd.mothersName || '',
    gender: pd.gender || '',
    dob: pd.dob || '',
    bloodGroup: pd.bloodGroup || '',
    hobbies: pd.hobbies || '',
    motherTongue: pd.motherTongue || '',
    otherLanguages: pd.otherLanguages || '',
    mobileNo: pd.mobileNo || '',
    alternatePhoneNo: pd.alternatePhoneNo || '',
    alternateMobileNo1: pd.alternateMobileNo1 || '',
    alternateMobileNo2: pd.alternateMobileNo2 || '',
    preferredContactHours: pd.preferredContactHours || '',
    skypeId: pd.skypeId || '',
    nationality: pd.nationality || 'Indian',
    domicile: pd.domicile || '',
    religion: pd.religion || '',
    category: pd.category || '',
    caste: pd.caste || '',
    subCaste: pd.subCaste || '',
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
      const { bio, ...personalDetailsFields } = formData;
      const updatePayload = {
        bio,
        personalDetails: {
          ...user.personalDetails,
          ...personalDetailsFields
        }
      };
      
      await updateDoc(doc(db, 'users', user.uid), updatePayload);
      setUser({ ...user, ...updatePayload });
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const inputClass = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.06] transition-all";
  const labelClass = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5";
  const reqClass = "text-rose-500 ml-1";

  const renderField = (name, label, type = "text", required = false) => (
    <div>
      <label className={labelClass}>{label} {required && <span className={reqClass}>*</span>}</label>
      {isEditing ? (
        <input type={type} name={name} value={formData[name]} onChange={handleChange} className={inputClass} />
      ) : (
        <div className="text-sm font-semibold text-slate-200 py-2 border-b border-white/[0.05]">
          {formData[name] || <span className="text-slate-600 italic">Not provided</span>}
        </div>
      )}
    </div>
  );

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
          <div className="p-1.5 bg-slate-900 rounded-3xl shadow-2xl">
            <Avatar name={user?.name} src={user?.avatarUrl} size="xl" className="w-28 h-28 rounded-2xl" />
          </div>
          <input type="file" id="avatar-input" className="hidden" accept="image/*" onChange={handleAvatarChange} />
          <label 
            htmlFor="avatar-input"
            className="absolute bottom-2 right-2 w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-xl hover:scale-110 cursor-pointer transition-transform border-2 border-slate-900"
          >
            {isUploading ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Camera size={14} />}
          </label>
        </div>
      </div>

      <div className="px-10 pb-10 flex flex-col lg:flex-row gap-10">
        {/* Left - Main Content */}
        <div className="flex-1 space-y-8">
          {/* Status Picker & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4">
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
                  <div className={`w-1.5 h-1.5 rounded-full ${s === 'online' ? 'bg-emerald-500 shadow-[0_0_6px_#8a9a86]' : s === 'away' ? 'bg-amber-500 shadow-[0_0_6px_#e8dcb9]' : 'bg-rose-500 shadow-[0_0_6px_#c88a83]'}`} />
                  {s}
                </button>
              ))}
            </div>
            
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button variant="primary" size="sm" icon={Save} onClick={handleSave}>Save Changes</Button>
                </>
              ) : (
                <Button variant="secondary" size="sm" icon={Edit2} onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              )}
            </div>
          </div>

          {/* Name & Bio */}
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">{user?.name}</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">
              Level {user?.roleLevel} · {user?.role}
            </p>
            <div className="mt-4">
              {isEditing ? (
                <div>
                  <label className={labelClass}>Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={3}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-3 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/40 resize-none"
                  />
                </div>
              ) : (
                <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">{user?.bio || formData.bio}</p>
              )}
            </div>
          </div>

          {/* Institutional Info (Read Only) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-white/[0.05] pt-7">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Academic Context</h4>
              {[
                { icon: Shield,   label: 'Registration ID', value: user?.prn || user?.uid.slice(0, 10).toUpperCase() },
                { icon: MapPin,   label: 'Division',        value: user?.division || 'Not Assigned' },
                { icon: Calendar, label: 'Academic Year',   value: user?.batch || '2025' },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                    <row.icon size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{row.label}</p>
                    <p className="text-sm font-bold text-slate-200">{row.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Security & Access</h4>
              {[
                { icon: Mail,       label: 'College Email ID', value: user?.email },
                { icon: Smartphone, label: '2FA / Device',  value: 'Enabled', badge: <Badge variant="success" size="xs">SECURE</Badge> },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                    <row.icon size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{row.label}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-200">{row.value}</p>
                      {row.badge}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Extended Student Personal Details Form */}
          <div className="pt-8 border-t border-white/[0.05]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                <User size={16} />
              </div>
              <h3 className="text-lg font-black text-white">Student Personal Details</h3>
            </div>
            
            <div className="glass-card rounded-2xl p-6 md:p-8 space-y-8">
              {/* Names row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {renderField('firstName', 'First Name', 'text', true)}
                {renderField('middleName', 'Middle Name')}
                {renderField('lastName', 'Last Name')}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderField('nameOnMarksheet', 'Name as it appears on 10th/12th mark sheet', 'text', true)}
                {renderField('mothersName', "Mother's Name", 'text', true)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderField('personalEmail', 'Personal Email')}
                {renderField('mobileNo', 'Mobile No.', 'tel', true)}
              </div>

              {/* Demographics Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className={labelClass}>Gender <span className={reqClass}>*</span></label>
                  {isEditing ? (
                    <select name="gender" value={formData.gender} onChange={handleChange} className={inputClass}>
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <div className="text-sm font-semibold text-slate-200 py-2 border-b border-white/[0.05]">{formData.gender || <span className="text-slate-600 italic">Not provided</span>}</div>
                  )}
                </div>
                {renderField('dob', 'Date of Birth', 'date', true)}
                <div>
                  <label className={labelClass}>Blood Group <span className={reqClass}>*</span></label>
                  {isEditing ? (
                    <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className={inputClass}>
                      <option value="">Select</option>
                      <option value="A+">A+</option><option value="A-">A-</option>
                      <option value="B+">B+</option><option value="B-">B-</option>
                      <option value="O+">O+</option><option value="O-">O-</option>
                      <option value="AB+">AB+</option><option value="AB-">AB-</option>
                    </select>
                  ) : (
                    <div className="text-sm font-semibold text-slate-200 py-2 border-b border-white/[0.05]">{formData.bloodGroup || <span className="text-slate-600 italic">Not provided</span>}</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {renderField('motherTongue', 'Mother Tongue', 'text', true)}
                {renderField('otherLanguages', 'Other Known Language')}
                {renderField('hobbies', 'Hobbies')}
              </div>

              {/* Alternate Contacts Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {renderField('alternatePhoneNo', 'Alternate Phone No.')}
                {renderField('alternateMobileNo1', 'Alternate Mobile No.1')}
                {renderField('alternateMobileNo2', 'Alternate Mobile No.2')}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderField('preferredContactHours', 'Preferred Contact Hours')}
                {renderField('skypeId', 'SkypeId')}
              </div>

              {/* Background Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className={labelClass}>Nationality <span className={reqClass}>*</span></label>
                  {isEditing ? (
                    <select name="nationality" value={formData.nationality} onChange={handleChange} className={inputClass}>
                      <option value="Indian">Indian</option>
                      <option value="NRI">NRI</option>
                      <option value="Foreign National">Foreign National</option>
                    </select>
                  ) : (
                    <div className="text-sm font-semibold text-slate-200 py-2 border-b border-white/[0.05]">{formData.nationality}</div>
                  )}
                </div>
                {renderField('domicile', 'Domicile', 'text', true)}
                <div>
                  <label className={labelClass}>Religion <span className={reqClass}>*</span></label>
                  {isEditing ? (
                    <select name="religion" value={formData.religion} onChange={handleChange} className={inputClass}>
                      <option value="">Select</option>
                      <option value="Hindu">Hindu</option>
                      <option value="Muslim">Muslim</option>
                      <option value="Christian">Christian</option>
                      <option value="Sikh">Sikh</option>
                      <option value="Jain">Jain</option>
                      <option value="Buddhist">Buddhist</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <div className="text-sm font-semibold text-slate-200 py-2 border-b border-white/[0.05]">{formData.religion || <span className="text-slate-600 italic">Not provided</span>}</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className={labelClass}>Category <span className={reqClass}>*</span></label>
                  {isEditing ? (
                    <select name="category" value={formData.category} onChange={handleChange} className={inputClass}>
                      <option value="">Select</option>
                      <option value="Open">Open</option>
                      <option value="OBC">OBC</option>
                      <option value="SC">SC</option>
                      <option value="ST">ST</option>
                      <option value="EWS">EWS</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <div className="text-sm font-semibold text-slate-200 py-2 border-b border-white/[0.05]">{formData.category || <span className="text-slate-600 italic">Not provided</span>}</div>
                  )}
                </div>
                {renderField('caste', 'Caste', 'text', true)}
                {renderField('subCaste', 'Sub Caste')}
              </div>

              {/* Signature Upload Placeholder */}
              <div className="pt-4">
                <label className={labelClass}>Upload Your Signature Here <span className={reqClass}>*</span></label>
                <p className="text-[10px] text-slate-500 mb-2">(Signature image should be 10-20 KB)</p>
                {isEditing ? (
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-32 bg-white/[0.02] border border-white/[0.08] border-dashed rounded-lg flex items-center justify-center text-slate-500">
                      <PenTool size={16} className="mr-2" /> <span className="text-xs">Browse...</span>
                    </div>
                    <p className="text-[10px] text-indigo-400 italic">Upload functionality integration pending</p>
                  </div>
                ) : (
                  <div className="h-12 w-32 bg-white/[0.02] border border-white/[0.05] rounded-lg flex items-center justify-center text-slate-600">
                    <span className="text-xs italic">Signature on file</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button variant="danger" icon={LogOut} onClick={handleLogout}>Log Out of System</Button>
          </div>
        </div>

        {/* Right - Sidebar */}
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
