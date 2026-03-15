/**
 * Courtroom Agent Service
 *
 * Manages AI agent personas for courtroom simulation:
 * - Judge: Rules on objections, maintains decorum
 * - Opposing Counsel: Argues against user, cross-examines
 * - Witness: Responds to questioning based on depositions/case facts
 *
 * Each agent maintains context-aware conversation history and integrates
 * with the performance scoring and audit logging systems.
 */

import { callGeminiProxy, GeminiProxyRequest } from './apiProxy';
import {
  CourtroomSession,
  CourtroomSessionType,
  SimulationMode,
  ObjectionRecord,
} from '../types';
import {
  createCourtroomSession,
  saveTranscriptEntry,
  recordObjection,
  generatePerformanceScorecard,
  saveSessionMetrics,
  updateSessionScore,
} from './performanceScoringService';
import { logAudit } from './auditLogService';
import { getCachedResult, cacheResult } from './cacheService';

// Agent persona definitions
export interface AgentPersona {
  role: 'judge' | 'opposing_counsel' | 'witness';
  systemPrompt: string;
  model: string;
  temperature: number;
}

const AGENT_PERSONAS: Record<string, AgentPersona> = {
  judge: {
    role: 'judge',
    systemPrompt: `You are a federal district court judge with 20 years of experience.
You are fair, knowledgeable about Federal Rules of Evidence and Federal Rules of Civil Procedure, and maintain courtroom decorum.
Evaluate objections based on legal merit. Provide brief, authoritative rulings.
When ruling on objections, cite the specific rule of evidence when applicable.
Maintain a formal, measured tone. Address attorneys as "Counsel."
If behavior is inappropriate, issue warnings before sanctions.`,
    model: 'gemini-2.5-flash',
    temperature: 0.3,
  },

  opposing_counsel: {
    role: 'opposing_counsel',
    systemPrompt: `You are an experienced trial attorney representing the opposing party.
Your goal is to challenge weak arguments, raise legitimate objections, and cross-examine effectively.
Be aggressive but professional. Cite relevant case law when appropriate.
Strategies:
- Object when there are genuine evidentiary grounds (hearsay, relevance, leading, speculation, lack of foundation)
- Cross-examine to expose inconsistencies
- Make strategic concessions to appear reasonable to the jury
- Use impeachment techniques when witness statements conflict
Do NOT object frivolously - only when there are legitimate legal grounds.`,
    model: 'gemini-2.5-flash',
    temperature: 0.7,
  },

  witness: {
    role: 'witness',
    systemPrompt: `You are a witness testifying based on the provided deposition transcript and case facts.
Answer questions consistently with your prior statements. Show realistic witness behavior:
- Nervousness under pressure (pause, ask for clarification)
- Evasiveness on difficult questions (answer adjacent questions, qualify responses)
- Clarity on facts you know well
- Appropriate emotion when discussing sensitive topics
Do NOT volunteer information beyond what is asked.
If asked about something outside your knowledge, say "I don't recall" or "I'm not sure."
Never break character or acknowledge being AI.`,
    model: 'gemini-2.5-flash',
    temperature: 0.8,
  },
};

// Active session state
interface ActiveAgentSession {
  sessionId: string;
  userId: string;
  caseContext: string;
  sessionType: CourtroomSessionType;
  difficulty: SimulationMode;
  agents: Record<string, AgentPersona>;
  conversationHistory: Array<{
    role: 'user' | 'model';
    parts: Array<{ text: string }>;
    speaker?: string;
  }>;
  objections: ObjectionRecord[];
  userStatements: string[];
  aiResponses: string[];
  startTime: number;
}

const activeSessions = new Map<string, ActiveAgentSession>();

/**
 * Create a new courtroom simulation session with AI agents.
 */
export async function createAgentSession(params: {
  userId: string;
  caseId?: string;
  sessionType: CourtroomSessionType;
  difficulty: SimulationMode;
  caseContext: string;
  witnessContext?: string;
  evidenceData?: Array<{ summary: string; entities: string[]; keyDates: string[] }>;
}): Promise<{ sessionId: string; initialMessage: string }> {
  const { userId, caseId, sessionType, difficulty, caseContext, witnessContext, evidenceData } = params;

  // Create session in database
  const sessionId = await createCourtroomSession({
    caseId,
    userId,
    sessionType,
    difficulty,
    aiJudgeModel: AGENT_PERSONAS.judge.model,
    aiOpposingCounselModel: AGENT_PERSONAS.opposing_counsel.model,
    aiWitnessModel: AGENT_PERSONAS.witness.model,
    caseContext,
    status: 'active',
    durationSeconds: 0,
  });

  if (!sessionId) {
    throw new Error('Failed to create courtroom session');
  }

  // Build agent personas with case context
  const agents = buildAgentsForSession(sessionType, difficulty, caseContext, witnessContext, evidenceData);

  // Initialize active session
  const session: ActiveAgentSession = {
    sessionId,
    userId,
    caseContext,
    sessionType,
    difficulty,
    agents,
    conversationHistory: [],
    objections: [],
    userStatements: [],
    aiResponses: [],
    startTime: Date.now(),
  };

  activeSessions.set(sessionId, session);

  // Generate opening message from the appropriate agent
  const openingAgent = getOpeningAgent(sessionType);
  const openingMessage = await generateAgentResponse(sessionId, openingAgent, 'BEGIN_SESSION');

  logAudit({
    userId,
    action: 'courtroom_session',
    resource: sessionId,
    details: { sessionType, difficulty, action: 'created' },
    success: true,
  });

  return { sessionId, initialMessage: openingMessage };
}

/**
 * Send a user message and get the appropriate agent's response.
 */
export async function sendMessage(
  sessionId: string,
  userMessage: string,
  targetAgent?: string
): Promise<{
  response: string;
  speaker: string;
  objection?: { type: string; ruling: string; reasoning: string };
  scorecard?: ReturnType<typeof generatePerformanceScorecard> extends Promise<infer T> ? T : never;
}> {
  const session = activeSessions.get(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found or expired`);
  }

  // Record user statement
  session.userStatements.push(userMessage);
  session.conversationHistory.push({
    role: 'user',
    parts: [{ text: userMessage }],
    speaker: 'user',
  });

  // Save transcript
  await saveTranscriptEntry(sessionId, 'user', userMessage);

  // Determine which agent should respond
  const agentKey = targetAgent || determineRespondingAgent(session, userMessage);
  const startTime = Date.now();

  // Generate response
  const response = await generateAgentResponse(sessionId, agentKey, userMessage);
  const durationMs = Date.now() - startTime;

  session.aiResponses.push(response);

  // Save AI transcript
  await saveTranscriptEntry(sessionId, agentKey, response);

  logAudit({
    userId: session.userId,
    action: 'ai_request',
    resource: `courtroom:${sessionId}`,
    details: { agent: agentKey, sessionType: session.sessionType },
    modelUsed: session.agents[agentKey]?.model || 'gemini-2.5-flash',
    durationMs,
    success: true,
  });

  // Check for objections in the response
  const objectionData = parseObjection(response);
  if (objectionData) {
    const objRecord: Omit<ObjectionRecord, 'id' | 'timestamp'> = {
      sessionId,
      objectionType: objectionData.type,
      raisedBy: 'ai_opposing',
      ruling: objectionData.ruling as 'sustained' | 'overruled' | 'pending',
      reasoning: objectionData.reasoning,
      legalBasis: objectionData.type,
      wasCured: false,
    };
    session.objections.push(objRecord as ObjectionRecord);
    await recordObjection(sessionId, objRecord);
  }

  return {
    response,
    speaker: agentKey,
    objection: objectionData || undefined,
  };
}

/**
 * End a courtroom session and generate final performance scorecard.
 */
export async function endSession(sessionId: string): Promise<{
  scorecard: Awaited<ReturnType<typeof generatePerformanceScorecard>>;
  duration: number;
}> {
  const session = activeSessions.get(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  const duration = Math.round((Date.now() - session.startTime) / 1000);

  // Generate performance scorecard
  const scorecard = await generatePerformanceScorecard(
    session.userStatements,
    session.aiResponses,
    session.objections as ObjectionRecord[],
    session.sessionType,
    session.caseContext
  );

  // Save metrics and update session
  await saveSessionMetrics(sessionId, session.userId, scorecard);
  await updateSessionScore(sessionId, scorecard.overallScore, scorecard.feedback);

  logAudit({
    userId: session.userId,
    action: 'courtroom_session',
    resource: sessionId,
    details: {
      action: 'completed',
      duration,
      score: scorecard.overallScore,
      objections: session.objections.length,
    },
    success: true,
  });

  // Clean up
  activeSessions.delete(sessionId);

  return { scorecard, duration };
}

/**
 * Get active session info.
 */
export function getActiveSession(sessionId: string): ActiveAgentSession | undefined {
  return activeSessions.get(sessionId);
}

// ---- Internal helpers ----

function buildAgentsForSession(
  sessionType: CourtroomSessionType,
  difficulty: SimulationMode,
  caseContext: string,
  witnessContext?: string,
  evidenceData?: Array<{ summary: string; entities: string[]; keyDates: string[] }>
): Record<string, AgentPersona> {
  const agents: Record<string, AgentPersona> = {};

  const evidenceSection = evidenceData?.length
    ? `\n\nAVAILABLE EVIDENCE:\n${evidenceData.map((e, i) => `${i + 1}. ${e.summary}\n   Entities: ${e.entities.slice(0, 5).join(', ')}\n   Dates: ${e.keyDates.slice(0, 3).join(', ')}`).join('\n')}`
    : '';

  const difficultyModifier = difficulty === 'learn'
    ? '\nBe educational and encouraging. Explain rulings and legal concepts.'
    : difficulty === 'trial'
    ? '\nBe realistic and challenging. No hand-holding.'
    : '\nBalance challenge with guidance.';

  // Always include judge
  agents.judge = {
    ...AGENT_PERSONAS.judge,
    systemPrompt: `${AGENT_PERSONAS.judge.systemPrompt}\n\nCASE CONTEXT: ${caseContext}${evidenceSection}${difficultyModifier}`,
  };

  // Include opposing counsel for most session types
  if (['mock_trial', 'cross_examination', 'opening_statement', 'closing_argument', 'voir_dire'].includes(sessionType)) {
    agents.opposing_counsel = {
      ...AGENT_PERSONAS.opposing_counsel,
      systemPrompt: `${AGENT_PERSONAS.opposing_counsel.systemPrompt}\n\nCASE CONTEXT: ${caseContext}${evidenceSection}${difficultyModifier}`,
    };
  }

  // Include witness for examination types
  if (['cross_examination', 'direct_examination', 'deposition', 'mock_trial'].includes(sessionType)) {
    const witnessExtra = witnessContext ? `\n\nWITNESS BACKGROUND & DEPOSITION:\n${witnessContext}` : '';
    agents.witness = {
      ...AGENT_PERSONAS.witness,
      systemPrompt: `${AGENT_PERSONAS.witness.systemPrompt}\n\nCASE CONTEXT: ${caseContext}${witnessExtra}${evidenceSection}${difficultyModifier}`,
    };
  }

  return agents;
}

function getOpeningAgent(sessionType: CourtroomSessionType): string {
  switch (sessionType) {
    case 'mock_trial':
    case 'sentencing':
      return 'judge';
    case 'cross_examination':
    case 'direct_examination':
    case 'deposition':
      return 'witness';
    default:
      return 'opposing_counsel';
  }
}

function determineRespondingAgent(session: ActiveAgentSession, userMessage: string): string {
  const lower = userMessage.toLowerCase();

  // Explicit addressing
  if (lower.includes('your honor') || lower.includes('the court')) return 'judge';
  if (lower.includes('counsel') || lower.includes('opposing')) return 'opposing_counsel';

  // Default based on session type
  switch (session.sessionType) {
    case 'cross_examination':
    case 'direct_examination':
    case 'deposition':
      return 'witness';
    case 'opening_statement':
    case 'closing_argument':
    case 'voir_dire':
      return 'opposing_counsel';
    case 'sentencing':
      return 'judge';
    default:
      return 'opposing_counsel';
  }
}

async function generateAgentResponse(
  sessionId: string,
  agentKey: string,
  userMessage: string
): Promise<string> {
  const session = activeSessions.get(sessionId);
  if (!session) throw new Error('Session not found');

  const agent = session.agents[agentKey];
  if (!agent) {
    return `[${agentKey} agent not available for this session type]`;
  }

  const history = session.conversationHistory
    .slice(-20)
    .map((entry) => ({
      role: entry.role,
      parts: entry.parts,
    }));

  const request: GeminiProxyRequest = {
    prompt: userMessage === 'BEGIN_SESSION'
      ? `Begin the ${session.sessionType.replace(/_/g, ' ')} session. Introduce yourself and set the scene based on the case context. Address the attorney and explain what will happen.`
      : userMessage,
    systemPrompt: agent.systemPrompt,
    model: agent.model,
    options: {
      temperature: agent.temperature,
      maxOutputTokens: 2048,
    },
    conversationHistory: history.length > 0 ? history : undefined,
  };

  const response = await callGeminiProxy(request);

  if (!response.success || !response.text) {
    throw new Error(response.error?.message || 'Agent response generation failed');
  }

  // Update conversation history
  session.conversationHistory.push({
    role: 'model',
    parts: [{ text: response.text }],
    speaker: agentKey,
  });

  return response.text;
}

function parseObjection(response: string): { type: string; ruling: string; reasoning: string } | null {
  const lower = response.toLowerCase();

  // Check for objection patterns
  const objectionPatterns = [
    /objection[!.]?\s*(hearsay|relevance|leading|speculation|foundation|argumentative|asked and answered|compound|vague|assumes facts)/i,
    /I object[!.]?\s*(?:on the grounds? of\s*)?(hearsay|relevance|leading|speculation|foundation|argumentative)/i,
  ];

  for (const pattern of objectionPatterns) {
    const match = response.match(pattern);
    if (match) {
      const type = match[1] || 'general';
      // Check if the response also contains a ruling
      const sustained = lower.includes('sustained');
      const overruled = lower.includes('overruled');
      const ruling = sustained ? 'sustained' : overruled ? 'overruled' : 'pending';

      return { type, ruling, reasoning: response.substring(0, 200) };
    }
  }

  return null;
}
