import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, RotateCcw, AlertCircle, Download, Save, Smartphone } from 'lucide-react';
import { TranscriptionStatus } from '../../types';
import { formatTime } from '../../utils/audioUtils';
import { downloadFile, generateFilename } from '../../utils/transcriptionFileUtils';
import { 
  audioRecordingService, 
  checkAudioRecordingSupport, 
  requestMicrophonePermission 
} from '../../services/audioRecordingService';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  status: TranscriptionStatus;
  autoDownload: boolean;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete, status, autoDownload }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');
  
  const timerIntervalRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check support and permission on mount
  useEffect(() => {
    const checkSupport = async () => {
      const support = checkAudioRecordingSupport();
      if (!support.supported) {
        setError(support.reason || 'Audio recording not supported');
        return;
      }
      
      // Check permission status
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setPermissionStatus(permissionStatus.state as any);
        
        permissionStatus.onchange = () => {
          setPermissionStatus(permissionStatus.state as any);
          if (permissionStatus.state === 'granted') {
            setError(null);
          }
        };
      } catch (e) {
        // Permissions API not supported
      }
    };
    
    checkSupport();
  }, []);

  const startVisualizer = useCallback((stream: MediaStream) => {
    if (!canvasRef.current) return;
    
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    try {
      audioContextRef.current = new AudioContextClass();
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      sourceRef.current.connect(analyserRef.current);
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const draw = () => {
        if (!analyserRef.current) return;
        animationFrameRef.current = requestAnimationFrame(draw);
        analyserRef.current.getByteFrequencyData(dataArray);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const barHeight = dataArray[i] / 2;
          const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
          gradient.addColorStop(0, '#d97706');
          gradient.addColorStop(1, '#fbbf24');
          ctx.fillStyle = gradient;
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
          x += barWidth + 1;
        }
      };
      draw();
    } catch (e) {
      console.warn('Visualizer failed to start:', e);
    }
  }, []);

  const stopVisualizer = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  const startRecording = async () => {
    setError(null);
    setAudioBlob(null);
    
    // Check support first
    const support = checkAudioRecordingSupport();
    if (!support.supported) {
      setError(support.reason || 'Audio recording not supported on this device');
      return;
    }
    
    // For iOS, explicitly request permission first
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isIOS || permissionStatus !== 'granted') {
      const permResult = await requestMicrophonePermission();
      if (!permResult.granted) {
        setError(permResult.error || 'Microphone permission denied. Please enable microphone access in Settings.');
        setPermissionStatus('denied');
        return;
      }
      setPermissionStatus('granted');
    }
    
    try {
      // Start recording using the service first
      await audioRecordingService.startRecording({
        onProgress: (status) => console.log('[AudioRecorder]', status),
        onError: (err) => {
          setError(err.message);
          stopVisualizer();
        },
        maxDuration: 600, // 10 minutes max
      });

      // Get the stream that the service is already using
      const stream = audioRecordingService.stream;
      if (stream) {
        streamRef.current = stream;
        startVisualizer(stream);
      }
      
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingTime(Math.floor(audioRecordingService.getCurrentDuration()));
      }, 1000);
      
    } catch (err) {
      console.error("Error starting recording:", err);
      const message = err instanceof Error ? err.message : 'Could not access microphone';
      setError(message);
      stopVisualizer();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    }
  };

  const stopRecording = async () => {
    if (!audioRecordingService.isRecording()) return;
    
    const result = await audioRecordingService.stopRecording();
    
    // Stop timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    // Stop visualizer
    stopVisualizer();
    
    // Stop visualizer stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    
    setIsRecording(false);
    
    if (result && result.blob) {
      setAudioBlob(result.blob);
      onRecordingComplete(result.blob);
      
      if (autoDownload) {
        const extension = result.mimeType.includes('mp4') ? 'm4a' : 'webm';
        downloadFile(result.blob, generateFilename('Evidence_Audio', extension), result.mimeType);
      }
    } else {
      setError('No audio was recorded. Please try again.');
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setRecordingTime(0);
    setError(null);
  };

  const handleManualDownload = () => {
    if (audioBlob) {
      const mimeType = audioBlob.type || 'audio/webm';
      const extension = mimeType.includes('mp4') ? 'm4a' : 'webm';
      downloadFile(audioBlob, generateFilename('Evidence_Audio', extension), mimeType);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      stopVisualizer();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      audioRecordingService.stopRecording();
    };
  }, [stopVisualizer]);

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed min-h-[400px]">
      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-200 flex items-center gap-2 max-w-md">
          <AlertCircle size={20} className="flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      
      {permissionStatus === 'denied' && (
        <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg text-yellow-200 max-w-md">
          <p className="font-semibold mb-2">Microphone Access Required</p>
          <ol className="text-sm list-decimal list-inside space-y-1">
            {isMobile ? (
              <>
                <li>Open your device Settings</li>
                <li>Find your browser app (Safari/Chrome)</li>
                <li>Enable Microphone permission</li>
                <li>Refresh this page</li>
              </>
            ) : (
              <>
                <li>Click the lock/info icon in the address bar</li>
                <li>Allow microphone access</li>
                <li>Refresh this page</li>
              </>
            )}
          </ol>
        </div>
      )}
      
      <div className={`relative w-full max-w-md h-32 mb-8 transition-opacity duration-300 ${isRecording ? 'opacity-100' : 'opacity-20'}`}>
        <canvas ref={canvasRef} width={400} height={128} className="w-full h-full rounded-lg" />
        {!isRecording && !audioBlob && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500 font-mono text-sm">
            Awaiting Audio Input...
          </div>
        )}
      </div>
      
      <div className="mb-8 font-mono text-5xl font-light text-slate-200 tracking-wider">
        {formatTime(recordingTime)}
      </div>
      
      <div className="flex items-center gap-6">
        {!isRecording && !audioBlob && (
          <button 
            onClick={startRecording} 
            className="group relative flex items-center justify-center w-20 h-20 rounded-full bg-gold-500 hover:bg-gold-600 transition-all duration-300 shadow-lg shadow-gold-500/30 hover:scale-105 active:scale-95"
          >
            <Mic size={32} className="text-slate-900 group-hover:animate-pulse" />
          </button>
        )}
        
        {isRecording && (
          <button 
            onClick={stopRecording} 
            className="group relative flex items-center justify-center w-20 h-20 rounded-full bg-red-500 hover:bg-red-400 transition-all duration-300 shadow-lg shadow-red-500/30 hover:scale-105 active:scale-95"
          >
            <Square size={32} className="text-white fill-current" />
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-400 rounded-full animate-ping"></span>
          </button>
        )}
        
        {audioBlob && !isRecording && (
          <>
            <button 
              onClick={resetRecording} 
              className="flex items-center justify-center w-14 h-14 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white transition-all border border-slate-600 active:scale-95" 
              disabled={status === TranscriptionStatus.PROCESSING}
            >
              <RotateCcw size={20} />
            </button>
            <button 
              onClick={handleManualDownload} 
              className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 hover:text-white transition-all border border-emerald-600/30 active:scale-95"
            >
              <Save size={20} />
            </button>
          </>
        )}
      </div>
      
      {audioBlob && (
        <audio 
          controls 
          src={URL.createObjectURL(audioBlob)} 
          className="mt-8 w-full max-w-md h-10 opacity-70" 
        />
      )}
      
      {autoDownload && isRecording && (
        <div className="mt-4 text-xs text-emerald-500 flex items-center gap-1 animate-pulse">
          <Download size={12} /> Auto-save enabled
        </div>
      )}
      
      {isMobile && permissionStatus === 'unknown' && (
        <div className="mt-4 text-xs text-slate-400 flex items-center gap-1">
          <Smartphone size={12} /> Tap the mic button to start recording
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
