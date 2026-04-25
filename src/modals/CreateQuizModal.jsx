import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Trophy, 
  Clock, 
  CheckCircle2, 
  Type, 
  PlusCircle,
  Hash,
  Send
} from 'lucide-react';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import useAuthStore from '../store/authStore';
import { createQuiz } from '../services/firestoreService';
import Badge from '../components/ui/Badge';

export default function CreateQuizModal({ isOpen, onClose }) {
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(15);
  const [questions, setQuestions] = useState([
    { id: 'q1', question: '', options: ['', '', '', ''], correctOption: 0, points: 10 }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const addQuestion = () => {
    const newId = 'q' + (questions.length + 1) + '_' + Math.random().toString(36).substr(2, 5);
    setQuestions([...questions, { id: newId, question: '', options: ['', '', '', ''], correctOption: 0, points: 10 }]);
  };

  const removeQuestion = (idx) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx, field, value) => {
    const next = [...questions];
    next[idx][field] = value;
    setQuestions(next);
  };

  const updateOption = (qIdx, optIdx, value) => {
    const next = [...questions];
    next[qIdx].options[optIdx] = value;
    setQuestions(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || questions.some(q => !q.question.trim()) || isLoading) return;

    setIsLoading(true);
    try {
      await createQuiz({
        title: title.trim(),
        subject: subject.trim(),
        description: description.trim(),
        authorId: user.uid,
        authorName: user.name,
        duration: Number(duration),
        questions
      });
      setTitle('');
      setQuestions([{ id: 'q1', question: '', options: ['', '', '', ''], correctOption: 0, points: 10 }]);
      onClose();
    } catch (error) {
      console.error('Error creating quiz:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Construct New Live Quiz" size="xl">
      <form onSubmit={handleSubmit} className="space-y-8 flex flex-col max-h-[80vh]">
        <div className="flex-1 overflow-y-auto custom-scrollbar px-1 space-y-8">
           {/* Metadata Section */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                 <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Quiz Title</label>
                    <div className="relative group">
                      <Type size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400" />
                      <input 
                        type="text" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Distributed Systems Final"
                        className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all text-sm font-bold"
                        required
                      />
                    </div>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Subject Context</label>
                    <input 
                      type="text" 
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Computer Science"
                      className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
                      required
                    />
                 </div>
              </div>
              <div className="space-y-4">
                 <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Duration (Minutes)</label>
                    <div className="relative group">
                      <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400" />
                      <input 
                        type="number" 
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all text-sm font-black"
                        required
                      />
                    </div>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Brief Description</label>
                    <input 
                      type="text" 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Short intro to the session..."
                      className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
                    />
                 </div>
              </div>
           </div>

           {/* Questions Section */}
           <div className="space-y-8 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                 <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest flex items-center gap-2">
                    <Hash size={16} className="text-indigo-400" /> Question Logic Sequence
                 </h3>
                 <Badge variant="primary" size="xs">{questions.length} Items</Badge>
              </div>

              <div className="space-y-12">
                 {questions.map((q, qIdx) => (
                   <div key={qIdx} className="relative bg-slate-800/20 border border-slate-700/30 rounded-3xl p-6 group/item">
                      <div className="absolute -top-4 -left-4 w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg">
                         {qIdx + 1}
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeQuestion(qIdx)}
                        className="absolute top-4 right-4 p-2 text-slate-600 hover:text-rose-500 transition-colors opacity-0 group-hover/item:opacity-100"
                      >
                         <Trash2 size={16} />
                      </button>

                      <div className="space-y-6">
                         <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Question Title</label>
                            <input 
                              type="text" 
                              value={q.question}
                              onChange={(e) => updateQuestion(qIdx, 'question', e.target.value)}
                              placeholder="Enter the primary question logic..."
                              className="w-full bg-slate-950 border-none rounded-xl py-3 px-4 text-slate-200 focus:ring-1 focus:ring-indigo-500/50 text-sm font-bold"
                              required
                            />
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {q.options.map((opt, oIdx) => (
                              <div key={oIdx} className="flex items-center gap-3">
                                 <button 
                                   type="button"
                                   onClick={() => updateQuestion(qIdx, 'correctOption', oIdx)}
                                   className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all border
                                      ${q.correctOption === oIdx 
                                        ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-600/20' 
                                        : 'bg-slate-900 border-slate-700/50 text-slate-600'}`}
                                 >
                                    {String.fromCharCode(65 + oIdx)}
                                 </button>
                                 <input 
                                   type="text" 
                                   value={opt}
                                   onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                                   placeholder={`Option ${oIdx + 1}`}
                                   className="flex-1 bg-slate-900 border border-slate-800 rounded-xl py-2 px-4 text-xs text-slate-400 focus:outline-none focus:border-indigo-500/50"
                                   required
                                 />
                              </div>
                            ))}
                         </div>
                      </div>
                   </div>
                 ))}
              </div>

              <button 
                type="button" 
                onClick={addQuestion}
                className="w-full py-4 border-2 border-dashed border-slate-800 rounded-3xl text-slate-600 hover:border-indigo-500/30 hover:text-indigo-400 transition-all flex items-center justify-center gap-2 text-sm font-bold bg-slate-900/40"
              >
                 <PlusCircle size={20} /> Add Next logical Segment
              </button>
           </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-700/50">
          <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
          <Button 
            variant="primary" 
            type="submit" 
            loading={isLoading} 
            icon={Send}
            className="px-10"
          >
            Deploy Quiz
          </Button>
        </div>
      </form>
    </Modal>
  );
}
