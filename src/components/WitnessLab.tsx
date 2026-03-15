import React, { useState, useRef, useEffect, useContext, useCallback } from 'react';
import { MOCK_WITNESSES } from '../constants';
import { AppContext } from '../App';
import { useKnowledge } from '../contexts/KnowledgeContext';
import { generateWitnessResponse, clearChatSession } from '../services/geminiService';
import { generateProactiveCoaching } from '../services/geminiService';
import { transcribeAudio } from '../services/transcriptionService';
import { synthesizeSpeech, getTrialVoicePreset, testAudioPlayback, ensureAudioUnlocked, ELEVENLABS_VOICES, selectModelWithFallback, TrialPhase } from '../services/elevenLabsService';
import { browserTTS, speakWithFallback, isBrowserTTSAvailable } from '../services/browserTTSService';
import { Message, Witness, TranscriptionProvider, CoachingSuggestion } from '../types';
import { Send, Mic, ShieldAlert, HeartPulse, StopCircle, Volume2, Loader2, Download, Lightbulb, Target, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { handleError, handleSuccess } from '../utils/errorHandler';
import { toast } from 'react-toastify';
import CaptionOverlay from './CaptionOverlay';
import { useSavedSessions } from '../hooks/useSavedSessions';

type WitnessVoicePreset = 'witness-hostile' | 'witness-nervous' | 'witness-cooperative';

const WitnessLab = () => {
  const { activeCase } = useContext(AppContext);
  const { getKnowledgeContext } = useKnowledge();
  const { addSession } = useSavedSessions(activeCase?.id);
  const [selectedWitness, setSelectedWitness] = useState<Witness>(MOCK_WITNESSES[0]);
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', sender: 'system', text: 'Simulation initialized. You may begin your examination.', timestamp: Date.now() }
  ]);
  const sessionStartTimeRef = useRef<number>(Date.now());

  const saveCurrentSession = useCallback(async () => {
    if (!activeCase || messages.length <= 1) return;

    const duration = Math.round((Date.now() - sessionStartTimeRef.current) / 1000);
    
    await addSession({
      id: crypto.randomUUID(),
      caseId: activeCase.id,
      caseTitle: `${activeCase.title} - ${selectedWitness.name} Exam`,
      phase: 'direct-examination', // Witness lab is usually examination
      mode: 'practice',
      date: new Date().toISOString(),
      duration,
      transcript: messages.map(m => ({
        id: crypto.randomUUID(),
        sender: m.sender,
        text: m.text,
        timestamp: m.timestamp,
      })),
      score: selectedWitness.credibilityScore,
      feedback: `Examination of ${selectedWitness.name} (${selectedWitness.role})`,
      metrics: {
        objectionsReceived: 0,
        fallaciesCommitted: 0,
        avgRhetoricalScore: selectedWitness.credibilityScore,
        wordCount: messages.reduce((acc, m) => acc + m.text.split(' ').length, 0),
        fillerWordsCount: 0
      }
    });
  }, [activeCase, messages, selectedWitness, addSession]);

  useEffect(() => {
    return () => {
      // Auto-save on unmount if there's progress
      void saveCurrentSession();
    };
  }, [saveCurrentSession]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [liveMicTranscript, setLiveMicTranscript] = useState('');
  const [micVolume, setMicVolume] = useState(0);
  
  const [captionText, setCaptionText] = useState<string>('');
  const [captionVisible, setCaptionVisible] = useState(false);
  const [captionSpeaker, setCaptionSpeaker] = useState<'user' | 'ai' | 'witness' | 'system'>('user');
  
  const [selectedVoicePreset, setSelectedVoicePreset] = useState<WitnessVoicePreset>('witness-cooperative');
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const [audioTestResult, setAudioTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const [coachingSuggestions, setCoachingSuggestions] = useState<CoachingSuggestion[]>([]);
  const [generalTip, setGeneralTip] = useState<string>('');
  const [showCoachingPanel, setShowCoachingPanel] = useState(true);
  const [isLoadingCoaching, setIsLoadingCoaching] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentAudioSourceRef = useRef<'elevenlabs' | 'browser' | null>(null);
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordingMimeTypeRef = useRef<string>('audio/webm');
  const finalSpeechTranscriptRef = useRef('');
  const playbackAudioRef = useRef<HTMLAudioElement | null>(null);
  const isAISpeakingRef = useRef(false);
  const isProcessingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const handleAudioUploadRef = useRef<((audioBlob: Blob, preferredTranscript?: string) => Promise<void>) | undefined>(undefined);

  const getSessionId = (witnessId: string) => `witness-${witnessId}-${activeCase?.id || 'default'}`;

  const fetchProactiveCoaching = useCallback(async () => {
    if (!activeCase || !selectedWitness) return;
    
    setIsLoadingCoaching(true);
    try {
      const phase: TrialPhase = 'cross-examination';
      const knowledgeContext = activeCase?.id ? getKnowledgeContext(activeCase.id) : undefined;
      const result = await generateProactiveCoaching(
        phase,
        activeCase.summary || 'A legal case',
        selectedWitness.personality,
        messages,
        knowledgeContext
      );
      setCoachingSuggestions(result.suggestions);
      setGeneralTip(result.generalTip);
    } catch (error) {
      console.warn('[WitnessLab] Failed to fetch coaching:', error);
    } finally {
      setIsLoadingCoaching(false);
    }
  }, [activeCase, selectedWitness, messages, getKnowledgeContext]);

  useEffect(() => {
    if (messages.length <= 1) {
      fetchProactiveCoaching();
    }
  }, [selectedWitness.id]);

  useEffect(() => {
    if (messages.length > 1 && messages.length % 3 === 0) {
      fetchProactiveCoaching();
    }
  }, [messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isProcessingAudio]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPlayingAudio) {
        stopAllAudio();
        return;
      }
      
      const activeElement = document.activeElement;
      const isInputFocused = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';
      
      if (e.key === ' ' && !isInputFocused && !isTyping && !isProcessingAudio) {
        e.preventDefault();
        if (isRecording) {
          stopRecording();
        } else {
          startRecording();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlayingAudio, isRecording, isTyping, isProcessingAudio]);

  useEffect(() => {
    const handleClick = () => {
      if (isPlayingAudio) {
        stopAllAudio();
      }
    };

    if (isPlayingAudio) {
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
    }
  }, [isPlayingAudio]);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop?.();
      } catch {
        // no-op
      }
      recordingStreamRef.current?.getTracks().forEach(track => track.stop());
      if (playbackAudioRef.current) {
        playbackAudioRef.current.pause();
        playbackAudioRef.current.src = '';
        playbackAudioRef.current = null;
      }
      browserTTS.stop();
    };
  }, []);

  const stopAllAudio = useCallback(() => {
    browserTTS.stop();
    if (playbackAudioRef.current) {
      playbackAudioRef.current.pause();
      playbackAudioRef.current.src = '';
      playbackAudioRef.current = null;
    }
    currentAudioSourceRef.current = null;
    setIsPlayingAudio(false);
    isAISpeakingRef.current = false;
    setCaptionVisible(false);
    setCaptionText('');
  }, []);

  const startRecording = useCallback(async () => {
    if (isRecordingRef.current || isTyping || isProcessingAudio) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;

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
        if (!isRecordingRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        setMicVolume(Math.min(100, average * 2.5));
        rafRef.current = requestAnimationFrame(updateVolume);
      };
      rafRef.current = requestAnimationFrame(updateVolume);

      const supportedMimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus'
      ];
      const selectedMimeType = supportedMimeTypes.find((candidate) =>
        typeof MediaRecorder !== 'undefined' &&
        typeof MediaRecorder.isTypeSupported === 'function' &&
        MediaRecorder.isTypeSupported(candidate)
      );
      const mediaRecorder = selectedMimeType
        ? new MediaRecorder(stream, { mimeType: selectedMimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      recordingMimeTypeRef.current = mediaRecorder.mimeType || selectedMimeType || 'audio/webm';
      audioChunksRef.current = [];
      finalSpeechTranscriptRef.current = '';
      setLiveMicTranscript('');

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const chunks = audioChunksRef.current;
        audioChunksRef.current = [];
        
        if (chunks.length === 0) {
          handleError(new Error('No audio chunks captured'), 'No audio captured. Please try again and speak for at least 1-2 seconds.', 'WitnessLab');
          if (recordingStreamRef.current) {
            recordingStreamRef.current.getTracks().forEach(track => track.stop());
            recordingStreamRef.current = null;
          }
          return;
        }

        const audioBlob = new Blob(chunks, { type: recordingMimeTypeRef.current });
        if (audioBlob.size === 0) {
          handleError(new Error('Captured audio blob was empty'), 'Audio capture was empty. Check microphone permissions and input device.', 'WitnessLab');
          if (recordingStreamRef.current) {
            recordingStreamRef.current.getTracks().forEach(track => track.stop());
            recordingStreamRef.current = null;
          }
          return;
        }

        const optimisticTranscript = finalSpeechTranscriptRef.current.trim();
        if (handleAudioUploadRef.current) {
          await handleAudioUploadRef.current(audioBlob, optimisticTranscript);
        }
        finalSpeechTranscriptRef.current = '';
        setLiveMicTranscript('');
        
        if (recordingStreamRef.current) {
          recordingStreamRef.current.getTracks().forEach(track => track.stop());
          recordingStreamRef.current = null;
        }
      };

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        console.log('[WitnessLab] Starting SpeechRecognition...');
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          console.log('[WitnessLab] SpeechRecognition started');
        };

        recognition.onspeechstart = () => {
          console.log('[WitnessLab] User is speaking...');
        };

        let silenceTimer: any = null;

        recognition.onresult = (event: any) => {
          if (isAISpeakingRef.current) {
            console.log('[WitnessLab] Ignoring speech result because AI is speaking');
            return;
          }

          if (silenceTimer) clearTimeout(silenceTimer);

          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const segment = event.results[i][0]?.transcript ?? '';
            if (event.results[i].isFinal) {
              finalTranscript += `${segment} `;
            } else {
              interimTranscript += segment;
            }
          }

          if (finalTranscript.trim()) {
            finalSpeechTranscriptRef.current = `${finalSpeechTranscriptRef.current} ${finalTranscript}`.trim();
          }

          const liveTranscript = `${finalSpeechTranscriptRef.current} ${interimTranscript}`.trim();
          setLiveMicTranscript(liveTranscript);
          setCaptionText(liveTranscript || 'Listening...');
          setCaptionSpeaker('user');
          setCaptionVisible(true);

          // Trigger auto-send after 2.5s of silence
          silenceTimer = setTimeout(() => {
            if (liveTranscript.trim() && isRecordingRef.current && !isAISpeakingRef.current && !isProcessingRef.current) {
              console.log('[WitnessLab] Silence detected, auto-submitting...');
              stopRecording();
            }
          }, 2500);
        };

        recognition.onerror = (event: any) => {
          console.error('[WitnessLab] Speech recognition error:', event?.error || event);
          if (event?.error === 'not-allowed') {
            toast.error('Microphone permission denied for speech recognition.');
          } else if (event?.error === 'no-speech') {
            // Ignore no-speech non-fatal error
          } else if (event?.error !== 'aborted') {
            toast.error(`Speech recognition error: ${event.error}`);
          }
        };

        recognition.onend = () => {
          // Don't auto-restart - user controls recording with hold-to-speak
        };

        recognitionRef.current = recognition;
        
        try {
          recognition.start();
        } catch (e) {
          console.warn('[WitnessLab] Failed to start recognition:', e);
        }
      } else {
        recognitionRef.current = null;
      }

      mediaRecorder.start(250);
      setIsRecording(true);
      isRecordingRef.current = true;
      setCaptionText('Listening...');
      setCaptionSpeaker('user');
      setCaptionVisible(true);
    } catch (error) {
      handleError(error, 'Could not access microphone', 'WitnessLab');
      setCaptionVisible(false);
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  }, [isTyping, isProcessingAudio]);

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    setIsRecording(false);
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
        recognitionRef.current.stop();
      } catch {
        // no-op
      }
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // no-op
      }
    }
    
    if (recordingStreamRef.current) {
      recordingStreamRef.current.getTracks().forEach(track => track.stop());
      recordingStreamRef.current = null;
    }

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setMicVolume(0);
    
    setCaptionText('Processing...');
  }, []);

  const handleAudioUpload = async (audioBlob: Blob, preferredTranscript?: string) => {
    setIsProcessingAudio(true);
    try {
      if (preferredTranscript && preferredTranscript.trim().length > 0) {
        const quickTranscript = preferredTranscript.trim();
        setCaptionText(quickTranscript);
        setCaptionSpeaker('user');
        setInput(quickTranscript);
        setTimeout(() => {
          setCaptionVisible(false);
        }, 1200);
        await handleSendMessage(undefined, quickTranscript);
        return;
      }

      const normalizedMimeType = audioBlob.type || recordingMimeTypeRef.current || 'audio/webm';
      const extension = normalizedMimeType.includes('webm')
        ? 'webm'
        : normalizedMimeType.includes('ogg')
          ? 'ogg'
          : normalizedMimeType.includes('mp4')
            ? 'm4a'
            : 'wav';
      const transcriptionInput = new File(
        [audioBlob],
        `witness-recording-${Date.now()}.${extension}`,
        { type: normalizedMimeType }
      );

      const result = await transcribeAudio(
        transcriptionInput, 
        '', 
        { 
          provider: TranscriptionProvider.GEMINI,
          customVocabulary: [],
          legalMode: true,
          openaiKey: '', 
          assemblyAiKey: '',
          googleClientId: '',
          googleApiKey: '',
          autoDownloadAudio: false,
          autoDriveUpload: false
        }
      );

      if (result.text) {
        setCaptionText(result.text);
        setCaptionSpeaker('user');
        setTimeout(() => {
          setCaptionVisible(false);
        }, 1500);
        setInput(result.text);
        await handleSendMessage(undefined, result.text);
      } else {
        handleError(new Error('No speech detected'), 'Could not transcribe audio', 'WitnessLab');
        setCaptionVisible(false);
      }
    } catch (error) {
      handleError(error, 'Transcription failed', 'WitnessLab');
      setCaptionVisible(false);
    } finally {
      setIsProcessingAudio(false);
    }
  };
  handleAudioUploadRef.current = handleAudioUpload;

  const getVoiceForWitness = (witness: Witness): WitnessVoicePreset => {
    if (witness.personality.toLowerCase().includes('hostile')) {
      return 'witness-hostile';
    } else if (witness.personality.toLowerCase().includes('nervous')) {
      return 'witness-nervous';
    }
    return 'witness-cooperative';
  };

  useEffect(() => {
    const voicePreset = getVoiceForWitness(selectedWitness);
    setSelectedVoicePreset(voicePreset);
  }, [selectedWitness]);

  const playResponse = async (text: string) => {
    try {
      const unlocked = await ensureAudioUnlocked();
      if (!unlocked) {
        console.warn('[WitnessLab TTS] Audio not unlocked, attempting fallback');
      }
      
      setIsPlayingAudio(true);
      isAISpeakingRef.current = true;
      setCaptionText(text);
      setCaptionSpeaker('witness');
      setCaptionVisible(true);
      
      const voiceConfig = getTrialVoicePreset(selectedVoicePreset);
      const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
      
      console.log('[WitnessLab TTS] ElevenLabs API Key present:', !!elevenLabsKey);
      console.log('[WitnessLab TTS] Selected voice preset:', selectedVoicePreset, 'Voice ID:', voiceConfig.voiceId);
      
      if (elevenLabsKey && elevenLabsKey.length > 10) {
        try {
          console.log('[WitnessLab TTS] Attempting ElevenLabs direct synthesis...');
          const voiceId = ELEVENLABS_VOICES[voiceConfig.voiceId as keyof typeof ELEVENLABS_VOICES]?.id || ELEVENLABS_VOICES['josh'].id;
          const audioData = await synthesizeSpeech(text, voiceId, {
            apiKey: elevenLabsKey,
            stability: 0.5,
            similarityBoost: 0.75,
          });

          currentAudioSourceRef.current = 'elevenlabs';
          const audioBlob = new Blob([audioData], { type: 'audio/mpeg' });
          const audioUrl = URL.createObjectURL(audioBlob);
          const audioElement = new Audio(audioUrl);
          playbackAudioRef.current = audioElement;

          await new Promise<void>((resolve, reject) => {
            let settled = false;
            const cleanup = () => {
              if (settled) return;
              settled = true;
              URL.revokeObjectURL(audioUrl);
            };

            audioElement.onended = () => {
              cleanup();
              resolve();
            };
            audioElement.onpause = () => {
              if (audioElement.ended) return;
              cleanup();
              resolve();
            };
            audioElement.onerror = () => {
              cleanup();
              reject(new Error('ElevenLabs audio playback failed'));
            };

            audioElement.play().catch((playError) => {
              cleanup();
              reject(playError);
            });
          });

          playbackAudioRef.current = null;
          setIsPlayingAudio(false);
          isAISpeakingRef.current = false;
          setCaptionVisible(false);
          setCaptionText('');
          console.log('[WitnessLab TTS] ElevenLabs playback completed');
          return;
        } catch (elevenLabsError) {
          console.warn('[WitnessLab TTS] ElevenLabs synthesis failed, falling back to browser TTS:', elevenLabsError);
        }
      }
      
      if (isBrowserTTSAvailable()) {
        console.log('[WitnessLab TTS] Using browser TTS fallback');
        currentAudioSourceRef.current = 'browser';
        await speakWithFallback(text, {
          rate: 0.95,
          pitch: 1.0,
          volume: 1,
          onEnd: () => {
            console.log('[WitnessLab TTS] Browser TTS playback complete');
            setIsPlayingAudio(false);
            isAISpeakingRef.current = false;
            setCaptionVisible(false);
            setCaptionText('');
          },
          onError: (error) => {
            console.error('[WitnessLab TTS] Browser TTS error:', error);
            setIsPlayingAudio(false);
            isAISpeakingRef.current = false;
            setCaptionVisible(false);
            setCaptionText('');
          }
        });
      } else {
        throw new Error('No TTS available');
      }
    } catch (error) {
      console.error('[WitnessLab TTS] Error:', error);
      handleError(error, 'Text-to-speech failed', 'WitnessLab');
      setIsPlayingAudio(false);
      isAISpeakingRef.current = false;
      setCaptionVisible(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, overrideText?: string) => {
    e?.preventDefault();
    const textToSend = overrideText || input;
    
    if (!textToSend.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const knowledgeContext = activeCase?.id ? getKnowledgeContext(activeCase.id) : undefined;
      const responseText = await generateWitnessResponse(
        getSessionId(selectedWitness.id),
        userMsg.text,
        selectedWitness.name, 
        selectedWitness.personality, 
        activeCase?.summary || "A generic legal case.",
        knowledgeContext
      );

      const witnessMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'witness',
        text: responseText,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, witnessMsg]);
      
      void playResponse(responseText);
      
    } catch (err) {
      handleError(err, 'Failed to get witness response', 'WitnessLab');
    } finally {
      setIsTyping(false);
    }
  };

  const handleTestAudio = async () => {
    setAudioTestResult(null);
    try {
      const result = await testAudioPlayback();
      setAudioTestResult({ success: result.success, message: result.message });
      if (result.success) {
        handleSuccess('Audio test successful!');
      } else {
        handleError(new Error(result.message), 'Audio test failed', 'WitnessLab');
      }
    } catch (error) {
      handleError(error, 'Audio test failed', 'WitnessLab');
    }
  };

  const exportTranscript = () => {
    if (messages.length === 0) {
      handleError(new Error('No messages to export'), 'Cannot export transcript', 'WitnessLab');
      return;
    }

    const formatTimestamp = (ts: number) => {
      const date = new Date(ts);
      return date.toLocaleString();
    };

    const getSpeakerLabel = (sender: Message['sender']) => {
      switch (sender) {
        case 'user': return 'Attorney';
        case 'witness': return selectedWitness.name;
        case 'system': return 'System';
        default: return sender;
      }
    };

    const transcriptText = messages
      .map(msg => `[${formatTimestamp(msg.timestamp)}] ${getSpeakerLabel(msg.sender)}: ${msg.text}`)
      .join('\n\n');

    const header = `Witness Examination Transcript
Witness: ${selectedWitness.name}
Role: ${selectedWitness.role}
Personality: ${selectedWitness.personality}
Case: ${activeCase?.title || 'Unknown'}
Date Exported: ${new Date().toLocaleString()}
${'='.repeat(50)}

`;

    const blob = new Blob([header + transcriptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${selectedWitness.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    handleSuccess('Transcript exported successfully!');
  };

  const voicePresetOptions: { value: WitnessVoicePreset; label: string; description: string }[] = [
    { value: 'witness-hostile', label: 'Hostile', description: 'Grainy, defensive voice' },
    { value: 'witness-nervous', label: 'Nervous', description: 'Young, anxious voice' },
    { value: 'witness-cooperative', label: 'Cooperative', description: 'Calm, helpful voice' },
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      <CaptionOverlay
        text={captionText}
        isVisible={captionVisible}
        speaker={captionSpeaker}
        position="bottom"
        fontSize="medium"
        showSpeaker={true}
        onDismiss={() => setCaptionVisible(false)}
      />
      
      <div className="w-72 flex flex-col gap-4 bg-slate-800 border border-slate-700 rounded-xl p-4 overflow-y-auto hidden md:flex">
        <h3 className="text-white font-serif font-bold px-2">Witness List</h3>
        {MOCK_WITNESSES.map(w => (
          <button
            key={w.id}
            onClick={() => {
              clearChatSession(getSessionId(selectedWitness.id));
              setSelectedWitness(w);
              setMessages([{ id: '0', sender: 'system', text: `Simulation with ${w.name} started.`, timestamp: Date.now() }]);
              setCoachingSuggestions([]);
              fetchProactiveCoaching();
            }}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${selectedWitness.id === w.id ? 'bg-slate-700 border border-gold-500/30' : 'hover:bg-slate-700/50 border border-transparent'}`}
          >
            <img src={w.avatarUrl} alt={w.name} className="w-10 h-10 rounded-full object-cover border border-slate-600" />
            <div>
              <p className="text-sm font-semibold text-white">{w.name}</p>
              <p className="text-xs text-slate-400">{w.role}</p>
            </div>
          </button>
        ))}
        
        <div className="mt-4 pt-4 border-t border-slate-700">
          <h4 className="text-white font-semibold text-sm px-2 mb-2">Voice Settings</h4>
          {voicePresetOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setSelectedVoicePreset(option.value)}
              className={`w-full text-left p-2 rounded-lg transition-colors text-sm ${
                selectedVoicePreset === option.value 
                  ? 'bg-gold-600/20 text-gold-400 border border-gold-500/30' 
                  : 'hover:bg-slate-700/50 text-slate-300'
              }`}
            >
              <div className="font-medium">{option.label}</div>
              <div className="text-xs text-slate-400">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-slate-900 border border-slate-700 rounded-xl overflow-hidden relative">
        <div className="h-16 bg-slate-800 border-b border-slate-700 flex items-center px-6 justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={selectedWitness.avatarUrl} alt="Active" className="w-10 h-10 rounded-full object-cover border-2 border-gold-500" />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800"></div>
            </div>
            <div>
              <h2 className="text-white font-semibold">{selectedWitness.name}</h2>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <span className="capitalize">{selectedWitness.personality}</span>
                <span>•</span>
                <span>Credibility: {selectedWitness.credibilityScore}%</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-slate-400 text-xs">
            {isPlayingAudio && (
              <button
                onClick={stopAllAudio}
                className="flex items-center gap-1 text-red-400 hover:text-red-300 bg-red-500/10 px-3 py-1 rounded-lg transition-colors"
              >
                <StopCircle size={14} />
                Stop Speaking
              </button>
            )}
            {!isPlayingAudio && (
              <button
                onClick={handleTestAudio}
                className="flex items-center gap-1 hover:text-white transition-colors"
                title="Test audio playback"
              >
                <Volume2 size={14} />
                Test Audio
              </button>
            )}
            <button
              onClick={exportTranscript}
              className="flex items-center gap-1 hover:text-white transition-colors"
              title="Export transcript"
            >
              <Download size={14} />
              Export
            </button>
            <div className="flex items-center gap-1">
              <HeartPulse size={14} className={selectedWitness.personality === 'Nervous' ? 'text-red-400 animate-pulse' : 'text-green-400'} />
              Stress Level
            </div>
            <div className="flex items-center gap-1">
              <ShieldAlert size={14} className={selectedWitness.personality === 'Hostile' ? 'text-red-400' : 'text-slate-500'} />
              Hostility
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isSystem = msg.sender === 'system';

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center">
                  <span className="text-xs text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full">{msg.text}</span>
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%] ${isUser ? 'ml-auto' : 'mr-auto'}`}>
                <div className={`flex items-center gap-2 mb-1 px-1`}>
                  {isUser ? (
                    <span className="text-[10px] font-bold tracking-wide text-blue-400 uppercase bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/30">
                      ATTORNEY — YOU
                    </span>
                  ) : (
                    <>
                      <span className="text-[10px] font-bold tracking-wide text-gold-400 uppercase bg-gold-500/20 px-2 py-0.5 rounded-full border border-gold-500/30">
                        WITNESS: {selectedWitness.name}
                      </span>
                      <span className={`text-[10px] font-medium tracking-wide px-2 py-0.5 rounded-full ${
                        selectedWitness.personality.toLowerCase().includes('hostile') 
                          ? 'text-red-400 bg-red-500/20 border border-red-500/30' 
                          : selectedWitness.personality.toLowerCase().includes('nervous')
                          ? 'text-yellow-400 bg-yellow-500/20 border border-yellow-500/30'
                          : 'text-green-400 bg-green-500/20 border border-green-500/30'
                      }`}>
                        {selectedWitness.personality.toUpperCase()} • Credibility: {selectedWitness.credibilityScore}%
                      </span>
                    </>
                  )}
                </div>
                <div className={`rounded-2xl px-5 py-3 ${
                  isUser 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                }`}>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                </div>
              </div>
            );
          })}
          
          {isProcessingAudio && (
            <div className="flex justify-end">
              <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-br-none px-5 py-3 flex items-center gap-2 text-gold-500 text-sm">
                <Loader2 size={16} className="animate-spin" />
                Transcribing audio...
              </div>
            </div>
          )}

          {(isRecording || liveMicTranscript) && (
            <div className="flex justify-end">
              <div className="max-w-[75%] bg-blue-950/40 border border-blue-700/50 rounded-2xl rounded-br-none px-5 py-3">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-[10px] uppercase tracking-wide text-blue-300">Live Transcript</p>
                  {isRecording && (
                    <div className="w-24 h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-400 transition-all duration-75"
                        style={{ width: `${micVolume}%` }}
                      ></div>
                    </div>
                  )}
                </div>
                <p className="text-sm text-blue-100 leading-relaxed">
                  {liveMicTranscript || 'Listening...'}
                </p>
              </div>
            </div>
          )}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-none px-5 py-3 flex items-center gap-1">
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="bg-slate-800 border-t border-slate-700 p-4">
          <form onSubmit={(e) => handleSendMessage(e)} className="flex gap-2 items-center bg-slate-900 border border-slate-600 rounded-xl p-1 pr-2 focus-within:border-gold-500 focus-within:ring-1 focus-within:ring-gold-500 transition-all">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder={isRecording ? "Listening..." : "Ask your question..."}
              className="flex-1 bg-transparent border-none focus:ring-0 text-white px-4 py-3 placeholder-slate-500"
              disabled={isTyping || isRecording || isProcessingAudio}
            />
            
            <button 
              type="button"
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              disabled={isTyping || isProcessingAudio}
              className={`p-2 transition-all rounded-full ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              title="Hold to speak"
            >
              {isRecording ? <StopCircle size={20} /> : <Mic size={20} />}
            </button>

            <button 
              type="submit" 
              disabled={!input.trim() || isTyping || isRecording}
              className="p-2 bg-gold-600 hover:bg-gold-500 text-slate-900 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
            </button>
          </form>
          <div className="text-center mt-2">
            <p className="text-[10px] text-slate-500">
              Hold mic or press Space to speak • Press Escape to stop audio • Enter to send
            </p>
          </div>
        </div>
      </div>

      <div className={`hidden lg:flex flex-col w-72 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden transition-all ${showCoachingPanel ? 'opacity-100' : 'opacity-0'}`}>
        <button
          onClick={() => setShowCoachingPanel(!showCoachingPanel)}
          className="flex items-center justify-between p-3 bg-gold-500/10 border-b border-gold-500/30 hover:bg-gold-500/20 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Target size={16} className="text-gold-400" />
            <span className="text-sm font-bold text-gold-400 uppercase tracking-wide">Coach's Suggestions</span>
          </div>
          {showCoachingPanel ? <ChevronUp size={16} className="text-gold-400" /> : <ChevronDown size={16} className="text-gold-400" />}
        </button>
        
        {showCoachingPanel && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoadingCoaching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin text-gold-400" />
              </div>
            ) : coachingSuggestions.length > 0 ? (
              <>
                {coachingSuggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.id || index}
                    onClick={() => setInput(suggestion.text)}
                    className="w-full text-left p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors group"
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
                    <div className="flex items-center gap-1 mt-2 text-gold-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px]">Click to use</span>
                      <ChevronRight size={10} />
                    </div>
                  </button>
                ))}
                
                {generalTip && (
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb size={14} className="text-yellow-400" />
                      <span className="text-[10px] font-bold text-yellow-400 uppercase">Tip</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{generalTip}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <Target size={32} className="mx-auto text-slate-600 mb-3" />
                <p className="text-sm text-slate-400">Start the conversation to receive coaching suggestions</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WitnessLab;
