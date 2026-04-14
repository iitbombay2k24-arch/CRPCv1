import React, { useState, useEffect } from 'react';
import {
  HelpCircle, MessageCircle, ArrowBigUp, User, Clock,
  Plus, Filter, CheckCircle2
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { onQuestionsChange, voteQuestion, onAnswersChange, postAnswer, resolveQuestion } from '../services/firestoreService';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import AskQuestionModal from '../modals/AskQuestionModal';
import Spinner from '../components/ui/Spinner';

export default function QAPage() {
  const { user } = useAuthStore();
  const [questions, setQuestions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [newAnswer, setNewAnswer] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const unsub = onQuestionsChange((data) => { setQuestions(data); setIsLoading(false); });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!selected) { setAnswers([]); return; }
    const unsub = onAnswersChange(selected.id, setAnswers);
    return () => unsub();
  }, [selected]);

  const handleUpvote = async (qId) => await voteQuestion(qId, user.uid);

  const handlePostAnswer = async (e) => {
    e.preventDefault();
    if (!newAnswer.trim() || isSending) return;
    setIsSending(true);
    try {
      await postAnswer(selected.id, { text: newAnswer.trim(), authorId: user.uid, authorName: user.name });
      setNewAnswer('');
    } finally {
      setIsSending(false);
    }
  };

  const handleResolve = async (qId) => {
    if (window.confirm('Mark this question as resolved?')) {
      await resolveQuestion(qId);
      if (selected?.id === qId) setSelected((p) => ({ ...p, isResolved: true }));
    }
  };

  return (
    <div className="h-full flex flex-col min-w-0">
      {/* Header */}
      <div className="h-16 border-b border-white/[0.05] px-7 flex items-center justify-between bg-black/20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
            <HelpCircle size={18} />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">Peer Q&A Board</h2>
            <p className="text-[11px] text-slate-500">Ask questions and share your knowledge</p>
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="primary" icon={Plus}>
          Ask Question
        </Button>
      </div>

      {/* Two-pane layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Question List */}
        <div className={`flex-1 overflow-y-auto custom-scrollbar p-5 space-y-3 ${selected ? 'hidden lg:block lg:max-w-[480px] lg:border-r lg:border-white/[0.05]' : 'block'}`}>
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">
              {questions.length} Questions
            </h3>
            <select className="bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs text-slate-400 px-3 py-1.5 focus:outline-none">
              <option>Most Recent</option>
              <option>Most Upvoted</option>
              <option>Unresolved</option>
            </select>
          </div>

          {isLoading ? (
            <div className="h-64 flex items-center justify-center"><Spinner size="lg" /></div>
          ) : questions.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center border border-dashed border-white/[0.06] rounded-3xl">
              <HelpCircle size={40} className="text-slate-700 mb-3" />
              <p className="text-slate-400 font-semibold">Board is empty</p>
              <p className="text-slate-600 text-sm">Be the first to ask!</p>
            </div>
          ) : (
            questions.map((q) => (
              <button
                key={q.id}
                onClick={() => setSelected(q)}
                className={`
                  w-full glass-card rounded-2xl p-4 text-left flex gap-4 group transition-all
                  ${selected?.id === q.id ? 'border-indigo-500/40 bg-indigo-500/5' : 'hover:border-white/[0.1]'}
                `}
              >
                {/* Upvotes */}
                <div className="flex flex-col items-center gap-1 min-w-[36px]">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleUpvote(q.id); }}
                    className={`p-1 rounded-lg transition-all ${q.upvotes?.includes(user.uid) ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 hover:text-indigo-400'}`}
                  >
                    <ArrowBigUp size={22} />
                  </button>
                  <span className="text-sm font-bold text-slate-300">{q.upvotes?.length || 0}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {q.isResolved && <Badge variant="success" size="xs">Resolved</Badge>}
                    <span className="text-[10px] text-slate-500"><User size={10} className="inline mr-0.5" />{q.authorName}</span>
                    <span className="text-[10px] text-slate-500"><Clock size={10} className="inline mr-0.5" />{q.time}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-100 mb-1.5 group-hover:text-indigo-300 transition-colors line-clamp-2">
                    {q.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-400">
                      <MessageCircle size={11} /> {q.answerCount || 0} answers
                    </div>
                    {q.tags?.map((tag) => (
                      <span key={tag} className="text-[9px] font-bold bg-white/[0.04] text-slate-500 px-1.5 py-0.5 rounded uppercase">{tag}</span>
                    ))}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Right: Question Detail */}
        <div className={`flex-1 flex flex-col overflow-hidden ${selected ? 'block' : 'hidden'}`}>
          {selected ? (
            <>
              {/* Detail Header */}
              <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between shrink-0 bg-black/10">
                <button onClick={() => setSelected(null)} className="lg:hidden text-xs text-slate-400 hover:text-white font-bold mr-3">
                  ← Back
                </button>
                <h4 className="font-bold text-sm text-slate-200 truncate flex-1">{selected.title}</h4>
                {selected.authorId === user.uid && !selected.isResolved && (
                  <Button variant="success" size="sm" onClick={() => handleResolve(selected.id)}>
                    Resolve
                  </Button>
                )}
              </div>

              {/* Detail Body */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-7">
                {/* Original */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={selected.authorName} size="md" />
                    <div>
                      <p className="text-sm font-bold text-slate-100">{selected.authorName}</p>
                      <p className="text-[10px] text-slate-500">{selected.time}</p>
                    </div>
                  </div>
                  <div className="glass-card rounded-2xl p-5 text-sm text-slate-300 whitespace-pre-wrap leading-relaxed border-indigo-500/15">
                    {selected.body}
                  </div>
                </div>

                {/* Answers */}
                <div className="space-y-4">
                  <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">
                    Discussion ({answers.length})
                  </h5>
                  {answers.length === 0 ? (
                    <p className="text-xs text-slate-600 text-center py-8 italic">No answers yet — be the first to respond!</p>
                  ) : (
                    answers.map((ans) => (
                      <div key={ans.id} className="flex gap-3">
                        <Avatar name={ans.authorName} size="sm" className="shrink-0 mt-1" />
                        <div className="flex-1 glass-card rounded-2xl p-4">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-indigo-300">{ans.authorName}</span>
                            <span className="text-[10px] text-slate-600">{ans.time}</span>
                          </div>
                          <p className="text-sm text-slate-300 whitespace-pre-wrap">{ans.text}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Answer Input */}
              <div className="p-4 border-t border-white/[0.05] bg-black/20 shrink-0">
                <form onSubmit={handlePostAnswer} className="relative">
                  <textarea
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                    placeholder="Write your answer…"
                    rows={3}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl py-3 px-4 pr-24 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 resize-none"
                  />
                  <div className="absolute bottom-3 right-3">
                    <Button type="submit" variant="primary" size="sm" loading={isSending} disabled={!newAnswer.trim()}>
                      Post
                    </Button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-white/[0.03] border border-white/[0.06] rounded-2xl flex items-center justify-center mb-4">
                <MessageCircle size={28} className="text-slate-600" />
              </div>
              <h4 className="text-base font-bold text-slate-400 mb-1">Select a question</h4>
              <p className="text-xs text-slate-600 max-w-xs">Click any question to view the discussion and contribute.</p>
            </div>
          )}
        </div>
      </div>

      <AskQuestionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
