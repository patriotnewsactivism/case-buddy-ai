/**
 * ElevenLabs Text-to-Speech Service
 * Provides realistic voice synthesis for trial simulator
 * Free tier: 10,000 characters per month
 * 
 * SECURITY: All API calls are proxied through Supabase Edge Functions
 * to keep API keys server-side.
 */

import { callElevenLabsProxy, isProxyReady } from './apiProxy';

let audioUnlocked = false;
let unlockAudioContext: AudioContext | null = null;
let globalAudioContext: AudioContext | null = null;
let currentVolume = 1.0;

interface AudioState {
  unlocked: boolean;
  contextState: AudioContextState | null;
  lastUnlockAttempt: number | null;
  unlockError: string | null;
  lastPlaybackAttempt: number | null;
  playbackError: string | null;
}

const audioState: AudioState = {
  unlocked: false,
  contextState: null,
  lastUnlockAttempt: null,
  unlockError: null,
  lastPlaybackAttempt: null,
  playbackError: null,
};

export const getAudioState = (): AudioState => ({ ...audioState });

export const isAudioUnlocked = (): boolean => audioUnlocked;

export const forceUnlockAudio = async (): Promise<boolean> => {
  console.log('[Audio] forceUnlockAudio called - forcing fresh unlock');
  audioUnlocked = false;
  unlockAudioContext = null;
  audioState.lastUnlockAttempt = Date.now();
  audioState.unlockError = null;
  
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    unlockAudioContext = new AudioContextClass();
    
    audioState.contextState = unlockAudioContext.state;
    console.log('[Audio] Created fresh AudioContext, state:', unlockAudioContext.state);
    
    if (unlockAudioContext.state === 'suspended') {
      console.log('[Audio] AudioContext suspended, resuming...');
      await unlockAudioContext.resume();
      audioState.contextState = unlockAudioContext.state;
      console.log('[Audio] AudioContext resumed, new state:', unlockAudioContext.state);
    }
    
    const buffer = unlockAudioContext.createBuffer(1, 1, 22050);
    const source = unlockAudioContext.createBufferSource();
    source.buffer = buffer;
    const gainNode = unlockAudioContext.createGain();
    gainNode.gain.value = 0.01;
    source.connect(gainNode);
    gainNode.connect(unlockAudioContext.destination);
    
    source.start();
    
    audioUnlocked = true;
    audioState.unlocked = true;
    console.log('[Audio] Force unlock successful');
    
    globalAudioContext = unlockAudioContext;
    
    return true;
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    audioState.unlockError = errorMsg;
    console.error('[Audio] Force unlock failed:', e);
    return false;
  }
};

export const unlockAudio = async (): Promise<void> => {
  if (audioUnlocked && unlockAudioContext && unlockAudioContext.state === 'running') {
    console.log('[Audio] Already unlocked and running');
    return;
  }
  
  audioState.lastUnlockAttempt = Date.now();
  audioState.unlockError = null;
  
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    
    if (!unlockAudioContext || unlockAudioContext.state === 'closed') {
      unlockAudioContext = new AudioContextClass();
      console.log('[Audio] Created new AudioContext for unlock');
    }
    
    audioState.contextState = unlockAudioContext.state;
    
    if (unlockAudioContext.state === 'suspended') {
      console.log('[Audio] AudioContext suspended, resuming...');
      await unlockAudioContext.resume();
      audioState.contextState = unlockAudioContext.state;
      console.log('[Audio] Resumed, state:', unlockAudioContext.state);
    }
    
    const buffer = unlockAudioContext.createBuffer(1, 1, 22050);
    const source = unlockAudioContext.createBufferSource();
    source.buffer = buffer;
    const gainNode = unlockAudioContext.createGain();
    gainNode.gain.value = 0.01;
    source.connect(gainNode);
    gainNode.connect(unlockAudioContext.destination);
    
    source.start();
    
    audioUnlocked = true;
    audioState.unlocked = true;
    globalAudioContext = unlockAudioContext;
    console.log('[Audio] Audio unlocked successfully');
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    audioState.unlockError = errorMsg;
    console.warn('[Audio] Failed to unlock audio:', e);
  }
};

export const ensureAudioUnlocked = async (): Promise<boolean> => {
  console.log('[Audio] ensureAudioUnlocked called, current state:', {
    audioUnlocked,
    contextState: unlockAudioContext?.state,
    globalContextState: globalAudioContext?.state
  });
  
  if (audioUnlocked) {
    if (unlockAudioContext && unlockAudioContext.state === 'running') {
      console.log('[Audio] Audio already unlocked and running');
      return true;
    }
    if (globalAudioContext && globalAudioContext.state === 'running') {
      console.log('[Audio] Global audio context running');
      return true;
    }
  }
  
  console.log('[Audio] Audio not properly unlocked, attempting unlock...');
  await unlockAudio();
  
  if (!audioUnlocked) {
    console.log('[Audio] Standard unlock failed, trying force unlock...');
    await forceUnlockAudio();
  }
  
  return audioUnlocked;
};

if (typeof window !== 'undefined') {
  const unlockEvents = ['click', 'touchstart', 'keydown', 'mousedown'];
  const unlockHandler = () => {
    console.log('[Audio] User interaction detected, unlocking audio...');
    unlockAudio();
    unlockEvents.forEach(e => window.removeEventListener(e, unlockHandler));
  };
  unlockEvents.forEach(e => window.addEventListener(e, unlockHandler, { once: true }));
}

export const ELEVENLABS_VOICES = {
  'rachel': { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', gender: 'female', description: 'Calming, natural' },
  'domi': { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', gender: 'female', description: 'Strong, confident' },
  'bella': { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', gender: 'female', description: 'Soft, smooth' },
  'antoni': { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', gender: 'male', description: 'Deep, authoritative' },
  'elli': { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', gender: 'female', description: 'Emotional, young' },
  'josh': { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', gender: 'male', description: 'Confident, conversational' },
  'arnold': { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', gender: 'male', description: 'Dramatic, deep' },
  'adam': { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', gender: 'male', description: 'Deep, calm' },
  'sam': { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam', gender: 'male', description: 'Grainy, raspy' },
} as const;

export type ElevenLabsVoiceId = keyof typeof ELEVENLABS_VOICES;

export const TRIAL_VOICE_PRESETS = {
  'prosecutor': { voice: 'adam', description: 'Authoritative, serious prosecutor' },
  'defense': { voice: 'josh', description: 'Confident, persuasive defense attorney' },
  'judge': { voice: 'arnold', description: 'Deep, commanding judicial presence' },
  'witness-hostile': { voice: 'sam', description: 'Grainy, defensive witness' },
  'witness-nervous': { voice: 'elli', description: 'Young, nervous witness' },
  'witness-cooperative': { voice: 'rachel', description: 'Calm, helpful witness' },
  'opponent-aggressive': { voice: 'domi', description: 'Strong, aggressive opposing counsel' },
  'opponent-calm': { voice: 'antoni', description: 'Deep, methodical opposing counsel' },
} as const;

export type TrialVoicePreset = keyof typeof TRIAL_VOICE_PRESETS;

export type TrialPhase = 
  | 'pre-trial-motions'
  | 'voir-dire' 
  | 'opening-statement' 
  | 'direct-examination' 
  | 'cross-examination' 
  | 'defendant-testimony'
  | 'closing-argument' 
  | 'sentencing';

const MODEL_FOR_PHASE: Record<TrialPhase, string> = {
  'opening-statement': 'eleven_v3',
  'closing-argument': 'eleven_v3',
  'sentencing': 'eleven_v3',
  'pre-trial-motions': 'eleven_turbo_v2_5',
  'voir-dire': 'eleven_turbo_v2_5',
  'direct-examination': 'eleven_turbo_v2_5',
  'cross-examination': 'eleven_turbo_v2_5',
  'defendant-testimony': 'eleven_turbo_v2_5',
};

export const isElevenLabsConfigured = (): boolean => {
  return isProxyReady();
};

export const getTrialVoicePreset = (preset: TrialVoicePreset): { voiceId: string; description: string } => {
  const config = TRIAL_VOICE_PRESETS[preset];
  const voice = ELEVENLABS_VOICES[config.voice];
  return {
    voiceId: voice.id,
    description: config.description,
  };
};

export const selectModelWithFallback = (phase: TrialPhase): string => {
  return MODEL_FOR_PHASE[phase] || 'eleven_turbo_v2_5';
};

export interface SynthesizeSpeechOptions {
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
  apiKey?: string;
}

export const synthesizeSpeech = async (
  text: string,
  voiceId?: string,
  options?: SynthesizeSpeechOptions
): Promise<ArrayBuffer> => {
  // Check for proxy or direct key (if provided in options)
  if (!isProxyReady() && !options?.apiKey) {
    throw new Error('ElevenLabs proxy is not configured. Please set up Supabase.');
  }

  const response = await callElevenLabsProxy({
    text,
    voiceId: voiceId || ELEVENLABS_VOICES.rachel.id,
    modelId: options?.modelId || 'eleven_turbo_v2_5',
    stability: options?.stability,
    similarityBoost: options?.similarityBoost,
    style: options?.style,
    useSpeakerBoost: options?.useSpeakerBoost,
    apiKey: options?.apiKey,
  });

  if (!response.success || !response.audioBase64) {
    throw new Error(response.error?.message || 'Failed to synthesize speech');
  }

  const binaryString = atob(response.audioBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
};

export const playAudioBuffer = async (audioBuffer: ArrayBuffer): Promise<void> => {
  if (!audioBuffer || audioBuffer.byteLength === 0) {
    console.warn('[Audio] Empty audio buffer, skipping playback');
    return;
  }

  audioState.lastPlaybackAttempt = Date.now();
  audioState.playbackError = null;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = globalAudioContext || new AudioContextClass();
    
    if (!globalAudioContext) {
      globalAudioContext = audioContext;
    }

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    const decodedBuffer = await audioContext.decodeAudioData(audioBuffer);
    const source = audioContext.createBufferSource();
    source.buffer = decodedBuffer;
    
    const gainNode = audioContext.createGain();
    gainNode.gain.value = currentVolume;
    
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    source.start(0);
    
    console.log('[Audio] Playback started successfully');
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    audioState.playbackError = errorMsg;
    console.error('[Audio] Playback error:', error);
    throw error;
  }
};

export const testAudioPlayback = async (): Promise<{ success: boolean; message: string }> => {
  try {
    await ensureAudioUnlocked();
    
    if (!audioUnlocked) {
      return { success: false, message: 'Failed to unlock audio context' };
    }

    const testText = 'Audio test successful.';
    const audioBuffer = await synthesizeSpeech(testText, ELEVENLABS_VOICES.rachel.id);
    
    await playAudioBuffer(audioBuffer);
    
    return { success: true, message: 'Audio playback test passed' };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Audio test failed: ${errorMsg}` };
  }
};
