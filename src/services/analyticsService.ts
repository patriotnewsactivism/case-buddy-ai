import { PerformanceSession, SessionMetrics, PerformanceTrend, PerformanceSummary } from "../types";

const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally', 'so', 'right', 'okay', 'well', 'i mean', 'kind of', 'sort of'];

const WEAK_PHRASES = ['i think', 'i guess', 'maybe', 'perhaps', 'possibly', 'might', 'somewhat', 'kind of', 'sort of', 'i feel like', 'it seems'];

export const analyzeTranscript = (transcript: string): {
  fillerWordCount: number;
  fillerWords: string[];
  weakPhrases: string[];
  wordCount: number;
  wordsPerMinute: number;
  pauseCount: number;
} => {
  const lowerTranscript = transcript.toLowerCase();
  const words = transcript.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const fillerWords: string[] = [];
  FILLER_WORDS.forEach(filler => {
    const regex = new RegExp(`\b${filler}\b`, 'gi');
    const matches = lowerTranscript.match(regex);
    if (matches) {
      fillerWords.push(...matches.map(m => filler));
    }
  });

  const weakPhrases: string[] = [];
  WEAK_PHRASES.forEach(phrase => {
    if (lowerTranscript.includes(phrase)) {
      weakPhrases.push(phrase);
    }
  });

  const pauseCount = (transcript.match(/\.\.\./g) || []).length + (transcript.match(/\[pause\]/gi) || []).length;

  return {
    fillerWordCount: fillerWords.length,
    fillerWords,
    weakPhrases,
    wordCount,
    wordsPerMinute: 0, // Calculated with duration
    pauseCount
  };
};

export const calculatePerformanceTrends = (sessions: PerformanceSession[]): PerformanceTrend[] => {
  const sorted = [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Group by week
  const weeklyData: Record<string, { scores: number[]; rhetorical: number[]; objectionSuccess: number[] }> = {};
  
  sorted.forEach(session => {
    const week = getWeekKey(new Date(session.date));
    if (!weeklyData[week]) {
      weeklyData[week] = { scores: [], rhetorical: [], objectionSuccess: [] };
    }
    weeklyData[week].scores.push(session.metrics.overallScore);
    weeklyData[week].rhetorical.push(session.metrics.rhetoricalScore);
    const success = session.metrics.objectionsReceived > 0 
      ? (session.metrics.objectionsSustained / session.metrics.objectionsReceived) * 100 
      : 50;
    weeklyData[week].objectionSuccess.push(success);
  });

  return Object.entries(weeklyData).map(([date, data]) => ({
    date,
    overallScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
    rhetoricalScore: data.rhetorical.reduce((a, b) => a + b, 0) / data.rhetorical.length,
    objectionSuccessRate: data.objectionSuccess.reduce((a, b) => a + b, 0) / data.objectionSuccess.length,
    sessionCount: data.scores.length
  }));
};

const getWeekKey = (date: Date): string => {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split('T')[0];
};

export const generatePerformanceSummary = (sessions: PerformanceSession[]): PerformanceSummary => {
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      totalDuration: 0,
      averageScore: 0,
      improvementRate: 0,
      strengths: [],
      weaknesses: [],
      recentTrend: [],
      topFillerWords: [],
      mostImproved: 'N/A',
      needsWork: 'N/A'
    };
  }

  const totalSessions = sessions.length;
  const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
  const averageScore = sessions.reduce((sum, s) => sum + s.metrics.overallScore, 0) / totalSessions;
  
  const trends = calculatePerformanceTrends(sessions);
  const improvementRate = trends.length >= 2 
    ? trends[trends.length - 1].overallScore - trends[0].overallScore 
    : 0;

  // Aggregate filler words
  const fillerCounts: Record<string, number> = {};
  sessions.forEach(s => {
    s.metrics.fillerWords.forEach(w => {
      fillerCounts[w] = (fillerCounts[w] || 0) + 1;
    });
  });
  const topFillerWords = Object.entries(fillerCounts)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Identify strengths and weaknesses
  const avgRhetorical = sessions.reduce((sum, s) => sum + s.metrics.rhetoricalScore, 0) / totalSessions;
  const avgLegal = sessions.reduce((sum, s) => sum + s.metrics.legalAccuracyScore, 0) / totalSessions;
  const objectionRate = sessions.reduce((sum, s) => {
    const total = s.metrics.objectionsReceived;
    return sum + (total > 0 ? s.metrics.objectionsSustained / total : 0);
  }, 0) / totalSessions;

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (avgRhetorical >= 70) strengths.push('Persuasive speaking');
  else weaknesses.push('Rhetorical effectiveness');

  if (avgLegal >= 70) strengths.push('Legal accuracy');
  else weaknesses.push('Legal knowledge application');

  if (objectionRate >= 0.7) strengths.push('Objection handling');
  else weaknesses.push('Objection response');

  if (sessions.reduce((sum, s) => sum + s.metrics.fillerWordCount, 0) / totalSessions < 5) {
    strengths.push('Clean speech');
  } else {
    weaknesses.push('Filler word usage');
  }

  return {
    totalSessions,
    totalDuration,
    averageScore,
    improvementRate,
    strengths,
    weaknesses,
    recentTrend: trends.slice(-4),
    topFillerWords,
    mostImproved: improvementRate > 10 ? 'Overall performance' : improvementRate > 5 ? 'Gradual improvement' : 'Consistent performance',
    needsWork: weaknesses[0] || 'Continue practicing'
  };
};

export const saveSession = (session: PerformanceSession): void => {
  const sessions = getSessions(session.caseId);
  sessions.push(session);
  localStorage.setItem(`sessions_${session.caseId}`, JSON.stringify(sessions));
};

export const getSessions = (caseId: string): PerformanceSession[] => {
  const saved = localStorage.getItem(`sessions_${caseId}`);
  return saved ? JSON.parse(saved) : [];
};

export default {
  analyzeTranscript,
  calculatePerformanceTrends,
  generatePerformanceSummary,
  saveSession,
  getSessions
};
