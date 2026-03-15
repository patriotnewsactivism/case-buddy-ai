/**
 * Audio Recording Service - Optimized for Mobile Browsers
 * 
 * Handles microphone access across different browsers including:
 * - iOS Safari (requires specific codec support)
 * - Android Chrome
 * - Desktop browsers
 */

export interface AudioRecordingOptions {
  onProgress?: (status: string) => void;
  onError?: (error: Error) => void;
  maxDuration?: number;
}

export interface AudioRecordingResult {
  blob: Blob;
  mimeType: string;
  duration: number;
}

export class AudioRecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  public stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private startTime: number = 0;
  private maxDurationTimer: number | null = null;
  
  private static instance: AudioRecordingService;
  
  static getInstance(): AudioRecordingService {
    if (!AudioRecordingService.instance) {
      AudioRecordingService.instance = new AudioRecordingService();
    }
    return AudioRecordingService.instance;
  }
  
  /**
   * Check if microphone access is available
   */
  async checkMicrophoneAccess(): Promise<{ available: boolean; reason?: string }> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return { 
        available: false, 
        reason: 'MediaDevices API not supported. Please use a modern browser.' 
      };
    }
    
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      return { 
        available: false, 
        reason: 'Microphone requires HTTPS. Please use a secure connection.' 
      };
    }
    
    try {
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      if (permissionStatus.state === 'denied') {
        return { 
          available: false, 
          reason: 'Microphone permission denied. Please enable it in your browser settings.' 
        };
      }
    } catch (e) {
      // Permissions API not supported, continue with getUserMedia check
    }
    
    return { available: true };
  }
  
  /**
   * Get the best supported MIME type for the current browser
   */
  getBestSupportedMimeType(): string {
    const mimeTypes = [
      // iOS Safari preferred formats
      'audio/mp4',
      'audio/mp4;codecs=mp4a.40.2',
      'audio/mp4;codecs=aac',
      // Chrome/Firefox preferred formats
      'audio/webm;codecs=opus',
      'audio/webm;codecs=pcm',
      'audio/webm',
      // Fallback
      'audio/ogg;codecs=opus',
      'audio/ogg',
    ];
    
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        console.log(`[AudioRecording] Using MIME type: ${mimeType}`);
        return mimeType;
      }
    }
    
    console.warn('[AudioRecording] No preferred MIME type supported, using default');
    return '';
  }
  
  /**
   * Get optimal audio constraints for mobile
   */
  private getAudioConstraints(): MediaTrackConstraints {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    if (isIOS) {
      // iOS Safari - use simpler constraints
      return {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100,
      };
    }
    
    if (isMobile) {
      // Android - can handle more constraints
      return {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000,
        channelCount: 1,
      };
    }
    
    // Desktop - full constraints
    return {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 48000,
      channelCount: 2,
    };
  }
  
  /**
   * Start recording audio
   */
  async startRecording(options?: AudioRecordingOptions): Promise<void> {
    // Clean up any existing recording
    await this.stopRecording();
    
    const accessCheck = await this.checkMicrophoneAccess();
    if (!accessCheck.available) {
      const error = new Error(accessCheck.reason || 'Microphone not available');
      options?.onError?.(error);
      throw error;
    }
    
    try {
      options?.onProgress?.('Requesting microphone access...');
      
      // Request microphone with constraints
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: this.getAudioConstraints(),
        video: false,
      });
      
      options?.onProgress?.('Microphone access granted, initializing recorder...');
      
      // Get best MIME type
      const mimeType = this.getBestSupportedMimeType();
      
      // Create MediaRecorder with options
      const recorderOptions: MediaRecorderOptions = {};
      if (mimeType) {
        recorderOptions.mimeType = mimeType;
      }
      
      // iOS Safari needs smaller chunks
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      const timeslice = isIOS ? 100 : 1000;
      
      try {
        this.mediaRecorder = new MediaRecorder(this.stream, recorderOptions);
      } catch (e) {
        // Fallback to default if MIME type fails
        console.warn('[AudioRecording] Failed with MIME type, using default:', e);
        this.mediaRecorder = new MediaRecorder(this.stream);
      }
      
      this.chunks = [];
      this.startTime = Date.now();
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };
      
      this.mediaRecorder.onerror = (event: Event) => {
        const error = new Error(`MediaRecorder error: ${(event as any).error?.message || 'Unknown error'}`);
        console.error('[AudioRecording] MediaRecorder error:', error);
        options?.onError?.(error);
      };
      
      // Start recording with timeslice for mobile
      this.mediaRecorder.start(timeslice);
      options?.onProgress?.('Recording started');
      
      // Set max duration timer if specified
      if (options?.maxDuration) {
        this.maxDurationTimer = window.setTimeout(() => {
          if (this.mediaRecorder?.state === 'recording') {
            console.log('[AudioRecording] Max duration reached, stopping...');
            this.stopRecording();
          }
        }, options.maxDuration * 1000);
      }
      
    } catch (error) {
      console.error('[AudioRecording] Failed to start recording:', error);
      
      // Clean up on error
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }
      
      const err = error instanceof Error ? error : new Error('Failed to start recording');
      
      // Provide more helpful error messages
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        err.message = 'Microphone permission denied. Please allow microphone access in your browser settings and try again.';
      } else if (err.name === 'NotFoundError') {
        err.message = 'No microphone found. Please connect a microphone and try again.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        err.message = 'Microphone is already in use by another application. Please close other apps and try again.';
      } else if (err.name === 'NotSupportedError') {
        err.message = 'Audio recording is not supported in this browser. Please try a different browser.';
      } else if (err.name === 'OverconstrainedError') {
        err.message = 'Microphone does not meet required specifications. Trying with basic settings...';
      }
      
      options?.onError?.(err);
      throw err;
    }
  }
  
  /**
   * Stop recording and get the result
   */
  async stopRecording(): Promise<AudioRecordingResult | null> {
    // Clear max duration timer
    if (this.maxDurationTimer) {
      clearTimeout(this.maxDurationTimer);
      this.maxDurationTimer = null;
    }
    
    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
      // Clean up stream if exists
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }
      return null;
    }
    
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(null);
        return;
      }
      
      this.mediaRecorder.onstop = () => {
        const duration = (Date.now() - this.startTime) / 1000;
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        
        if (this.chunks.length === 0) {
          console.warn('[AudioRecording] No audio chunks recorded');
          resolve(null);
          return;
        }
        
        const blob = new Blob(this.chunks, { type: mimeType });
        
        // Clean up
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
          this.stream = null;
        }
        this.chunks = [];
        this.mediaRecorder = null;
        
        resolve({ blob, mimeType, duration });
      };
      
      this.mediaRecorder.stop();
    });
  }
  
  /**
   * Check if currently recording
   */
  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }
  
  /**
   * Get current recording duration in seconds
   */
  getCurrentDuration(): number {
    if (!this.startTime) return 0;
    return (Date.now() - this.startTime) / 1000;
  }
  
  /**
   * Get the actual MIME type being used
   */
  getCurrentMimeType(): string | null {
    return this.mediaRecorder?.mimeType || null;
  }
}

// Export singleton instance
export const audioRecordingService = AudioRecordingService.getInstance();

/**
 * Request microphone permission explicitly (useful for iOS)
 * iOS Safari requires user interaction to access microphone
 */
export const requestMicrophonePermission = async (): Promise<{ granted: boolean; error?: string }> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    return { granted: true };
  } catch (error) {
    const err = error as Error;
    return { 
      granted: false, 
      error: err.message || 'Microphone permission denied' 
    };
  }
};

/**
 * Check if the browser supports audio recording
 */
export const checkAudioRecordingSupport = (): { supported: boolean; reason?: string } => {
  if (typeof navigator === 'undefined') {
    return { supported: false, reason: 'Not in browser environment' };
  }
  
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return { supported: false, reason: 'MediaDevices API not supported' };
  }
  
  if (typeof MediaRecorder === 'undefined') {
    return { supported: false, reason: 'MediaRecorder not supported' };
  }
  
  if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    return { supported: false, reason: 'HTTPS required for microphone access' };
  }
  
  return { supported: true };
};
