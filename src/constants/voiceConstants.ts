import { VoiceProfile, TrialPhase } from '../types';

export const AVAILABLE_VOICES = [
  'Zephyr',
  'Puck',
  'Kore',
  'Orus',
  'Autonoe',
  'Umbriel',
  'Erinome',
  'Laomedeia',
  'Schedar',
  'Achird',
  'Sadachbia',
  'Fenrir',
  'Aoede',
] as const;

export type VoiceName = typeof AVAILABLE_VOICES[number];

export const VOICE_PROFILES: VoiceProfile[] = [
  {
    id: 'judge-authoritative',
    name: 'Judge - Authoritative',
    description: 'Formal, commanding tone for judicial figures',
    personality: 'authoritative',
    recommendedFor: ['pre-trial-motions', 'sentencing'],
    voiceName: 'Kore',
  },
  {
    id: 'opponent-aggressive',
    name: 'Opposing Counsel - Aggressive',
    description: 'Sharp, confrontational tone for fierce opposition',
    personality: 'aggressive',
    recommendedFor: ['cross-examination', 'opening-statement', 'closing-argument'],
    voiceName: 'Fenrir',
  },
  {
    id: 'opponent-professional',
    name: 'Opposing Counsel - Professional',
    description: 'Measured, professional tone for standard proceedings',
    personality: 'neutral',
    recommendedFor: ['direct-examination', 'voir-dire'],
    voiceName: 'Schedar',
  },
  {
    id: 'witness-hostile',
    name: 'Witness - Hostile',
    description: 'Evasive, defensive tone for hostile witnesses',
    personality: 'aggressive',
    recommendedFor: ['cross-examination'],
    voiceName: 'Orus',
  },
  {
    id: 'witness-nervous',
    name: 'Witness - Nervous',
    description: 'Uncertain, hesitant tone for nervous witnesses',
    personality: 'friendly',
    recommendedFor: ['direct-examination', 'defendant-testimony'],
    voiceName: 'Achird',
  },
  {
    id: 'witness-cooperative',
    name: 'Witness - Cooperative',
    description: 'Helpful, clear tone for cooperative witnesses',
    personality: 'calm',
    recommendedFor: ['direct-examination'],
    voiceName: 'Erinome',
  },
  {
    id: 'prosecutor',
    name: 'Prosecutor',
    description: 'Assertive, methodical tone for prosecution',
    personality: 'authoritative',
    recommendedFor: ['defendant-testimony', 'closing-argument'],
    voiceName: 'Zephyr',
  },
];

export const VOICE_DESCRIPTIONS: Record<string, { tone: string; bestFor: string }> = {
  'Zephyr': { tone: 'Bright and articulate', bestFor: 'Prosecutors, expert witnesses' },
  'Puck': { tone: 'Upbeat and energetic', bestFor: 'Casual coaching, friendly witnesses' },
  'Kore': { tone: 'Firm and authoritative', bestFor: 'Judges, senior counsel' },
  'Orus': { tone: 'Firm and direct', bestFor: 'Hostile witnesses, tough opponents' },
  'Autonoe': { tone: 'Bright and clear', bestFor: 'Direct examination, coaching' },
  'Umbriel': { tone: 'Easy-going and relaxed', bestFor: 'Settlement discussions, mediation' },
  'Erinome': { tone: 'Clear and precise', bestFor: 'Expert testimony, technical witnesses' },
  'Laomedeia': { tone: 'Upbeat and engaging', bestFor: 'Opening statements, jury appeal' },
  'Schedar': { tone: 'Even and balanced', bestFor: 'General proceedings, balanced opponents' },
  'Achird': { tone: 'Friendly and approachable', bestFor: 'Friendly witnesses, coaching mode' },
  'Sadachbia': { tone: 'Lively and animated', bestFor: 'Dynamic cross-examination' },
  'Fenrir': { tone: 'Excitable and aggressive', bestFor: 'Aggressive cross-examination' },
  'Aoede': { tone: 'Breezy and conversational', bestFor: 'Casual practice, learn mode' },
};

export const DEFAULT_VOICE_BY_PHASE: Partial<Record<TrialPhase, string>> = {
  'pre-trial-motions': 'Kore',
  'voir-dire': 'Schedar',
  'opening-statement': 'Laomedeia',
  'direct-examination': 'Achird',
  'cross-examination': 'Fenrir',
  'defendant-testimony': 'Zephyr',
  'closing-argument': 'Kore',
  'sentencing': 'Kore',
};

export const SUPPORTED_LANGUAGES = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'es-US', name: 'Spanish (US)' },
] as const;

export const OBJECTION_RESPONSES = [
  { label: 'Withdraw',        text: 'Your Honor, I withdraw the question.' },
  { label: 'Rephrase',        text: 'Your Honor, I will rephrase the question.' },
  { label: 'Argue Relevance', text: 'Your Honor, this question is directly relevant to the central issues before the court.' },
  { label: 'Foundation',      text: 'Your Honor, I have laid proper foundation for this line of questioning.' },
] as const;
