import OpenAI from "openai";
import { WhisperTranscriptionResult, TranscriptSegment, SpeakerSegment } from "../types";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true // Required for client-side usage
});

/**
 * Transcribe audio using OpenAI Whisper API
 */
export const transcribeAudio = async (
  file: File,
  options: {
    language?: string;
    enableDiarization?: boolean;
  } = {}
): Promise<WhisperTranscriptionResult> => {
  const startTime = Date.now();

  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured. Add it to .env.local');
    }

    // Use Whisper-1 model for transcription
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: options.language,
      response_format: 'verbose_json',
      timestamp_granularities: ['segment', 'word']
    });

    // Process segments
    const segments: TranscriptSegment[] = (transcription as any).segments?.map((seg: any, idx: number) => ({
      id: idx,
      start: seg.start,
      end: seg.end,
      text: seg.text.trim(),
      confidence: seg.avg_logprob ? Math.exp(seg.avg_logprob) * 100 : undefined
    })) || [];

    // Calculate word count
    const wordCount = transcription.text.split(/\s+/).filter(Boolean).length;

    return {
      text: transcription.text,
      duration: (transcription as any).duration || 0,
      language: transcription.language || 'en',
      segments,
      wordCount,
      speakers: [] // Whisper doesn't do diarization natively
    };

  } catch (error) {
    console.error('Whisper transcription error:', error);
    
    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('Invalid OpenAI API key. Check your OPENAI_API_KEY in .env.local');
      }
      if (error.message.includes('file format')) {
        throw new Error('Unsupported audio format. Use MP3, M4A, WAV, or WebM');
      }
      if (error.message.includes('size')) {
        throw new Error('File too large. Maximum size is 25MB for Whisper API');
      }
    }
    
    throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Transcribe with word-level timestamps
 */
export const transcribeWithWordTimestamps = async (
  file: File
): Promise<WhisperTranscriptionResult & { words: Array<{ word: string; start: number; end: number }> }> => {
  const result = await transcribeAudio(file);
  
  // Re-fetch with word timestamps
  const transcription = await openai.audio.transcriptions.create({
    file: file,
    model: 'whisper-1',
    response_format: 'verbose_json',
    timestamp_granularities: ['word']
  });

  const words = (transcription as any).words?.map((w: any) => ({
    word: w.word || w.text,
    start: w.start,
    end: w.end
  })) || [];

  return { ...result, words };
};

/**
 * Translate audio to English
 */
export const translateAudio = async (file: File): Promise<string> => {
  try {
    const translation = await openai.audio.translations.create({
      file: file,
      model: 'whisper-1'
    });

    return translation.text;

  } catch (error) {
    console.error('Translation error:', error);
    throw new Error(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Check if file is valid for Whisper transcription
 */
export const isValidAudioFile = (file: File): { valid: boolean; error?: string } => {
  const validTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/wave',
    'audio/m4a',
    'audio/x-m4a',
    'audio/webm',
    'audio/ogg',
    'audio/mp4',
    'video/mp4' // Some audio files may be detected as video
  ];
  
  const validExtensions = ['mp3', 'wav', 'm4a', 'webm', 'ogg', 'mp4', 'mpeg', 'mpga'];
  
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  // Check either MIME type or extension
  const typeValid = validTypes.includes(file.type);
  const extValid = extension && validExtensions.includes(extension);
  
  if (!typeValid && !extValid) {
    return { 
      valid: false, 
      error: 'Invalid audio format. Supported: MP3, WAV, M4A, WebM, OGG, MP4 (max 25MB)' 
    };
  }
  
  // Whisper API limit is 25MB
  const maxSize = 25 * 1024 * 1024;
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: `File size exceeds 25MB Whisper limit. Current: ${(file.size / (1024 * 1024)).toFixed(1)}MB` 
    };
  }
  
  return { valid: true };
};

/**
 * Estimate transcription cost
 * Whisper pricing: $0.006 per minute
 */
export const estimateCost = (durationSeconds: number): string => {
  const minutes = durationSeconds / 60;
  const cost = minutes * 0.006;
  return `$${cost.toFixed(4)} (~${minutes.toFixed(1)} min)`;
};

/**
 * Format transcription for export
 */
export const formatTranscript = (
  result: WhisperTranscriptionResult,
  format: 'txt' | 'srt' | 'vtt' | 'json' = 'txt'
): string => {
  switch (format) {
    case 'txt':
      return result.text;
      
    case 'srt':
      return result.segments.map((seg, idx) => {
        const start = formatSRTTime(seg.start);
        const end = formatSRTTime(seg.end);
        return `${idx + 1}\n${start} --> ${end}\n${seg.text}\n`;
      }).join('\n');
      
    case 'vtt':
      const header = 'WEBVTT\n\n';
      const body = result.segments.map((seg, idx) => {
        const start = formatVTTTime(seg.start);
        const end = formatVTTTime(seg.end);
        return `${idx + 1}\n${start} --> ${end}\n${seg.text}\n`;
      }).join('\n');
      return header + body;
      
    case 'json':
      return JSON.stringify(result, null, 2);
      
    default:
      return result.text;
  }
};

// Helper functions for time formatting
const formatSRTTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
};

const formatVTTTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
};

export default {
  transcribeAudio,
  transcribeWithWordTimestamps,
  translateAudio,
  isValidAudioFile,
  estimateCost,
  formatTranscript
};
