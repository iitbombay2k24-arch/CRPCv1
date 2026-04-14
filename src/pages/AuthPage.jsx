import React, { useState } from 'react';
import { loginUser, registerUser } from '../services/authService';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';
import Input from '../components/ui/Input';

import {
  Lock, Mail, User, GraduationCap, Briefcase, ArrowLeft,
  Sparkles, Shield, Zap, Users, ChevronRight
} from 'lucide-react';

const FEATURES = [
  { icon: Zap, label: 'Real-Time Sync', desc: 'WebSocket-powered chat & notifications' },
  { icon: Shield, label: 'Zero-Trust Security', desc: 'RBAC with 4 clearance levels & DLP' },
  { icon: Users, label: 'Campus Collaboration', desc: 'Chat, Q&A, tasks, quizzes & placement' },
  { icon: Sparkles, label: 'AI-Powered Analytics', desc: 'Engagement scores & smart leaderboards' },
];

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [prn, setPrn] = useState('');
  const [testRole, setTestRole] = useState('Student');
  const [isLoading, setIsLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const { setUser } = useAuthStore();
  const { success, error } = useNotificationStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (mode === 'login') {
        const userProfile = await loginUser(email, password);
        if (userProfile) { setUser(userProfile); success('Welcome back!'); }
      } else if (mode === 'register') {
        const finalPrn = testRole !== 'Student' ? `ROLE_${testRole}` : prn;
        const profile = await registerUser({
          email, password, name,
          prn: finalPrn.startsWith('ROLE_') ? '' : finalPrn,
          role: finalPrn.startsWith('ROLE_') ? finalPrn.split('_')[1] : 'Student',
        });
        setUser(profile);
        success('Account created!', 'Welcome to DYPIU Collab');
      } else if (mode === 'forgot') {
        if (!email) { error('Enter your email address'); return; }
        await sendPasswordResetEmail(auth, email);
        setForgotSent(true);
        success('Reset link sent! Check your inbox.', 'Email Sent');
      }
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        // If login fails, try to automatically register them so they don't have to switch tabs.
        if (mode === 'login') {
           try {
              const finalPrn = testRole !== 'Student' ? `ROLE_${testRole}` : prn;
              const profile = await registerUser({
                email, password, name: email.split('@')[0],
                prn: finalPrn.startsWith('ROLE_') ? '' : finalPrn,
                role: finalPrn.startsWith('ROLE_') ? finalPrn.split('_')[1] : 'Student',
              });
              setUser(profile);
              success('Auto-created account for testing!', 'Welcome to DYPIU Collab');
              return;
           } catch(autoRegisterErr) {
              error(autoRegisterErr.message, 'Auto-Register Failed');
           }
        }
      }
      error(err.message || 'Authentication failed', 'Auth Error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#03040b] flex items-center justify-center relative overflow-hidden p-4">
      {/* Mesh Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] bg-indigo-600/10 rounded-full blur-[120px] -translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 right-0 w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-violet-600/8 rounded-full blur-[100px] translate-x-1/4 translate-y-1/4" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <div
        className="
          w-full max-w-5xl flex rounded-3xl overflow-hidden relative z-10
          border border-white/[0.06]
          shadow-2xl shadow-black/70
          bg-black/40 backdrop-blur-2xl
        "
        style={{ minHeight: '640px' }}
      >
        {/* ══ LEFT PANEL ══ */}
        <div className="hidden lg:flex lg:w-5/12 flex-col justify-between p-10 relative overflow-hidden border-r border-white/[0.05]">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-transparent to-violet-600/5 pointer-events-none" />
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

          {/* Logo */}
          <div className="relative">
            <div className="inline-flex items-center gap-3 mb-10">
              <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <GraduationCap size={22} className="text-white" />
              </div>
              <div>
                <p className="text-white font-black text-lg tracking-tighter leading-none">
                  DYPIU <span className="premium-gradient-text">COLLAB</span>
                </p>
                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-0.5">
                  Intelligence. Unity.
                </p>
              </div>
            </div>

            <h1 className="text-3xl font-extrabold text-white leading-[1.15] mb-4 tracking-tight">
              The Academic OS<br />for{' '}
              <span className="premium-gradient-text">DYPIU</span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              A secure enterprise platform for real-time collaboration, quizzes, placement tracking & campus-wide communication.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/[0.08] transition-all group"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-600/20 flex items-center justify-center text-indigo-400 shrink-0 group-hover:scale-110 transition-transform">
                  <f.icon size={15} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-200">{f.label}</p>
                  <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
            <p className="text-[9px] text-slate-700 font-bold uppercase tracking-widest text-center pt-2">
              Platform v4.0.0 — Firestore + RBAC + DLP
            </p>
          </div>
        </div>

        {/* ══ RIGHT PANEL ══ */}
        <div className="w-full lg:w-7/12 flex flex-col justify-center items-center p-8 sm:p-14">
          {/* Forgot Sent State */}
          {mode === 'forgot' && forgotSent ? (
            <div className="w-full max-w-sm text-center space-y-6 animate-fade-in">
              <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <Mail size={36} className="text-emerald-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Check your inbox</h2>
                <p className="text-slate-400 text-sm">
                  We sent a reset link to{' '}
                  <span className="text-indigo-400 font-bold">{email}</span>.
                </p>
              </div>
              <button
                onClick={() => { setMode('login'); setForgotSent(false); }}
                className="w-full h-12 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft size={16} /> Back to Login
              </button>
            </div>
          ) : (
            <div className="w-full max-w-sm">
              {/* Mode Switcher */}
              {mode !== 'forgot' && (
                <div className="flex bg-white/[0.04] border border-white/[0.08] rounded-2xl p-1 mb-10">
                  {[['login', 'Sign In'], ['register', 'Create Account']].map(([m, label]) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`
                        flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all
                        ${mode === m
                          ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/25'
                          : 'text-slate-500 hover:text-slate-300'
                        }
                      `}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {/* Forgot Header */}
              {mode === 'forgot' && (
                <div className="mb-8">
                  <button
                    onClick={() => setMode('login')}
                    className="flex items-center gap-2 text-slate-500 hover:text-white text-xs font-bold mb-5 transition-colors"
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                  <h2 className="text-2xl font-bold text-white mb-1.5">Reset Password</h2>
                  <p className="text-slate-400 text-sm">Enter your university email and we'll send a reset link.</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'register' && (
                  <div className="space-y-4 animate-fade-in">
                    <Input label="Full Legal Name" placeholder="e.g. Yash Marathe" leftIcon={User} value={name} onChange={(e) => setName(e.target.value)} required />
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="PRN Number" placeholder="2021..." leftIcon={Briefcase} value={prn} onChange={(e) => setPrn(e.target.value)} />
                      <div>
                        <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">
                          Dev Role
                        </label>
                        <select
                          className="w-full h-11 px-3 bg-indigo-600/10 border border-indigo-500/30 rounded-xl text-indigo-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                          value={testRole}
                          onChange={(e) => setTestRole(e.target.value)}
                        >
                          <option value="Student">Student (L1)</option>
                          <option value="Faculty">Faculty (L2)</option>
                          <option value="Admin">Admin (L3)</option>
                          <option value="SuperAdmin">Super Admin (L4)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <Input
                  label="University Email"
                  type="email"
                  placeholder={mode === 'register' ? 'any@email.com' : 'your@email.com'}
                  leftIcon={Mail}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  helperText={mode === 'register' ? 'Any email accepted (test mode)' : ''}
                />

                {mode !== 'forgot' && (
                  <div>
                    <Input
                      label="Password"
                      type="password"
                      placeholder="••••••••"
                      leftIcon={Lock}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      helperText={mode === 'register' ? 'Min 6 characters' : ''}
                    />
                    {mode === 'login' && (
                      <div className="flex justify-end mt-2">
                        <button
                          type="button"
                          onClick={() => setMode('forgot')}
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
                        >
                          Forgot Password?
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="
                    w-full h-12 mt-2
                    bg-gradient-to-r from-indigo-600 to-violet-600
                    hover:from-indigo-500 hover:to-violet-500
                    text-white font-bold rounded-2xl transition-all
                    shadow-lg shadow-indigo-600/25 hover:shadow-indigo-500/40
                    flex items-center justify-center gap-2
                    disabled:opacity-50 disabled:cursor-not-allowed
                    active:scale-[0.98]
                  "
                >
                  {isLoading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>
                        {mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Send Reset Link'}
                      </span>
                      <ChevronRight size={16} className="opacity-60" />
                    </>
                  )}
                </button>
              </form>

              {mode === 'login' && (
                <p className="text-center text-[10px] text-slate-600 mt-8 leading-relaxed">
                  By signing in, you agree to DYPIU Collab{' '}
                  <span className="text-indigo-500">Terms of Use</span> and confirm your institutional credentials.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
