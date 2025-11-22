import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import { ViewState, CaseConfig, Message, NotebookState, SavedSession, TranscriptEntry, FeedbackReport } from '@/types';
import { saveSession as saveSessionToStorage, getLastSession } from '@/utils/storage';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';
import { Auth } from '@/components/Auth';
import { CaseManager } from '@/components/CaseManager';
import { CaseView } from '@/components/CaseView';
import { Timer } from '@/components/Timer';
import { TemplatesView } from '@/components/TemplatesView';
import { HistoryView } from '@/components/HistoryView';
import { FeedbackView } from '@/components/FeedbackView';
import { base64ToUint8Array, uint8ArrayToBase64, decodeAudioData, createPcmBlob } from '@/utils/audioUtils';
import { useIsMobile } from '@/hooks/use-mobile';

// --- Configuration ---
const LIVE_MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025';
const TEXT_MODEL = 'gemini-2.5-flash';
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

// --- Components ---

// 1. Landing Component
const Landing = ({ onStart, onViewHistory, onViewTemplates, onViewCases, onSignOut }: {
  onStart: () => void;
  onViewHistory: () => void;
  onViewTemplates: () => void;
  onViewCases: () => void;
  onSignOut: () => void;
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
          onClick={onViewCases}
          className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-500 border border-blue-500 rounded-lg flex items-center gap-2 transition-colors text-sm sm:text-base shadow-lg"
        >
          <span className="material-symbols-rounded text-base sm:text-lg">folder</span>
          <span className="font-medium hidden sm:inline">My Cases</span>
          <span className="font-medium sm:hidden">Cases</span>
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
        <button
          onClick={onSignOut}
          className="px-3 py-2 sm:px-4 sm:py-2 bg-red-600 hover:bg-red-500 border border-red-500 rounded-lg flex items-center gap-2 transition-colors text-sm sm:text-base"
        >
          <span className="material-symbols-rounded text-base sm:text-lg">logout</span>
        </button>
      </div>

      {showInstructions && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowInstructions(false)}>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 sm:p-8 max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">How to Use CaseBuddy</h2>
              <button onClick={() => setShowInstructions(false)} className="p-2 hover:bg-slate-700 rounded-lg">
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>
            <div className="space-y-4 text-slate-300">
              <p>CaseBuddy helps you practice case interviews and legal simulations with AI-powered real-time feedback.</p>
              <div>
                <h3 className="font-semibold text-white mb-2">Getting Started:</h3>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Choose your case type and difficulty level</li>
                  <li>Select Live Simulation for voice practice</li>
                  <li>Allow microphone access when prompted</li>
                  <li>Start speaking - the AI will respond in real-time</li>
                </ol>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Tips for Success:</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Speak clearly and at a natural pace</li>
                  <li>Use the Mic Gain slider if audio is too quiet</li>
                  <li>Review the notebook panel for key insights</li>
                  <li>Save your session to track progress</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="z-10 max-w-3xl text-center space-y-6 sm:space-y-8 px-4">
        <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-2xl mb-4 ring-1 ring-blue-500/30">
          <span className="material-symbols-rounded text-blue-400 text-3xl sm:text-4xl">gavel</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
          Case<span className="text-blue-500">Buddy</span>
        </h1>

        <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Master your high-stakes performance. Whether it's a <span className="text-white font-semibold">MBB Case Interview</span> or a <span className="text-white font-semibold">Civil RICO Trial</span>,
          CaseBuddy is your expert AI sparring partner.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left mt-8 sm:mt-12">
          {[
            { icon: 'record_voice_over', title: 'Live Simulation', desc: 'Practice depositions, cross-examinations, and case interviews in real-time.' },
            { icon: 'psychology', title: 'Expert Feedback', desc: 'Get critiqued on legal theory, questioning technique, and business frameworks.' },
            { icon: 'balance', title: 'Business & Law', desc: 'From Profitability to Civil Rights Litigation. Infinite scenarios.' }
          ].map((feature, i) => (
            <div key={i} className="p-4 sm:p-6 rounded-xl bg-slate-800/50 border border-slate-700 backdrop-blur-sm hover:border-blue-500/50 transition-colors">
              <span className="material-symbols-rounded text-blue-400 text-2xl sm:text-3xl mb-3 block">{feature.icon}</span>
              <h3 className="font-semibold text-base sm:text-lg mb-1">{feature.title}</h3>
              <p className="text-slate-400 text-xs sm:text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>

        <button
          onClick={onStart}
          className="mt-8 sm:mt-12 px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-semibold text-base sm:text-lg transition-all transform hover:scale-105 shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)]"
        >
          Start Practice Session
        </button>
      </div>
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

        <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-4">
          <button
            onClick={() => onConfigComplete(config, 'text')}
            className="flex items-center justify-center gap-2 py-2 sm:py-3 rounded-xl bg-slate-700 hover:bg-slate-600 transition-colors font-medium text-sm sm:text-base"
          >
            <span className="material-symbols-rounded text-base sm:text-lg">chat</span>
            <span className="hidden sm:inline">Text Strategy</span>
            <span className="sm:hidden">Text</span>
          </button>
          <button
            onClick={() => onConfigComplete(config, 'live')}
            className="flex items-center justify-center gap-2 py-2 sm:py-3 rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors font-medium text-sm sm:text-base"
          >
            <span className="material-symbols-rounded text-base sm:text-lg">mic</span>
            <span className="hidden sm:inline">Live Simulation</span>
            <span className="sm:hidden">Live</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// 3. Live Interface (Using working implementation)
const LiveSession = ({ config, initialNotebook, onEnd, caseId, caseContext }: {
  config: CaseConfig;
  initialNotebook?: NotebookState;
  onEnd: (session: SavedSession) => void;
  caseId?: string;
  caseContext?: any;
}) => {
  const isMobile = useIsMobile();
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [volume, setVolume] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [inputGain, setInputGain] = useState(1.0);
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [echoCancellation, setEchoCancellation] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotebook, setShowNotebook] = useState(false);
  const [notebook, setNotebook] = useState<NotebookState>(initialNotebook || {
    caseTitle: "Initializing...",
    currentPhase: "Setup",
    keyData: [],
    candidateFramework: [],
    caseTimeline: [],
    trialNotes: []
  });
  const [sessionDuration, setSessionDuration] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [audioFrequencyData, setAudioFrequencyData] = useState<Uint8Array>(new Uint8Array(128));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Audio Context Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Live API Refs
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const startTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<any>(null);
  const inputGainRef = useRef(1.0);
  const mounted = useRef(true);

  const isLegal = isLegalCase(config.type);

  // Sync gain ref
  useEffect(() => {
    inputGainRef.current = inputGain;
  }, [inputGain]);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Trial Notes management
  const [currentNote, setCurrentNote] = useState('');

  const addTrialNote = () => {
    if (currentNote.trim()) {
      setNotebook(prev => ({
        ...prev,
        trialNotes: [...prev.trialNotes, currentNote.trim()]
      }));
      setCurrentNote('');
    }
  };

  const removeTrialNote = (index: number) => {
    setNotebook(prev => ({
      ...prev,
      trialNotes: prev.trialNotes.filter((_, i) => i !== index)
    }));
  };

  const stopSession = useCallback(() => {
    console.log('Stopping session...');

    // Stop Audio Inputs
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }

    // Stop Audio Outputs
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch(e) {}
    });
    sourcesRef.current.clear();

    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    setVolume(0);
    nextStartTimeRef.current = 0;
  }, []);

  const handleEndSession = async () => {
    stopSession();
    const session: SavedSession = {
      id: Date.now().toString(),
      config,
      notebook,
      date: Date.now(),
      duration: sessionDuration,
      transcript
    };
    saveSessionToStorage(session);

    // Save to database if user is authenticated and case is selected
    const { data: { user } } = await supabase.auth.getUser();
    if (user && caseId) {
      const sessionData: TablesInsert<'sessions'> = {
        case_id: caseId,
        user_id: user.id,
        session_type: 'live-interview',
        duration: sessionDuration,
        notebook: notebook as any,
        transcript: session.transcript as any,
      };
      await supabase.from('sessions').insert(sessionData);
    }

    onEnd(session);
  };

  const handleSaveSession = async () => {
    const session: SavedSession = {
      id: Date.now().toString(),
      config,
      notebook,
      date: Date.now(),
      duration: sessionDuration,
      transcript
    };
    saveSessionToStorage(session);

    // Save to database if user is authenticated and case is selected
    const { data: { user } } = await supabase.auth.getUser();
    if (user && caseId) {
      const sessionData: TablesInsert<'sessions'> = {
        case_id: caseId,
        user_id: user.id,
        session_type: 'live-interview',
        duration: sessionDuration,
        notebook: notebook as any,
        transcript: session.transcript as any,
      };
      await supabase.from('sessions').insert(sessionData);
    }

    showToast("Session Saved Successfully");
  };

  useEffect(() => {
    mounted.current = true;

    const init = async () => {
      try {
        console.log('Initializing Gemini Live session...');
        const ai = new GoogleGenAI({ apiKey: API_KEY });

        setStatus('connecting');

        // Request microphone access with enhanced settings
        console.log('🎤 Requesting microphone access...');
        console.log('Audio settings:', { 
          echoCancellation, 
          noiseSuppression, 
          autoGainControl: true 
        });
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: echoCancellation,
            noiseSuppression: noiseSuppression,
            autoGainControl: true
          }
        });
        console.log('✅ Microphone access granted');
        console.log('Audio tracks:', stream.getAudioTracks().map(track => ({
          label: track.label,
          settings: track.getSettings()
        })));
        mediaStreamRef.current = stream;

        console.log('🔊 Setting up audio contexts...');
        const inputAc = new AudioContextClass({ sampleRate: 16000 });
        const outputAc = new AudioContextClass({ sampleRate: 24000 });
        inputAudioContextRef.current = inputAc;
        outputAudioContextRef.current = outputAc;
        console.log('Input context:', inputAc.state, 'Sample rate:', inputAc.sampleRate);
        console.log('Output context:', outputAc.state, 'Sample rate:', outputAc.sampleRate);

        console.log('🎵 Creating audio analyser and processor...');
        const source = inputAc.createMediaStreamSource(stream);
        sourceNodeRef.current = source;
        
        // Create analyser for visualization
        const analyser = inputAc.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        analyserRef.current = analyser;
        console.log('Analyser created - FFT size:', analyser.fftSize, 'Frequency bins:', analyser.frequencyBinCount);
        
        const processor = inputAc.createScriptProcessor(4096, 1, 1);
        scriptProcessorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (isMuted || !sessionRef.current) return;

          const inputData = e.inputBuffer.getChannelData(0);

          // Apply Gain
          const gain = inputGainRef.current;
          for (let i = 0; i < inputData.length; i++) {
            inputData[i] *= gain;
          }

          // Simple volume meter
          let sum = 0;
          for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
          const rms = Math.sqrt(sum / inputData.length);
          setVolume(Math.min(rms * 10, 1));

          const pcmBlob = createPcmBlob(inputData);
          sessionRef.current.sendRealtimeInput({ media: pcmBlob });
        };

        source.connect(analyser);
        analyser.connect(processor);
        processor.connect(inputAc.destination);

        // System instruction
        let systemInstruction = "";
        if (isLegal) {
          systemInstruction = `
          You are an elite Senior Litigation Partner and Trial Advocacy Coach.
          The user is practicing a ${config.difficulty} level ${config.type} simulation involving ${config.industry}.

          YOUR GOAL: Teach the user how to properly present, question, depose, and try the case.

          SPECIFIC GUIDANCE FOR ${config.type.toUpperCase()}:
          - Criminal Defense: Focus on Fourth Amendment suppression, Brady violations, and establishing Reasonable Doubt.
          - Civil Rights: Drill on Section 1983 elements, Qualified Immunity defenses, and Monell liability.
          - Civil RICO: Demand precision on the 'Enterprise' structure, specific 'Predicate Acts', and the 'Pattern of Racketeering'.
          - Deposition: Teach the 'Funnel Technique'. Object if compound or leading questions are asked inappropriately.

          ADAPTIVITY BASED ON DIFFICULTY (${config.difficulty}):
          - Beginner: Interrupt to correct form or legal standard immediately. Explain why a question is objectionable.
          - Intermediate: Allow minor errors but highlight them. Challenge the user's theory.
          - Advanced/Expert: Play a hostile witness or skeptical judge. Seize on any imprecision.

          Stay in character at all times. Be realistic and challenging.
          Use the 'updateNotebook' tool to track legal theory, admitted evidence, and key timeline events.
          `;
        } else {
          systemInstruction = `
          You are an expert Case Interviewer from McKinsey/BCG.
          You are conducting a ${config.difficulty} level ${config.type} case in the ${config.industry} industry.

          Role:
          - Be professional but encouraging.
          - Provide the case prompt clearly.
          - Listen to the candidate's structure.
          - Push back if the structure is weak.
          - Provide data only when asked or relevant.
          - Keep responses concise (spoken conversation).

          Tool Use:
          - Use 'updateNotebook' to reflect the case state.
          - Update 'caseTitle' with the company/scenario name.
          - Use 'newTimelineEvent' to log progress (e.g., "Framework Accepted", "Math Analysis Started").
          `;
        }

        // Define Tools
        const updateNotebookTool = {
          name: "updateNotebook",
          parameters: {
            type: Type.OBJECT,
            properties: {
              caseTitle: { type: Type.STRING },
              currentPhase: { type: Type.STRING, description: "Current phase e.g. Opening, Discovery, Deposition, Framework, Analysis" },
              keyData: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of key data/evidence/exhibits/statutes provided" },
              candidateFramework: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Candidate's structure, legal theory, or line of questioning" },
              newTimelineEvent: { type: Type.STRING, description: "A significant event to add to the timeline log" }
            }
          }
        };

        console.log('🌐 Connecting to Gemini Live API...');
        console.log('Model:', LIVE_MODEL);
        console.log('Voice:', isLegal ? 'Fenrir' : 'Kore');
        const sessionPromise = ai.live.connect({
          model: LIVE_MODEL,
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: systemInstruction,
            tools: [{ functionDeclarations: [updateNotebookTool] }],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: isLegal ? 'Fenrir' : 'Kore'
                }
              }
            }
          },
          callbacks: {
            onopen: () => {
              console.log('✅ Session connected successfully!');
              console.log('Connection status: OPEN');
              setStatus('connected');
              startTimeRef.current = Date.now();

              // Start timer
              timerIntervalRef.current = setInterval(() => {
                if (startTimeRef.current) {
                  setSessionDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
                }
              }, 1000);
            },
            onmessage: async (msg: LiveServerMessage) => {
              // Handle Audio
              const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (audioData && outputAudioContextRef.current) {
                console.log('🔊 Received audio chunk, size:', audioData.length, 'chars');
                const ctx = outputAudioContextRef.current;
                const uint8 = base64ToUint8Array(audioData);

                try {
                  const audioBuffer = await decodeAudioData(uint8, ctx, 24000, 1);
                  console.log('Audio decoded - duration:', audioBuffer.duration.toFixed(2), 's');
                  const now = ctx.currentTime;
                  const start = Math.max(now, nextStartTimeRef.current);

                  const source = ctx.createBufferSource();
                  source.buffer = audioBuffer;
                  source.connect(ctx.destination);
                  source.start(start);
                  nextStartTimeRef.current = start + audioBuffer.duration;
                  sourcesRef.current.add(source);

                  source.onended = () => sourcesRef.current.delete(source);
                } catch (err) {
                  console.error("❌ Error decoding audio chunk", err);
                }
              }

              const interrupted = msg.serverContent?.interrupted;
              if (interrupted) {
                console.log('⚠️ Audio interrupted - clearing queue');
                sourcesRef.current.forEach(s => {
                  try { s.stop(); } catch(e) {}
                });
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
              }

              // Handle Tools
              if (msg.toolCall) {
                console.log('🔧 Tool call received:', msg.toolCall.functionCalls.length, 'functions');
                for (const fc of msg.toolCall.functionCalls) {
                  if (fc.name === 'updateNotebook') {
                    const args = fc.args as any;
                    console.log('📝 Notebook update:', args);
                    setNotebook(prev => {
                      const next = { ...prev, ...args };
                      if (args.newTimelineEvent) {
                        next.caseTimeline = [...(prev.caseTimeline || []), args.newTimelineEvent];
                      }
                      return next;
                    });
                    sessionRef.current.sendToolResponse({
                      functionResponses: {
                        id: fc.id,
                        name: fc.name,
                        response: { result: "Notebook updated" }
                      }
                    });
                  }
                }
              }
            },
            onclose: () => {
              console.log("⚠️ Session closed by server");
              stopSession();
            },
            onerror: (e) => {
              console.error('❌ Session error:', e);
              setStatus('error');
            }
          }
        });

        sessionPromise.then(sess => {
          sessionRef.current = sess;
          console.log('✅ Session ready - sending initial audio input');
          sess.sendRealtimeInput({
            media: {
              mimeType: "audio/pcm;rate=16000",
              data: ""
            }
          });
        });

      } catch (e) {
        console.error('❌ Failed to initialize:', e);
        console.error('Error details:', e instanceof Error ? e.message : 'Unknown error');
        setStatus('error');
      }
    };

    init();

    return () => {
      mounted.current = false;
      stopSession();
    };
  }, [config, echoCancellation, noiseSuppression]);

  // Audio visualization effect
  useEffect(() => {
    if (!analyserRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let animationId: number;

    const draw = () => {
      animationId = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);
      setAudioFrequencyData(new Uint8Array(dataArray));

      ctx.fillStyle = 'rgb(15, 23, 42)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height * 0.8;

        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, 'rgb(59, 130, 246)');
        gradient.addColorStop(1, 'rgb(37, 99, 235)');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [analyserRef.current, status]);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-900 text-white overflow-hidden">
      {/* Toast Notification */}
      <div className={`fixed top-4 md:top-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ${toastMessage ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <div className="bg-blue-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-full shadow-2xl flex items-center gap-2 md:gap-3 font-medium text-sm md:text-base">
          <span className="material-symbols-rounded text-lg md:text-xl">check_circle</span>
          {toastMessage}
        </div>
      </div>

      {/* Main Live Area */}
      <div className="flex-1 flex flex-col relative min-h-0">
        <div className="absolute top-3 md:top-6 left-3 md:left-6 z-10 flex gap-2 md:gap-4">
          <div className={`inline-flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-semibold uppercase tracking-wider ${status === 'connected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-700 text-slate-400'}`}>
            <div className={`w-1.5 md:w-2 h-1.5 md:h-2 rounded-full ${status === 'connected' ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`}></div>
            <span className="hidden sm:inline">{status === 'connected' ? 'Live Simulation' : status}</span>
            <span className="sm:hidden">{status === 'connected' ? 'Live' : status}</span>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 md:p-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            title="Audio Settings"
          >
            <span className="material-symbols-rounded text-sm md:text-base">settings</span>
          </button>
        </div>

        {/* Mobile Notebook Toggle Button */}
        {isMobile && (
          <button
            onClick={() => setShowNotebook(!showNotebook)}
            className="absolute top-3 right-3 z-10 p-2 bg-blue-600 hover:bg-blue-500 border border-blue-500 rounded-lg transition-colors shadow-lg"
            title="View Notebook"
          >
            <span className="material-symbols-rounded text-base">
              {showNotebook ? 'close' : 'menu_book'}
            </span>
          </button>
        )}

        {/* Audio Settings Panel */}
        {showSettings && (
          <div className="absolute top-14 md:top-20 left-3 md:left-6 right-3 md:right-auto z-20 bg-slate-800 border border-slate-700 rounded-xl p-3 md:p-4 w-auto md:w-72 shadow-2xl max-w-sm">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="font-semibold text-white text-sm md:text-base">Audio Settings</h3>
              <button onClick={() => setShowSettings(false)}>
                <span className="material-symbols-rounded text-slate-400 text-sm">close</span>
              </button>
            </div>
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs md:text-sm text-slate-300">Noise Suppression</label>
                <button
                  onClick={() => setNoiseSuppression(!noiseSuppression)}
                  className={`relative inline-flex h-5 md:h-6 w-9 md:w-11 items-center rounded-full transition-colors ${
                    noiseSuppression ? 'bg-blue-600' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 md:h-4 w-3.5 md:w-4 transform rounded-full bg-white transition-transform ${
                      noiseSuppression ? 'translate-x-5 md:translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs md:text-sm text-slate-300">Echo Cancellation</label>
                <button
                  onClick={() => setEchoCancellation(!echoCancellation)}
                  className={`relative inline-flex h-5 md:h-6 w-9 md:w-11 items-center rounded-full transition-colors ${
                    echoCancellation ? 'bg-blue-600' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 md:h-4 w-3.5 md:w-4 transform rounded-full bg-white transition-transform ${
                      echoCancellation ? 'translate-x-5 md:translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="pt-2 border-t border-slate-700">
                <p className="text-[10px] md:text-xs text-slate-400 flex items-center gap-1">
                  <span className="material-symbols-rounded text-xs">info</span>
                  Changes require restarting the session
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-center relative px-4 md:px-8 py-4">
          {/* Audio Visualizer */}
          <div className="w-full max-w-3xl mb-4 md:mb-8">
            <canvas
              ref={canvasRef}
              width={800}
              height={200}
              className="w-full h-20 md:h-32 rounded-xl bg-slate-950/50 border border-slate-800"
            />
          </div>

          {/* Mic Icon with Pulse */}
          <div className="relative">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-blue-500/20 border-2 md:border-4 border-blue-500/30 flex items-center justify-center relative">
              <div className={`absolute inset-0 rounded-full ${status === 'connected' && volume > 0.1 ? 'animate-ping' : ''} bg-blue-500/20`}></div>
              <span className="material-symbols-rounded text-blue-400 text-4xl md:text-5xl z-10">mic</span>
            </div>
            {/* Volume Indicator Ring */}
            <svg className="absolute inset-0 w-24 h-24 md:w-32 md:h-32" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx={isMobile ? "48" : "64"}
                cy={isMobile ? "48" : "64"}
                r={isMobile ? "44" : "60"}
                stroke="currentColor"
                strokeWidth={isMobile ? "3" : "4"}
                fill="none"
                className="text-blue-500/20"
              />
              <circle
                cx={isMobile ? "48" : "64"}
                cy={isMobile ? "48" : "64"}
                r={isMobile ? "44" : "60"}
                stroke="currentColor"
                strokeWidth={isMobile ? "3" : "4"}
                fill="none"
                strokeDasharray={`${2 * Math.PI * (isMobile ? 44 : 60)}`}
                strokeDashoffset={`${2 * Math.PI * (isMobile ? 44 : 60) * (1 - volume)}`}
                className="text-blue-500 transition-all duration-100"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <p className="mt-4 md:mt-8 text-slate-400 font-light text-base md:text-lg">
            {status === 'connecting' ? 'Connecting...' : status === 'connected' ? 'Listening...' : 'Connection error'}
          </p>

          {/* Audio Quality Indicator */}
          <div className="mt-2 md:mt-4 flex flex-wrap items-center justify-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-slate-500">
            {noiseSuppression && (
              <span className="px-1.5 md:px-2 py-0.5 md:py-1 bg-blue-500/10 text-blue-400 rounded-full whitespace-nowrap">Noise Suppression</span>
            )}
            {echoCancellation && (
              <span className="px-1.5 md:px-2 py-0.5 md:py-1 bg-blue-500/10 text-blue-400 rounded-full whitespace-nowrap">Echo Cancellation</span>
            )}
          </div>
        </div>

        <div className="h-auto md:h-24 bg-slate-800 border-t border-slate-700 flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 px-3 md:px-8 py-3 md:py-0">
          {/* Timer */}
          <div className="flex items-center gap-2 text-slate-400 text-xs md:text-sm order-1 md:order-none">
            <span className="material-symbols-rounded text-base md:text-lg">timer</span>
            <span className="font-mono">{Math.floor(sessionDuration / 60)}:{(sessionDuration % 60).toString().padStart(2, '0')}</span>
          </div>

          {/* Mic Gain Control - Hidden on mobile to save space */}
          {!isMobile && (
            <div className="flex items-center gap-3 mr-4 bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-700">
              <span className="material-symbols-rounded text-slate-400 text-sm">mic</span>
              <div className="flex flex-col w-32">
                <div className="flex justify-between text-[10px] text-slate-500 font-medium uppercase mb-1">
                  <span>Mic Gain</span>
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
          )}

          {/* Action Buttons - Responsive layout */}
          <div className="flex items-center gap-2 md:gap-3 order-2 md:order-none">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3 md:p-4 rounded-full ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-white'} hover:scale-105 transition-transform`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              <span className="material-symbols-rounded text-xl md:text-2xl">{isMuted ? 'mic_off' : 'mic'}</span>
            </button>

            <button
              onClick={handleSaveSession}
              className="p-3 md:p-4 rounded-full bg-slate-700 text-blue-400 hover:bg-slate-600 hover:text-blue-300 hover:scale-105 transition-all"
              title="Save Session"
            >
              <span className="material-symbols-rounded text-xl md:text-2xl">save</span>
            </button>

            <button
              onClick={handleEndSession}
              className="px-4 md:px-8 py-2 md:py-3 bg-red-600 hover:bg-red-500 rounded-full font-semibold text-white transition-colors text-sm md:text-base"
            >
              <span className="hidden sm:inline">End Session</span>
              <span className="sm:hidden">End</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel: Notebook - Modal on mobile, sidebar on desktop */}
      {/* Mobile: Full-screen overlay */}
      {isMobile && showNotebook && (
        <div className="fixed inset-0 bg-slate-900 z-30 flex flex-col">
          {/* Mobile Notebook Header */}
          <div className="p-4 border-b border-slate-700 bg-slate-800/50 backdrop-blur flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">
                {isLegal ? 'Legal Pad' : 'Interviewer Notebook'}
              </h3>
              <h2 className="text-lg font-semibold text-white leading-tight truncate">{notebook.caseTitle}</h2>
              <div className="mt-1 text-xs text-slate-400">Phase: <span className="text-white">{notebook.currentPhase}</span></div>
            </div>
            <button
              onClick={() => setShowNotebook(false)}
              className="ml-3 p-2 hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
            >
              <span className="material-symbols-rounded">close</span>
            </button>
          </div>

          {/* Mobile Notebook Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Case Timeline Section */}
            <div>
              <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-3">
                <span className="material-symbols-rounded text-yellow-500 text-base">history_edu</span>
                Case Timeline
              </h4>
              {(!notebook.caseTimeline || notebook.caseTimeline.length === 0) ? (
                <p className="text-sm text-slate-500 italic">No events recorded yet.</p>
              ) : (
                <div className="relative border-l border-slate-600 ml-2 space-y-3 pl-3 py-1">
                  {notebook.caseTimeline.map((event, i) => (
                    <div key={i} className="relative text-sm text-slate-300">
                      <div className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-yellow-500 ring-4 ring-slate-900"></div>
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

            {/* Trial Notes Section */}
            <div>
              <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-3">
                <span className="material-symbols-rounded text-purple-500 text-base">sticky_note</span>
                Trial Notes & Questions
              </h4>

              {/* Add Note Input */}
              <div className="mb-3">
                <textarea
                  value={currentNote}
                  onChange={(e) => setCurrentNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      addTrialNote();
                    }
                  }}
                  placeholder="Enter a note or question to display during trial..."
                  className="w-full bg-slate-700/50 border border-slate-600 rounded p-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
                  rows={2}
                />
                <button
                  onClick={addTrialNote}
                  className="mt-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-rounded text-sm">add</span>
                  Add Note
                </button>
              </div>

              {/* Notes List */}
              {notebook.trialNotes.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No notes yet. Add notes or questions to keep on screen during the trial.</p>
              ) : (
                <ul className="space-y-2">
                  {notebook.trialNotes.map((note, i) => (
                    <li key={i} className="text-sm text-slate-300 bg-slate-700/50 p-2 rounded border-l-2 border-purple-500 flex justify-between items-start gap-2">
                      <span className="flex-1">{note}</span>
                      <button
                        onClick={() => removeTrialNote(i)}
                        className="text-slate-400 hover:text-red-400 transition-colors flex-shrink-0"
                        title="Remove note"
                      >
                        <span className="material-symbols-rounded text-base">close</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Desktop: Sidebar */}
      {!isMobile && (
        <div className="w-96 bg-slate-800 border-l border-slate-700 flex flex-col shadow-2xl z-20">
          <div className="p-6 border-b border-slate-700 bg-slate-800/50 backdrop-blur">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">
              {isLegal ? 'Legal Pad' : 'Interviewer Notebook'}
            </h3>
            <h2 className="text-xl font-semibold text-white leading-tight">{notebook.caseTitle}</h2>
            <div className="mt-2 text-sm text-slate-400">Phase: <span className="text-white">{notebook.currentPhase}</span></div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Case Timeline Section */}
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

            {/* Trial Notes Section */}
            <div>
              <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-3">
                <span className="material-symbols-rounded text-purple-500 text-lg">sticky_note</span>
                Trial Notes & Questions
              </h4>

              {/* Add Note Input */}
              <div className="mb-3">
                <textarea
                  value={currentNote}
                  onChange={(e) => setCurrentNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      addTrialNote();
                    }
                  }}
                  placeholder="Enter a note or question to display during trial..."
                  className="w-full bg-slate-700/50 border border-slate-600 rounded p-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
                  rows={3}
                />
                <button
                  onClick={addTrialNote}
                  className="mt-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-rounded text-sm">add</span>
                  Add Note
                </button>
              </div>

              {/* Notes List */}
              {notebook.trialNotes.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No notes yet. Add notes or questions to keep on screen during the trial.</p>
              ) : (
                <ul className="space-y-2">
                  {notebook.trialNotes.map((note, i) => (
                    <li key={i} className="text-sm text-slate-300 bg-slate-700/50 p-2 rounded border-l-2 border-purple-500 flex justify-between items-start gap-2">
                      <span className="flex-1">{note}</span>
                      <button
                        onClick={() => removeTrialNote(i)}
                        className="text-slate-400 hover:text-red-400 transition-colors flex-shrink-0"
                        title="Remove note"
                      >
                        <span className="material-symbols-rounded text-base">close</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 4. Text Session (simplified version)
const TextSession = ({ config, onEnd }: { config: CaseConfig, onEnd: () => void }) => {
  return (
    <div className="flex flex-col h-screen bg-slate-900">
      <div className="h-16 border-b border-slate-700 flex items-center justify-between px-6 bg-slate-800/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="material-symbols-rounded text-white text-sm">chat</span>
          </div>
          <h1 className="font-semibold text-white">{config.type} <span className="text-slate-500 text-sm font-normal">| {config.difficulty}</span></h1>
        </div>
        <button onClick={onEnd} className="text-slate-400 hover:text-white text-sm">End Session</button>
      </div>
      <div className="flex-1 flex items-center justify-center text-slate-400">
        <p>Text mode coming soon...</p>
      </div>
    </div>
  );
};

// 5. App Main Container
const CaseBuddyApp = () => {
  const [view, setView] = useState<ViewState>('auth');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [config, setConfig] = useState<CaseConfig>({ type: '', industry: '', difficulty: '' });
  const [initialNotebook, setInitialNotebook] = useState<NotebookState | undefined>(undefined);
  const [completedSession, setCompletedSession] = useState<SavedSession | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string | undefined>(undefined);
  const [selectedCaseData, setSelectedCaseData] = useState<any>(undefined);
  const [caseContext, setCaseContext] = useState<any>(undefined);

  useEffect(() => {
    // Check if user is already authenticated
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
        setView('landing');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      if (session && view === 'auth') {
        setView('landing');
      } else if (!session) {
        setView('auth');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setView('auth');
  };

  const startSetup = () => {
    setInitialNotebook(undefined);
    setSelectedCaseId(undefined);
    setCaseContext(undefined);
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

  const handleEndLiveSession = (session: SavedSession) => {
    setCompletedSession(session);
    setView('feedback');
  };

  const handleEnd = () => setView('landing');

  const handleFeedbackComplete = (feedback: FeedbackReport) => {
    if (completedSession) {
      const updatedSession = { ...completedSession, feedback };
      saveSessionToStorage(updatedSession);
    }
    setView('landing');
  };

  const handleSelectCase = (caseId: string, caseData: any) => {
    setSelectedCaseId(caseId);
    setSelectedCaseData(caseData);
    setView('case-detail');
  };

  const handleStartCaseSession = (context: any) => {
    setCaseContext(context);
    setConfig({
      type: context.caseType,
      industry: context.industry || 'Technology',
      difficulty: 'Intermediate',
    });
    setView('live-interview');
  };

  return (
    <div className="antialiased">
      {view === 'auth' && <Auth onSuccess={() => setView('landing')} />}
      {view === 'landing' && (
        <Landing
          onStart={startSetup}
          onViewHistory={() => setView('history')}
          onViewTemplates={() => setView('templates')}
          onViewCases={() => setView('cases')}
          onSignOut={handleSignOut}
        />
      )}
      {view === 'cases' && (
        <div className="min-h-screen bg-slate-900 text-white p-6">
          <CaseManager onSelectCase={handleSelectCase} />
        </div>
      )}
      {view === 'case-detail' && selectedCaseId && selectedCaseData && (
        <div className="min-h-screen bg-slate-900 text-white p-6">
          <CaseView
            caseId={selectedCaseId}
            caseData={selectedCaseData}
            onBack={() => setView('cases')}
            onStartSession={handleStartCaseSession}
          />
        </div>
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
          onEnd={handleEndLiveSession}
          caseId={selectedCaseId}
          caseContext={caseContext}
        />
      )}
      {view === 'text-interview' && <TextSession config={config} onEnd={handleEnd} />}
      {view === 'templates' && (
        <TemplatesView
          onBack={() => setView('landing')}
          onSelectTemplate={(template) => {
            setConfig({
              type: template.caseType,
              industry: 'Technology',
              difficulty: 'Intermediate'
            });
            setView('setup');
          }}
        />
      )}
      {view === 'history' && (
        <HistoryView
          onBack={() => setView('landing')}
          onResumeSession={handleLoadSession}
        />
      )}
      {view === 'feedback' && completedSession && (
        <FeedbackView
          session={completedSession}
          onComplete={handleFeedbackComplete}
          onSkip={() => setView('landing')}
        />
      )}
    </div>
  );
};

export default CaseBuddyApp;
