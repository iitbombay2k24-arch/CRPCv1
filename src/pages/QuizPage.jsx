import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Trophy, Plus, Play, Clock, AlertCircle,
  Timer, ChevronRight, ShieldAlert, Star, BarChart2, CheckCircle2
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { onQuizzesChange, submitQuizResult } from '../services/firestoreService';
import { hasPermission } from '../lib/rbac';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import CreateQuizModal from '../modals/CreateQuizModal';
import Avatar from '../components/ui/Avatar';
import Spinner from '../components/ui/Spinner';

export default function QuizPage() {
  const { user } = useAuthStore();
  const [quizzes, setQuizzes] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [result, setResult] = useState(null);

  // Use refs to track mutable quiz state without stale closures
  const answersRef = useRef({});
  const scoreRef = useRef(0);
  const timeLeftRef = useRef(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    const unsub = onQuizzesChange((data) => { setQuizzes(data); setIsLoading(false); });
    return () => unsub();
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleFinishQuiz = useCallback(async (quiz) => {
    stopTimer();
    setIsFinished(true);

    const finalScore = scoreRef.current;
    const finalAnswers = { ...answersRef.current };
    const timeTaken = (quiz.duration * 60) - timeLeftRef.current;

    setResult({ score: finalScore, total: quiz.questions.length, timeTaken });

    try {
      await submitQuizResult(quiz.id, {
        userId: user.uid,
        userName: user.name,
        score: finalScore,
        total: quiz.questions.length,
        answers: finalAnswers,
        timeTaken,
      });
    } catch (e) {
      console.error('Failed to submit quiz result:', e);
    }
  }, [stopTimer, user]);

  const startQuiz = useCallback((quiz) => {
    answersRef.current = {};
    scoreRef.current = 0;
    timeLeftRef.current = quiz.duration * 60;

    setActiveQuiz(quiz);
    setCurrentQuestionIdx(0);
    setTimeLeft(quiz.duration * 60);
    setIsFinished(false);
    setSelectedAnswer(null);
    setResult(null);
  }, []);

  // Timer Effect
  useEffect(() => {
    if (!activeQuiz || isFinished) return;

    timerRef.current = setInterval(() => {
      timeLeftRef.current -= 1;
      const newTime = timeLeftRef.current;
      setTimeLeft(newTime);

      if (newTime <= 0) {
        handleFinishQuiz(activeQuiz);
      }
    }, 1000);

    return () => stopTimer();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeQuiz, isFinished]);

  const handleNext = useCallback(() => {
    const q = activeQuiz.questions[currentQuestionIdx];

    // Check answer and update score ref synchronously
    if (selectedAnswer !== null && selectedAnswer === q.correctAnswer) {
      scoreRef.current += 1;
    }

    // Store answer in ref (no stale closure)
    answersRef.current = { ...answersRef.current, [q.id || currentQuestionIdx]: selectedAnswer };

    const isLast = currentQuestionIdx + 1 >= activeQuiz.questions.length;
    if (isLast) {
      handleFinishQuiz(activeQuiz);
    } else {
      setCurrentQuestionIdx((p) => p + 1);
      setSelectedAnswer(null);
    }
  }, [activeQuiz, currentQuestionIdx, selectedAnswer, handleFinishQuiz]);

  const canCreate = hasPermission(user.role, 'CREATE_CHANNEL');

  /* ─── Active Quiz: Finished ─── */
  if (activeQuiz && isFinished && result) {
    const accuracy = ((result.score / result.total) * 100).toFixed(0);
    const mins = Math.floor(result.timeTaken / 60);
    const secs = result.timeTaken % 60;
    const grade = accuracy >= 90 ? { label: 'Excellent', color: 'text-emerald-400' }
      : accuracy >= 75 ? { label: 'Good', color: 'text-indigo-400' }
      : accuracy >= 50 ? { label: 'Average', color: 'text-amber-400' }
      : { label: 'Needs Work', color: 'text-rose-400' };

    return (
      <div className="h-full flex flex-col items-center justify-center p-8 animate-fade-in">
        <div className="max-w-lg w-full glass-card rounded-3xl p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Trophy Icon */}
          <div className="relative w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-amber-500/30 rotate-6">
            <Trophy size={44} className="text-white -rotate-6" />
          </div>

          <h2 className="text-3xl font-black text-white mb-1">Quiz Complete!</h2>
          <p className={`text-lg font-black mb-2 ${grade.color}`}>{grade.label}</p>
          <p className="text-slate-400 text-sm mb-8">Results have been synced with your academic record.</p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Score</p>
              <p className="text-3xl font-black text-emerald-400">{result.score}/{result.total}</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Accuracy</p>
              <p className="text-3xl font-black text-indigo-400">{accuracy}%</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Time</p>
              <p className="text-2xl font-black text-slate-300">{mins}m {secs}s</p>
            </div>
          </div>

          {/* Stars */}
          <div className="flex justify-center gap-1 mb-8">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={22}
                className={star <= Math.round(accuracy / 20) ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}
              />
            ))}
          </div>

          <Button variant="primary" className="w-full" onClick={() => { setActiveQuiz(null); setIsFinished(false); setResult(null); }}>
            Back to Quizzes
          </Button>
        </div>
      </div>
    );
  }

  /* ─── Active Quiz: In Progress ─── */
  if (activeQuiz && !isFinished) {
    const q = activeQuiz.questions[currentQuestionIdx];
    const progress = ((currentQuestionIdx + 1) / activeQuiz.questions.length) * 100;
    const isUrgent = timeLeft < 30;
    const isWarning = timeLeft < 60;

    return (
      <div className="h-full flex flex-col bg-black/40 overflow-hidden">
        {/* Quiz Header */}
        <div className="h-18 border-b border-white/[0.05] px-8 py-4 flex items-center justify-between shrink-0 bg-black/30">
          <div className="flex items-center gap-4 min-w-0">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 shrink-0">
              <Timer size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-white text-sm uppercase tracking-tight truncate">{activeQuiz.title}</h3>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="h-1.5 w-40 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 font-black shrink-0">
                  {currentQuestionIdx + 1}/{activeQuiz.questions.length}
                </span>
              </div>
            </div>
          </div>

          {/* Timer */}
          <div className={`
            px-4 py-2 rounded-2xl font-black text-lg tracking-tighter flex items-center gap-2 transition-all shrink-0
            ${isUrgent
              ? 'bg-rose-600 text-white shadow-xl shadow-rose-600/30 animate-pulse'
              : isWarning
              ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
              : 'bg-white/[0.05] border border-white/[0.08] text-white'
            }
          `}>
            <Clock size={16} />
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
        </div>

        {/* Anti-Cheat Banner */}
        <div className="px-8 py-2 bg-rose-500/[0.06] border-b border-rose-500/15 flex items-center justify-center gap-2 shrink-0">
          <ShieldAlert size={11} className="text-rose-500" />
          <p className="text-[9px] text-rose-400 font-bold uppercase tracking-widest">
            Proctoring Active — Tab switching is monitored
          </p>
        </div>

        {/* Question */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
          <div className="max-w-3xl w-full">
            {/* Question number badge */}
            <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4 text-center">
              Question {currentQuestionIdx + 1} of {activeQuiz.questions.length}
            </p>
            <h2 className="text-xl font-bold text-white mb-10 text-center leading-relaxed">
              {q.question}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedAnswer(i)}
                  className={`
                    p-6 rounded-3xl border-2 text-left flex items-center gap-4 transition-all
                    hover:scale-[1.02] active:scale-[0.98]
                    ${selectedAnswer === i
                      ? 'bg-gradient-to-br from-indigo-600/30 to-violet-600/20 border-indigo-400 text-white shadow-xl shadow-indigo-600/20'
                      : 'bg-white/[0.03] border-white/[0.08] text-slate-300 hover:border-white/20 hover:bg-white/[0.06]'
                    }
                  `}
                >
                  <div className={`
                    w-9 h-9 rounded-xl font-black text-sm flex items-center justify-center shrink-0
                    ${selectedAnswer === i ? 'bg-indigo-500/30 text-indigo-200' : 'bg-white/[0.05] text-slate-500'}
                  `}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span className="font-semibold leading-snug">{opt}</span>
                  {selectedAnswer === i && (
                    <CheckCircle2 size={18} className="ml-auto text-indigo-400 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-20 border-t border-white/[0.05] px-10 flex items-center justify-between bg-black/20 shrink-0">
          <p className="text-xs text-slate-600 font-bold">
            {selectedAnswer === null ? 'Select an answer to continue' : 'Answer selected ✓'}
          </p>
          <Button
            variant="primary"
            size="lg"
            iconRight={ChevronRight}
            disabled={selectedAnswer === null}
            onClick={handleNext}
          >
            {currentQuestionIdx + 1 === activeQuiz.questions.length ? 'Finish Quiz' : 'Next Question'}
          </Button>
        </div>
      </div>
    );
  }

  /* ─── Quiz Dashboard ─── */
  return (
    <div className="h-full flex flex-col min-w-0">
      {/* Header */}
      <div className="h-16 border-b border-white/[0.05] px-7 flex items-center justify-between bg-black/20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400">
            <Trophy size={18} />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">Live Quizzes</h2>
            <p className="text-[11px] text-slate-500">Real-time academic testing</p>
          </div>
        </div>
        {canCreate && (
          <Button onClick={() => setIsModalOpen(true)} variant="primary" icon={Plus}>
            Create Quiz
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-7">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center"><Spinner size="lg" /></div>
        ) : quizzes.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center border border-dashed border-white/[0.06] rounded-3xl">
            <AlertCircle size={40} className="text-slate-700 mb-3" />
            <p className="text-slate-400 font-semibold">No Active Quizzes</p>
            <p className="text-slate-600 text-sm">New quizzes will appear here when created by Faculty.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="glass-card rounded-3xl p-6 flex flex-col relative overflow-hidden group"
              >
                {/* BG glow */}
                <div className="absolute -top-8 -right-8 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-110 transition-transform">
                    <Trophy size={24} />
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <Badge variant="warning" size="xs" dot>Active</Badge>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                      <Clock size={11} /> {quiz.duration} min
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                      <BarChart2 size={11} /> {quiz.questions?.length || 0} Qs
                    </div>
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-black text-white mb-1.5 leading-tight uppercase tracking-tight">
                    {quiz.title}
                  </h3>
                  <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest bg-indigo-500/10 inline-block px-2 py-0.5 rounded-lg mb-3">
                    {quiz.subject}
                  </p>
                  <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
                    {quiz.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-white/[0.05] space-y-4">
                  <div className="flex items-center gap-2">
                    <Avatar name={quiz.authorName || 'F'} size="xs" />
                    <span className="text-[10px] text-slate-500 font-bold">
                      {quiz.authorName || 'Faculty'}
                    </span>
                  </div>
                  <Button
                    variant="primary"
                    icon={Play}
                    className="w-full"
                    onClick={() => startQuiz(quiz)}
                  >
                    Start Quiz
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateQuizModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
