import React, { useEffect } from 'react';
import useAuthStore from './store/authStore';
import useUIStore from './store/uiStore';
import useChannelStore from './store/channelStore';
import { onAuthChange } from './services/authService';
import { onChannelsChange } from './services/firestoreService';
import AuthPage from './pages/AuthPage';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import { PageLoader } from './components/ui/Spinner';
import ToastContainer from './components/ui/Toast';

export default function App() {
  const { user, isLoading, setUser, setFirebaseUser, setLoading } = useAuthStore();
  const { setChannels } = useChannelStore();
  const { activeTab } = useUIStore();

  // 1. Listen for Auth State Changes
  useEffect(() => {
    const unsubscribe = onAuthChange((fbUser, profile) => {
      setFirebaseUser(fbUser);
      setUser(profile);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [setFirebaseUser, setUser, setLoading]);

  // 2. Listen for Channel Changes (Real-time)
  useEffect(() => {
    if (!user) return;
    const unsubscribe = onChannelsChange((channels) => {
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
      <>
        <AuthPage />
        <ToastContainer />
      </>
    );
  }

  // Authenticated -> Main Layout
  return (
    <div className="h-screen w-screen bg-slate-950 flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        
        <main className="flex-1 min-h-0 relative bg-slate-900/40">
           {/* Tab Rendering Content Area */}
           <div className="h-full w-full flex items-center justify-center text-slate-500 animate-fade-in p-8">
              <div className="text-center">
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
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
