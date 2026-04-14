import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck, UserCheck, UserX, History, FileSpreadsheet, Search, Filter, 
  QrCode, ScanLine, MapPin, X
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import useAuthStore from '../store/authStore';
import { onAttendanceChange, markAttendance, calculateAttendanceMetrics, verifyAttendanceQR } from '../services/firestoreService';
import { hasPermission } from '../lib/rbac';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import Spinner from '../components/ui/Spinner';
import useNotificationStore from '../store/notificationStore';
import confetti from 'canvas-confetti';

export default function AttendancePage() {
  const { user } = useAuthStore();
  const { success, error, info } = useNotificationStore();
  const [attendance, setAttendance] = useState([]);
  const [metrics, setMetrics] = useState({ overallPercentage: 0, totalSessions: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [markingSubject, setMarkingSubject] = useState('');
  const [isMarking, setIsMarking] = useState(false);
  const [qrValue, setQrValue] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  
  // DYPIU Campus Coordinates (Approx)
  const DYPIU_COORD = { lat: 18.6601, lng: 73.7651 };
  const DIST_THRESHOLD = 0.5; // km (500m radius)

  useEffect(() => {
    const unsub = onAttendanceChange(user.uid, (data) => {
      setAttendance(data);
      setMetrics(calculateAttendanceMetrics(data));
      setIsLoading(false);
    });
    return () => unsub();
  }, [user.uid]);

  const canMark = hasPermission(user.role, 'MARK_ATTENDANCE');
  const rate = Number(metrics.overallPercentage);
  const isGood = rate >= 75;

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const checkGeofence = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject('Geolocation not supported');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const dist = calculateDistance(pos.coords.latitude, pos.coords.longitude, DYPIU_COORD.lat, DYPIU_COORD.lng);
          if (dist > DIST_THRESHOLD) reject(`Out of range! You are ${dist.toFixed(2)}km away from DYPIU campus.`);
          else resolve();
        },
        () => reject('Location access denied. Enable GPS to mark attendance.')
      );
    });
  };

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    if (!markingSubject.trim() || isMarking) return;
    setIsMarking(true);
    try {
      await checkGeofence();
      await markAttendance({
        studentId: user.uid,
        studentName: user.name,
        subject: markingSubject.trim(),
        markedBy: user.name,
      });
      setMarkingSubject('');
      success('Attendance marked!', 'Location verified via Geofencing.');
      confetti({ particleCount: 100, spread: 50, origin: { y: 0.8 } });
    } catch (err) {
      error(err.toString() || 'Failed to mark attendance');
    } finally {
      setIsMarking(false);
    }
  };

  const generateQR = () => {
    if (!markingSubject.trim()) return error('Enter a subject name first');
    const expiry = Date.now() + 5 * 60 * 1000; // 5 mins
    setQrValue(`ATTENDANCE_SESSION_${markingSubject.trim().toUpperCase()}_${expiry}`);
    info(`QR Session active for 5 minutes.`);
  };

  useEffect(() => {
    if (showScanner) {
      const scanner = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: 250 });
      scanner.render(async (decodedText) => {
        scanner.clear();
        setShowScanner(false);
        setIsMarking(true);
        try {
          await checkGeofence();
          await verifyAttendanceQR(user.uid, user.name, decodedText);
          success('Success!', 'QR Attendance verified & marked.');
          confetti({ particleCount: 150, spread: 70 });
        } catch (err) {
          error(err.message || 'Verification Failed');
        } finally {
          setIsMarking(false);
        }
      }, (err) => console.log(err));
      return () => scanner.clear();
    }
  }, [showScanner]);

  const handleExport = () => {
    if (!attendance.length) return error('No logs found to export.');
    
    const headers = ['Subject', 'Status', 'Marked By', 'Date'];
    const rows = attendance.map(a => [a.subject, a.status, a.markedBy, a.date]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Export Started', 'Your attendance CSV is downloading.');
  };

  return (
    <div className="h-full flex flex-col min-w-0">
      {/* Header */}
      <div className="h-16 border-b border-white/[0.05] px-7 flex items-center justify-between bg-black/20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
            <ClipboardCheck size={18} />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">Attendance Tracker</h2>
            <p className="text-[11px] text-slate-500">Monitor your academic presence</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Attendance Rate</p>
            <p className={`text-2xl font-black ${isGood ? 'text-emerald-400' : 'text-rose-400'}`}>{rate}%</p>
          </div>
          <div className="h-8 w-px bg-white/[0.08] hidden sm:block" />
          <Button variant="secondary" icon={FileSpreadsheet} size="sm" onClick={handleExport}>Export</Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-7">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-7">
          {/* Left col */}
          <div className="space-y-5">
            {/* Progress Ring Card */}
            <div className="glass-card rounded-2xl p-6 flex flex-col items-center text-center">
              <div className="relative w-28 h-28 mb-4">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" className="fill-none stroke-white/[0.05]" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r="54"
                    className={`fill-none transition-all duration-1000 ${isGood ? 'stroke-emerald-500' : 'stroke-rose-500'}`}
                    strokeWidth="10"
                    strokeDasharray="339"
                    strokeDashoffset={339 - (339 * rate) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className={`text-2xl font-black ${isGood ? 'text-emerald-400' : 'text-rose-400'}`}>{rate}%</span>
                </div>
              </div>
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Presence Summary</h3>
              <div className="w-full space-y-3 text-sm">
                {[
                  { label: 'Total Sessions', value: metrics.totalSessions, color: 'text-slate-200' },
                  { label: 'Present', value: attendance.filter((a) => a.status === 'Present').length, color: 'text-emerald-400' },
                  { label: 'Eligibility', value: isGood ? 'Eligible' : 'Check', color: isGood ? 'text-emerald-400' : 'text-rose-400' },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between border-t border-white/[0.04] pt-3">
                    <span className="text-slate-500 text-xs">{row.label}</span>
                    <span className={`font-bold text-xs ${row.color}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* QR Scanner / Generator */}
            {canMark ? (
              <div className="glass-card rounded-2xl p-5 border-indigo-500/15">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <QrCode size={14} /> Faculty QR Hub
                </h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={markingSubject}
                    onChange={(e) => setMarkingSubject(e.target.value)}
                    placeholder="Enter Subject (e.g. OS)"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/40"
                  />
                  {qrValue ? (
                    <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-2xl">
                      <QRCodeSVG value={qrValue} size={180} />
                      <p className="text-[10px] text-slate-900 font-black uppercase">Valid for 5 Minutes</p>
                      <Button variant="ghost" size="xs" onClick={() => setQrValue(null)} className="text-slate-500 hover:text-rose-500">Reset</Button>
                    </div>
                  ) : (
                    <Button onClick={generateQR} variant="primary" className="w-full" icon={QrCode}>Generate Session QR</Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="glass-card rounded-2xl p-5 border-emerald-500/15">
                <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <ScanLine size={14} /> Self Marking
                </h3>
                <div className="space-y-4">
                  <Button onClick={() => setShowScanner(true)} variant="primary" className="w-full bg-emerald-600 hover:bg-emerald-500" icon={ScanLine}>
                    Scan Session QR
                  </Button>
                  <p className="text-[10px] text-slate-600 text-center italic flex items-center justify-center gap-1">
                    <MapPin size={8} /> DYPIU Coordinates: {DYPIU_COORD.lat}, {DYPIU_COORD.lng}
                  </p>
                </div>
              </div>
            )}
            
            {showScanner && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
                <div className="bg-slate-900 border border-white/[0.1] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
                  <div className="p-4 border-b border-white/[0.05] flex justify-between items-center">
                    <h4 className="font-bold text-white">Focus on QR Code</h4>
                    <button onClick={() => setShowScanner(false)} className="text-slate-500 hover:text-white p-2">
                      <X size={20} />
                    </button>
                  </div>
                  <div id="qr-reader" className="w-full min-h-[300px]" />
                  <div className="p-6 text-center text-slate-400 text-xs italic">
                    Scan the session code shared by your faculty on the screen.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Log Table */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <History size={14} /> Attendance Log
              </h3>
              <div className="flex gap-2">
                <button className="p-2 bg-white/[0.04] border border-white/[0.06] rounded-xl text-slate-400 hover:text-white transition-colors"><Search size={14} /></button>
                <button className="p-2 bg-white/[0.04] border border-white/[0.06] rounded-xl text-slate-400 hover:text-white transition-colors"><Filter size={14} /></button>
              </div>
            </div>

            {isLoading ? (
              <div className="h-64 flex items-center justify-center"><Spinner size="lg" /></div>
            ) : attendance.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center border border-dashed border-white/[0.06] rounded-2xl">
                <UserX size={36} className="text-slate-700 mb-3" />
                <p className="text-slate-400 font-semibold">No records yet</p>
                <p className="text-slate-600 text-sm">Mark your first attendance above</p>
              </div>
            ) : (
              <div className="glass-card rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/[0.05] bg-black/20">
                      <th className="px-5 py-3.5">Date & Time</th>
                      <th className="px-5 py-3.5">Subject</th>
                      <th className="px-5 py-3.5 hidden md:table-cell">Verified By</th>
                      <th className="px-5 py-3.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {attendance.map((rec) => (
                      <tr key={rec.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-slate-200">{rec.dateStr}</p>
                          <p className="text-[10px] text-slate-500">{rec.timeStr}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-bold text-indigo-400">{rec.subject}</span>
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <Avatar name={rec.markedBy} size="xs" />
                            <span className="text-xs text-slate-400">{rec.markedBy}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Badge variant="success" size="xs">Present</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
