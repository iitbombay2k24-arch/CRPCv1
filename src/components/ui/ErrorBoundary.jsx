import React from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import Button from './Button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Critical UI Crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center p-12 text-center bg-slate-950/50 backdrop-blur-3xl animate-fade-in">
          <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center text-rose-500 mb-6 border border-rose-500/20 shadow-2xl shadow-rose-500/10">
            <AlertCircle size={40} />
          </div>
          <h1 className="text-2xl font-black text-white mb-3 uppercase tracking-tighter">System Interruption</h1>
          <p className="text-slate-400 text-sm max-w-sm mx-auto mb-8 leading-relaxed font-medium">
            A module failed to initialize correctly. This is usually due to an intermittent network failure or a secure connection reset.
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              variant="primary" 
              icon={RefreshCcw}
              onClick={() => window.location.reload()}
            >
              Re-initialize Workspace
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => this.setState({ hasError: false })}
            >
              Ignore & Continue
            </Button>
          </div>
          
          <div className="mt-12 p-4 bg-black/40 rounded-2xl border border-white/5 max-w-lg overflow-hidden">
             <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em] mb-2">Technical Insight</p>
             <p className="text-[10px] text-rose-500/60 font-mono break-all">{this.state.error?.message || 'Unknown runtime exception'}</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
