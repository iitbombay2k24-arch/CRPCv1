import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Download, FileText, 
  Clock, Shield, User, ExternalLink, Calendar
} from 'lucide-react';
import { onAuditLogChange } from '../../services/firestoreService';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('All');

  useEffect(() => {
    const unsub = onAuditLogChange((data) => {
      setLogs(data);
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actorEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesAction = actionFilter === 'All' || log.action === actionFilter;
    
    return matchesSearch && matchesAction;
  });

  const exportToCSV = () => {
    const headers = ['Action', 'Actor', 'Email', 'Details', 'Timestamp'];
    const rows = filteredLogs.map(l => [l.action, l.actorName, l.actorEmail, l.details, l.date]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) return <div className="h-full flex items-center justify-center"><Spinner /></div>;

  const uniqueActions = ['All', ...new Set(logs.map(l => l.action))];

  return (
    <div className="h-full flex flex-col space-y-6 animate-fade-in">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text"
              placeholder="Search audit trail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.05] rounded-2xl py-2.5 pl-12 pr-4 text-xs text-white focus:outline-none focus:border-rose-500/30 transition-all"
            />
          </div>
          
          <select 
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-white/[0.03] border border-white/[0.05] rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 focus:outline-none"
          >
            {uniqueActions.map(action => <option key={action} value={action} className="bg-slate-900">{action}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-white/[0.1] transition-all"
          >
            <Download size={14} className="text-rose-500" />
            Export CSV
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-white/[0.1] transition-all"
          >
            <FileText size={14} className="text-rose-500" />
            Print Report
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="flex-1 bg-white/[0.02] border border-white/[0.05] rounded-[2rem] overflow-hidden flex flex-col shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar h-full">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-white/[0.05] bg-slate-950">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Event</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Operator</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Context & Details</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Sequence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-5">
                    <Badge variant={log.action.includes('Delete') || log.action.includes('Ban') || log.action.includes('Moderation') ? 'danger' : 'neutral'} size="xs" className="uppercase font-black tracking-widest">
                      {log.action}
                    </Badge>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                        <User size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white leading-none mb-1">{log.actorName}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{log.actorEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 max-w-xl">
                    <div className="flex items-start gap-3">
                      <Shield size={14} className="text-slate-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-slate-400 leading-relaxed font-medium line-clamp-2">
                        {log.details}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-2 text-slate-300 mb-1">
                        <Clock size={12} className="text-rose-500" />
                        <span className="text-xs font-black tabular-nums tracking-tighter">
                          {log.date.split(',')[1] || log.date}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                        {log.date.split(',')[0]}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredLogs.length === 0 && (
            <div className="p-20 text-center">
              <div className="w-16 h-16 bg-white/[0.03] rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-white/10">
                <Search size={24} className="text-slate-700" />
              </div>
              <h3 className="text-slate-400 font-bold uppercase tracking-widest text-sm">No Audit Records Found</h3>
              <p className="text-[10px] text-slate-600 mt-2 uppercase tracking-[0.2em]">Adjust filters to expand search</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
