import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled React error:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen bg-[#090a10] text-slate-200 flex items-center justify-center p-6">
          <div className="w-full max-w-lg rounded-3xl border border-rose-500/20 bg-rose-950/20 backdrop-blur-xl p-8 text-center">
            <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
              <AlertTriangle className="text-rose-300" size={30} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              The application ran into an unexpected error. Your data in Firestore is safe. Reload to continue.
            </p>
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all"
            >
              <RefreshCcw size={16} />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
