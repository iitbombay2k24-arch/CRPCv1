import React, { useEffect, useState, lazy, Suspense } from 'react';
import useAuthStore from './store/authStore';
import useUIStore from './store/uiStore';
import useChannelStore from './store/channelStore';
import { onAuthChange, logoutUser, resendVerificationEmail, refreshCurrentUser } from './services/authService';
import { onChannelsChange, updateUserStatus, updateUserStreak, onPlatformConfigChange } from './services/firestoreService';
import useNotificationStore from './store/notificationStore';
import { canAccessTab } from './lib/rbac';
import { Mail, MessageSquarePlus, ShieldAlert, AlertTriangle } from 'lucide-react';
// Lazy load pages for performance optimization
const AuthPage = lazy(() => import('./pages/AuthPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const AnnouncementPage = lazy(() => import('./pages/AnnouncementPage'));
const ResourcePage = lazy(() => import('./pages/ResourcePage'));
const QAPage = lazy(() => import('./pages/QAPage'));
const TaskBoardPage = lazy(() => import('./pages/TaskBoardPage'));
const TimetablePage = lazy(() => import('./pages/TimetablePage'));
const AttendancePage = lazy(() => import('./pages/AttendancePage'));
const GrievancePage = lazy(() => import('./pages/GrievancePage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const DMPage = lazy(() => import('./pages/DMPage'));
const BookmarksPage = lazy(() => import('./pages/BookmarksPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const QuizPage = lazy(() => import('./pages/QuizPage'));
const PlacementPage = lazy(() => import('./pages/PlacementPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const FocusPage = lazy(() => import('./pages/FocusPage'));
const ResumeAnalyzerPage = lazy(() => import('./pages/ResumeAnalyzerPage'));
const InterviewForumPage = lazy(() => import('./pages/InterviewForumPage'));
const GroupStudyPage = lazy(() => import('./pages/GroupStudyPage'));
const CampusBlogPage = lazy(() => import('./pages/CampusBlogPage'));
const KioskPage = lazy(() => import('./pages/KioskPage'));

import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import Spinner, { PageLoader } from './components/ui/Spinner';
import ToastContainer from './components/ui/Toast';
import GlobalSearchModal from './components/layout/GlobalSearchModal';

export default function App() {
  const { user, firebaseUser, isLoading, setUser, setFirebaseUser, setLoading } = useAuthStore();
  const { setChannels } = useChannelStore();
  const { activeTab, dmTarget, setActiveTab } = useUIStore();
  const { success, error } = useNotificationStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [platformConfig, setPlatformConfig] = useState(null);

  useEffect(() => {
    const handleOpenSearch = () => setIsSearchOpen(true);
    window.addEventListener('open-global-search', handleOpenSearch);
    return () => window.removeEventListener('open-global-search', handleOpenSearch);
  }, []);


  // 1. Listen for Auth State Changes
  useEffect(() => {
    const unsubscribe = onAuthChange((fbUser, profile) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        setUser(profile);
        updateUserStatus(fbUser.uid, 'online');
        updateUserStreak(fbUser.uid);
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setLoading(false);
    });

    const unsubscribeConfig = onPlatformConfigChange((data) => {
      setPlatformConfig(data);
    });

    // Handle session end presence
    const handleUnload = () => {
      if (user?.uid) {
        updateUserStatus(user.uid, 'offline');
      }
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      unsubscribe();
      unsubscribeConfig();
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [setFirebaseUser, setUser, setLoading, user?.uid]);

  // 2. Listen for Channel Changes (Real-time)
  useEffect(() => {
    if (!user) return;
    const unsubscribe = onChannelsChange((channels) => {
      setChannels(channels);
    });
    return () => unsubscribe();
  }, [user, setChannels]);

  // Loading Screen
  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center">
        <PageLoader message="Initializing Secure Connection..." />
      </div>
    );
  }

  // Maintenance Mode Gate
  if (platformConfig?.isMaintenanceMode && user?.roleLevel < 4) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-center p-6">
         <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex items-center justify-center text-amber-500 mb-8 animate-pulse">
            <ShieldAlert size={40} />
         </div>
         <h1 className="text-2xl font-black text-white mb-4">System Maintenance</h1>
         <p className="text-slate-500 max-w-sm leading-relaxed mb-8">
            {platformConfig.maintenanceBanner || "The platform is currently undergoing scheduled improvements for a better academic experience. Please check back later."}
         </p>
         <div className="flex gap-4">
            <button onClick={() => window.location.reload()} className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white hover:bg-white/10 transition-all">Reload Page</button>
            <button onClick={() => logoutUser()} className="px-6 py-2 bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-500/20">Sign Out</button>
         </div>
      </div>
    );
  }

  const isVerified = true; // FORCED BYPASS (Stop verification requirement)

  const handleResendVerification = async () => {
    setIsResendingVerification(true);
    try {
      const result = await resendVerificationEmail();
      if (result.alreadyVerified) {
        success('Your account is already verified. Reloading session...');
      } else {
        success('Verification email sent. Check inbox and spam folder.');
      }
    } catch (resendError) {
      error(resendError.message || 'Failed to send verification email.', 'Verification Error');
    } finally {
      setIsResendingVerification(false);
    }
  };

  const handleVerificationRefresh = async () => {
    try {
      const refreshedUser = await refreshCurrentUser();
      if (refreshedUser?.emailVerified) {
        success('Email verified. Access unlocked.');
      } else {
        error('Email still not verified. Open the verification link and try again.', 'Verification Pending');
      }
    } catch (refreshError) {
      error(refreshError.message || 'Could not refresh verification state.', 'Refresh Failed');
    }
  };

  const hasTabAccess = user ? canAccessTab(user.role, activeTab) : false;

  // Not Authenticated -> Auth Flow
  if (!user) {
    return (
      <Suspense fallback={<div className="h-screen w-screen bg-slate-950 flex items-center justify-center"><Spinner /></div>}>
        <AuthPage />
        <ToastContainer />
      </Suspense>
    );
  }

  // Unverified -> Verification Barrier
  if (!isVerified) {
     return (
       <div className="h-screen w-screen bg-[#020617] flex items-center justify-center p-6 bg-[url('https://grain-y.com/assets/images/noise.png')] bg-repeat">
          <div className="max-w-md w-full glass-card p-10 rounded-[2.5rem] text-center border-white/[0.05] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]">
             <div className="w-20 h-20 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl mx-auto flex items-center justify-center text-indigo-400 mb-8">
                <Mail size={40} />
             </div>
             <h2 className="text-2xl font-black text-white mb-3">Check Your Inbox</h2>
             <p className="text-slate-500 text-sm leading-relaxed mb-10">
                We've sent a link to <span className="text-slate-300 font-bold">{user.email}</span>. Please verify your institutional email to unlock your workspace.
             </p>
             
             <div className="space-y-3">
                <button 
                  onClick={handleVerificationRefresh}
                  className="w-full bg-white text-slate-950 py-4 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all shadow-xl"
                >
                  I've Verified My Email
                </button>
                <div className="flex gap-3">
                   <button 
                    disabled={isResendingVerification}
                    onClick={handleResendVerification}
                    className="flex-1 bg-white/5 border border-white/10 text-slate-300 py-3.5 rounded-2xl font-bold text-xs hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                   >
                     {isResendingVerification ? <Spinner size="xs" /> : 'Resend Link'}
                   </button>
                   <button 
                    onClick={() => logoutUser()}
                    className="flex-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 py-3.5 rounded-2xl font-bold text-xs hover:bg-rose-500/20 transition-all"
                   >
                     Try Different Email
                   </button>
                </div>
             </div>
          </div>
          <ToastContainer />
       </div>
     );
  }

  // Kiosk Mode Override (Full Screen No Layout)
  if (activeTab.toLowerCase() === 'kiosk') {
    return (
      <Suspense fallback={<div className="h-screen w-screen bg-slate-950 flex items-center justify-center"><Spinner /></div>}>
        <KioskPage />
      </Suspense>
    );
  }

  // Active App Session
  return (
    <div className="h-screen w-screen bg-slate-950 flex overflow-hidden font-sans selection:bg-indigo-500/30">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <TopBar />

        {/* Global Maintenance Banner */}
        {platformConfig?.maintenanceBanner && !platformConfig?.isMaintenanceMode && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2 flex items-center gap-3">
             <AlertTriangle size={14} className="text-amber-500 shrink-0" />
             <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest leading-none">Platform Notice: {platformConfig.maintenanceBanner}</p>
          </div>
        )}

        <main className="flex-1 overflow-hidden">
          <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><Spinner /></div>}>
            {!hasTabAccess ? (
               <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-black/20">
                  <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 mb-6">
                     <AlertTriangle size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Access Restricted</h3>
                  <p className="text-slate-500 max-w-xs text-sm">Your institutional role level does not grant access to the {activeTab} environment.</p>
                  <button onClick={() => setActiveTab('Chat')} className="mt-8 text-indigo-400 font-bold text-xs hover:underline uppercase tracking-widest">Return to Comms Hub</button>
               </div>
            ) : activeTab.toLowerCase() === 'chat' ? <ChatPage />
            : activeTab.toLowerCase() === 'announcements' ? <AnnouncementPage />
            : activeTab.toLowerCase() === 'resources' ? <ResourcePage />
            : activeTab.toLowerCase() === 'qa' ? <QAPage />
            : activeTab.toLowerCase() === 'tasks' ? <TaskBoardPage />
            : activeTab.toLowerCase() === 'timetable' ? <TimetablePage />
            : activeTab.toLowerCase() === 'attendance' ? <AttendancePage />
            : activeTab.toLowerCase() === 'grievances' ? <GrievancePage />
            : activeTab.toLowerCase() === 'admin' ? <AdminPage />
            : activeTab.toLowerCase() === 'dm' ? <DMPage targetId={dmTarget} />
            : activeTab.toLowerCase() === 'bookmarks' ? <BookmarksPage />
            : activeTab.toLowerCase() === 'profile' ? <ProfilePage />
            : activeTab.toLowerCase() === 'quizzes' ? <QuizPage />
            : activeTab.toLowerCase() === 'placement' ? <PlacementPage />
            : activeTab.toLowerCase() === 'leaderboard' ? <LeaderboardPage />
            : activeTab.toLowerCase() === 'focus' ? <FocusPage />
            : activeTab.toLowerCase() === 'resume-analyzer' ? <ResumeAnalyzerPage />
            : activeTab.toLowerCase() === 'interview-forum' ? <InterviewForumPage />
            : activeTab.toLowerCase() === 'group-study' ? <GroupStudyPage />
            : activeTab.toLowerCase() === 'blogs' ? <CampusBlogPage />
            : <div className="p-10 text-slate-500">Feature routing missing: {activeTab}</div>}
          </Suspense>
        </main>
      </div>

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
      <ToastContainer />
    </div>
  );
}
