import React, { useEffect, useState, lazy, Suspense } from 'react';
import useAuthStore from './store/authStore';
import useUIStore from './store/uiStore';
import useChannelStore from './store/channelStore';
import { onAuthChange, logoutUser } from './services/authService';
import { onChannelsChange, updateUserStatus, updateUserStreak } from './services/firestoreService';
import { Mail, MessageSquarePlus } from 'lucide-react';
// Lazy load pages for performance optimization
const AuthPage = lazy(() => import('./pages/AuthPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
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
const AssessmentsPage = lazy(() => import('./pages/AssessmentsPage'));
const PlacementPage = lazy(() => import('./pages/PlacementPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const FocusPage = lazy(() => import('./pages/FocusPage'));
const ResumeAnalyzerPage = lazy(() => import('./pages/ResumeAnalyzerPage'));
const InterviewForumPage = lazy(() => import('./pages/InterviewForumPage'));
const GroupStudyPage = lazy(() => import('./pages/GroupStudyPage'));
const SecurityPage = lazy(() => import('./pages/SecurityPage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));

import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import Spinner, { PageLoader } from './components/ui/Spinner';
import ToastContainer from './components/ui/Toast';
import GlobalSearchModal from './components/layout/GlobalSearchModal';
import SuperAdminLayout from './components/layout/SuperAdminLayout';
import FacultyAlertTray from './components/layout/FacultyAlertTray';
import ErrorBoundary from './components/ui/ErrorBoundary';

export default function App() {
  const { user, firebaseUser, isLoading, setUser, setFirebaseUser, setLoading } = useAuthStore();
  const { setChannels } = useChannelStore();
  const { activeTab, dmTarget } = useUIStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleOpenSearch = () => setIsSearchOpen(true);
    window.addEventListener('open-global-search', handleOpenSearch);
    return () => window.removeEventListener('open-global-search', handleOpenSearch);
  }, []);


  // 1. Listen for Auth State Changes
  useEffect(() => {
    const unsubscribe = onAuthChange((fbUser, profile) => {
      setFirebaseUser(fbUser);
      setUser(profile);
      setLoading(false);
      
      if (fbUser) {
        updateUserStatus(fbUser.uid, 'online');
        updateUserStreak(fbUser.uid);
      }
    });

    // Handle session end presence
    const handleUnload = () => {
      if (user?.uid) updateUserStatus(user.uid, 'offline');
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      unsubscribe();
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [setFirebaseUser, setUser, setLoading, user?.uid]);

  // 2. Listen for Channel Changes (Real-time)
  useEffect(() => {
    if (!user) return;
    const unsubscribe = onChannelsChange(user, (channels) => {
      setChannels(channels);
    });
    return () => unsubscribe();
  }, [user, setChannels]);

  // Loading State
  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center">
        <PageLoader message="Initializing Secure Connection..." />
      </div>
    );
  }

  // Not Authenticated -> Auth Flow
  if (!user) {
    return (
      <Suspense fallback={<div className="h-screen w-screen bg-slate-950 flex items-center justify-center"><Spinner /></div>}>
        <AuthPage />
        <ToastContainer />
      </Suspense>
    );
  }


  // SuperAdmin Command Center Override
  if (user.roleLevel >= 4 && activeTab === 'admin') {
    return (
      <Suspense fallback={<div className="h-screen w-screen bg-slate-950 flex items-center justify-center"><Spinner /></div>}>
        <SuperAdminLayout />
        <ToastContainer />
      </Suspense>
    );
  }

  // Authenticated -> Main Layout
  return (
    <div className="h-screen w-screen bg-slate-900 flex overflow-hidden relative text-slate-200">
      {/* Premium Mesh Background */}
      <div className="mesh-bg">
         <div className="mesh-orb mesh-orb-1" />
         <div className="mesh-orb mesh-orb-2" />
         <div className="mesh-orb mesh-orb-3" />
         <div className="mesh-grid" />
      </div>

      {/* Sidebar */}
      <div className="relative z-10 flex h-full">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0">
        <TopBar />
        
        <main className="flex-1 min-h-0 relative glass-panel border-t border-white/[0.05]">
           {/* Tab Rendering Content Area */}
           <Suspense fallback={
             <div className="h-full w-full flex items-center justify-center text-slate-500">
               <Spinner />
             </div>
           }>
             <ErrorBoundary>
               {activeTab === 'dashboard' ? (
                 <DashboardPage />
               ) : activeTab === 'chat' ? (
                 <ChatPage />
               ) : activeTab === 'announcements' ? (
                 <AnnouncementPage />
               ) : activeTab === 'timetable' ? (
                 <TimetablePage />
               ) : activeTab === 'attendance' ? (
                 <AttendancePage />
               ) : activeTab === 'resources' ? (
                 <ResourcePage />
               ) : activeTab === 'tasks' ? (
                 <TaskBoardPage />
               ) : activeTab === 'qa' ? (
                 <QAPage />
               ) : activeTab === 'grievances' ? (
                 <GrievancePage />
               ) : activeTab === 'admin' && user.roleLevel >= 3 ? (
                 <AdminPage />
               ) : activeTab === 'dm' ? (
                 <DMPage recipient={dmTarget} />
               ) : activeTab === 'bookmarks' ? (
                 <BookmarksPage />
               ) : activeTab === 'profile' ? (
                 <ProfilePage />
               ) : activeTab === 'quizzes' ? (
                 <AssessmentsPage />
               ) : activeTab === 'live-quizzes' ? (
                 <QuizPage />
               ) : activeTab === 'placement' ? (
                 <PlacementPage />
               ) : activeTab === 'leaderboard' ? (
                 <LeaderboardPage />
               ) : activeTab === 'focus' ? (
                 <FocusPage />
               ) : activeTab === 'resume-analyzer' ? (
                 <ResumeAnalyzerPage />
               ) : activeTab === 'interview-forum' ? (
                 <InterviewForumPage />
               ) : activeTab === 'group-study' ? (
                 <GroupStudyPage />
               ) : activeTab === 'security' ? (
                 <SecurityPage />
               ) : activeTab === 'calendar' ? (
                 <CalendarPage />
               ) : (
                 <div className="h-full w-full flex items-center justify-center text-slate-500 animate-fade-in p-8">
                    <div className="text-center">
                      <h1 className="text-4xl font-black text-slate-800 mb-4 uppercase tracking-tighter opacity-20">Work in Progress</h1>
                      <h3 className="text-xl font-bold text-slate-300 mb-2 capitalize">{activeTab} Page</h3>
                      <p className="max-w-xs mx-auto text-sm text-slate-500">
                        Currently building the {activeTab} engine. Stay tuned for real-time updates.
                      </p>
                      <div className="mt-8 flex gap-2 justify-center">
                         <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce duration-700" />
                         <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce duration-700 delay-150" />
                         <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce duration-700 delay-300" />
                      </div>
                    </div>
                 </div>
               )}
             </ErrorBoundary>
           </Suspense>
        </main>
      </div>

      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <FacultyAlertTray />
      
      {/* Floating Feedback Button */}
      <button 
        onClick={() => window.alert('Opening DYPIU Feedback Portal...')}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[60] group border-4 border-slate-900"
      >
        <MessageSquarePlus size={24} />
        <div className="absolute right-full mr-4 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-[10px] font-black uppercase text-white tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Post Feedback
        </div>
      </button>

      <ToastContainer />
    </div>
  );
}
