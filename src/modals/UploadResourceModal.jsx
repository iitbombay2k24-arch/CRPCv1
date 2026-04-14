import React, { useState, useRef } from 'react';
import { 
  Upload, 
  X, 
  FileText, 
  BookOpen, 
  File as FileIcon, 
  Cloud,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import useAuthStore from '../store/authStore';
import { uploadResource, uploadFile } from '../services/firestoreService';

export default function UploadResourceModal({ isOpen, onClose }) {
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [type, setType] = useState('Notes');
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const types = ['Notes', 'Paper', 'Book', 'Assignment', 'Syllabus'];

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.size > 25 * 1024 * 1024) { // 25MB limit
        setError('File size too large (max 25MB)');
        return;
      }
      setFile(selected);
      setError('');
      if (!title) setTitle(selected.name.split('.')[0]); // Auto-fill title
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title.trim() || !subject.trim() || isLoading) return;

    setIsLoading(true);
    setProgress(10);
    try {
      // 1. Upload to Storage
      const fileUrl = await uploadFile(file, `resources/${subject.toLowerCase().trim()}`);
      setProgress(60);

      // 2. Add to Firestore
      await uploadResource({
        title: title.trim(),
        subject: subject.trim(),
        type,
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        uploadedBy: user.uid,
        uploadedByName: user.name
      });
      setProgress(100);

      // Reset & Close
      setTimeout(() => {
        setFile(null);
        setTitle('');
        setSubject('');
        setProgress(0);
        onClose();
      }, 500);
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Upload failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Resource" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <header className="mb-4">
          <p className="text-xs text-slate-500">Add course materials to the central repository. Supports PDF, PPT, DOCX, and common formats (Max 25MB).</p>
        </header>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl flex items-center gap-3 text-rose-500 text-xs font-bold animate-shake">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="space-y-4">
          {/* File Dropzone */}
          <div>
            {!file ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800/50 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-indigo-400 group-hover:scale-110 transition-all">
                  <Cloud size={28} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-300">Click to select file</p>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-tighter">PDF, DOCX, PPTX, IMAGE</p>
                </div>
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-4 flex items-center gap-4 relative">
                 <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                   <FileIcon size={24} />
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-200 truncate">{file.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                 </div>
                 <button 
                  type="button"
                  onClick={() => setFile(null)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-all"
                 >
                   <X size={16} />
                 </button>
                 
                 {isLoading && (
                   <div className="absolute bottom-0 left-0 h-1 bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                 )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
             {/* Title */}
             <div className="col-span-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Resource Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Unit 1: Introduction to AI"
                  className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm"
                  required
                />
             </div>

             {/* Subject */}
             <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Subject</label>
                <input 
                  type="text" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Artificial Intelligence"
                  className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm"
                  required
                />
             </div>

             {/* Type */}
             <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Material Type</label>
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm appearance-none"
                >
                  {types.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
             </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
          <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
          <Button 
            variant="primary" 
            type="submit" 
            loading={isLoading} 
            icon={Upload}
            disabled={!file}
            className="px-10"
          >
            {isLoading ? 'Uploading...' : 'Upload Library'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
