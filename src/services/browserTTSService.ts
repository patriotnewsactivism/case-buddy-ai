/**
 * Browser TTS Service - Fallback text-to-speech using Web Speech API
 * Used when ElevenLabs is unavailable or fails
 */

/**
 * Options for browser text-to-speech
 */
export interface BrowserTTSOptions {
  /** Voice name or URI */
  voice?: string;
  /** Speech rate (0.1 to 10, default 1) */
  rate?: number;
  /** Pitch (0 to 2, default 1) */
  pitch?: number;
  /** Volume (0 to 1, default 1) */
  volume?: number;
  /** Called at word boundaries */
  onBoundary?: (event: SpeechSynthesisEvent) => void;
  /** Called when speech ends */
  onEnd?: () => void;
  /** Called on error */
  onError?: (error: Error) => void;
}

/**
 * Browser TTS class wrapping the Web Speech API
 */
export class BrowserTTS {
  private synthesis: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private _isSpeaking: boolean = false;
  private _voices: SpeechSynthesisVoice[] = [];
  private preferredVoice: SpeechSynthesisVoice | null = null;
  private rate: number = 1;
  private pitch: number = 1;
  private volume: number = 1;
  private voicesLoaded: boolean = false;
  private watchdogTimer: ReturnType<typeof setTimeout> | null = null;
  private userInteractionReceived: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
      this.loadVoices();
    }
  }

  /**
   * Load available voices, handling async loading in some browsers
   */
  private loadVoices(): void {
    if (!this.synthesis) return;

    const voices = this.synthesis.getVoices();
    if (voices.length > 0) {
      this._voices = voices;
      this.voicesLoaded = true;
      return;
    }

    // Some browsers load voices asynchronously
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = () => {
        this._voices = this.synthesis?.getVoices() || [];
        this.voicesLoaded = true;
      };
    }
  }

  /**
   * Mark that user interaction has occurred (required for Chrome)
   */
  markUserInteraction(): void {
    this.userInteractionReceived = true;
  }

  /**
   * Wait for voices to be loaded
   */
  private async waitForVoices(timeout: number = 2000): Promise<void> {
    if (this.voicesLoaded || this._voices.length > 0) return;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Voices loading timed out'));
      }, timeout);

      const checkVoices = () => {
        if (this._voices.length > 0 || this.voicesLoaded) {
          clearTimeout(timer);
          resolve();
        }
      };

      // Check periodically
      const interval = setInterval(() => {
        const voices = this.synthesis?.getVoices() || [];
        if (voices.length > 0) {
          this._voices = voices;
          this.voicesLoaded = true;
          clearTimeout(timer);
          clearInterval(interval);
          resolve();
        }
      }, 100);

      // Also listen for the event
      if (this.synthesis?.onvoiceschanged !== undefined) {
        const synth = this.synthesis;
        const originalHandler = synth.onvoiceschanged;
        synth.onvoiceschanged = (event: Event) => {
          if (originalHandler) {
            originalHandler.call(synth, event);
          }
          checkVoices();
        };
      }
    });
  }

  /**
   * Start a watchdog timer to detect stuck speechSynthesis
   */
  private startWatchdog(onStuck: () => void, timeout: number = 30000): void {
    this.clearWatchdog();
    this.watchdogTimer = setTimeout(() => {
      if (this._isSpeaking) {
        console.warn('Browser TTS watchdog: speechSynthesis appears stuck, attempting recovery');
        this.forceReset();
        onStuck();
      }
    }, timeout);
  }

  /**
   * Clear the watchdog timer
   */
  private clearWatchdog(): void {
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }
  }

  /**
   * Force reset speechSynthesis when stuck
   */
  private forceReset(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
      this._isSpeaking = false;
      this.currentUtterance = null;
    }
  }

  /**
   * Speak text using browser TTS
   * @param text - Text to speak
   * @param options - Speech options
   * @returns Promise that resolves when speech is complete
   */
  async speak(text: string, options?: BrowserTTSOptions): Promise<void> {
    if (!this.synthesis) {
      throw new Error('Speech synthesis not available in this browser');
    }

    // Cancel any ongoing speech
    this.stop();

    // Wait for voices if needed
    try {
      await this.waitForVoices();
    } catch {
      console.warn('Could not load voices, proceeding with default');
    }

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;

      // Apply default settings
      utterance.rate = options?.rate ?? this.rate;
      utterance.pitch = options?.pitch ?? this.pitch;
      utterance.volume = options?.volume ?? this.volume;

      // Set voice
      if (options?.voice) {
        const voice = this._voices.find(
          v => v.name === options.voice || v.voiceURI === options.voice
        );
        if (voice) {
          utterance.voice = voice;
        }
      } else if (this.preferredVoice) {
        utterance.voice = this.preferredVoice;
      }

      // Event handlers
      utterance.onstart = () => {
        this._isSpeaking = true;
        this.startWatchdog(() => {
          options?.onError?.(new Error('Speech synthesis timed out'));
          reject(new Error('Speech synthesis timed out'));
        });
      };

      utterance.onend = () => {
        this._isSpeaking = false;
        this.currentUtterance = null;
        this.clearWatchdog();
        options?.onEnd?.();
        resolve();
      };

      utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        this._isSpeaking = false;
        this.currentUtterance = null;
        this.clearWatchdog();
        
        // Don't treat cancellation as an error
        if (event.error === 'canceled' || event.error === 'interrupted') {
          resolve();
          return;
        }

        const error = new Error(`Speech synthesis error: ${event.error}`);
        options?.onError?.(error);
        reject(error);
      };

      utterance.onboundary = (event: SpeechSynthesisEvent) => {
        options?.onBoundary?.(event);
      };

      // Handle Chrome's user interaction requirement
      try {
        this.synthesis!.speak(utterance);
        
        // Chrome bug: speechSynthesis may not start speaking immediately
        // Resume if paused (workaround for Chrome pause bug)
        if (this.synthesis!.paused) {
          this.synthesis!.resume();
        }
      } catch (error) {
        this._isSpeaking = false;
        this.clearWatchdog();
        reject(error);
      }
    });
  }

  /**
   * Stop current speech
   */
  stop(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
    this._isSpeaking = false;
    this.currentUtterance = null;
    this.clearWatchdog();
  }

  /**
   * Pause current speech
   */
  pause(): void {
    if (this.synthesis && this._isSpeaking) {
      this.synthesis.pause();
    }
  }

  /**
   * Resume paused speech
   */
  resume(): void {
    if (this.synthesis) {
      this.synthesis.resume();
    }
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return this._isSpeaking || (this.synthesis?.speaking ?? false);
  }

  /**
   * Get available voices
   */
  getVoices(): SpeechSynthesisVoice[] {
    if (this.synthesis) {
      this._voices = this.synthesis.getVoices();
    }
    return this._voices;
  }

  /**
   * Set preferred voice
   */
  setVoice(voice: SpeechSynthesisVoice): void {
    this.preferredVoice = voice;
  }

  /**
   * Set speech rate (0.1 to 10)
   */
  setRate(rate: number): void {
    this.rate = Math.max(0.1, Math.min(10, rate));
  }

  /**
   * Set pitch (0 to 2)
   */
  setPitch(pitch: number): void {
    this.pitch = Math.max(0, Math.min(2, pitch));
  }

  /**
   * Set volume (0 to 1)
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }
}

/**
 * Singleton instance of BrowserTTS
 */
export const browserTTS = new BrowserTTS();

/**
 * Check if browser TTS is available
 */
export function isBrowserTTSAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Get a preferred voice based on language and optional gender preference
 * @param gender - Optional gender preference for voice selection
 * @returns Best matching voice or null
 */
export function getPreferredVoice(gender?: 'male' | 'female'): SpeechSynthesisVoice | null {
  if (!isBrowserTTSAvailable()) return null;

  const voices = browserTTS.getVoices();
  if (voices.length === 0) return null;

  // Preferred voice names by gender
  const maleVoiceNames = [
    'Google UK English Male',
    'Microsoft David',
    'Daniel',
    'Alex',
    'Google US English Male',
    'male'
  ];

  const femaleVoiceNames = [
    'Google UK English Female',
    'Microsoft Zira',
    'Samantha',
    'Victoria',
    'Google US English Female',
    'female'
  ];

  const preferredNames = gender === 'male' ? maleVoiceNames :
                         gender === 'female' ? femaleVoiceNames :
                         [...femaleVoiceNames, ...maleVoiceNames];

  // First try to find exact match by name
  for (const name of preferredNames) {
    const voice = voices.find(v => 
      v.name.toLowerCase().includes(name.toLowerCase())
    );
    if (voice) return voice;
  }

  // Prefer native voices
  const nativeVoice = voices.find(v => v.localService);
  if (nativeVoice) return nativeVoice;

  // Prefer English voices
  const englishVoice = voices.find(v => 
    v.lang.startsWith('en-') || v.lang === 'en'
  );
  if (englishVoice) return englishVoice;

  // Fall back to first voice
  return voices[0] || null;
}

/**
 * Speak text with automatic voice selection and fallback handling
 * @param text - Text to speak
 * @param options - Speech options
 */
export async function speakWithFallback(text: string, options?: BrowserTTSOptions): Promise<void> {
  if (!isBrowserTTSAvailable()) {
    throw new Error('Browser TTS not available');
  }

  // Get a good default voice if not specified
  const voice = options?.voice ? undefined : getPreferredVoice();
  
  // Create utterance options with preferred voice
  const speakOptions: BrowserTTSOptions = {
    ...options,
    voice: options?.voice || (voice?.name)
  };

  try {
    await browserTTS.speak(text, speakOptions);
  } catch (error) {
    // If the primary attempt fails, try with default settings
    console.warn('Primary TTS failed, trying with default settings:', error);
    
    try {
      await browserTTS.speak(text, {
        rate: 1,
        pitch: 1,
        volume: 1,
        onEnd: options?.onEnd,
        onError: options?.onError
      });
    } catch (fallbackError) {
      throw fallbackError;
    }
  }
}

/**
 * Initialize browser TTS - call this after user interaction for Chrome compatibility
 */
export function initBrowserTTS(): void {
  if (!isBrowserTTSAvailable()) return;
  
  // Pre-load voices
  browserTTS.getVoices();
  browserTTS.markUserInteraction();
  
  // Trigger a silent utterance to "unlock" speechSynthesis in Chrome
  // This must be called from a user interaction handler
  try {
    const utterance = new SpeechSynthesisUtterance('');
    utterance.volume = 0;
    window.speechSynthesis.speak(utterance);
    window.speechSynthesis.cancel();
  } catch {
    // Ignore errors from initialization
  }
}
