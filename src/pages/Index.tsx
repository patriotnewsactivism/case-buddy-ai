import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import { ViewState, CaseConfig, Message, NotebookState, SavedSession, TranscriptEntry, FeedbackReport, FrameworkTemplate } from '@/types';
import { saveSession as saveSessionToStorage, getLastSession } from '@/utils/storage';
import { Timer } from '@/components/Timer';
import { TemplatesView } from '@/components/TemplatesView';
import { HistoryView } from '@/components/HistoryView';
import { FeedbackView } from '@/components/FeedbackView';

// --- Configuration ---
const LIVE_MODEL = 'gemini-2.0-flash-exp';
const TEXT_MODEL = 'gemini-2.0-flash-exp';
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';

// --- Constants ---
const CASE_TYPES = [
  'Profitability', 'Market Entry', 'Mergers & Acquisitions', 'Product Launch', 
  'Criminal Defense', 'Civil Rights Litigation', 'Civil RICO', 'Deposition Simulation', 'Trial Strategy', 'Cross-Examination'
];

const INDUSTRIES = [
  'Technology', 'Retail', 'Healthcare', 'Energy', 'Financial Services', 
  'Government', 'Legal Services', 'Non-Profit', 'Real Estate'
];

const DIFFICULTIES = [
  'Beginner', 'Intermediate', 'Advanced', 'Expert / Partner Level'
];

const isLegalCase = (type: string) => {
  return ['Criminal Defense', 'Civil Rights Litigation', 'Civil RICO', 'Deposition Simulation', 'Trial Strategy', 'Cross-Examination'].includes(type);
};

// --- Audio Utils ---
const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function float32ToInt16(float32: Float32Array): Int16Array {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return int16;
}

// --- Components ---

// 1. Landing Component
const Landing = ({ onStart, onViewHistory, onViewTemplates }: {
  onStart: () => void;
  onViewHistory: () => void;
  onViewTemplates: () => void;
}) => {
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>

      <div className="fixed top-4 sm:top-6 right-4 sm:right-6 flex flex-col sm:flex-row gap-2 sm:gap-3 z-20">
        <button
          onClick={() => setShowInstructions(true)}
          className="px-3 py-2 sm:px-4 sm:py-2 bg-green-600 hover:bg-green-500 border border-green-500 rounded-lg flex items-center gap-2 transition-colors text-sm sm:text-base shadow-lg"
        >
          <span className="material-symbols-rounded text-base sm:text-lg">help</span>
          <span className="font-medium">How to Use</span>
        </button>
        <button
          onClick={onViewTemplates}
          className="px-3 py-2 sm:px-4 sm:py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-2 transition-colors text-sm sm:text-base"
        >
          <span className="material-symbols-rounded text-base sm:text-lg">account_tree</span>
          <span className="font-medium hidden sm:inline">Templates</span>
          <span className="font-medium sm:hidden">Temps</span>
        </button>
        <button
          onClick={onViewHistory}
          className="px-3 py-2 sm:px-4 sm:py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-2 transition-colors text-sm sm:text-base"
        >
          <span className="material-symbols-rounded text-base sm:text-lg">history</span>
          <span className="font-medium hidden sm:inline">History</span>
        </button>
      </div>

      <div className="z-10 max-w-3xl text-center space-y-4 sm:space-y-8 px-4">
        <div className="inline-flex items-center justify-center p-2 sm:p-3 bg-blue-500/10 rounded-2xl mb-2 sm:mb-4 ring-1 ring-blue-500/30">
          <span className="material-symbols-rounded text-blue-400 text-3xl sm:text-4xl">gavel</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
          Case<span className="text-blue-500">Buddy</span>
        </h1>

        <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Master your high-stakes performance. Whether it's a <span className="text-white font-semibold">MBB Case Interview</span> or a <span className="text-white font-semibold">Civil RICO Trial</span>,
          CaseBuddy is your expert AI sparring partner.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 text-left mt-6 sm:mt-12">
          {[
            { icon: 'record_voice_over', title: 'Live Simulation', desc: 'Practice depositions, cross-examinations, and case interviews in real-time.' },
            { icon: 'psychology', title: 'Expert Feedback', desc: 'Get critiqued on legal theory, questioning technique, and business frameworks.' },
            { icon: 'balance', title: 'Business & Law', desc: 'From Profitability to Civil Rights Litigation. Infinite scenarios.' }
          ].map((feature, i) => (
            <div key={i} className="p-4 sm:p-6 rounded-xl bg-slate-800/50 border border-slate-700 backdrop-blur-sm hover:border-blue-500/50 transition-colors">
              <span className="material-symbols-rounded text-blue-400 text-2xl sm:text-3xl mb-2 sm:mb-3 block">{feature.icon}</span>
              <h3 className="font-semibold text-base sm:text-lg mb-1">{feature.title}</h3>
              <p className="text-slate-400 text-xs sm:text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>

        <button
          onClick={onStart}
          className="mt-6 sm:mt-12 px-6 py-3 sm:px-8 sm:py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-semibold text-base sm:text-lg transition-all transform hover:scale-105 shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)]"
        >
          Start Practice Session
        </button>
      </div>

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 sm:p-6 flex items-center justify-between z-10">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <span className="material-symbols-rounded text-green-500">help</span>
                How to Use CaseBuddy
              </h2>
              <button
                onClick={() => setShowInstructions(false)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <span className="material-symbols-rounded text-slate-400">close</span>
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-6 text-slate-300">
              {/* Quick Start */}
              <section>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="material-symbols-rounded text-blue-500">rocket_launch</span>
                  Quick Start
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-sm sm:text-base">
                  <li>Click <strong className="text-white">"Start Practice Session"</strong> to begin</li>
                  <li>Select your simulation type (Legal or Business)</li>
                  <li>Choose industry, difficulty level</li>
                  <li>Pick <strong className="text-white">Text Strategy</strong> (chat) or <strong className="text-white">Live Simulation</strong> (voice)</li>
                  <li>Practice and receive real-time feedback</li>
                </ol>
              </section>

              {/* For Legal Professionals */}
              <section className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="material-symbols-rounded text-yellow-500">gavel</span>
                  For Legal Professionals & Litigation
                </h3>
                <div className="space-y-3 text-sm sm:text-base">
                  <p>CaseBuddy helps you prepare for:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong className="text-white">Criminal Defense</strong> - Practice defense strategies and cross-examination</li>
                    <li><strong className="text-white">Civil Rights Litigation</strong> - Prepare arguments for civil rights cases</li>
                    <li><strong className="text-white">Civil RICO</strong> - Complex racketeering case preparation</li>
                    <li><strong className="text-white">Deposition Simulation</strong> - Master deposition questioning techniques</li>
                    <li><strong className="text-white">Trial Strategy</strong> - Develop comprehensive trial approaches</li>
                    <li><strong className="text-white">Cross-Examination</strong> - Sharpen your questioning skills</li>
                  </ul>
                  <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                    <p className="text-blue-300 font-medium">💡 Pro Tip:</p>
                    <p className="text-slate-400 text-sm mt-1">During live sessions, the AI tracks your legal theory, evidence, and case timeline in real-time on the right sidebar (desktop) or collapsible panel (mobile).</p>
                  </div>
                </div>
              </section>

              {/* For Business Professionals */}
              <section className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="material-symbols-rounded text-purple-500">business_center</span>
                  For Business Case Interviews
                </h3>
                <div className="space-y-3 text-sm sm:text-base">
                  <p>Practice consulting-style cases:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong className="text-white">Profitability</strong> - Analyze business profitability issues</li>
                    <li><strong className="text-white">Market Entry</strong> - Evaluate new market opportunities</li>
                    <li><strong className="text-white">M&A</strong> - Assess merger and acquisition scenarios</li>
                    <li><strong className="text-white">Product Launch</strong> - Strategic product introduction planning</li>
                  </ul>
                </div>
              </section>

              {/* Live vs Text Mode */}
              <section>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="material-symbols-rounded text-green-500">compare</span>
                  Choosing Your Mode
                </h3>
                <div className="grid sm:grid-cols-2 gap-4 text-sm sm:text-base">
                  <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/30">
                    <h4 className="font-semibold text-blue-400 mb-2 flex items-center gap-2">
                      <span className="material-symbols-rounded text-sm">mic</span>
                      Live Simulation (Voice)
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-slate-400 text-sm">
                      <li>Real-time voice conversation</li>
                      <li>Most realistic practice</li>
                      <li>Requires microphone access</li>
                      <li>Best for oral advocacy prep</li>
                    </ul>
                  </div>
                  <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                    <h4 className="font-semibold text-slate-300 mb-2 flex items-center gap-2">
                      <span className="material-symbols-rounded text-sm">chat</span>
                      Text Strategy
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-slate-400 text-sm">
                      <li>Written conversation</li>
                      <li>More time to think</li>
                      <li>Great for strategy work</li>
                      <li>Works anywhere, anytime</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Tips for Success */}
              <section>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="material-symbols-rounded text-orange-500">tips_and_updates</span>
                  Tips for Success
                </h3>
                <ul className="space-y-2 text-sm sm:text-base">
                  <li className="flex gap-3">
                    <span className="text-blue-500 mt-1">•</span>
                    <span><strong className="text-white">Be specific</strong> - Clearly articulate your arguments and reasoning</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-blue-500 mt-1">•</span>
                    <span><strong className="text-white">Use the notebook</strong> - Track key points as they appear in the sidebar</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-blue-500 mt-1">•</span>
                    <span><strong className="text-white">Save your sessions</strong> - Review feedback after each practice</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-blue-500 mt-1">•</span>
                    <span><strong className="text-white">Adjust difficulty</strong> - Start easier and work your way up</span>
                  </li>
                </ul>
              </section>

              <div className="pt-4 border-t border-slate-700">
                <button
                  onClick={() => {
                    setShowInstructions(false);
                    onStart();
                  }}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-colors"
                >
                  Got It! Start Practicing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 2. Setup Component
const Setup = ({ onConfigComplete, onLoadSession, onBack, onViewTemplates }: {
  onConfigComplete: (config: CaseConfig, mode: 'live' | 'text') => void;
  onLoadSession: (saved: SavedSession) => void;
  onBack: () => void;
  onViewTemplates: () => void;
}) => {
  const [config, setConfig] = useState<CaseConfig>({
    type: 'Profitability',
    industry: 'Technology',
    difficulty: 'Intermediate'
  });
  const [savedSession, setSavedSession] = useState<SavedSession | null>(null);

  useEffect(() => {
    const saved = getLastSession();
    if (saved) {
      setSavedSession(saved);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <button
        onClick={onBack}
        className="fixed top-4 sm:top-6 left-4 sm:left-6 p-2 hover:bg-slate-800 rounded-lg transition-colors z-10"
      >
        <span className="material-symbols-rounded">arrow_back</span>
      </button>

      <button
        onClick={onViewTemplates}
        className="fixed top-4 sm:top-6 right-4 sm:right-6 px-3 py-2 sm:px-4 sm:py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-2 transition-colors z-10 text-sm sm:text-base"
      >
        <span className="material-symbols-rounded text-base sm:text-lg">account_tree</span>
        <span className="font-medium hidden sm:inline">View Templates</span>
      </button>

      <div className="w-full max-w-md bg-slate-800 rounded-2xl border border-slate-700 p-4 sm:p-8 space-y-4 sm:space-y-6 shadow-2xl mt-16 sm:mt-0">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Session Configuration</h2>

        {savedSession && (
          <div
            className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group hover:bg-blue-500/20 transition-colors cursor-pointer"
            onClick={() => onLoadSession(savedSession)}
          >
            <div className="text-xs sm:text-sm">
              <div className="text-blue-400 font-semibold flex items-center gap-2">
                <span className="material-symbols-rounded text-sm">history</span>
                Resume Last Session
              </div>
              <div className="text-slate-400 mt-1">{savedSession.config.type} • {new Date(savedSession.date).toLocaleDateString()}</div>
            </div>
            <button
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-xs font-bold rounded-lg uppercase tracking-wide transition-transform group-hover:scale-105 w-full sm:w-auto"
            >
              Resume
            </button>
          </div>
        )}

        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm text-slate-400 mb-2">Case / Simulation Type</label>
            <select
              value={config.type}
              onChange={(e) => setConfig({...config, type: e.target.value})}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 sm:p-3 text-sm sm:text-base text-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {CASE_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm text-slate-400 mb-2">Industry / Sector</label>
            <select
              value={config.industry}
              onChange={(e) => setConfig({...config, industry: e.target.value})}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 sm:p-3 text-sm sm:text-base text-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {INDUSTRIES.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm text-slate-400 mb-2">Difficulty Level</label>
            <select
              value={config.difficulty}
              onChange={(e) => setConfig({...config, difficulty: e.target.value})}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 sm:p-3 text-sm sm:text-base text-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {DIFFICULTIES.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-4">
          <button
            onClick={() => onConfigComplete(config, 'text')}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 transition-colors font-medium text-sm sm:text-base"
          >
            <span className="material-symbols-rounded text-lg sm:text-xl">chat</span>
            <span>Text Strategy</span>
          </button>
          <button
            onClick={() => {
              if (!API_KEY) {
                alert('Please add your Google API Key in environment variables (VITE_GOOGLE_API_KEY)');
                return;
              }
              onConfigComplete(config, 'live');
            }}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors font-medium text-sm sm:text-base"
          >
            <span className="material-symbols-rounded text-lg sm:text-xl">mic</span>
            <span>Live Simulation</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// 3. Live Interface
const LiveSession = ({ config, initialNotebook, onEnd }: {
  config: CaseConfig;
  initialNotebook?: NotebookState;
  onEnd: (session: SavedSession) => void;
}) => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [volume, setVolume] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [inputGain, setInputGain] = useState(1.0);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [showNotebook, setShowNotebook] = useState(false);
  const [notebook, setNotebook] = useState<NotebookState>(initialNotebook || {
    caseTitle: "Initializing...",
    currentPhase: "Setup",
    keyData: [],
    candidateFramework: [],
    caseTimeline: []
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isTranscriptionEnabled, setIsTranscriptionEnabled] = useState(true);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [currentInputTrans, setCurrentInputTrans] = useState("");
  const [currentOutputTrans, setCurrentOutputTrans] = useState("");
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null); 
  const inputGainRef = useRef(1.0);
  const mounted = useRef(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef(`session-${Date.now()}`);

  const isLegal = isLegalCase(config.type);

  useEffect(() => {
    inputGainRef.current = inputGain;
  }, [inputGain]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, currentInputTrans, currentOutputTrans]);

  useEffect(() => {
    if (timelineScrollRef.current) {
      timelineScrollRef.current.scrollTop = timelineScrollRef.current.scrollHeight;
    }
  }, [notebook.caseTimeline]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const saveSession = () => {
    const session: SavedSession = {
      id: sessionIdRef.current,
      config,
      notebook,
      date: Date.now(),
      duration: sessionDuration,
      transcript
    };
    saveSessionToStorage(session);
    showToast("Session Saved Successfully");
  };

  const handleEndSession = () => {
    const session: SavedSession = {
      id: sessionIdRef.current,
      config,
      notebook,
      date: Date.now(),
      duration: sessionDuration,
      transcript
    };
    saveSessionToStorage(session);
    onEnd(session);
  };

  useEffect(() => {
    mounted.current = true;
    
    const init = async () => {
      try {
        if (!API_KEY) {
          setStatus('error');
          return;
        }

        const ai = new GoogleGenAI({ apiKey: API_KEY });
        
        const ac = new AudioContextClass({ sampleRate: 24000 });
        audioContextRef.current = ac;
        const inputAc = new AudioContextClass({ sampleRate: 16000 });
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = inputAc.createMediaStreamSource(stream);
        const processor = inputAc.createScriptProcessor(4096, 1, 1);
        
        processor.onaudioprocess = (e) => {
          if (isMuted || !sessionRef.current) return;
          
          const inputData = e.inputBuffer.getChannelData(0);
          const gain = inputGainRef.current;
          
          for (let i = 0; i < inputData.length; i++) {
            inputData[i] *= gain;
          }
          
          let sum = 0;
          for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
          const rms = Math.sqrt(sum / inputData.length);
          setVolume(Math.min(rms * 10, 1));

          const pcm16 = float32ToInt16(inputData);
          const arrayBuffer = new ArrayBuffer(pcm16.byteLength);
          new Uint8Array(arrayBuffer).set(new Uint8Array(pcm16.buffer));
          const base64 = arrayBufferToBase64(arrayBuffer);
          
          sessionRef.current.sendRealtimeInput({
            media: {
              mimeType: "audio/pcm;rate=16000",
              data: base64
            }
          });
        };
        
        source.connect(processor);
        processor.connect(inputAc.destination);

        const updateNotebookTool = {
          name: "updateNotebook",
          parameters: {
            type: Type.OBJECT,
            properties: {
              caseTitle: { type: Type.STRING },
              currentPhase: { type: Type.STRING },
              keyData: { type: Type.ARRAY, items: { type: Type.STRING } },
              candidateFramework: { type: Type.ARRAY, items: { type: Type.STRING } },
              newTimelineEvent: { type: Type.STRING }
            }
          }
        };

        let systemInstruction = isLegal 
          ? `You are an elite Senior Litigation Partner conducting a ${config.difficulty} level ${config.type} simulation in ${config.industry}. Guide the user through proper legal procedure, questioning technique, and case strategy. Use the updateNotebook tool frequently to track progress, evidence, legal theory, and timeline events.`
          : `You are an expert McKinsey/BCG Case Interviewer conducting a ${config.difficulty} level ${config.type} case in ${config.industry}. Guide the candidate through structured problem-solving. Use the updateNotebook tool to track their framework, analysis, and key milestones.`;

        const sessionPromise = ai.live.connect({
          model: LIVE_MODEL,
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction,
            tools: [{ functionDeclarations: [updateNotebookTool] }],
          },
          callbacks: {
            onopen: () => {
              setStatus('connected');
            },
            onmessage: async (msg: LiveServerMessage) => {
              const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (audioData && audioContextRef.current) {
                const ctx = audioContextRef.current;
                const uint8 = base64ToUint8Array(audioData);
                
                const int16 = new Int16Array(uint8.buffer.slice(0));
                const float32 = new Float32Array(int16.length);
                for(let i=0; i<int16.length; i++) float32[i] = int16[i] / 32768.0;
                
                const buf = ctx.createBuffer(1, float32.length, 24000);
                buf.copyToChannel(float32, 0);

                const src = ctx.createBufferSource();
                src.buffer = buf;
                src.connect(ctx.destination);
                
                const now = ctx.currentTime;
                const start = Math.max(now, nextStartTimeRef.current);
                src.start(start);
                nextStartTimeRef.current = start + buf.duration;
                
                sourcesRef.current.add(src);
                src.onended = () => sourcesRef.current.delete(src);
              }

              const inputTx = msg.serverContent?.inputTranscription?.text;
              const outputTx = msg.serverContent?.outputTranscription?.text;
              
              if (inputTx) setCurrentInputTrans(prev => prev + inputTx);
              if (outputTx) setCurrentOutputTrans(prev => prev + outputTx);

              if (msg.serverContent?.turnComplete) {
                setCurrentInputTrans(curr => {
                  if (curr.trim()) {
                    setTranscript(t => [...t, { sender: 'You', text: curr, timestamp: Date.now() }]);
                  }
                  return "";
                });
                setCurrentOutputTrans(curr => {
                  if (curr.trim()) {
                    setTranscript(t => [...t, { sender: 'AI', text: curr, timestamp: Date.now() }]);
                  }
                  return "";
                });
              }

              if (msg.toolCall) {
                for (const fc of msg.toolCall.functionCalls) {
                  if (fc.name === 'updateNotebook') {
                    const args = fc.args as any;
                    setNotebook(prev => {
                      const next = { ...prev, ...args };
                      if (args.newTimelineEvent) {
                        next.caseTimeline = [...(prev.caseTimeline || []), args.newTimelineEvent];
                        delete (next as any).newTimelineEvent;
                      }
                      return next;
                    });
                    sessionRef.current.sendToolResponse({
                      functionResponses: [{
                        id: fc.id,
                        name: fc.name,
                        response: { result: "Notebook updated" }
                      }]
                    });
                  }
                }
              }
            },
            onclose: () => {
              console.log("Session closed");
            },
            onerror: (e) => {
              console.error(e);
              setStatus('error');
            }
          }
        });

        sessionPromise.then(sess => {
          sessionRef.current = sess;
          sess.sendRealtimeInput({
            media: {
              mimeType: "audio/pcm;rate=16000",
              data: "" 
            }
          });
        });

      } catch (e) {
        console.error(e);
        setStatus('error');
      }
    };

    init();

    return () => {
      mounted.current = false;
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [config]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId: number;

    const draw = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      ctx.beginPath();
      const radius = 50 + (volume * 100) + (Math.sin(Date.now() / 500) * 5);
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = `rgba(59, 130, 246, ${0.2 + volume})`; 
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, 40, 0, 2 * Math.PI);
      ctx.fillStyle = '#2563eb';
      ctx.fill();

      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, [volume]);

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-900 text-white overflow-hidden">
      <div className={`absolute top-4 sm:top-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ${toastMessage ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <div className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-2xl flex items-center gap-2 sm:gap-3 font-medium text-sm sm:text-base">
          <span className="material-symbols-rounded text-base sm:text-xl">check_circle</span>
          {toastMessage}
        </div>
      </div>

      <div className="flex-1 flex flex-col relative">
        <div className="absolute top-4 sm:top-6 left-4 sm:left-6 z-10 flex flex-wrap gap-2 sm:gap-4">
          <div className={`inline-flex items-center gap-2 px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${status === 'connected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-700 text-slate-400'}`}>
            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${status === 'connected' ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`}></div>
            {status === 'connected' ? 'Live' : status}
          </div>
          <button
            onClick={() => setIsTranscriptionEnabled(!isTranscriptionEnabled)}
            className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold border transition-colors ${isTranscriptionEnabled ? 'bg-white text-slate-900 border-white' : 'bg-transparent text-slate-400 border-slate-600 hover:border-slate-400'}`}
          >
            {isTranscriptionEnabled ? 'CC ON' : 'CC OFF'}
          </button>
          <button
            onClick={() => setShowNotebook(!showNotebook)}
            className="lg:hidden px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold bg-blue-600 hover:bg-blue-500 transition-colors"
          >
            {showNotebook ? 'Hide Notes' : 'Show Notes'}
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center relative px-4">
          <canvas ref={canvasRef} width={600} height={400} className="w-full max-w-2xl h-auto opacity-90" />
          <p className="mt-4 sm:mt-8 text-slate-400 font-light text-sm sm:text-lg animate-pulse">
            {status === 'connecting' ? 'Preparing session...' : 'Listening...'}
          </p>

          {isTranscriptionEnabled && (transcript.length > 0 || currentInputTrans || currentOutputTrans) && (
            <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 w-[calc(100%-2rem)] sm:w-full max-w-2xl max-h-[200px] sm:max-h-[300px] overflow-y-auto bg-black/60 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/10 scrollbar-hide" ref={scrollRef}>
              <div className="flex flex-col gap-1 sm:gap-2">
                {transcript.map((t, i) => (
                  <div key={i} className={`text-xs sm:text-sm ${t.sender === 'You' ? 'text-blue-300' : 'text-white'}`}>
                    <span className="font-bold opacity-70 uppercase text-[10px] sm:text-xs mr-2">{t.sender}:</span>
                    {t.text}
                  </div>
                ))}
                {(currentInputTrans || currentOutputTrans) && (
                  <div className="text-xs sm:text-sm italic opacity-80 animate-pulse">
                    {currentInputTrans && <span className="text-blue-300"><span className="font-bold text-[10px] sm:text-xs mr-2">YOU:</span>{currentInputTrans}</span>}
                    {currentOutputTrans && <span className="text-white"><span className="font-bold text-[10px] sm:text-xs mr-2">AI:</span>{currentOutputTrans}</span>}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="min-h-[80px] sm:h-24 bg-slate-800 border-t border-slate-700 flex flex-wrap items-center justify-center gap-2 sm:gap-4 px-2 sm:px-8 py-2">
          <Timer onTimeUpdate={setSessionDuration} />

          <div className="hidden sm:flex items-center gap-3 bg-slate-900/50 px-3 sm:px-4 py-2 rounded-xl border border-slate-700">
            <span className="material-symbols-rounded text-slate-400 text-sm">mic</span>
            <div className="flex flex-col w-24 sm:w-32">
              <div className="flex justify-between text-[10px] text-slate-500 font-medium uppercase mb-1">
                <span>Gain</span>
                <span>{inputGain.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                step="0.1"
                value={inputGain}
                onChange={(e) => setInputGain(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2 sm:p-4 rounded-full ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-white'} hover:scale-105 transition-transform`}
          >
            <span className="material-symbols-rounded text-lg sm:text-2xl">{isMuted ? 'mic_off' : 'mic'}</span>
          </button>

          <button
            onClick={saveSession}
            className="p-2 sm:p-4 rounded-full bg-slate-700 text-blue-400 hover:bg-slate-600 hover:text-blue-300 hover:scale-105 transition-all"
            title="Save Session"
          >
            <span className="material-symbols-rounded text-lg sm:text-2xl">save</span>
          </button>

          <button
            onClick={handleEndSession}
            className="px-4 sm:px-8 py-2 sm:py-3 bg-red-600 hover:bg-red-500 rounded-full font-semibold text-white transition-colors text-xs sm:text-base"
          >
            <span className="hidden sm:inline">End & Get Feedback</span>
            <span className="sm:hidden">End</span>
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-96 bg-slate-800 border-l border-slate-700 flex-col shadow-2xl z-20">
        <div className="p-6 border-b border-slate-700 bg-slate-800/50 backdrop-blur">
          <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">
            {isLegal ? 'Legal Pad' : 'Interviewer Notebook'}
          </h3>
          <h2 className="text-xl font-semibold text-white leading-tight">{notebook.caseTitle}</h2>
          <div className="mt-2 text-sm text-slate-400">Phase: <span className="text-white">{notebook.currentPhase}</span></div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide" ref={timelineScrollRef}>
          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-3">
              <span className="material-symbols-rounded text-yellow-500 text-lg">history_edu</span>
              Case Timeline
            </h4>
            {(!notebook.caseTimeline || notebook.caseTimeline.length === 0) ? (
              <p className="text-sm text-slate-500 italic">No events recorded yet.</p>
            ) : (
              <div className="relative border-l border-slate-600 ml-2 space-y-4 pl-4 py-1">
                {notebook.caseTimeline.map((event, i) => (
                  <div key={i} className="relative text-sm text-slate-300">
                    <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-yellow-500 ring-4 ring-slate-800"></div>
                    {event}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-3">
              <span className="material-symbols-rounded text-blue-500 text-lg">
                {isLegal ? 'folder_open' : 'dataset'}
              </span>
              {isLegal ? 'Exhibits / Evidence' : 'Key Data Provided'}
            </h4>
            {notebook.keyData.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Empty.</p>
            ) : (
              <ul className="space-y-2">
                {notebook.keyData.map((d, i) => (
                  <li key={i} className="text-sm text-slate-300 bg-slate-700/50 p-2 rounded border-l-2 border-blue-500">{d}</li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-3">
              <span className="material-symbols-rounded text-green-500 text-lg">
                {isLegal ? 'gavel' : 'account_tree'}
              </span>
              {isLegal ? 'Legal Theory / Strategy' : 'Candidate Structure'}
            </h4>
            {notebook.candidateFramework.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Pending...</p>
            ) : (
              <ul className="space-y-2">
                {notebook.candidateFramework.map((d, i) => (
                  <li key={i} className="text-sm text-slate-300 bg-slate-700/50 p-2 rounded border-l-2 border-green-500">{d}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Notebook Modal */}
      {showNotebook && (
        <div className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-800 rounded-t-2xl sm:rounded-2xl border-t sm:border border-slate-700 w-full sm:max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                  {isLegal ? 'Legal Pad' : 'Interviewer Notebook'}
                </h3>
                <h2 className="text-lg font-semibold text-white leading-tight">{notebook.caseTitle}</h2>
                <div className="mt-1 text-xs text-slate-400">Phase: <span className="text-white">{notebook.currentPhase}</span></div>
              </div>
              <button
                onClick={() => setShowNotebook(false)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <span className="material-symbols-rounded text-slate-400">close</span>
              </button>
            </div>

            <div className="p-4 space-y-6">
              <div>
                <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-3">
                  <span className="material-symbols-rounded text-yellow-500 text-base">history_edu</span>
                  Case Timeline
                </h4>
                {(!notebook.caseTimeline || notebook.caseTimeline.length === 0) ? (
                  <p className="text-sm text-slate-500 italic">No events recorded yet.</p>
                ) : (
                  <div className="relative border-l border-slate-600 ml-2 space-y-3 pl-4 py-1">
                    {notebook.caseTimeline.map((event, i) => (
                      <div key={i} className="relative text-sm text-slate-300">
                        <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-yellow-500 ring-4 ring-slate-800"></div>
                        {event}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-3">
                  <span className="material-symbols-rounded text-blue-500 text-base">
                    {isLegal ? 'folder_open' : 'dataset'}
                  </span>
                  {isLegal ? 'Exhibits / Evidence' : 'Key Data Provided'}
                </h4>
                {notebook.keyData.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">Empty.</p>
                ) : (
                  <ul className="space-y-2">
                    {notebook.keyData.map((d, i) => (
                      <li key={i} className="text-sm text-slate-300 bg-slate-700/50 p-2 rounded border-l-2 border-blue-500">{d}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-3">
                  <span className="material-symbols-rounded text-green-500 text-base">
                    {isLegal ? 'gavel' : 'account_tree'}
                  </span>
                  {isLegal ? 'Legal Theory / Strategy' : 'Candidate Structure'}
                </h4>
                {notebook.candidateFramework.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">Pending...</p>
                ) : (
                  <ul className="space-y-2">
                    {notebook.candidateFramework.map((d, i) => (
                      <li key={i} className="text-sm text-slate-300 bg-slate-700/50 p-2 rounded border-l-2 border-green-500">{d}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 4. Text Session
const TextSession = ({ config, onEnd }: { config: CaseConfig; onEnd: (session: SavedSession) => void }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef(`session-${Date.now()}`);
  
  const ai = useRef(new GoogleGenAI({ apiKey: API_KEY })).current;
  const chatSession = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const initChat = async () => {
      setLoading(true);
      try {
        const isLegal = isLegalCase(config.type);
        const sysInstruction = isLegal 
          ? `You are a renowned Trial Lawyer conducting a ${config.difficulty} level ${config.type} case strategy session in ${config.industry}. Create realistic scenarios and provide expert legal guidance.`
          : `You are an expert Case Interviewer from McKinsey/BCG conducting a ${config.difficulty} ${config.type} case in ${config.industry}. Guide the candidate through structured problem-solving.`;
        
        chatSession.current = ai.chats.create({
          model: TEXT_MODEL,
          config: { systemInstruction: sysInstruction }
        });
        
        const result = await chatSession.current.sendMessage({ message: "Start the session." });
        setMessages([{ role: 'model', text: result.text, timestamp: Date.now() }]);
      } catch (e) {
        console.error(e);
        setMessages([{ role: 'system', text: "Failed to start session. Please check your API key.", timestamp: Date.now() }]);
      } finally {
        setLoading(false);
      }
    };
    initChat();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user' as const, text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const result = await chatSession.current.sendMessage({ message: input });
      setMessages(prev => [...prev, { role: 'model', text: result.text, timestamp: Date.now() }]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = () => {
    const session: SavedSession = {
      id: sessionIdRef.current,
      config,
      notebook: {
        caseTitle: `${config.type} - Text Session`,
        currentPhase: "Completed",
        keyData: [],
        candidateFramework: [],
        caseTimeline: []
      },
      date: Date.now(),
      duration: sessionDuration
    };
    saveSessionToStorage(session);
    onEnd(session);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900">
      <div className="h-14 sm:h-16 border-b border-slate-700 flex items-center justify-between px-3 sm:px-6 bg-slate-800/50 backdrop-blur">
        <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-rounded text-white text-sm sm:text-base">chat</span>
          </div>
          <h1 className="font-semibold text-white text-sm sm:text-base truncate">
            {config.type}
            <span className="text-slate-500 text-xs sm:text-sm font-normal ml-1 hidden sm:inline">| {config.difficulty}</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Timer onTimeUpdate={setSessionDuration} />
          <button
            onClick={handleEndSession}
            className="px-2 sm:px-4 py-1.5 sm:py-2 bg-red-600 hover:bg-red-500 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap"
          >
            <span className="hidden sm:inline">End & Get Feedback</span>
            <span className="sm:hidden">End</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-6">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] sm:max-w-2xl p-3 sm:p-4 rounded-2xl ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-tr-none'
                : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none'
            }`}>
              <div className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed">{msg.text}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 p-3 sm:p-4 rounded-2xl rounded-tl-none flex gap-2">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-slate-500 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-slate-500 rounded-full animate-bounce delay-75"></div>
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-slate-500 rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef}></div>
      </div>

      <div className="p-3 sm:p-4 bg-slate-800 border-t border-slate-700">
        <div className="max-w-4xl mx-auto flex gap-2 sm:gap-4">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Type your response..."
            className="flex-1 bg-slate-900 border border-slate-600 text-white rounded-xl px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base"
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center disabled:opacity-50 transition-colors flex-shrink-0"
          >
            <span className="material-symbols-rounded text-lg sm:text-xl">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// 5. Main App
const Index = () => {
  const [view, setView] = useState<ViewState>('landing');
  const [config, setConfig] = useState<CaseConfig>({ type: '', industry: '', difficulty: '' });
  const [initialNotebook, setInitialNotebook] = useState<NotebookState | undefined>(undefined);
  const [completedSession, setCompletedSession] = useState<SavedSession | null>(null);

  const startSetup = () => {
    setInitialNotebook(undefined);
    setView('setup');
  };
  
  const handleConfigComplete = (newConfig: CaseConfig, mode: 'live' | 'text') => {
    setConfig(newConfig);
    setView(mode === 'live' ? 'live-interview' : 'text-interview');
  };

  const handleLoadSession = (saved: SavedSession) => {
    setConfig(saved.config);
    setInitialNotebook(saved.notebook);
    setView('live-interview');
  };

  const handleSessionEnd = (session: SavedSession) => {
    setCompletedSession(session);
    setView('feedback');
  };

  const handleFeedbackComplete = (feedback: FeedbackReport) => {
    if (completedSession) {
      const updatedSession = { ...completedSession, feedback };
      saveSessionToStorage(updatedSession);
    }
    setView('landing');
  };

  return (
    <div className="antialiased">
      {view === 'landing' && (
        <Landing 
          onStart={startSetup} 
          onViewHistory={() => setView('history')}
          onViewTemplates={() => setView('templates')}
        />
      )}
      {view === 'setup' && (
        <Setup 
          onConfigComplete={handleConfigComplete} 
          onLoadSession={handleLoadSession}
          onBack={() => setView('landing')}
          onViewTemplates={() => setView('templates')}
        />
      )}
      {view === 'live-interview' && (
        <LiveSession 
          config={config} 
          initialNotebook={initialNotebook} 
          onEnd={handleSessionEnd}
        />
      )}
      {view === 'text-interview' && (
        <TextSession 
          config={config} 
          onEnd={handleSessionEnd}
        />
      )}
      {view === 'feedback' && completedSession && (
        <FeedbackView
          session={completedSession}
          onComplete={handleFeedbackComplete}
          onSkip={() => setView('landing')}
        />
      )}
      {view === 'history' && (
        <HistoryView
          onBack={() => setView('landing')}
          onResumeSession={(session) => {
            setConfig(session.config);
            setInitialNotebook(session.notebook);
            setView('live-interview');
          }}
        />
      )}
      {view === 'templates' && (
        <TemplatesView
          onBack={() => setView('landing')}
        />
      )}
    </div>
  );
};

export default Index;
