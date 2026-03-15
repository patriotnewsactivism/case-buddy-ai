/**
 * Performance Scoring Service
 *
 * Provides real-time and post-session performance scoring for courtroom simulations.
 * Tracks metrics across sessions and generates improvement recommendations.
 */

import {
  PerformanceScorecard,
  PerformanceSummaryData,
  CourtroomSession,
  SimulationMetric,
  ObjectionRecord,
  SimulationTranscriptEntry,
} from '../types';
import { getSupabaseClient } from './supabaseClient';
import { callGeminiProxy } from './apiProxy';

/**
 * Generate a real-time performance scorecard based on the current session state.
 */
export async function generatePerformanceScorecard(
  userStatements: string[],
  aiResponses: string[],
  objections: ObjectionRecord[],
  sessionType: string,
  caseContext?: string
): Promise<PerformanceScorecard> {
  const userText = userStatements.join('\n');
  const objectionsSustained = objections.filter(o => o.ruling === 'sustained').length;
  const objectionsOverruled = objections.filter(o => o.ruling === 'overruled').length;
  const totalObjections = objections.length;

  // Calculate objection handling score
  const objectionScore = totalObjections > 0
    ? ((objectionsOverruled / totalObjections) * 100)
    : 75; // Default if no objections yet

  const prompt = `You are a legal performance evaluator. Analyze this courtroom simulation performance.

SESSION TYPE: ${sessionType}
${caseContext ? `CASE CONTEXT: ${caseContext}` : ''}

ATTORNEY'S STATEMENTS (${userStatements.length} total):
${userText.substring(0, 5000)}

AI OPPONENT'S RESPONSES (${aiResponses.length} total):
${aiResponses.join('\n').substring(0, 3000)}

OBJECTION RECORD:
- Total objections: ${totalObjections}
- Sustained (against attorney): ${objectionsSustained}
- Overruled (in attorney's favor): ${objectionsOverruled}

Score the attorney on these metrics (0-100):
1. persuasiveness - How convincing and compelling the arguments are
2. evidenceUsage - How well evidence and facts are referenced
3. legalAccuracy - Correctness of legal reasoning and citations
4. overallScore - Weighted overall performance

Also provide:
- feedback: 2-3 sentence overall assessment
- strengths: List of 2-3 specific strengths demonstrated
- areasForImprovement: List of 2-3 specific areas to improve

Return as JSON.`;

  try {
    const response = await callGeminiProxy({
      prompt,
      model: 'gemini-2.5-flash',
      options: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    if (response.success && response.text) {
      const parsed = JSON.parse(response.text);
      return {
        persuasiveness: clampScore(parsed.persuasiveness || 50),
        evidenceUsage: clampScore(parsed.evidenceUsage || 50),
        objectionHandling: clampScore(objectionScore),
        legalAccuracy: clampScore(parsed.legalAccuracy || 50),
        overallScore: clampScore(parsed.overallScore || 50),
        feedback: parsed.feedback || 'Performance analysis complete.',
        strengths: parsed.strengths || [],
        areasForImprovement: parsed.areasForImprovement || [],
      };
    }
  } catch (err) {
    console.warn('[PerformanceScoring] AI scoring failed, using heuristic:', err);
  }

  // Fallback: heuristic scoring
  return generateHeuristicScorecard(userStatements, objections);
}

/**
 * Generate a heuristic scorecard when AI scoring is unavailable.
 */
function generateHeuristicScorecard(
  userStatements: string[],
  objections: ObjectionRecord[]
): PerformanceScorecard {
  const totalWords = userStatements.join(' ').split(/\s+/).length;
  const avgLength = totalWords / Math.max(userStatements.length, 1);

  // Persuasiveness: based on statement length and variety
  const persuasiveness = Math.min(85, 40 + Math.min(avgLength / 2, 30) + (userStatements.length > 5 ? 15 : 0));

  // Evidence usage: check for evidence-related keywords
  const evidenceKeywords = ['exhibit', 'evidence', 'document', 'testimony', 'record', 'fact'];
  const evidenceRefs = userStatements.filter(s =>
    evidenceKeywords.some(kw => s.toLowerCase().includes(kw))
  ).length;
  const evidenceUsage = Math.min(90, 30 + (evidenceRefs / Math.max(userStatements.length, 1)) * 60);

  // Objection handling
  const objectionsSustained = objections.filter(o => o.ruling === 'sustained').length;
  const objectionsOverruled = objections.filter(o => o.ruling === 'overruled').length;
  const objectionHandling = objections.length > 0
    ? Math.min(95, 50 + ((objectionsOverruled - objectionsSustained) / objections.length) * 45)
    : 70;

  // Legal accuracy: check for legal terminology
  const legalTerms = ['statute', 'precedent', 'ruling', 'objection', 'foundation', 'hearsay', 'relevance'];
  const legalRefs = userStatements.filter(s =>
    legalTerms.some(term => s.toLowerCase().includes(term))
  ).length;
  const legalAccuracy = Math.min(85, 35 + (legalRefs / Math.max(userStatements.length, 1)) * 50);

  const overallScore = (persuasiveness * 0.3 + evidenceUsage * 0.2 + objectionHandling * 0.25 + legalAccuracy * 0.25);

  return {
    persuasiveness: Math.round(persuasiveness),
    evidenceUsage: Math.round(evidenceUsage),
    objectionHandling: Math.round(objectionHandling),
    legalAccuracy: Math.round(legalAccuracy),
    overallScore: Math.round(overallScore),
    feedback: `Performance score: ${Math.round(overallScore)}/100. ${
      overallScore >= 70 ? 'Good performance overall.' : 'Consider focusing on evidence integration and legal precision.'
    }`,
    strengths: overallScore >= 60
      ? ['Consistent engagement', 'Active participation']
      : ['Willingness to participate'],
    areasForImprovement: [
      evidenceUsage < 60 ? 'Reference specific evidence more frequently' : null,
      legalAccuracy < 60 ? 'Strengthen legal reasoning and citations' : null,
      persuasiveness < 60 ? 'Develop more compelling arguments' : null,
    ].filter(Boolean) as string[],
  };
}

/**
 * Save session performance metrics to the database.
 */
export async function saveSessionMetrics(
  sessionId: string,
  userId: string,
  scorecard: PerformanceScorecard
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) {
    // Save to localStorage as fallback
    const key = `performance_${sessionId}`;
    localStorage.setItem(key, JSON.stringify(scorecard));
    return;
  }

  const metrics: Array<{
    session_id: string;
    user_id: string;
    metric_type: string;
    score: number;
    feedback: string | null;
    details: Record<string, unknown>;
  }> = [
    {
      session_id: sessionId,
      user_id: userId,
      metric_type: 'persuasiveness',
      score: scorecard.persuasiveness,
      feedback: null,
      details: {},
    },
    {
      session_id: sessionId,
      user_id: userId,
      metric_type: 'evidence_usage',
      score: scorecard.evidenceUsage,
      feedback: null,
      details: {},
    },
    {
      session_id: sessionId,
      user_id: userId,
      metric_type: 'objection_handling',
      score: scorecard.objectionHandling,
      feedback: null,
      details: {},
    },
    {
      session_id: sessionId,
      user_id: userId,
      metric_type: 'legal_accuracy',
      score: scorecard.legalAccuracy,
      feedback: null,
      details: {},
    },
    {
      session_id: sessionId,
      user_id: userId,
      metric_type: 'overall',
      score: scorecard.overallScore,
      feedback: scorecard.feedback,
      details: {
        strengths: scorecard.strengths,
        areasForImprovement: scorecard.areasForImprovement,
      },
    },
  ];

  try {
    await client.from('simulation_metrics').insert(metrics);
  } catch (err) {
    console.warn('[PerformanceScoring] Failed to save metrics:', err);
    // Fallback to localStorage
    const key = `performance_${sessionId}`;
    localStorage.setItem(key, JSON.stringify(scorecard));
  }
}

/**
 * Update the courtroom session with overall score.
 */
export async function updateSessionScore(
  sessionId: string,
  overallScore: number,
  feedback: string
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client
      .from('courtroom_sessions')
      .update({
        overall_score: overallScore,
        feedback,
        status: 'completed',
      })
      .eq('id', sessionId);
  } catch (err) {
    console.warn('[PerformanceScoring] Failed to update session score:', err);
  }
}

/**
 * Get the performance summary for a user.
 */
export async function getPerformanceSummary(userId: string): Promise<PerformanceSummaryData | null> {
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }

  try {
    const { data, error } = await client.rpc('get_performance_summary', {
      p_user_id: userId,
    });

    if (error || !data) {
      return null;
    }

    return {
      totalSessions: data.total_sessions || 0,
      totalDurationSeconds: data.total_duration_seconds || 0,
      averageScore: data.average_score || 0,
      sessionsByType: data.sessions_by_type || {},
      objectionStats: {
        totalRaised: data.objection_stats?.total_raised || 0,
        sustained: data.objection_stats?.sustained || 0,
        overruled: data.objection_stats?.overruled || 0,
      },
      recentScores: (data.recent_scores || []).map((s: any) => ({
        date: s.date,
        score: s.score,
        type: s.type,
      })),
    };
  } catch (err) {
    console.warn('[PerformanceScoring] Failed to get summary:', err);
    return null;
  }
}

/**
 * Record an objection in the database.
 */
export async function recordObjection(
  sessionId: string,
  objection: Omit<ObjectionRecord, 'id' | 'timestamp'>
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.from('objection_tracker').insert({
      session_id: sessionId,
      objection_type: objection.objectionType,
      raised_by: objection.raisedBy,
      ruling: objection.ruling,
      reasoning: objection.reasoning,
      legal_basis: objection.legalBasis,
      was_cured: objection.wasCured,
    });
  } catch (err) {
    console.warn('[PerformanceScoring] Failed to record objection:', err);
  }
}

/**
 * Save a transcript entry for a courtroom session.
 */
export async function saveTranscriptEntry(
  sessionId: string,
  speaker: string,
  content: string,
  analysis?: Record<string, unknown>
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.from('simulation_transcripts').insert({
      session_id: sessionId,
      speaker,
      content,
      analysis,
    });
  } catch (err) {
    console.warn('[PerformanceScoring] Failed to save transcript entry:', err);
  }
}

/**
 * Create a new courtroom session record.
 */
export async function createCourtroomSession(
  session: Omit<CourtroomSession, 'id' | 'createdAt'>
): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) {
    const localId = crypto.randomUUID();
    localStorage.setItem(`courtroom_session_${localId}`, JSON.stringify(session));
    return localId;
  }

  try {
    const { data, error } = await client
      .from('courtroom_sessions')
      .insert({
        case_id: session.caseId,
        user_id: session.userId,
        session_type: session.sessionType,
        difficulty: session.difficulty,
        ai_judge_model: session.aiJudgeModel,
        ai_opposing_counsel_model: session.aiOpposingCounselModel,
        ai_witness_model: session.aiWitnessModel,
        case_context: session.caseContext,
        status: session.status,
      })
      .select('id')
      .single();

    if (error) {
      console.warn('[PerformanceScoring] Failed to create session:', error);
      return null;
    }

    return data?.id || null;
  } catch (err) {
    console.warn('[PerformanceScoring] Failed to create session:', err);
    return null;
  }
}

// Utility
function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}
