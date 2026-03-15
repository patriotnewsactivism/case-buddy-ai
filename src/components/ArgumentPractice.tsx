import React, {
  useState, useRef, useEffect, useContext, useReducer, useCallback
} from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../App';
import { useAuth } from '../contexts/AuthContext';
import { MOCK_OPPONENT } from '../constants';
import {
  CoachingAnalysis, Message, TrialPhase, SimulationMode,
  TrialSession, VoiceConfig, SimulatorSettings, TrialSessionMetrics,
  CoachingSuggestion
} from '../types';
import {
  Mic, MicOff, Activity, AlertTriangle, Lightbulb, AlertCircle,
  BookOpen, Sword, GraduationCap, User, Gavel, ArrowLeft, FileText,
  Users, Scale, Clock, Volume2, ChevronUp, FolderOpen, ChevronDown,
  Target, Loader2, ChevronRight
} from 'lucide-react';
import { getTrialSimSystemPrompt, isOpenAIConfigured, streamOpenAIResponse } from '../services/openAIService';
import { generateProactiveCoaching } from '../services/geminiService';
import { callGeminiProxy } from '../services/apiProxy';
import { Type } from "@google/genai";
import { ELEVENLABS_VOICES, TRIAL_VOICE_PRESETS, isElevenLabsConfigured, synthesizeSpeech } from '../services/elevenLabsService';
import { isBrowserTTSAvailable, speakWithFallback } from '../services/browserTTSService';
import { toast } from 'react-toastify';

// Extracted components and hooks
import ObjectionModal from './TrialSim/ObjectionModal';
import SessionCard from './TrialSim/SessionCard';
import { StatPill, TranscriptBubble, SettingRow } from './TrialSim/AtomicComponents';
import { useSavedSessions } from '../hooks/useSavedSessions';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AIStructuredResponse {
  speak: string;
  action: 'response' | 'objection' | 'ruling' | 'question';
  objection: { grounds: string; explanation: string } | null;
  ruling?: {
    type: 'sustained' | 'overruled' | 'warning';
    text: string;
    judgeName: string;
  } | null;
  coaching: {
    critique: string;
    suggestion: string;
    teleprompterScript: string;
    rhetoricalEffectiveness: number;
    fallaciesIdentified: string[];
  };
}

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  onspeechstart: () => void;
  onspeechend: () => void;
  start: () => void;
  stop: () => void;
}

type SimView = 'setup' | 'active' | 'history';

interface SessionState {
  isLive: boolean;
  isConnecting: boolean;
  isAISpeaking: boolean;
  liveVolume: number;
  inputTranscript: string;
  outputTranscript: string;
  objectionCount: number;
  rhetoricalScores: number[];
  sessionScore: number;
}

type SessionAction =
  | { type: 'START_CONNECTING' }
  | { type: 'SESSION_LIVE' }
  | { type: 'SESSION_STOPPED' }
  | { type: 'AI_SPEAKING_START' }
  | { type: 'AI_SPEAKING_END' }
  | { type: 'SET_VOLUME'; volume: number }
  | { type: 'SET_INPUT_TRANSCRIPT'; text: string }
  | { type: 'SET_OUTPUT_TRANSCRIPT'; text: string }
  | { type: 'OBJECTION_DETECTED' }
  | { type: 'RHETORICAL_SCORE'; score: number }
  | { type: 'RESET_SESSION' };

const INITIAL_SESSION: SessionState = {
  isLive: false,
  isConnecting: false,
  isAISpeaking: false,
  liveVolume: 0,
  inputTranscript: '',
  outputTranscript: '',
  objectionCount: 0,
  rhetoricalScores: [],
  sessionScore: 50,
};

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'START_CONNECTING':
      return { ...state, isConnecting: true };
    case 'SESSION_LIVE':
      return { ...state, isLive: true, isConnecting: false };
    case 'SESSION_STOPPED':
      return {
        ...state,
        isLive: false, isConnecting: false, isAISpeaking: false,
        liveVolume: 0, inputTranscript: '', outputTranscript: ''
      };
    case 'AI_SPEAKING_START':
      return { ...state, isAISpeaking: true };
    case 'AI_SPEAKING_END':
      return { ...state, isAISpeaking: false };
    case 'SET_VOLUME':
      return { ...state, liveVolume: action.volume };
    case 'SET_INPUT_TRANSCRIPT':
      return { ...state, inputTranscript: action.text };
    case 'SET_OUTPUT_TRANSCRIPT':
      return { ...state, outputTranscript: action.text };
    case 'OBJECTION_DETECTED':
      return { ...state, objectionCount: state.objectionCount + 1 };
    case 'RHETORICAL_SCORE': {
      const scores = [...state.rhetoricalScores, action.score];
      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / (scores.length || 1));
      return { ...state, rhetoricalScores: scores, sessionScore: avg };
    }
    case 'RESET_SESSION':
      return { ...INITIAL_SESSION };
    default:
      return state;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'literally', 'actually', 'right', 'so'];

function buildStructuredSystemPrompt(
  phase: TrialPhase,
  mode: SimulationMode,
  opponentName: string,
  caseSummary: string,
  judgeName: string = "Judge"
): string {
  const base = getTrialSimSystemPrompt(phase, mode, opponentName, caseSummary);
  return `${base}

══ RESPONSE FORMAT — CRITICAL ══
You MUST respond ONLY with valid JSON (no markdown, no code fences) matching this schema exactly:

{
  "speak": "<what you say aloud as opposing counsel or judge — stay in character>",
  "action": "response" | "objection" | "ruling" | "question",
  "objection": null | { "grounds": "<legal basis, e.g. Hearsay>", "explanation": "<1–2 sentence explanation>" },
  "ruling": null | { "type": "sustained" | "overruled" | "warning", "text": "<The judge's ruling statement>", "judgeName": "${judgeName}" },
  "coaching": {
    "critique": "<constructive critique of the user's last statement — be specific>",
    "suggestion": "<concrete, actionable improvement>",
    "teleprompterScript": "<exactly what the user should say next — write it in first person>",
    "rhetoricalEffectiveness": <integer 0–100>,
    "fallaciesIdentified": [<string array of any logical fallacies — empty array if none>]
  }
}

Rules:
• "speak" is the ONLY text said aloud. Keep it courtroom-realistic and appropriate to the phase.
• "objection" is non-null ONLY when you raise a formal objection; otherwise null.
• "ruling" is non-null ONLY if the judge intervenes or rules on an objection; otherwise null.
• "coaching" is ALWAYS fully populated — it drives the private training HUD, never spoken.
• "rhetoricalEffectiveness" reflects argument strength: 0=catastrophic, 50=average, 100=masterful.
• Never break character in "speak". Coaching commentary stays in "coaching" only.
• Output ONLY valid JSON. Non-JSON output breaks the simulator.`;
}

function parseAIResponse(raw: string): AIStructuredResponse {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/m, '')
    .replace(/\s*```$/m, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as AIStructuredResponse;
    if (typeof parsed.speak !== 'string') throw new Error('Missing speak field');
    return parsed;
  } catch (err) {
    console.warn('[TrialSim] Failed to parse structured AI response, using fallback:', err);
    return {
      speak: raw.trim() || '[No response]',
      action: 'response',
      objection: null,
      coaching: {
        critique: 'AI response format was unexpected — continue practicing.',
        suggestion: 'Keep going. Your argument is being evaluated.',
        teleprompterScript: '',
        rhetoricalEffectiveness: 50,
        fallaciesIdentified: [],
      },
    };
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TRIAL_PHASES = [
  { id: 'pre-trial-motions', label: 'Pre-Trial',  icon: FileText },
  { id: 'voir-dire',         label: 'Voir Dire',  icon: Users },
  { id: 'opening-statement', label: 'Opening',    icon: BookOpen },
  { id: 'direct-examination',label: 'Direct',     icon: User },
  { id: 'cross-examination', label: 'Cross',      icon: Sword },
  { id: 'defendant-testimony',label:'Defendant',  icon: Mic },
  { id: 'closing-argument',  label: 'Closing',    icon: Scale },
  { id: 'sentencing',        label: 'Sentencing', icon: Gavel },
] as const;

const MODES = [
  {
    id: 'learn',
    label: 'Learn',
    desc: 'AI guides with scripts and detailed coaching',
    icon: GraduationCap,
    colorClass: 'bg-blue-600',
  },
  {
    id: 'practice',
    label: 'Practice',
    desc: 'Balanced objections and feedback',
    icon: Mic,
    colorClass: 'bg-green-600',
  },
  {
    id: 'trial',
    label: 'Simulate',
    desc: 'Aggressive — no mercy, real courtroom pressure',
    icon: Sword,
    colorClass: 'bg-red-600',
  },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

const TrialSim: React.FC = () => {
  const { activeCase } = useContext(AppContext);
  const { user, updateUsage } = useAuth();

  // ── Navigation ──────────────────────────────────────────────────────────
  const [view, setView]     = useState<SimView>('setup');
  const [phase, setPhase]   = useState<TrialPhase | null>(null);
  const [mode, setMode]     = useState<SimulationMode | null>(null);

  // ── Setup UI ────────────────────────────────────────────────────────────
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>({
    voiceName: 'josh', personality: 'neutral', languageCode: 'en-US',
  });
  const [simulatorSettings, setSimulatorSettings] = useState<SimulatorSettings>({
    voice: { voiceName: 'josh', personality: 'neutral', languageCode: 'en-US' },
    realismLevel: 'professional',
    interruptionFrequency: 'medium',
    coachingVerbosity: 'moderate',
    audioQuality: 'high',
  });
  const [useElevenLabs, setUseElevenLabs] = useState(true);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);

  // ── Session UI ──────────────────────────────────────────────────────────
  const [messages, setMessages]             = useState<Message[]>([]);
  const [coachingTip, setCoachingTip]       = useState<CoachingAnalysis | null>(null);
  const [objectionAlert, setObjectionAlert] = useState<{ grounds: string; explanation: string } | null>(null);
  const [judgeAlert, setJudgeAlert] = useState<{ type: string; text: string; judgeName: string } | null>(null);
  const [showCoaching, setShowCoaching]     = useState(false);
  const [showTeleprompter, setShowTeleprompter] = useState(true);
  const [showEvidencePanel, setShowEvidencePanel] = useState(false);
  const [proactiveSuggestions, setProactiveSuggestions] = useState<CoachingSuggestion[]>([]);
  const [proactiveTip, setProactiveTip] = useState<string>('');
  const [isLoadingProactive, setIsLoadingProactive] = useState(false);
  const [showProactivePanel, setShowProactivePanel] = useState(true);

  // ── Session state machine ────────────────────────────────────────────────
  const [session, dispatch] = useReducer(sessionReducer, INITIAL_SESSION);

  // ── Saved sessions ───────────────────────────────────────────────────────
  const { sessions: savedSessions, addSession, removeSession } = useSavedSessions(activeCase?.id);

  // ── History playback ─────────────────────────────────────────────────────
  const [playingSessionId, setPlayingSessionId] = useState<string | null>(null);
  const historyAudioRef = useRef<HTMLAudioElement | null>(null);

  // ── Stable refs (prevent stale closure bugs) ─────────────────────────────
  const isLiveRef        = useRef(false);
  const isAISpeakingRef  = useRef(false);
  const isProcessingRef  = useRef(false);
  const restartAttemptsRef = useRef(0);

  // ── Infrastructure refs ──────────────────────────────────────────────────
  const recognitionRef      = useRef<SpeechRecognition | null>(null);
  const streamRef           = useRef<MediaStream | null>(null);
  const mediaRecorderRef    = useRef<MediaRecorder | null>(null);
  const recordedChunksRef   = useRef<Blob[]>([]);
  const playbackAudioRef    = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef  = useRef<AbortController | null>(null);
  const rafRef              = useRef<number | null>(null);
  const sessionStartTimeRef = useRef<number>(0);
  const metricsRef          = useRef<TrialSessionMetrics>({
    objectionsReceived: 0, fallaciesCommitted: 0,
    avgRhetoricalScore: 50, wordCount: 0, fillerWordsCount: 0,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Derived ──────────────────────────────────────────────────────────────
  const opponentName = activeCase?.opposingCounsel && activeCase.opposingCounsel !== 'Unknown'
    ? activeCase.opposingCounsel
    : MOCK_OPPONENT.name;

  const elevenLabsKey = process.env.ELEVENLABS_API_KEY ?? '';
  const canUseElevenLabs = useElevenLabs && isElevenLabsConfigured() && elevenLabsKey.length > 10;

  const avgRhetoricalScore = session.rhetoricalScores.length > 0
    ? Math.round(session.rhetoricalScores.reduce((a, b) => a + b, 0) / (session.rhetoricalScores.length || 1))
    : 50;

  // ── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => { isAISpeakingRef.current = session.isAISpeaking; }, [session.isAISpeaking]);
  useEffect(() => { isLiveRef.current = session.isLive; }, [session.isLive]);

  useEffect(() => {
    metricsRef.current.objectionsReceived = session.objectionCount;
  }, [session.objectionCount]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      stopSession(true);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Proactive Coaching ───────────────────────────────────────────────────

  const fetchProactiveCoaching = useCallback(async () => {
    if (!activeCase || !phase) return;
    
    setIsLoadingProactive(true);
    try {
      const result = await generateProactiveCoaching(
        phase,
        activeCase.summary || 'A legal case',
        'opponent',
        messages
      );
      setProactiveSuggestions(result.suggestions);
      setProactiveTip(result.generalTip);
    } catch (error) {
      console.warn('[TrialSim] Failed to fetch proactive coaching:', error);
    } finally {
      setIsLoadingProactive(false);
    }
  }, [activeCase, phase, messages]);

  useEffect(() => {
    if (view === 'active' && phase && messages.length === 0) {
      fetchProactiveCoaching();
    }
  }, [view, phase, messages.length]);

  useEffect(() => {
    if (view === 'active' && messages.length > 0 && messages.length % 3 === 0) {
      fetchProactiveCoaching();
    }
  }, [view, messages.length]);

  // ── Audio playback ────────────────────────────────────────────────────────

  const speakText = useCallback(async (text: string): Promise<void> => {
    if (!text) return;
    dispatch({ type: 'AI_SPEAKING_START' });

    try {
      if (canUseElevenLabs) {
        const voiceId =
          ELEVENLABS_VOICES[voiceConfig.voiceName as keyof typeof ELEVENLABS_VOICES]?.id
          ?? ELEVENLABS_VOICES['josh'].id;

        const audioData = await synthesizeSpeech(text, voiceId, {
          apiKey: elevenLabsKey,
          stability: 0.5,
          similarityBoost: 0.75,
        });

        const audioBlob = new Blob([audioData], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        playbackAudioRef.current = audio;

        try {
          await new Promise<void>((resolve, reject) => {
            audio.onended = () => resolve();
            audio.onerror = () => reject(new Error('ElevenLabs audio playback failed'));
            audio.play().catch(reject);
          });
        } finally {
          URL.revokeObjectURL(audioUrl);
          playbackAudioRef.current = null;
        }
      } else if (isBrowserTTSAvailable()) {
        await speakWithFallback(text, { rate: 1, pitch: 1, volume: 1 });
      } else {
        toast.warn('Voice playback unavailable — response shown in transcript only.');
      }
    } catch (err) {
      console.warn('[TrialSim] Speech playback error:', err);
    } finally {
      dispatch({ type: 'AI_SPEAKING_END' });
    }
  }, [canUseElevenLabs, voiceConfig.voiceName, elevenLabsKey]);

  // ── Recording ─────────────────────────────────────────────────────────────

  const startRecording = useCallback((stream: MediaStream) => {
    recordedChunksRef.current = [];
    try {
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onerror = (e) => console.error('[TrialSim] MediaRecorder error:', e);
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
    } catch (err) {
      console.error('[TrialSim] MediaRecorder init failed:', err);
    }
  }, []);

  // ── Session save ──────────────────────────────────────────────────────────

  const saveSession = useCallback(() => {
    if (!activeCase || !phase || !mode) return;
    if (recordedChunksRef.current.length === 0) return;

    const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
    const audioUrl = URL.createObjectURL(blob);

    addSession({
      id: `session-${Date.now()}`,
      caseId: activeCase.id,
      caseTitle: activeCase.title,
      phase,
      mode,
      date: new Date().toISOString(),
      duration: Math.round((Date.now() - sessionStartTimeRef.current) / 1000),
      transcript: messages.map(m => ({
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        sender: m.sender,
        text: m.text,
        timestamp: m.timestamp,
      })),
      audioUrl,
      score: avgRhetoricalScore,
      metrics: { ...metricsRef.current },
    });

    if (user?.plan === 'free') {
      void updateUsage({ trial_sessions_this_month: (user.usage?.trial_sessions_this_month || 0) + 1 });
    }

    toast.success('Session saved!');
  }, [activeCase, phase, mode, messages, avgRhetoricalScore, addSession]);

  // ── Stop session ──────────────────────────────────────────────────────────

  const stopSession = useCallback((silent = false) => {
    if (!silent && recordedChunksRef.current.length > 0) {
      saveSession();
    }

    abortControllerRef.current?.abort();
    abortControllerRef.current = null;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = () => {};
        recognitionRef.current.onerror = () => {};
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    playbackAudioRef.current?.pause();
    playbackAudioRef.current = null;

    if (mediaRecorderRef.current?.state !== 'inactive') {
      try { mediaRecorderRef.current?.stop(); } catch {}
    }
    mediaRecorderRef.current = null;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;

    dispatch({ type: 'SESSION_STOPPED' });
    isLiveRef.current = false;
    isProcessingRef.current = false;
    restartAttemptsRef.current = 0;
  }, [saveSession]);

  // ── Core AI turn orchestration ────────────────────────────────────────────

  const handleUserTranscript = useCallback(async (transcript: string) => {
    if (!phase || !mode || !activeCase) return;
    if (isProcessingRef.current) return;

    isProcessingRef.current = true;
    dispatch({ type: 'SET_INPUT_TRANSCRIPT', text: transcript });
    dispatch({ type: 'SET_OUTPUT_TRANSCRIPT', text: '' });

    metricsRef.current.wordCount += transcript.split(/\s+/).filter(Boolean).length;
    const lc = transcript.toLowerCase();
    metricsRef.current.fillerWordsCount += FILLER_WORDS.filter(f => lc.includes(f)).length;

    setMessages(prev => [...prev, {
      id: `${Date.now()}-u`,
      sender: 'user',
      text: transcript,
      timestamp: Date.now(),
    }]);

    try {
      abortControllerRef.current = new AbortController();
      const systemPrompt = buildStructuredSystemPrompt(phase, mode, opponentName, activeCase.summary, activeCase.judge);

      const response = await callGeminiProxy({
        prompt: transcript,
        systemPrompt,
        model: 'gemini-2.5-flash',
        options: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              speak: { type: Type.STRING },
              action: { type: Type.STRING },
              objection: {
                type: Type.OBJECT,
                properties: {
                  grounds: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                }
              },
              ruling: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  text: { type: Type.STRING },
                  judgeName: { type: Type.STRING }
                }
              },
              coaching: {
                type: Type.OBJECT,
                properties: {
                  critique: { type: Type.STRING },
                  suggestion: { type: Type.STRING },
                  teleprompterScript: { type: Type.STRING },
                  rhetoricalEffectiveness: { type: Type.NUMBER },
                  fallaciesIdentified: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['critique', 'suggestion', 'teleprompterScript', 'rhetoricalEffectiveness']
              }
            },
            required: ['speak', 'action', 'coaching']
          }
        },
        conversationHistory: messages.map(m => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        }))
      });

        if (!response.success || !response.text) {
        throw new Error(response.error?.message || 'AI turn failed: No response text received');
        }

        const parsed = parseAIResponse(response.text);
        dispatch({ type: 'SET_OUTPUT_TRANSCRIPT', text: parsed.speak });

      if (parsed.objection) {
        dispatch({ type: 'OBJECTION_DETECTED' });
        setObjectionAlert(parsed.objection);
      }

      if (parsed.ruling) {
        setJudgeAlert({
          type: parsed.ruling.type,
          text: parsed.ruling.text,
          judgeName: parsed.ruling.judgeName || activeCase.judge || "Judge"
        });
        
        setMessages(prev => [...prev, {
          id: `${Date.now()}-j`,
          sender: 'system',
          text: `[${parsed.ruling?.judgeName || 'Judge'}]: ${parsed.ruling?.text}`,
          timestamp: Date.now(),
        }]);
      }

      if (parsed.coaching) {
        const { coaching } = parsed;
        setCoachingTip({
          critique: coaching.critique,
          suggestion: coaching.suggestion,
          teleprompterScript: coaching.teleprompterScript,
          rhetoricalEffectiveness: coaching.rhetoricalEffectiveness,
          fallaciesIdentified: coaching.fallaciesIdentified,
        } as CoachingAnalysis);

        dispatch({ type: 'RHETORICAL_SCORE', score: coaching.rhetoricalEffectiveness });
        metricsRef.current.avgRhetoricalScore = avgRhetoricalScore;

        if (coaching.fallaciesIdentified.length > 0) {
          metricsRef.current.fallaciesCommitted += coaching.fallaciesIdentified.length;
        }
      }

      setMessages(prev => [...prev, {
        id: `${Date.now()}-o`,
        sender: 'opponent',
        text: parsed.speak || '[No response]',
        timestamp: Date.now(),
      }]);

      await speakText(parsed.speak);
      
      if (parsed.ruling) {
        await new Promise(r => setTimeout(r, 500));
        await speakText(parsed.ruling.text);
        setTimeout(() => setJudgeAlert(null), 5000);
      }

    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error('[TrialSim] AI turn error:', err);
      toast.error('Failed to get AI response — check configuration.');
    } finally {
      dispatch({ type: 'SET_INPUT_TRANSCRIPT', text: '' });
      dispatch({ type: 'AI_SPEAKING_END' });
      isProcessingRef.current = false;
    }
  }, [phase, mode, activeCase, opponentName, avgRhetoricalScore, speakText, messages]);

  // ── Start session ─────────────────────────────────────────────────────────

  const startSession = useCallback(async () => {
    if (!activeCase || !phase || !mode) {
      toast.error('Select a case, phase, and mode first.');
      return;
    }

    if (user?.plan === 'free' && (user.usage?.trial_sessions_this_month || 0) >= 1) {
      toast.error('Free plan is limited to 1 trial session per month. Please upgrade to Pro.');
      return;
    }

    if (!isOpenAIConfigured()) {
      toast.error('OpenAI API key not configured. Add OPENAI_API_KEY to .env.local');
      return;
    }

    dispatch({ type: 'START_CONNECTING' });
    sessionStartTimeRef.current = Date.now();
    metricsRef.current = { objectionsReceived: 0, fallaciesCommitted: 0, avgRhetoricalScore: 50, wordCount: 0, fillerWordsCount: 0 };
    isProcessingRef.current = false;
    restartAttemptsRef.current = 0;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      streamRef.current = stream;

      // Real-time volume meter setup
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateVolume = () => {
        if (!isLiveRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        dispatch({ type: 'SET_VOLUME', volume: Math.min(100, average * 2) });
        rafRef.current = requestAnimationFrame(updateVolume);
      };
      rafRef.current = requestAnimationFrame(updateVolume);

    } catch (err) {
      console.error('[TrialSim] Microphone denied:', err);
      toast.error('Microphone access denied — allow it in browser settings and retry.');
      dispatch({ type: 'SESSION_STOPPED' });
      return;
    }

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      toast.error('Speech recognition not supported. Use Chrome or Edge.');
      stream.getTracks().forEach(t => t.stop());
      dispatch({ type: 'SESSION_STOPPED' });
      return;
    }

    const recognition = new SpeechRecognitionClass() as any;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      console.log('[TrialSim] SpeechRecognition started');
    };

    const MAX_RESTARTS = 10;
    let silenceTimer: ReturnType<typeof setTimeout> | null = null;
    let lastTranscriptTime = Date.now();

    recognition.onspeechstart = () => {
      console.log('[TrialSim] User speaking...');
      dispatch({ type: 'SET_VOLUME', volume: 80 });
      lastTranscriptTime = Date.now();
    };
    
    recognition.onspeechend = () => {
      dispatch({ type: 'SET_VOLUME', volume: 20 });
    };

    recognition.onresult = async (event: SpeechRecognitionEvent) => {
      if (isAISpeakingRef.current) {
        console.log('[TrialSim] Ignoring speech result because AI is speaking');
        return;
      }
      
      lastTranscriptTime = Date.now();
      if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
      }

      let interimTranscript = '';
      let latestFinalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          latestFinalTranscript += t;
        } else {
          interimTranscript += t;
        }
      }

      if (interimTranscript) {
        dispatch({ type: 'SET_INPUT_TRANSCRIPT', text: interimTranscript.trim() });
        dispatch({ type: 'SET_VOLUME', volume: 60 + Math.random() * 30 });
        
        // Start silence timer for interim results
        silenceTimer = setTimeout(async () => {
          if (interimTranscript.trim() && !isProcessingRef.current && !isAISpeakingRef.current) {
            console.log('[TrialSim] Silence detected, processing interim transcript');
            await handleUserTranscript(interimTranscript.trim());
          }
        }, 2500); // 2.5s of silence triggers it
      }

      if (latestFinalTranscript.trim() && !isProcessingRef.current) {
        if (silenceTimer) clearTimeout(silenceTimer);
        await handleUserTranscript(latestFinalTranscript.trim());
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const FATAL_ERRORS = ['not-allowed', 'audio-capture', 'service-not-allowed'];
      if (FATAL_ERRORS.includes(event.error)) {
        toast.error(`Speech recognition: ${event.error} — check browser settings.`);
        stopSession();
        return;
      }
      if (event.error === 'aborted' || event.error === 'no-speech') {
        return;
      }
      console.warn('[TrialSim] Non-fatal recognition error:', event.error);
    };

    recognition.onend = () => {
      if (!recognitionRef.current || !isLiveRef.current) return;

      if (restartAttemptsRef.current >= MAX_RESTARTS) {
        toast.error('Speech recognition stopped repeatedly. Please refresh the page.');
        dispatch({ type: 'SESSION_STOPPED' });
        return;
      }

      const delay = Math.min(200, 100 + restartAttemptsRef.current * 20);
      setTimeout(() => {
        if (!isLiveRef.current || !recognitionRef.current) return;
        try {
          recognition.start();
          restartAttemptsRef.current = 0;
        } catch (err) {
          restartAttemptsRef.current++;
          console.error('[TrialSim] Recognition restart failed:', err);
        }
      }, delay);
    };

    try {
      recognition.start();
    } catch (err) {
      console.error('[TrialSim] recognition.start() failed:', err);
      toast.error('Failed to start speech recognition. Refresh and try again.');
      stream.getTracks().forEach(t => t.stop());
      dispatch({ type: 'SESSION_STOPPED' });
      return;
    }

    startRecording(stream);
    dispatch({ type: 'SESSION_LIVE' });
    isLiveRef.current = true;

    if (!canUseElevenLabs) {
      toast.info('ElevenLabs not configured — using browser voice.');
    }
    toast.success('Session started — speak to begin!');
  }, [activeCase, phase, mode, canUseElevenLabs, handleUserTranscript, startRecording, stopSession]);

  const handleObjectionResponse = useCallback((response: string) => {
    setObjectionAlert(null);
    handleUserTranscript(response);
  }, [handleUserTranscript]);

  const playHistorySession = useCallback((s: TrialSession) => {
    if (playingSessionId === s.id) {
      historyAudioRef.current?.pause();
      setPlayingSessionId(null);
      return;
    }
    historyAudioRef.current?.pause();
    if (!s.audioUrl) return;
    const audio = new Audio(s.audioUrl);
    audio.onended = () => setPlayingSessionId(null);
    audio.play();
    historyAudioRef.current = audio;
    setPlayingSessionId(s.id);
  }, [playingSessionId]);

  const downloadAudio = useCallback((s: TrialSession) => {
    if (!s.audioUrl) { toast.error('No audio available.'); return; }
    Object.assign(document.createElement('a'), {
      href: s.audioUrl,
      download: `trial-${s.phase}-${s.date.slice(0, 10)}.webm`,
    }).click();
  }, []);

  const exportTranscript = useCallback((s: TrialSession) => {
    const lines = [
      'TRIAL SIMULATION TRANSCRIPT',
      '='.repeat(40),
      `Case:     ${s.caseTitle}`,
      `Phase:    ${s.phase}`,
      `Mode:     ${s.mode}`,
      `Date:     ${new Date(s.date).toLocaleString()}`,
      `Duration: ${Math.floor(s.duration / 60)}m ${s.duration % 60}s`,
      `Score:    ${s.score}%`,
      '',
    ];

    if (s.metrics) {
      lines.push(
        'METRICS',
        `  Objections received:  ${s.metrics.objectionsReceived ?? 0}`,
        `  Fallacies committed:  ${s.metrics.fallaciesCommitted ?? 0}`,
        `  Avg rhetorical score: ${s.metrics.avgRhetoricalScore ?? 50}%`,
        `  Word count:           ${s.metrics.wordCount ?? 0}`,
        `  Filler words:         ${s.metrics.fillerWordsCount ?? 0}`,
        '',
      );
    }

    lines.push('TRANSCRIPT', '='.repeat(40));
    (s.transcript ?? []).forEach(m => {
      const sender = m.sender === 'user' ? 'YOU' : m.sender.toUpperCase();
      lines.push(`\n[${sender}]:\n${m.text}`);
    });

    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain' }));
    Object.assign(document.createElement('a'), {
      href: url,
      download: `transcript-${s.phase}-${s.date.slice(0, 10)}.txt`,
    }).click();
    URL.revokeObjectURL(url);
    toast.success('Transcript exported.');
  }, []);

  const handleDeleteSession = useCallback((id: string) => {
    if (!window.confirm('Delete this session?')) return;
    removeSession(id);
    toast.success('Session deleted.');
  }, [removeSession]);

  if (!activeCase) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-slate-500 p-4">
        <AlertCircle size={48} className="mb-4 opacity-40" />
        <p className="text-lg font-semibold text-white">No Active Case</p>
        <p className="text-sm text-slate-500 mt-1 mb-6">Select a case to begin your simulation.</p>
        <Link
          to="/app/cases"
          className="bg-gold-600 hover:bg-gold-500 text-slate-900 font-bold px-6 py-3 rounded-lg transition-colors"
        >
          Select a Case
        </Link>
      </div>
    );
  }

  if (view === 'setup') {
    return (
      <div className="min-h-screen pb-20">
        <div className="sticky top-0 bg-slate-900 z-10 border-b border-slate-800 p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Trial Simulator</h1>
          <button onClick={() => setView('history')} className="flex items-center gap-2 text-gold-500 hover:text-gold-400">
            <Clock size={18} />
            History ({savedSessions.length})
          </button>
        </div>

        <div className="p-4 space-y-6">
          <section>
            <h2 className="text-gold-500 font-semibold mb-3">Select Phase</h2>
            <div className="grid grid-cols-4 gap-2">
              {TRIAL_PHASES.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setPhase(id as TrialPhase)}
                  className={`flex flex-col items-center p-3 rounded-lg transition-all ${
                    phase === id
                      ? 'bg-gold-500 text-slate-900'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-xs mt-1">{label}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-gold-500 font-semibold mb-3">Select Mode</h2>
            <div className="space-y-2">
              {MODES.map(({ id, label, desc, icon: Icon, colorClass }) => (
                <button
                  key={id}
                  onClick={() => setMode(id as SimulationMode)}
                  className={`w-full p-4 rounded-lg text-left flex items-center gap-4 transition-all ${
                    mode === id ? `${colorClass} text-white` : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Icon size={24} />
                  <div>
                    <p className="font-semibold">{label}</p>
                    <p className="text-xs opacity-80">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section>
            <button
              onClick={() => setShowVoiceSettings(v => !v)}
              className="w-full flex items-center justify-between p-4 bg-slate-800 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Volume2 size={20} className="text-gold-500" />
                <div className="text-left">
                  <p className="font-semibold">Voice & Settings</p>
                  <p className="text-xs opacity-60">{voiceConfig.voiceName} · {simulatorSettings.realismLevel}</p>
                </div>
              </div>
              {showVoiceSettings ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {showVoiceSettings && (
              <div className="mt-2 p-4 bg-slate-800 rounded-lg space-y-5 border border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-300">ElevenLabs Voices</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {useElevenLabs ? 'Realistic AI voices (recommended)' : 'Using browser built-in voice'}
                    </p>
                  </div>
                  <button
                    onClick={() => setUseElevenLabs(v => !v)}
                    role="switch"
                    aria-checked={useElevenLabs}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      useElevenLabs ? 'bg-gold-500' : 'bg-slate-600'
                    }`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                      useElevenLabs ? 'left-6' : 'left-0.5'
                    }`} />
                  </button>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Voice</label>
                  <select
                    value={voiceConfig.voiceName}
                    onChange={e => setVoiceConfig(v => ({ ...v, voiceName: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-gold-500"
                  >
                    {Object.entries(ELEVENLABS_VOICES).map(([id, voice]) => (
                      <option key={id} value={id}>
                        {voice.name} — {voice.description}
                      </option>
                    ))}
                  </select>
                </div>

                {phase && (
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Role Preset</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(TRIAL_VOICE_PRESETS).map(([id, preset]) => (
                        <button
                          key={id}
                          onClick={() => setVoiceConfig(v => ({ ...v, voiceName: preset.voice }))}
                          className={`p-2.5 rounded-lg text-left text-xs transition-all ${
                            voiceConfig.voiceName === preset.voice
                              ? 'bg-gold-500 text-slate-900'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          <p className="font-semibold capitalize">{id.replace(/-/g, ' ')}</p>
                          <p className="opacity-70 line-clamp-2 mt-0.5">{preset.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <SettingRow
                  label="Realism Level"
                  options={['casual', 'professional', 'intense']}
                  value={simulatorSettings.realismLevel}
                  onChange={v => setSimulatorSettings(s => ({ ...s, realismLevel: v as any }))}
                />
                <SettingRow
                  label="Interruption Frequency"
                  options={['low', 'medium', 'high']}
                  value={simulatorSettings.interruptionFrequency}
                  onChange={v => setSimulatorSettings(s => ({ ...s, interruptionFrequency: v as any }))}
                />
                <SettingRow
                  label="Coaching Detail"
                  options={['minimal', 'moderate', 'detailed']}
                  value={simulatorSettings.coachingVerbosity}
                  onChange={v => setSimulatorSettings(s => ({ ...s, coachingVerbosity: v as any }))}
                />
              </div>
            )}
          </section>

          <button
            disabled={!phase || !mode}
            onClick={() => {
              setMessages([]);
              setCoachingTip(null);
              setObjectionAlert(null);
              dispatch({ type: 'RESET_SESSION' });
              setView('active');
            }}
            className="w-full py-4 rounded-xl text-lg font-bold transition-all disabled:cursor-not-allowed
              bg-gold-500 text-slate-900 hover:bg-gold-400
              disabled:bg-slate-700 disabled:text-slate-500"
          >
            {phase && mode
              ? `Begin — ${phase.replace(/-/g, ' ')} · ${mode}`
              : 'Select Phase & Mode'}
          </button>
        </div>
      </div>
    );
  }

  if (view === 'history') {
    return (
      <div className="min-h-screen pb-20">
        <div className="sticky top-0 bg-slate-900 z-10 border-b border-slate-800 p-4 flex items-center gap-4">
          <button onClick={() => setView('setup')} className="text-slate-400 hover:text-white">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-white">Session History</h1>
          <span className="text-sm text-slate-500">({savedSessions.length} sessions)</span>
        </div>

        <div className="p-4">
          {savedSessions.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Clock size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No sessions yet</p>
              <p className="text-sm mt-1 opacity-70">Complete a simulation to see it recorded here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedSessions.map(s => (
                <SessionCard
                  key={s.id}
                  session={s}
                  isPlaying={playingSessionId === s.id}
                  onPlay={() => playHistorySession(s)}
                  onDownload={() => downloadAudio(s)}
                  onExport={() => exportTranscript(s)}
                  onDelete={() => handleDeleteSession(s.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0">
      {objectionAlert && (
        <ObjectionModal
          grounds={objectionAlert.grounds}
          explanation={objectionAlert.explanation}
          onRespond={handleObjectionResponse}
          onDismiss={() => setObjectionAlert(null)}
        />
      )}

      <div className="bg-slate-800 border-b border-slate-700 p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { stopSession(); setView('setup'); }}
            className="text-slate-400 hover:text-white transition-colors"
            title="End session"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <p className="font-bold text-white text-sm capitalize">{phase?.replace(/-/g, ' ')}</p>
            <p className="text-xs text-slate-400">{mode} mode · {opponentName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-700 rounded-full">
            <AlertTriangle size={12} className="text-red-400" />
            <span className="text-xs text-slate-300">{session.objectionCount} obj</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-700 rounded-full">
            <Volume2 size={12} className="text-gold-500" />
            <span className="text-xs text-slate-300">{voiceConfig.voiceName}</span>
          </div>
          {session.isLive && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-900/60 rounded-full">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs text-red-300 font-bold">REC</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-900">
          <div className="flex items-center gap-4 md:gap-8 mb-6">
            <StatPill label="Score"      value={`${session.sessionScore}%`} color="gold" />
            <div className="w-px h-6 bg-slate-700" />
            <StatPill label="Avg"        value={`${avgRhetoricalScore}%`}   color="slate" />
            <div className="w-px h-6 bg-slate-700" />
            <StatPill label="Objections" value={session.objectionCount}     color="red" />
            <div className="w-px h-6 bg-slate-700 hidden sm:block" />
            <StatPill label="Words" value={metricsRef.current.wordCount} color="slate" className="hidden sm:block" />
          </div>

          <div className={`w-32 h-32 rounded-full border-4 transition-all duration-200 ${
            session.isLive && session.liveVolume > 20
              ? 'border-red-500 scale-105 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
              : 'border-slate-700'
          }`}>
            <img
              src={phase === 'defendant-testimony'
                ? 'https://picsum.photos/id/1005/200/200'
                : 'https://picsum.photos/id/1025/200/200'}
              alt="Opposing Counsel"
              className="w-full h-full rounded-full object-cover opacity-80"
            />
          </div>

          <p className="mt-3 text-white font-semibold text-center">
            {phase === 'defendant-testimony' ? 'Prosecutor' : opponentName}
          </p>
          <p className={`text-sm mt-1 font-medium transition-colors ${
            session.isConnecting ? 'text-yellow-400' :
            session.isAISpeaking ? 'text-emerald-400' :
            session.isLive       ? 'text-blue-400'    : 'text-slate-500'
          }`}>
            {session.isConnecting ? 'Connecting…' :
             session.isAISpeaking ? '● Speaking' :
             session.isLive       ? '● Listening' : 'Ready'}
          </p>

          {session.isLive && (
            <div className="w-full max-w-xs mt-4 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gold-500 rounded-full transition-all duration-75"
                style={{ width: `${Math.min(100, session.liveVolume * 1.2)}%` }}
              />
            </div>
          )}

          {session.isLive && (
            <div className="w-full max-w-2xl mt-5 space-y-2">
              <TranscriptBubble
                label="Hearing You"
                text={session.inputTranscript || 'Speak now — your words appear here…'}
                color="blue"
              />
              <TranscriptBubble
                label={session.isAISpeaking ? 'Speaking Back…' : 'Response'}
                text={session.outputTranscript || 'Waiting for AI response…'}
                color="emerald"
              />
            </div>
          )}

          {(activeCase.evidence ?? []).length > 0 && (
            <div className="w-full max-w-sm mt-5">
              <button
                onClick={() => setShowEvidencePanel(v => !v)}
                className="w-full flex items-center justify-between p-2.5 bg-slate-800 rounded-lg text-slate-300 text-sm hover:bg-slate-700 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <FolderOpen size={16} className="text-gold-500" />
                  Evidence ({(activeCase.evidence || []).length} items)
                </span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${showEvidencePanel ? 'rotate-180' : ''}`}
                />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${showEvidencePanel ? 'max-h-52' : 'max-h-0'}`}>
                <div className="mt-1.5 space-y-1 max-h-52 overflow-y-auto pr-0.5">
                  {(activeCase.evidence || []).map((e, i) => (
                    <div key={i} className="p-2.5 bg-slate-800 rounded text-xs">
                      <p className="font-semibold text-white truncate">{e.title}</p>
                      <p className="text-slate-400 line-clamp-2 mt-0.5">
                        {e.summary?.slice(0, 130) ?? 'No summary available'}
                        {(e.summary?.length ?? 0) > 130 ? '…' : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="hidden md:flex flex-col gap-2 h-28 px-6 py-2 justify-end overflow-hidden">
          {messages.slice(-3).map(m => {
            const isUser = m.sender === 'user';
            const isOpponent = m.sender === 'opponent';
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%] ${isUser ? 'ml-auto' : 'mr-auto'}`}
              >
                <div className="flex items-center gap-2 mb-0.5 px-1">
                  {isUser ? (
                    <span className="text-[9px] font-bold tracking-wide text-blue-400 uppercase bg-blue-500/20 px-1.5 py-0.5 rounded-full border border-blue-500/30">
                      ATTORNEY — YOU
                    </span>
                  ) : isOpponent ? (
                    <span className="text-[9px] font-bold tracking-wide text-red-400 uppercase bg-red-500/20 px-1.5 py-0.5 rounded-full border border-red-500/30">
                      OPPOSING COUNSEL
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold tracking-wide text-slate-400 uppercase bg-slate-500/20 px-1.5 py-0.5 rounded-full border border-slate-500/30">
                      {m.sender.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className={`text-xs px-3 py-1.5 rounded-lg ${
                  isUser
                    ? 'bg-blue-900/50 text-blue-200'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {m.text.slice(0, 120)}{m.text.length > 120 ? '…' : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={`hidden lg:flex flex-col w-72 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden transition-all ${showProactivePanel ? 'opacity-100' : 'opacity-0'}`}>
        <button
          onClick={() => setShowProactivePanel(!showProactivePanel)}
          className="flex items-center justify-between p-3 bg-gold-500/10 border-b border-gold-500/30 hover:bg-gold-500/20 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Target size={16} className="text-gold-400" />
            <span className="text-sm font-bold text-gold-400 uppercase tracking-wide">Coach's Suggestions</span>
          </div>
          {showProactivePanel ? <ChevronUp size={16} className="text-gold-400" /> : <ChevronDown size={16} className="text-gold-400" />}
        </button>
        
        {showProactivePanel && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[60vh]">
            {isLoadingProactive ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin text-gold-400" />
              </div>
            ) : proactiveSuggestions.length > 0 ? (
              <>
                {proactiveSuggestions.map((suggestion, index) => (
                  <div
                    key={suggestion.id || index}
                    className="w-full text-left p-3 bg-slate-700/50 rounded-lg"
                  >
                    <div className="flex items-start gap-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        suggestion.type === 'question' ? 'bg-blue-500/20 text-blue-400' :
                        suggestion.type === 'statement' ? 'bg-green-500/20 text-green-400' :
                        suggestion.type === 'objection' ? 'bg-red-500/20 text-red-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {suggestion.type}
                      </span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        suggestion.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                        suggestion.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {suggestion.priority}
                      </span>
                    </div>
                    <p className="text-sm text-white mt-2 leading-relaxed">{suggestion.text}</p>
                    <p className="text-[10px] text-slate-400 mt-1 italic">{suggestion.context}</p>
                  </div>
                ))}
                
                {proactiveTip && (
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb size={14} className="text-yellow-400" />
                      <span className="text-[10px] font-bold text-yellow-400 uppercase">Tip</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{proactiveTip}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <Target size={32} className="mx-auto text-slate-600 mb-3" />
                <p className="text-sm text-slate-400">Start speaking to receive coaching suggestions</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={`fixed md:relative bottom-24 md:bottom-0 left-0 right-0 z-40 transition-all duration-300 ${
        showTeleprompter ? 'max-h-[60vh]' : 'max-h-14'
      }`}>
        <div className="bg-slate-800 border-t-2 border-gold-500 shadow-2xl">
          <button
            onClick={() => setShowTeleprompter(v => !v)}
            className="w-full p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Lightbulb size={20} className="text-gold-400" />
              <span className="text-gold-300 text-sm font-bold tracking-wide">COACHING TELEPROMPTER</span>
              {coachingTip && (
                <span className="text-[10px] bg-gold-500/20 text-gold-400 px-2 py-0.5 rounded-full font-mono uppercase">
                  {coachingTip.rhetoricalEffectiveness}% effective
                </span>
              )}
            </div>
            <ChevronDown
              size={20}
              className={`text-gold-400 transition-transform duration-200 ${showTeleprompter ? 'rotate-180' : ''}`}
            />
          </button>

          {showTeleprompter && (
            <div className="p-5 bg-slate-900 border-t border-gold-500/20 overflow-y-auto max-h-[45vh] scrollbar-thin scrollbar-thumb-slate-700">
              {coachingTip?.teleprompterScript ? (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <p className="text-[10px] text-gold-400/60 uppercase tracking-[0.2em] font-black mb-3">Your Next Script:</p>
                  <p className="text-xl md:text-3xl text-white leading-relaxed font-light italic">
                    "{coachingTip.teleprompterScript}"
                  </p>
                </div>
              ) : (
                <div className="text-center py-10 opacity-50">
                  <p className="text-slate-400 text-sm">Waiting for you to speak...</p>
                  <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-widest">Real-time coaching will appear here</p>
                </div>
              )}

              {coachingTip && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <button
                    onClick={() => setShowCoaching(v => !v)}
                    className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <BookOpen size={14} />
                    {showCoaching ? 'Hide' : 'Show'} detailed feedback
                    <ChevronDown
                      size={13}
                      className={`transition-transform duration-150 ${showCoaching ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {showCoaching && (
                    <div className="mt-3 space-y-2 text-sm">
                      <p className="text-slate-300">
                        <span className="font-semibold text-slate-400">Critique: </span>
                        {coachingTip.critique}
                      </p>
                      <p className="text-gold-300">
                        <span className="font-semibold text-gold-400">Tip: </span>
                        {coachingTip.suggestion}
                      </p>
                      {(coachingTip.fallaciesIdentified ?? []).length > 0 && (
                        <p className="text-red-300">
                          <span className="font-semibold text-red-400">Fallacies: </span>
                          {coachingTip.fallaciesIdentified!.join(', ')}
                        </p>
                      )}
                      <p className="text-slate-400">
                        <span className="font-semibold">Effectiveness: </span>
                        {coachingTip.rhetoricalEffectiveness}%
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="fixed md:relative bottom-0 left-0 right-0 z-50 bg-slate-800 border-t border-slate-700 p-4">
        <div className="flex items-center justify-center">
          {!session.isLive ? (
            <button
              onClick={startSession}
              disabled={session.isConnecting}
              className="flex flex-col items-center group"
            >
              <div className="w-20 h-20 rounded-full bg-gold-500 disabled:bg-slate-700 flex items-center justify-center text-slate-900 shadow-xl transition-transform group-hover:scale-105 group-active:scale-95">
                {session.isConnecting
                  ? <Activity className="animate-spin" size={32} />
                  : <Mic size={32} />}
              </div>
              <span className="text-xs text-gold-500 mt-2 font-bold">
                {session.isConnecting ? 'Connecting…' : 'Start'}
              </span>
            </button>
          ) : (
            <button
              onClick={() => stopSession()}
              className="flex flex-col items-center group"
            >
              <div className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center text-white shadow-xl animate-pulse group-hover:animate-none group-hover:bg-red-700 transition-colors">
                <MicOff size={32} />
              </div>
              <span className="text-xs text-red-400 mt-2 font-bold">Stop & Save</span>
            </button>
          )}
        </div>
      </div>

      <div ref={messagesEndRef} />
    </div>
  );
};

export default TrialSim;
