import React, { useState } from 'react';
import { 
  Sparkles, FileText, CheckCircle2, AlertCircle, TrendingUp, 
  Brain, Zap, Search, Download, Upload 
} from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import confetti from 'canvas-confetti';

export default function ResumeAnalyzerPage() {
  const [file, setFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const handleUpload = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setResult(null);
    }
  };

  const fileToGenerativePart = async (file) => {
    const base64EncodedDataPromise = new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type }
    };
  };

  const analyzeResume = async () => {
    if (!file) return;
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    setIsAnalyzing(true);
    
    if (!apiKey) {
      setTimeout(() => {
        setResult({
          score: 84,
          match: 'Senior Software Engineer (Backend)',
          streaks: ['React', 'Node.js', 'Firebase', 'Data Structures'],
          weaknesses: ['SQL Optimization', 'Cloud Scalability'],
          summary: 'MOCK DATA (No API Key found): Strong foundational skills with high consistency in frontend and real-time backend development.'
        });
        setIsAnalyzing(false);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }, 1500);
      return;
    }

    try {
      const pdfPart = await fileToGenerativePart(file);
      const prompt = `You are an expert tech recruiter and ATS system. Analyze this resume file. 
      Return ONLY a valid JSON object (no markdown, no backticks). The JSON must exactly match this structure:
      {
        "score": (a number between 1 and 100 matching overall quality and ATS readability),
        "match": (The best suitable job title for this resume, string),
        "summary": (A 2-sentence summary of the candidate's career profile),
        "streaks": [Array of 3 to 5 core strengths or skills found],
        "weaknesses": [Array of 2 to 3 skill gaps or weaknesses]
      }`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }, pdfPart] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      const aiText = data.candidates[0].content.parts[0].text;
      const parsedResult = JSON.parse(aiText);
      
      setResult(parsedResult);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      console.error("Gemini Analysis Error:", err);
      // Fallback if parsing or network fails
      alert("Analysis failed. Make sure it's a valid PDF and your API key is correct.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="h-full flex flex-col min-w-0">
      <div className="h-16 border-b border-white/[0.05] px-7 flex items-center justify-between bg-black/20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center text-violet-400">
            <Brain size={18} />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">AI Resume Analyzer</h2>
            <p className="text-[11px] text-slate-500">Get instant AI-driven career feedback</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-7">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Main Upload Area */}
          {!result ? (
            <div className={`
              glass-card rounded-[2.5rem] p-12 border-dashed border-2 
              flex flex-col items-center justify-center text-center transition-all
              ${file ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-white/[0.08] hover:border-white/[0.15]'}
            `}>
              <div className="w-20 h-20 bg-white/[0.03] rounded-3xl flex items-center justify-center mb-6">
                <FileText size={40} className={file ? 'text-indigo-400' : 'text-slate-600'} />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">
                {file ? file.name : 'Upload Your Resume'}
              </h3>
              <p className="text-sm text-slate-500 mb-8 max-w-sm">
                PDF, DOCX formats supported. Our AI will analyze your skills against top-tier tech roles.
              </p>

              <div className="flex gap-3">
                <input type="file" id="resume-upload" className="hidden" onChange={handleUpload} accept=".pdf,.docx" />
                <label 
                  htmlFor="resume-upload"
                  className="px-6 h-12 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <Upload size={18} /> {file ? 'Change File' : 'Select File'}
                </label>
                
                {file && (
                  <Button 
                    variant="primary" 
                    className="px-10 shadow-lg shadow-indigo-600/20"
                    loading={isAnalyzing}
                    onClick={analyzeResume}
                  >
                    Analyze Now
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-7 animate-fade-in">
              {/* Score Card */}
              <div className="glass-card rounded-[2rem] p-8 flex flex-col items-center text-center space-y-4">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="54" className="fill-none stroke-white/[0.05]" strokeWidth="10" />
                    <circle
                      cx="60" cy="60" r="54"
                      className="fill-none stroke-violet-500 transition-all duration-1000"
                      strokeWidth="10"
                      strokeDasharray="339"
                      strokeDashoffset={339 - (339 * result.score) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-3xl font-black text-white">
                    {result.score}
                  </div>
                </div>
                <h4 className="text-sm font-bold text-slate-400">ATS Match Score</h4>
                <Badge variant="success">Excellent Match</Badge>
              </div>

              {/* Suggestions */}
              <div className="lg:col-span-2 space-y-6">
                <div className="glass-card rounded-3xl p-7">
                  <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <TrendingUp size={14} className="text-emerald-400" /> Career Profile
                  </h4>
                  <p className="text-lg font-bold text-white mb-2">{result.match}</p>
                  <p className="text-sm text-slate-400 leading-relaxed">{result.summary}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-card rounded-3xl p-6 border-emerald-500/15">
                    <h5 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3">Strong Skills</h5>
                    <div className="flex flex-wrap gap-2">
                      {result.streaks.map(s => <span key={s} className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-[10px] font-bold border border-emerald-500/20">{s}</span>)}
                    </div>
                  </div>
                  <div className="glass-card rounded-3xl p-6 border-rose-500/15">
                    <h5 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-3">Gap Analysis</h5>
                    <div className="flex flex-wrap gap-2">
                      {result.weaknesses.map(w => <span key={w} className="px-2 py-1 bg-rose-500/10 text-rose-400 rounded-lg text-[10px] font-bold border border-rose-500/20">{w}</span>)}
                    </div>
                  </div>
                </div>

                <Button variant="secondary" className="w-full h-14 rounded-2xl text-base" onClick={() => setResult(null)}>
                  Analyze Another Resume
                </Button>
              </div>
            </div>
          )}

          {/* Tips Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: Zap, label: 'Standardized Format', desc: 'ATS engines prefer clear headers and simple layouts.' },
              { icon: Search, label: 'Keyword Optimization', desc: 'Mapping skills to specific role requirements.' },
              { icon: CheckCircle2, label: 'Action Verbs', desc: 'Using impact-driven language like "Led" or "Architected".' },
            ].map(tip => (
              <div key={tip.label} className="p-5 bg-white/[0.02] border border-white/[0.05] rounded-3xl">
                <tip.icon className="text-indigo-400 mb-3" size={20} />
                <h5 className="font-bold text-slate-200 text-sm mb-1">{tip.label}</h5>
                <p className="text-[11px] text-slate-500 leading-relaxed">{tip.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
