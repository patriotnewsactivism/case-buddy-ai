
export enum CaseStatus {
  PRE_TRIAL = 'Pre-Trial',
  DISCOVERY = 'Discovery',
  TRIAL = 'Trial',
  APPEAL = 'Appeal',
  CLOSED = 'Closed'
}

export enum DocumentType {
  DEPOSITION = 'Deposition',
  MOTION = 'Motion',
  EVIDENCE = 'Evidence',
  CONTRACT = 'Contract',
  OTHER = 'Other'
}

export type TrialPhase = 
  | 'pre-trial-motions'
  | 'voir-dire' 
  | 'opening-statement' 
  | 'direct-examination' 
  | 'cross-examination' 
  | 'defendant-testimony'
  | 'closing-argument' 
  | 'sentencing';

export type SimulationMode = 'learn' | 'practice' | 'trial';

export type RiskLevel = 'low' | 'medium' | 'high';
export type PriorityLevel = 'low' | 'medium' | 'high';
export type TaskStatus = 'open' | 'blocked' | 'done';

export interface EvidenceItem {
  id: string;
  caseId: string;
  title: string;
  type: DocumentType;
  source: 'text' | 'file';
  summary: string;
  keyEntities: string[];
  risks: string[];
  addedAt: string;
  lastUpdated?: string;
  fileName?: string;
  notes?: string;
}

export interface CaseTask {
  id: string;
  caseId: string;
  title: string;
  status: TaskStatus;
  priority: PriorityLevel;
  dueDate?: string;
  owner?: string;
  notes?: string;
}

export interface Case {
  id: string;
  user_id?: string; // Links case to a specific user in Supabase
  title: string;
  client: string;
  status: CaseStatus;
  opposingCounsel: string;
  judge: string;
  nextCourtDate: string;
  summary: string;
  winProbability: number;
  tags?: string[];
  evidence?: EvidenceItem[];
  tasks?: CaseTask[];
  
  // Realistic Legal Fields
  docketNumber?: string;
  courtLocation?: string;
  jurisdiction?: Jurisdiction | string;
  clientType?: 'plaintiff' | 'defendant' | 'prosecution';
  opposingParty?: string;
  legalTheory?: string;
  keyIssues?: string[];
  witnesses?: Witness[];
  opposingProfile?: OpposingProfile;
  lastUpdated?: string;
  citations?: CaseLawCitation[];
  discoveryRequests?: DiscoveryRequest[];
  settlementAnalyses?: SettlementAnalysis[];
}

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  date: string;
  content: string;
  summary?: string;
  keyEntities?: string[];
}

export interface Witness {
  id: string;
  name: string;
  role: string;
  personality: string; // e.g., "Hostile", "Nervous", "Cooperative"
  credibilityScore: number; // 0-100
  avatarUrl: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'witness' | 'system' | 'opponent' | 'coach';
  text: string;
  timestamp: number;
  sentiment?: string;
}

export interface StrategyInsight {
  title: string;
  description: string;
  confidence: number;
  type: 'risk' | 'opportunity' | 'prediction';
}

export interface OpposingProfile {
  name: string;
  firm: string;
  aggressiveness: number; // 0-100
  settlementTendency: number; // 0-100
  commonTactics: string[];
}

export interface CoachingAnalysis {
  critique: string;
  suggestion: string;
  sampleResponse: string;
  fallaciesIdentified: string[];
  rhetoricalEffectiveness: number;
  rhetoricalFeedback: string;
  teleprompterScript?: string;
}

export interface CoachingSuggestion {
  id: string;
  type: 'question' | 'statement' | 'objection' | 'follow-up' | 'tip';
  text: string;
  context: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ProactiveCoaching {
  suggestions: CoachingSuggestion[];
  generalTip: string;
  strategicGoal: string;
}

export interface Transcription {
  id: string;
  caseId: string;
  fileName: string;
  fileUrl?: string;
  text: string;
  duration?: number; // in seconds
  speakers?: string[];
  timestamp: number;
  tags?: string[];
  notes?: string;
}

export type TimelineEventType = 'incident' | 'evidence' | 'witness' | 'filing' | 'hearing' | 'other';
export type TimelineEventImportance = 'low' | 'medium' | 'high' | 'critical';

export interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  description: string;
  type: TimelineEventType;
  importance: TimelineEventImportance;
  tags?: string[];
  linkedEvidence?: string[];
  linkedWitnesses?: string[];
}

export type EvidenceStatus = 'pending' | 'admitted' | 'excluded' | 'challenged';

export interface Evidence {
  id: string;
  name: string;
  type: DocumentType;
  description: string;
  dateObtained: string;
  exhibitNumber?: string;
  source?: string;
  status: EvidenceStatus;
  tags?: string[];
  notes?: string;
}

export interface Juror {
  id: string;
  name: string;
  age: number;
  occupation: string;
  education: string;
  background: string;
  biases: string[];
  leaningScore: number;
  avatar: string;
}

export interface JuryDeliberation {
  jurorId: string;
  statement: string;
  timestamp: number;
}

export interface JuryVerdict {
  verdict: 'guilty' | 'not guilty' | 'hung';
  confidence: number;
  voteTally: {
    guilty: number;
    notGuilty: number;
  };
  reasoning: string;
  weaknesses: string[];
  strengths: string[];
}

export interface TrialSessionMetrics {
  objectionsReceived: number;
  fallaciesCommitted: number;
  avgRhetoricalScore: number;
  wordCount: number;
  fillerWordsCount: number;
}

export interface TrialSessionTranscriptEntry {
  id: string;
  sender: Message['sender'];
  text: string;
  timestamp: number;
}

export interface TrialSession {
  id: string;
  caseId: string;
  caseTitle: string;
  phase: TrialPhase | string;
  mode: SimulationMode | string;
  date: string;
  duration: number;
  transcript: TrialSessionTranscriptEntry[];
  audioUrl?: string;
  score?: number;
  feedback?: string;
  metrics?: Partial<TrialSessionMetrics>;
}

export type Jurisdiction = 'federal' | 'texas' | 'louisiana' | 'mississippi';

export interface ObjectionEvent {
  id: string;
  timestamp: number;
  ground: string;
  ruling: 'sustained' | 'overruled' | 'pending';
  explanation?: string;
  wasCured: boolean;
}

export interface JurorDemographics {
  age: number;
  gender: 'male' | 'female' | 'non-binary';
  race: string;
  education: string;
  occupation: string;
  income: string;
  maritalStatus: string;
  hasChildren: boolean;
  religion?: string;
  politicalLean: string;
  urbanRural: 'urban' | 'suburban' | 'rural';
  priorJuryService: boolean;
  crimeVictim: boolean;
  lawEnforcementFamily: boolean;
}

export interface PsychographicProfile {
  authorityRespect: number;
  justiceOrientation: 'retributive' | 'restorative' | 'mixed';
  skepticismLevel: number;
  empathyLevel: number;
  cognitiveStyle: 'analytical' | 'intuitive' | 'balanced';
  decisionSpeed: 'quick' | 'deliberate' | 'thorough';
  opennessToExperience: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export interface EnhancedJuror extends Juror {
  demographics: JurorDemographics;
  psychographics: PsychographicProfile;
  initialLeaning: number;
  currentLeaning: number;
  reasoningNotes: string[];
}

export interface CaseLawCitation {
  caseName: string;
  citation: string;
  court: string;
  date: string;
  summary: string;
  holding: string;
  favorableTo: 'plaintiff' | 'defendant' | 'neutral';
  stillGoodLaw: boolean;
  url: string;
}

export interface PerformanceMetrics {
  objectionsReceived: number;
  objectionsSustained: number;
  objectionsOverruled: number;
  successfulCures: number;
  rhetoricalScore: number;
  legalAccuracyScore: number;
  overallScore: number;
}

export interface AdmissibilityIssue {
  type: string;
  severity: 'fatal' | 'serious' | 'minor';
  rule: string;
  explanation: string;
  potentialCure: string;
}

export interface AdmissibilityAnalysis {
  overallAdmissibility: 'admissible' | 'conditionally_admissible' | 'inadmissible';
  confidenceScore: number;
  issues: AdmissibilityIssue[];
  suggestedFoundations: string[];
  caseLawSupport: CaseLawCitation[];
}

// ============================================
// NEW TYPES FOR ENHANCED FEATURES
// ============================================

// OCR Types
export interface OCRResult {
  text: string;
  confidence: number;
  pages?: string[];
  detectedLanguage?: string;
  wordCount: number;
  processingTime: number;
}

export interface OCRBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  confidence: number;
}

export type OCRProvider = 
  | 'tesseract' 
  | 'google-document-ai' 
  | 'aws-textract' 
  | 'azure-document-intelligence' 
  | 'mathpix';

export type LegalDocumentCategory = 
  | 'general'
  | 'deposition'
  | 'contract'
  | 'court-filing'
  | 'financial-records'
  | 'medical-records'
  | 'handwritten-evidence'
  | 'form'
  | 'table-heavy';

export interface OCRCapabilities {
  printedTextAccuracy: number;
  handwritingSupport: boolean;
  tableExtraction: boolean;
  multiColumnSupport: boolean;
  lowQualitySupport: boolean;
  formRecognition: boolean;
  clientSide: boolean;
}

export interface OCRProviderConfig {
  provider: OCRProvider;
  enabled: boolean;
  apiKey?: string;
  region?: string;
  endpoint?: string;
  processorId?: string;
  priority: number;
  documentCategories: LegalDocumentCategory[];
  capabilities: OCRCapabilities;
  costPerPage: number;
}

export interface OCROptions {
  provider?: OCRProvider;
  documentCategory?: LegalDocumentCategory;
  enableHandwriting?: boolean;
  enableTableExtraction?: boolean;
  enableFormRecognition?: boolean;
  language?: string;
  preserveLayout?: boolean;
  onProgress?: (progress: number, status: string) => void;
}

export interface OCRTableData {
  headers: string[];
  rows: string[][];
  confidence: number;
  pageNumber?: number;
}

export interface OCRFormData {
  fields: {
    key: string;
    value: string;
    confidence: number;
    boundingBox?: OCRBoundingBox;
  }[];
  checkboxes?: {
    label: string;
    checked: boolean;
    confidence: number;
  }[];
  tables?: OCRTableData[];
}

export interface EnhancedOCRResult extends OCRResult {
  provider: OCRProvider;
  tables?: OCRTableData[];
  forms?: OCRFormData;
  entities?: {
    text: string;
    type: 'person' | 'organization' | 'date' | 'amount' | 'location' | 'other';
    confidence: number;
  }[];
  layoutPreserved?: boolean;
  rawResponse?: unknown;
}

export interface OCRProviderInfo {
  id: OCRProvider;
  name: string;
  description: string;
  capabilities: OCRCapabilities;
  pricingInfo: string;
  recommendedFor: LegalDocumentCategory[];
  setupRequired: string[];
}

// Whisper Transcription Types
export interface WhisperTranscriptionResult {
  text: string;
  duration: number;
  language: string;
  segments: TranscriptSegment[];
  speakers?: SpeakerSegment[];
  wordCount: number;
}

export interface TranscriptSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  speaker?: string;
  confidence?: number;
}

export interface SpeakerSegment {
  speaker: string;
  segments: number[];
}

// Enhanced Transcription with more fields
export interface EnhancedTranscription extends Transcription {
  source: 'audio' | 'document' | 'video';
  confidence: number;
  segments?: TranscriptSegment[];
  processingMethod: 'whisper' | 'ocr' | 'external';
  language?: string;
  wordCount: number;
}

// Deposition Types
export interface DepositionOutline {
  id: string;
  caseId: string;
  deponentName: string;
  deponentRole: string;
  date: string;
  topics: DepositionTopic[];
  exhibitList: string[];
  anticipatedObjections: AnticipatedObjection[];
  keyDocuments: string[];
  notes: string;
}

export interface DepositionTopic {
  id: string;
  title: string;
  questions: DepositionQuestion[];
  order: number;
  notes?: string;
}

export interface DepositionQuestion {
  id: string;
  text: string;
  type: 'foundation' | 'substantive' | 'impeachment' | 'follow-up' | 'closing';
  purpose: string;
  anticipatedAnswer?: string;
  followUpQuestions?: string[];
  linkedExhibit?: string;
  anticipatedObjection?: string;
  notes?: string;
}

export interface AnticipatedObjection {
  ground: string;
  likelihood: 'high' | 'medium' | 'low';
  responseStrategy: string;
  caseLaw?: string;
}

// Settlement Types
export interface SettlementAnalysis {
  id: string;
  caseId: string;
  date: string;
  economicDamages: EconomicDamages;
  nonEconomicDamages: NonEconomicDamages;
  punitiveDamages?: PunitiveDamages;
  comparativeNegligence: number;
  settlementRange: [number, number];
  recommendedDemand: number;
  confidenceScore: number;
  factors: SettlementFactor[];
  juryVerdictResearch?: JuryVerdictData[];
  negotiationStrategy: string;
}

export interface EconomicDamages {
  medicalExpenses: number;
  medicalExpensesFuture: number;
  lostWages: number;
  lostWagesFuture: number;
  propertyDamage: number;
  otherEconomic: number;
  total: number;
}

export interface NonEconomicDamages {
  painAndSuffering: number;
  emotionalDistress: number;
  lossOfConsortium: number;
  lossOfEnjoyment: number;
  disfigurement: number;
  multiplier: number;
  total: number;
}

export interface PunitiveDamages {
  basis: string;
  multiplier: number;
  amount: number;
  likelihood: number;
}

export interface SettlementFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  description: string;
}

export interface JuryVerdictData {
  caseName: string;
  venue: string;
  date: string;
  injuries: string;
  award: number;
  notes?: string;
}

// Discovery Types
export interface DiscoveryRequest {
  id: string;
  caseId: string;
  type: 'interrogatory' | 'request-for-production' | 'request-for-admission' | 'deposition';
  number: string;
  question: string;
  response?: string;
  objections?: string[];
  servedDate?: string;
  responseDueDate?: string;
  responseDate?: string;
  status: 'pending' | 'responded' | 'objected' | 'overdue';
  privilegeLogEntry?: boolean;
  notes?: string;
}

export interface DiscoveryDeadline {
  id: string;
  caseId: string;
  requestType: string;
  requestNumber: string;
  servedDate: string;
  dueDate: string;
  daysRemaining: number;
  status: 'upcoming' | 'due-today' | 'overdue' | 'completed';
}

// Case Law Search Types
export interface CaseLawSearchResult {
  id: string;
  caseName: string;
  citation: string;
  court: string;
  date: string;
  summary: string;
  holding?: string;
  relevanceScore: number;
  url: string;
  stillGoodLaw: boolean;
  overruledDate?: string;
  distinguishingCases?: string[];
}

export interface CaseLawSearchParams {
  query: string;
  court?: string;
  jurisdiction?: string;
  dateFrom?: string;
  dateTo?: string;
  maxResults?: number;
}

// Performance Analytics Types
export interface PerformanceSession {
  id: string;
  caseId: string;
  date: string;
  phase: TrialPhase;
  mode: SimulationMode;
  duration: number;
  metrics: SessionMetrics;
  transcript: string;
  audioUrl?: string;
  videoUrl?: string;
  notes?: string;
}

export interface SessionMetrics {
  objectionsReceived: number;
  objectionsSustained: number;
  objectionsOverruled: number;
  rhetoricalScore: number;
  legalAccuracyScore: number;
  overallScore: number;
  fillerWordCount: number;
  fillerWords: string[];
  weakPhrases: string[];
  wordsPerMinute: number;
  pauseCount: number;
  averagePauseLength: number;
}

export interface PerformanceTrend {
  date: string;
  overallScore: number;
  rhetoricalScore: number;
  objectionSuccessRate: number;
  sessionCount: number;
}

export interface PerformanceSummary {
  totalSessions: number;
  totalDuration: number;
  averageScore: number;
  improvementRate: number;
  strengths: string[];
  weaknesses: string[];
  recentTrend: PerformanceTrend[];
  topFillerWords: { word: string; count: number }[];
  mostImproved: string;
  needsWork: string;
}

// Exhibit Management Types
export interface Exhibit {
  id: string;
  caseId: string;
  exhibitNumber: string;
  title: string;
  description: string;
  type: 'document' | 'photo' | 'video' | 'audio' | 'physical';
  source: string;
  dateObtained: string;
  status: EvidenceStatus;
  linkedWitnesses: string[];
  linkedEvents: string[];
  tags: string[];
  batesNumber?: string;
  privilegeStatus: 'not-privileged' | 'privileged' | 'work-product' | 'unknown';
  privilegeLogEntry?: string;
  notes?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
}

// Negotiation Simulation Types
export interface NegotiationScenario {
  id: string;
  caseId: string;
  opponentType: 'insurance' | 'corporation' | 'individual' | 'government';
  opponentTactics: string[];
  settlementRange: [number, number];
  initialOffer: number;
  currentOffer: number;
  rounds: NegotiationRound[];
  status: 'active' | 'settled' | 'impasse';
  outcome?: {
    settledAmount?: number;
    reason?: string;
  };
}

export interface NegotiationRound {
  round: number;
  yourPosition: number;
  opponentPosition: number;
  yourArgument: string;
  opponentResponse: string;
  timestamp: number;
}

// Legal Research Types
export interface LegalResearchQuery {
  id: string;
  caseId: string;
  query: string;
  results: CaseLawSearchResult[];
  date: string;
  notes?: string;
}

export interface MotionDraft {
  id: string;
  caseId: string;
  type: string;
  title: string;
  content: string;
  tableOfAuthorities: string[];
  status: 'draft' | 'review' | 'final';
  createdDate: string;
  modifiedDate: string;
}

// Voice Simulator Configuration Types
export type VoicePersonality = 'authoritative' | 'friendly' | 'neutral' | 'aggressive' | 'calm';

export interface VoiceConfig {
  voiceName: string;
  personality: VoicePersonality;
  languageCode: string;
}

export interface VoiceProfile {
  id: string;
  name: string;
  description: string;
  personality: VoicePersonality;
  recommendedFor: TrialPhase[];
  voiceName: string;
}

export interface SimulatorSettings {
  voice: VoiceConfig;
  realismLevel: 'casual' | 'professional' | 'intense';
  interruptionFrequency: 'low' | 'medium' | 'high';
  coachingVerbosity: 'minimal' | 'moderate' | 'detailed';
  audioQuality: 'standard' | 'high';
}

// ============================================
// TRANSCRIPTION TYPES (from case-buddy-transcribe)
// ============================================

export enum AppMode {
  UPLOAD = 'UPLOAD',
  RECORD = 'RECORD',
}

export enum TranscriptionStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export enum TranscriptionProvider {
  GEMINI = 'GEMINI',
  OPENAI = 'OPENAI',
  ASSEMBLYAI = 'ASSEMBLYAI',
}

export interface TranscriptionSettings {
  provider: TranscriptionProvider;
  openaiKey: string;
  assemblyAiKey: string;
  googleClientId: string; // For Google Drive Integration
  googleApiKey: string;   // Required for Picker API
  legalMode: boolean; // Enables verbatim, timestamps, and speaker ID
  autoDownloadAudio: boolean; // Auto-save audio on stop
  autoDriveUpload: boolean; // Auto-upload to Google Drive
  customVocabulary: string[]; // List of words/phrases to teach the AI
}

export interface TranscriptSegmentData {
  start: number; // Start time in seconds
  end: number;   // End time in seconds
  speaker: string;
  text: string;
}

export interface TranscriptionResultData {
  text: string; // Fallback plain text
  segments?: TranscriptSegmentData[]; // Structured data for click-to-play
  summary?: string;
  detectedLanguage?: string;
  providerUsed: TranscriptionProvider;
}

export interface BatchItem {
  id: string;
  file: File;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'ERROR';
  stage: string; // e.g. "Extracting Audio", "Uploading"
  progress: number;
  result?: TranscriptionResultData;
  error?: string;
}

export interface AudioFile {
  file: File | Blob;
  name: string;
  type: string;
  duration?: number;
}

export interface VoiceProfileData {
  id: string;
  name: string;
  createdAt: string;
  lastUsed: string;
  usageCount: number;
}

// ============================================
// CAPTION AND ENHANCED AUDIO TYPES
// ============================================

export interface CaptionSettings {
  enabled: boolean;
  fontSize: 'small' | 'medium' | 'large';
  position: 'bottom' | 'top' | 'center';
  showSpeaker: boolean;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
}

export interface AudioState {
  isUnlocked: boolean;
  isPlaying: boolean;
  currentSource: 'elevenlabs' | 'browser' | null;
  volume: number;
  lastError?: string;
}

export interface VoiceSettings {
  provider: 'elevenlabs' | 'browser';
  voiceId?: string;
  rate: number;
  pitch: number;
  volume: number;
}

export interface LiveTranscript {
  id: string;
  text: string;
  isFinal: boolean;
  speaker: 'user' | 'ai' | 'witness' | 'system';
  timestamp: number;
  confidence?: number;
}

export interface CaptionWord {
  word: string;
  start?: number;
  end?: number;
  isHighlighted?: boolean;
}

export interface KnowledgeEntity {
  text: string;
  type: 'person' | 'organization' | 'date' | 'amount' | 'location' | 'statute' | 'case-citation' | 'other';
  confidence: number;
  source: string;
}

export interface KnowledgeFact {
  id: string;
  text: string;
  source: string;
  confidence: number;
  category: 'procedural' | 'factual' | 'legal' | 'evidentiary' | 'testimonial';
  createdAt: number;
}

export interface DocumentSummary {
  id: string;
  fileName: string;
  summary: string;
  entities: KnowledgeEntity[];
  keyDates: string[];
  monetaryAmounts: string[];
  risks: string[];
  addedAt: number;
}

export interface CaseKnowledge {
  caseId: string;
  entities: KnowledgeEntity[];
  facts: KnowledgeFact[];
  documentSummaries: DocumentSummary[];
  lastUpdated: number;
}

// ============================================
// PRODUCTION READINESS TYPES
// ============================================

// User Tier System
export type UserTier = 'free' | 'pro' | 'enterprise';

export interface UserTierConfig {
  tier: UserTier;
  startedAt: string;
  expiresAt?: string;
  stripeSubscriptionId?: string;
}

export interface TierLimits {
  ocrPages: number | 'unlimited';
  aiRequests: number | 'unlimited';
  transcriptionMinutes: number | 'unlimited';
  storageGb: number;
  courtroomSessions: number | 'unlimited';
}

export const TIER_LIMITS: Record<UserTier, TierLimits> = {
  free: {
    ocrPages: 50,
    aiRequests: 100,
    transcriptionMinutes: 10,
    storageGb: 1,
    courtroomSessions: 5,
  },
  pro: {
    ocrPages: 1000,
    aiRequests: 1000,
    transcriptionMinutes: 300,
    storageGb: 50,
    courtroomSessions: 100,
  },
  enterprise: {
    ocrPages: 'unlimited',
    aiRequests: 10000,
    transcriptionMinutes: 3000,
    storageGb: 500,
    courtroomSessions: 'unlimited',
  },
};

// AI Model Router Types
export type AIProvider = 'gemini-flash' | 'gemini-pro' | 'openai';

export interface AIModelConfig {
  provider: AIProvider;
  model: string;
  costPer1kTokens: number;
  maxTokens: number;
  supportsStructuredOutput: boolean;
  supportsThinking: boolean;
}

export interface AIRoutingDecision {
  model: AIModelConfig;
  reason: string;
  estimatedCost: number;
  complexity: number;
}

// Cache Types
export interface CacheEntry {
  id: string;
  documentId?: string;
  analysisType: string;
  promptHash: string;
  result: unknown;
  modelUsed: string;
  tokenCount?: number;
  hitCount: number;
  expiresAt: string;
  createdAt: string;
}

export type CacheLayer = 'memory' | 'database';

export interface CacheResult {
  hit: boolean;
  layer?: CacheLayer;
  data?: unknown;
  cacheId?: string;
}

// Document Processing Queue Types
export type QueueItemStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type ProcessingMethod = 'native_text' | 'ocr_tesseract' | 'ocr_google' | 'ocr_aws' | 'ocr_azure' | 'transcription';

export interface DocumentQueueItem {
  id: string;
  userId: string;
  caseId?: string;
  fileName: string;
  filePath?: string;
  fileType: string;
  fileSize?: number;
  status: QueueItemStatus;
  processingMethod?: ProcessingMethod;
  priority: number;
  result?: unknown;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface DocumentQueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  totalProcessed: number;
}

// Courtroom Simulation Types (Extended)
export type CourtroomSessionType =
  | 'mock_trial'
  | 'deposition'
  | 'cross_examination'
  | 'direct_examination'
  | 'opening_statement'
  | 'closing_argument'
  | 'voir_dire'
  | 'sentencing';

export type CourtroomSessionStatus = 'active' | 'paused' | 'completed' | 'abandoned';

export interface CourtroomSession {
  id: string;
  caseId?: string;
  userId: string;
  sessionType: CourtroomSessionType;
  difficulty: SimulationMode;
  aiJudgeModel: string;
  aiOpposingCounselModel: string;
  aiWitnessModel: string;
  caseContext?: string;
  status: CourtroomSessionStatus;
  durationSeconds: number;
  overallScore?: number;
  feedback?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface SimulationTranscriptEntry {
  id: string;
  sessionId: string;
  speaker: string;
  content: string;
  audioUrl?: string;
  analysis?: Record<string, unknown>;
  timestamp: string;
}

export interface ObjectionRecord {
  id: string;
  sessionId: string;
  objectionType: string;
  raisedBy: 'user' | 'ai_opposing';
  ruling: 'sustained' | 'overruled' | 'pending';
  reasoning?: string;
  legalBasis?: string;
  wasCured: boolean;
  timestamp: string;
}

export interface SimulationMetric {
  id: string;
  sessionId: string;
  userId: string;
  metricType: string;
  score: number;
  feedback?: string;
  details?: Record<string, unknown>;
  calculatedAt: string;
}

// Performance Scoring Types
export interface PerformanceScorecard {
  persuasiveness: number;
  evidenceUsage: number;
  objectionHandling: number;
  legalAccuracy: number;
  overallScore: number;
  feedback: string;
  strengths: string[];
  areasForImprovement: string[];
}

export interface PerformanceSummaryData {
  totalSessions: number;
  totalDurationSeconds: number;
  averageScore: number;
  sessionsByType: Record<string, number>;
  objectionStats: {
    totalRaised: number;
    sustained: number;
    overruled: number;
  };
  recentScores: Array<{
    date: string;
    score: number;
    type: string;
  }>;
}

// Transcription Router Types
export type TranscriptionService = 'browser' | 'whisper' | 'gemini';

export interface TranscriptionRouterConfig {
  service: TranscriptionService;
  maxDurationSeconds: number;
  accuracy: number;
  costPerMinute: number;
}

export interface TranscriptionRouterResult {
  service: TranscriptionService;
  text: string;
  segments?: TranscriptSegment[];
  duration?: number;
  language?: string;
  confidence: number;
  correctedText?: string;
  corrections?: Array<{ original: string; corrected: string }>;
}
