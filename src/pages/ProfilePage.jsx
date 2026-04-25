import React, { useState, useEffect } from 'react';
import { 
  User, Settings, Shield, Mail, MapPin, Calendar, Camera, Save, LogOut,
  Bell, Lock, Smartphone, Trophy, Activity, Award, Star, Edit2, Flame, 
  CheckCircle, PenTool, Printer, Download, Plus, Search, ChevronRight,
  Stethoscope, GraduationCap, Briefcase, BookOpen, Microscope, Award as AwardIcon,
  Globe, FileText, Upload, CreditCard, Syringe, Users, ChevronLeft
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { logoutUser } from '../services/authService';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import useNotificationStore from '../store/notificationStore';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';

export default function ProfilePage() {
  const { user, setUser, setFirebaseUser } = useAuthStore();
  const { success, error } = useNotificationStore();
  const [activeTab, setActiveTab] = useState('Personal Details');
  const [isEditing, setIsEditing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const pd = user?.personalDetails || {};
  const [formData, setFormData] = useState({
    firstName: pd.firstName || user?.name?.split(' ')[0] || '',
    middleName: pd.middleName || '',
    lastName: pd.lastName || user?.name?.split(' ')[1] || '',
    nameOnMarksheet: pd.nameOnMarksheet || user?.name || '',
    personalEmail: pd.personalEmail || '',
    mothersName: pd.mothersName || '',
    gender: pd.gender || 'Male',
    dob: pd.dob || '',
    bloodGroup: pd.bloodGroup || '',
    hobbies: pd.hobbies || '',
    motherTongue: pd.motherTongue || '',
    otherLanguages: pd.otherLanguages || '',
    mobileNo: pd.mobileNo || '',
    alternatePhoneNo: pd.alternatePhoneNo || '',
    skypeId: pd.skypeId || '',
    nationality: pd.nationality || 'Indian',
    domicile: pd.domicile || '',
    religion: pd.religion || '',
    category: pd.category || '',
    caste: pd.caste || '',
    subCaste: pd.subCaste || '',
  });

  const profileTabs = [
    'Personal Details', 'Family Details', 'Medical Details', 'Qualification', 
    'Course Taught', 'Training', 'Conference/Seminar/Conclave', 'Workshop', 
    'Publications', 'Consultancy', 'Research Project', 'Research Guidance', 
    'Membership', 'Patents/Copyrights', 'Skill Upgradation', 'Work Experience', 
    'Research Interest', 'Significant Achievement', 'Appointment Status', 
    'Service Book', 'Self Contribution/ Addl.Responsibilities', 'Print Profile', 
    'Authority', 'Other Document Upload', 'Download All Documents', 
    'Bank Detail', 'Vaccination Details'
  ];

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = async () => {
    try {
      const updatePayload = { personalDetails: { ...user.personalDetails, ...formData } };
      await updateDoc(doc(db, 'users', user.uid), updatePayload);
      setUser({ ...user, ...updatePayload });
      setIsEditing(false);
      success('Profile Synchronized', 'Your credentials have been updated in the master database.');
    } catch (err) {
      error('Update Failed', err.message);
    }
  };

  const renderField = (label, name, value, type = "text") => (
    <div className="flex flex-col gap-1.5">
       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
       {isEditing ? (
         <input 
           type={type} 
           name={name} 
           value={formData[name]} 
           onChange={handleChange} 
           className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50" 
         />
       ) : (
         <div className="text-xs font-bold text-slate-200 py-1 border-b border-white/[0.03]">
           {value || <span className="text-slate-600 italic">Not Disclosed</span>}
         </div>
       )}
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-slate-950 animate-fade-in overflow-hidden">
      {/* ─── Breadcrumb Header ─── */}
      <div className="bg-black/40 border-b border-white/5 px-6 py-4 flex items-center justify-between shrink-0">
         <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest">
            <Star size={14} className="text-teal-400 fill-teal-400" />
            <span className="text-teal-400">Personal</span>
            <span className="text-slate-600">»</span>
            <span className="text-teal-400">Profiles</span>
         </div>
         <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
               {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()} {currentTime.toLocaleTimeString('en-US', { hour12: true })}
            </span>
            <div className="w-5 h-5 bg-teal-500/10 border border-teal-500/20 rounded flex items-center justify-center text-teal-400 cursor-pointer">
               <span className="font-bold">i</span>
            </div>
         </div>
      </div>

      {/* ─── Tab Matrix (ERP Style) ─── */}
      <div className="p-4 bg-white/[0.02] border-b border-white/5 shrink-0 overflow-x-auto no-scrollbar">
         <div className="flex flex-wrap gap-2 max-w-[1400px]">
            {profileTabs.map(tab => (
              <button
                key={tab}
                onClick={() => {
                   if (tab === 'Print Profile') window.print();
                   else if (tab === 'Download All Documents') success('Document Generation', 'Preparing PDF bundle...');
                   else setActiveTab(tab);
                }}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeTab === tab 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                  : 'bg-white/5 text-indigo-400 hover:bg-white/10 hover:text-white border border-white/5'
                }`}
              >
                {tab}
              </button>
            ))}
         </div>
      </div>

      {/* ─── Main Content Area ─── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
         <div className="max-w-6xl mx-auto space-y-8">
            
            {activeTab === 'Personal Details' ? (
              <div className="space-y-8 animate-slide-up">
                 {/* Identity Card */}
                 <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 flex flex-col md:flex-row gap-8 items-center md:items-start shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 flex gap-2">
                       {isEditing ? (
                         <Button variant="primary" size="sm" icon={Save} onClick={handleSave}>Apply Synchronization</Button>
                       ) : (
                         <Button variant="secondary" size="sm" icon={Edit2} onClick={() => setIsEditing(true)}>Modify Details</Button>
                       )}
                    </div>
                    
                    <div className="relative group shrink-0">
                       <Avatar name={user?.name} src={user?.avatarUrl} size="xl" className="w-32 h-32 rounded-[2rem] border-4 border-white/5 shadow-2xl" />
                       <div className="absolute inset-0 bg-black/40 rounded-[2rem] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer">
                          <Camera size={24} className="text-white" />
                       </div>
                    </div>

                    <div className="flex-1 space-y-6 pt-2">
                       <div>
                          <h2 className="text-3xl font-black text-white tracking-tighter">{user?.name}</h2>
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.3em] mt-1">{user?.role} · UID: {user?.uid.substring(0, 8).toUpperCase()}</p>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                          {renderField('Employee ID', 'email', user?.email)}
                          {renderField('Employee Name', 'name', user?.name)}
                          {renderField('Current Post', 'post', user?.role === 'SuperAdmin' ? 'Visiting Faculty (Super Admin)' : user?.role)}
                          {renderField('Primary Email', 'personalEmail', user?.email)}
                          {renderField('Date of Birth', 'dob', formData.dob || 'Jan 01, 1995')}
                          {renderField('Contact Number', 'mobileNo', formData.mobileNo || '+91 7005XXXXXX')}
                       </div>
                    </div>
                 </div>

                 {/* Detailed Sections */}
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* General Information */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 space-y-6">
                       <h3 className="text-xs font-black text-teal-400 uppercase tracking-widest flex items-center gap-3">
                          <Globe size={18} /> General Identity
                       </h3>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          {renderField('Nationality', 'nationality', formData.nationality)}
                          {renderField('Mother Tongue', 'motherTongue', formData.motherTongue)}
                          {renderField('Religion', 'religion', formData.religion)}
                          {renderField('Category', 'category', formData.category)}
                          {renderField('Caste', 'caste', formData.caste)}
                          {renderField('Sub Caste', 'subCaste', formData.subCaste)}
                       </div>
                    </div>

                    {/* Additional Details */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 space-y-6">
                       <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-3">
                          <Smartphone size={18} /> Technical & Social
                       </h3>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          {renderField('Skype ID', 'skypeId', formData.skypeId)}
                          {renderField('Alt. Mobile', 'alternatePhoneNo', formData.alternatePhoneNo)}
                          {renderField('Domicile', 'domicile', formData.domicile)}
                          {renderField('Blood Group', 'bloodGroup', formData.bloodGroup)}
                          <div className="col-span-2">
                             {renderField('Hobbies / Interests', 'hobbies', formData.hobbies)}
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            ) : (
              <div className="animate-fade-in flex flex-col items-center justify-center py-40 bg-white/[0.01] border border-dashed border-white/10 rounded-[3rem]">
                 <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 text-slate-800">
                    {activeTab === 'Medical Details' ? <Stethoscope size={48} /> : 
                     activeTab === 'Qualification' ? <GraduationCap size={48} /> : 
                     activeTab === 'Work Experience' ? <Briefcase size={48} /> : 
                     <FileText size={48} />}
                 </div>
                 <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">{activeTab}</h3>
                 <p className="text-slate-500 text-xs font-bold uppercase tracking-widest italic">No Data Records Found for the Selected Module</p>
                 <button className="mt-8 px-6 py-2 bg-indigo-600/10 border border-indigo-600/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-600/20 transition-all flex items-center gap-2">
                    <Plus size={14} /> Initialize Record Entry
                 </button>
              </div>
            )}
         </div>
      </div>

      {/* ─── Global Footer Actions ─── */}
      <div className="px-8 py-4 bg-black/40 border-t border-white/5 flex items-center justify-between shrink-0">
         <button onClick={handleLogout} className="text-[10px] font-black text-rose-500 hover:text-rose-400 uppercase tracking-widest flex items-center gap-2">
            <LogOut size={14} /> Terminate Secure Session
         </button>
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
               <Shield size={12} /> Encrypted Transmission Active
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
               <Globe size={12} /> Cluster: AP-SOUTH-01
            </div>
         </div>
      </div>
    </div>
  );
}
