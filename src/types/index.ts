export type ViewState = 'landing' | 'setup' | 'live-interview' | 'text-interview' | 'feedback' | 'history' | 'templates';

export interface CaseConfig {
  type: string;
  industry: string;
  difficulty: string;
}

export interface Message {
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: number;
}

export interface NotebookState {
  caseTitle: string;
  currentPhase: string;
  keyData: string[];
  candidateFramework: string[];
  caseTimeline: string[];
}

export interface SavedSession {
  id: string;
  config: CaseConfig;
  notebook: NotebookState;
  date: number;
  duration: number;
  transcript?: TranscriptEntry[];
  feedback?: FeedbackReport;
}

export interface TranscriptEntry {
  sender: 'You' | 'AI';
  text: string;
  timestamp: number;
}

export interface FeedbackReport {
  overallScore: number;
  strengths: string[];
  improvements: string[];
  detailedFeedback: string;
  specificRecommendations: string[];
}

export interface FrameworkTemplate {
  id: string;
  name: string;
  description: string;
  caseType: string;
  structure: string[];
  tips: string[];
}
