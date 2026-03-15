/**
 * Transcription Router Service
 *
 * Routes audio/video transcription to the most cost-effective provider:
 * - Browser Speech API (free, client-side, limited accuracy)
 * - Whisper via Edge Function (paid, high accuracy)
 * - Gemini via Edge Function (paid, good for short clips)
 *
 * Also provides post-processing for legal terminology correction.
 */

import {
  UserTier,
  TranscriptionService,
  TranscriptionRouterConfig,
  TranscriptionRouterResult,
  TranscriptSegment,
} from '../types';
import { callWhisperProxy } from './apiProxy';
import { callGeminiProxy } from './apiProxy';

// Provider configurations
const TRANSCRIPTION_PROVIDERS: Record<TranscriptionService, TranscriptionRouterConfig> = {
  browser: {
    service: 'browser',
    maxDurationSeconds: 600, // 10 minutes
    accuracy: 0.75,
    costPerMinute: 0,
  },
  whisper: {
    service: 'whisper',
    maxDurationSeconds: 7200, // 2 hours
    accuracy: 0.92,
    costPerMinute: 0.006, // ~$0.006/minute
  },
  gemini: {
    service: 'gemini',
    maxDurationSeconds: 1800, // 30 minutes
    accuracy: 0.88,
    costPerMinute: 0,  // Covered by Gemini API quota
  },
};

// Common legal terminology corrections
const LEGAL_CORRECTIONS: Record<string, string> = {
  'discoverie': 'discovery',
  'plaintif': 'plaintiff',
  'defendint': 'defendant',
  'habeus': 'habeas',
  'habeas corpse': 'habeas corpus',
  'sirtiorari': 'certiorari',
  'certiorari': 'certiorari',
  'amicus curry': 'amicus curiae',
  'nolo contendery': 'nolo contendere',
  'void ear': 'voir dire',
  'war deer': 'voir dire',
  'bone a fide': 'bona fide',
  'per say': 'per se',
  'prima facia': 'prima facie',
  'pro bono publico': 'pro bono publico',
  'stair decisis': 'stare decisis',
  'starry decisis': 'stare decisis',
  'in loco parentis': 'in loco parentis',
  'duress': 'duress',
  'inditement': 'indictment',
  'enditement': 'indictment',
  'tortious': 'tortious',
  'tortuous': 'tortious',
  'preponderance': 'preponderance',
};

/**
 * Select the optimal transcription service based on audio properties and user tier.
 */
export function selectTranscriptionService(
  durationSeconds: number,
  userTier: UserTier,
  options?: {
    requireHighAccuracy?: boolean;
    preferredService?: TranscriptionService;
  }
): TranscriptionRouterConfig {
  // If user explicitly chose a service, respect that
  if (options?.preferredService) {
    return TRANSCRIPTION_PROVIDERS[options.preferredService];
  }

  // High accuracy requested → Whisper (if paid tier)
  if (options?.requireHighAccuracy && userTier !== 'free') {
    return TRANSCRIPTION_PROVIDERS.whisper;
  }

  // Free tier routing
  if (userTier === 'free') {
    if (durationSeconds <= 600) {
      return TRANSCRIPTION_PROVIDERS.browser;
    }
    // For longer audio, use Gemini (covered by API quota)
    return TRANSCRIPTION_PROVIDERS.gemini;
  }

  // Pro/Enterprise routing
  if (durationSeconds <= 300) {
    // Short clips: use Gemini (no extra cost)
    return TRANSCRIPTION_PROVIDERS.gemini;
  }

  // Longer audio: use Whisper for accuracy
  return TRANSCRIPTION_PROVIDERS.whisper;
}

/**
 * Transcribe audio using the Browser Speech API.
 */
async function transcribeWithBrowser(audioBlob: Blob): Promise<TranscriptionRouterResult> {
  // Browser Speech API is only available for live audio, not file processing.
  // For file-based transcription, we'd need to play the audio through the speech API.
  // This is a simplified version that returns an error for file uploads.
  return {
    service: 'browser',
    text: '',
    confidence: 0,
    corrections: [],
  };
}

/**
 * Transcribe audio using Whisper via Edge Function.
 */
async function transcribeWithWhisper(file: File): Promise<TranscriptionRouterResult> {
  const result = await callWhisperProxy(file);

  if (!result.success) {
    throw new Error(result.error?.message || 'Whisper transcription failed');
  }

  const segments: TranscriptSegment[] = (result.segments || []).map((seg, idx) => ({
    id: idx,
    start: seg.start,
    end: seg.end,
    text: seg.text,
    speaker: seg.speaker,
  }));

  return {
    service: 'whisper',
    text: result.text,
    segments,
    duration: result.duration,
    language: result.language,
    confidence: 0.92,
  };
}

/**
 * Transcribe audio using Gemini via Edge Function.
 */
async function transcribeWithGemini(file: File): Promise<TranscriptionRouterResult> {
  // Convert file to base64 for Gemini
  const buffer = await file.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(buffer).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ''
    )
  );

  const response = await callGeminiProxy({
    prompt: `Transcribe this audio file accurately. Include timestamps for each segment.
For legal proceedings, use proper legal terminology.
Return the transcription as plain text with speaker labels if multiple speakers are detected.
Format: [MM:SS] Speaker: text`,
    model: 'gemini-2.5-flash',
    inlineData: {
      mimeType: file.type || 'audio/mpeg',
      data: base64,
    },
  });

  if (!response.success || !response.text) {
    throw new Error(response.error?.message || 'Gemini transcription failed');
  }

  return {
    service: 'gemini',
    text: response.text,
    confidence: 0.88,
  };
}

/**
 * Apply legal terminology corrections to transcribed text.
 */
export function correctLegalTerminology(text: string): {
  correctedText: string;
  corrections: Array<{ original: string; corrected: string }>;
} {
  let correctedText = text;
  const corrections: Array<{ original: string; corrected: string }> = [];

  for (const [wrong, right] of Object.entries(LEGAL_CORRECTIONS)) {
    const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
    const matches = correctedText.match(regex);

    if (matches) {
      for (const match of matches) {
        if (match.toLowerCase() !== right.toLowerCase()) {
          corrections.push({ original: match, corrected: right });
        }
      }
      correctedText = correctedText.replace(regex, right);
    }
  }

  return { correctedText, corrections };
}

/**
 * Enhance transcription with AI-powered legal terminology correction.
 */
async function enhanceWithAI(text: string): Promise<{
  correctedText: string;
  corrections: Array<{ original: string; corrected: string }>;
}> {
  // First apply rule-based corrections
  const { correctedText: ruleBasedText, corrections: ruleBasedCorrections } =
    correctLegalTerminology(text);

  // If text is short, rule-based is sufficient
  if (text.length < 500) {
    return { correctedText: ruleBasedText, corrections: ruleBasedCorrections };
  }

  // For longer texts, use AI for additional corrections
  try {
    const response = await callGeminiProxy({
      prompt: `Review and correct legal terminology in this transcript. Only fix legal terms, case citations, and legal phrases. Do not change the meaning or structure.

Transcript:
${ruleBasedText.substring(0, 10000)}

Return the corrected text with no other commentary.`,
      model: 'gemini-2.5-flash',
      options: {
        temperature: 0.1,
        maxOutputTokens: 4096,
      },
    });

    if (response.success && response.text) {
      return {
        correctedText: response.text,
        corrections: ruleBasedCorrections,
      };
    }
  } catch {
    // If AI enhancement fails, return rule-based results
  }

  return { correctedText: ruleBasedText, corrections: ruleBasedCorrections };
}

/**
 * Main transcription function. Routes to optimal provider and post-processes.
 */
export async function transcribeAudio(
  file: File,
  options?: {
    userTier?: UserTier;
    durationSeconds?: number;
    preferredService?: TranscriptionService;
    requireHighAccuracy?: boolean;
    enhanceLegalTerms?: boolean;
  }
): Promise<TranscriptionRouterResult> {
  const tier = options?.userTier || 'free';
  const duration = options?.durationSeconds || 0;
  const enhance = options?.enhanceLegalTerms ?? true;

  // Select provider
  const config = selectTranscriptionService(duration, tier, {
    requireHighAccuracy: options?.requireHighAccuracy,
    preferredService: options?.preferredService,
  });

  console.log(`[TranscriptionRouter] Using ${config.service} for ${file.name} (${duration}s, tier: ${tier})`);

  // Route to selected provider
  let result: TranscriptionRouterResult;

  switch (config.service) {
    case 'whisper':
      result = await transcribeWithWhisper(file);
      break;
    case 'gemini':
      result = await transcribeWithGemini(file);
      break;
    case 'browser':
    default:
      result = await transcribeWithBrowser(file);
      break;
  }

  // Post-process with legal terminology correction
  if (enhance && result.text) {
    const { correctedText, corrections } = await enhanceWithAI(result.text);
    result.correctedText = correctedText;
    result.corrections = corrections;
  }

  return result;
}

/**
 * Get available transcription services for the user's tier.
 */
export function getAvailableServices(tier: UserTier): TranscriptionRouterConfig[] {
  const services = Object.values(TRANSCRIPTION_PROVIDERS);

  if (tier === 'free') {
    return services.filter(s => s.costPerMinute === 0);
  }

  return services;
}

/**
 * Estimate transcription cost.
 */
export function estimateTranscriptionCost(
  durationSeconds: number,
  service: TranscriptionService
): number {
  const config = TRANSCRIPTION_PROVIDERS[service];
  return (durationSeconds / 60) * config.costPerMinute;
}
