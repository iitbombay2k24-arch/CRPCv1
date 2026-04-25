import React, { useState } from 'react';
import { 
  Lock, Shield, Mail, Smartphone, Monitor, MapPin, 
  Clock, AlertCircle, CheckCircle, ChevronRight, 
  ShieldCheck, RefreshCw, LogOut, Eye, EyeOff
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import useNotificationStore from '../store/notificationStore';

export default function SecurityPage() {
  const { user } = useAuthStore();
  const { info, success } = useNotificationStore();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [tfaEnabled, setTfaEnabled] = useState(false);

  const deviceActivity = [
    { id: 1, device: 'Windows PC', browser: 'Chrome', location: 'Pune, India', time: 'Active Now', current: true },
    { id: 2, device: 'iPhone 15 Pro', browser: 'Safari', location: 'Mumbai, India', time: '2 hours ago', current: false },
    { id: 3, device: 'MacBook Air', browser: 'Chrome', location: 'Pune, India', time: 'Yesterday, 10:45 PM', current: false },
  ];

  return (
    <div className="h-full flex flex-col bg-slate-950 animate-fade-in overflow-y-auto custom-scrollbar">
       {/* ─── Main Header ─── */}
       <div className="bg-indigo-900 border-b border-white/10 px-6 py-2 shrink-0">
          <h1 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Password & Sign-In Method</h1>
       </div>

       <div className="p-8 max-w-5xl mx-auto w-full space-y-4">
          
          {/* ─── Password Section ─── */}
          <SecurityRow 
            title="Password" 
            icon={Lock}
            onClick={() => setShowPasswordForm(!showPasswordForm)}
          >
             {showPasswordForm ? (
               <div className="pt-6 space-y-4 animate-slide-up">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">New Password</label>
                        <input type="password" placeholder="••••••••" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50" />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Confirm Password</label>
                        <input type="password" placeholder="••••••••" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50" />
                     </div>
                  </div>
                  <div className="flex justify-end gap-3">
                     <Button variant="ghost" size="sm" onClick={() => setShowPasswordForm(false)}>Cancel</Button>
                     <Button variant="primary" size="sm" onClick={() => { success('Password Updated', 'Your security credentials have been refreshed.'); setShowPasswordForm(false); }}>Update Password</Button>
                  </div>
               </div>
             ) : (
               <div className="flex items-center justify-between">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Last updated 14 days ago</p>
                  <button className="text-[10px] font-black text-indigo-400 hover:text-white uppercase tracking-widest transition-colors">Change Password</button>
               </div>
             )}
          </SecurityRow>

          {/* ─── Verification Section ─── */}
          <SecurityRow title="Verify Email Id and Mobile No." icon={ShieldCheck}>
             <div className="flex items-center justify-between">
                <div className="space-y-1">
                   <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                         <Mail size={12} className="text-emerald-500" />
                         <span className="text-xs font-bold text-slate-300">{user?.email}</span>
                         <Badge variant="success" size="xs">Verified</Badge>
                      </div>
                      <div className="w-px h-3 bg-white/10" />
                      <div className="flex items-center gap-2">
                         <Smartphone size={12} className="text-rose-500" />
                         <span className="text-xs font-bold text-slate-300">+91 7005XXXXXX</span>
                         <Badge variant="danger" size="xs">Unverified</Badge>
                      </div>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest animate-pulse">Verification process pending !!</span>
                   <button className="ml-4 px-4 py-1.5 bg-indigo-600/10 border border-indigo-600/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-indigo-600/20 transition-all">
                      Fix Now
                   </button>
                </div>
             </div>
          </SecurityRow>

          {/* ─── 2FA Section ─── */}
          <SecurityRow title="Two-Factor Authentication" icon={Shield}>
             <div className="flex items-center justify-between">
                <div>
                   <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                      Add an extra layer of security to your account by requiring a verification code in addition to your password.
                   </p>
                </div>
                <div className="flex items-center gap-4">
                   <span className={`text-[10px] font-black uppercase tracking-widest ${tfaEnabled ? 'text-emerald-500' : 'text-slate-600'}`}>
                      {tfaEnabled ? 'Currently Enabled' : 'Disabled'}
                   </span>
                   <button 
                     onClick={() => { setTfaEnabled(!tfaEnabled); info('2FA Status Changed', 'Security parameters updated.'); }}
                     className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-all ${tfaEnabled ? 'bg-emerald-600 justify-end' : 'bg-white/10 justify-start'}`}
                   >
                      <div className="w-4 h-4 bg-white rounded-full shadow-lg" />
                   </button>
                </div>
             </div>
          </SecurityRow>

          {/* ─── Device Activity ─── */}
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl overflow-hidden shadow-2xl">
             <div className="bg-indigo-950/20 px-6 py-4 border-b border-white/[0.05] flex items-center justify-between">
                <h3 className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-3">
                   <Monitor size={16} className="text-indigo-400" />
                   Device Activity
                </h3>
                <button className="text-[9px] font-black text-rose-500 hover:text-white uppercase tracking-widest flex items-center gap-1.5 transition-colors">
                   <LogOut size={12} /> Log out all other sessions
                </button>
             </div>
             <div className="divide-y divide-white/[0.03]">
                {deviceActivity.map(session => (
                   <div key={session.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/[0.01] transition-colors">
                      <div className="flex items-center gap-4">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${session.current ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-white/5 text-slate-500 border border-white/10'}`}>
                            {session.device.includes('iPhone') ? <Smartphone size={20} /> : <Monitor size={20} />}
                         </div>
                         <div>
                            <div className="flex items-center gap-2">
                               <p className="text-xs font-bold text-white">{session.device}</p>
                               {session.current && <Badge variant="success" size="xs">Current</Badge>}
                            </div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                               {session.browser} • {session.location}
                            </p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{session.time}</p>
                         {!session.current && (
                           <button className="text-[8px] font-black text-rose-500 hover:underline uppercase tracking-widest mt-1">Revoke Access</button>
                         )}
                      </div>
                   </div>
                ))}
             </div>
          </div>

       </div>
    </div>
  );
}

function SecurityRow({ title, icon: Icon, children, onClick }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl overflow-hidden hover:border-white/10 transition-all group">
       <div 
         className={`px-6 py-4 flex items-center justify-between cursor-pointer ${children ? 'bg-indigo-950/20 border-b border-white/[0.05]' : ''}`}
         onClick={onClick}
       >
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                <Icon size={16} />
             </div>
             <h3 className="text-[11px] font-black text-white uppercase tracking-widest">{title}</h3>
          </div>
          <ChevronRight size={16} className="text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
       </div>
       <div className="p-6 bg-transparent">
          {children}
       </div>
    </div>
  );
}
