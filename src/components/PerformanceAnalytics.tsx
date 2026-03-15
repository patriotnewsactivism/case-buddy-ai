import React, { useState, useContext, useEffect, useMemo } from 'react';
import { AppContext } from '../App';
import { PerformanceSession, PerformanceTrend, PerformanceSummary, SessionMetrics, TrialSession } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, Target, Award, AlertTriangle, Clock, Mic, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const PerformanceAnalytics = () => {
  const { activeCase } = useContext(AppContext);
  const [sessions, setSessions] = useState<PerformanceSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<PerformanceSession | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');

  useEffect(() => {
    if (activeCase) {
      // 1. Load from trial_sessions (The source of truth for live sessions)
      const trialSessionsRaw = localStorage.getItem(`trial_sessions_${activeCase.id}`);
      const trialSessions: TrialSession[] = trialSessionsRaw ? JSON.parse(trialSessionsRaw) : [];

      // 2. Load from performance (Historical/manual analytics)
      const performanceRaw = localStorage.getItem(`performance_${activeCase.id}`);
      const perfSessions: PerformanceSession[] = performanceRaw ? JSON.parse(performanceRaw) : [];

      // 3. Map TrialSessions to PerformanceSessions
      const mappedTrialSessions: PerformanceSession[] = trialSessions.map(ts => ({
        id: ts.id,
        caseId: ts.caseId,
        date: ts.date,
        phase: ts.phase as any,
        mode: ts.mode as any,
        duration: ts.duration / 60, // Convert to minutes
        transcript: ts.transcript.map(m => `${m.sender}: ${m.text}`).join('\n'),
        audioUrl: ts.audioUrl,
        metrics: {
          objectionsReceived: ts.metrics?.objectionsReceived || 0,
          objectionsSustained: 0, // Not currently tracked in live sessions
          objectionsOverruled: 0, // Not currently tracked in live sessions
          rhetoricalScore: ts.metrics?.avgRhetoricalScore || ts.score || 50,
          legalAccuracyScore: ts.score || 50,
          overallScore: ts.score || 50,
          fillerWordCount: ts.metrics?.fillerWordsCount || 0,
          fillerWords: [],
          weakPhrases: [],
          wordsPerMinute: ts.metrics?.wordCount ? Math.round(ts.metrics.wordCount / (ts.duration / 60 || 1)) : 0,
          pauseCount: 0,
          averagePauseLength: 0
        }
      }));

      // Combine and sort by date descending
      const combined = [...mappedTrialSessions, ...perfSessions].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setSessions(combined);
    }
  }, [activeCase]);

  const generateMockSessions = () => {
    if (!activeCase) return;
    const phases = ['opening-statement', 'direct-examination', 'cross-examination', 'closing-argument'];
    const mockSessions: PerformanceSession[] = [];
    
    for (let i = 0; i < 10; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i * 3);
      
      mockSessions.push({
        id: `mock-${i}-${Date.now()}`,
        caseId: activeCase.id,
        date: date.toISOString(),
        phase: phases[Math.floor(Math.random() * phases.length)] as any,
        mode: ['learn', 'practice', 'trial'][Math.floor(Math.random() * 3)] as any,
        duration: Math.floor(Math.random() * 30 + 10),
        metrics: {
          objectionsReceived: Math.floor(Math.random() * 15),
          objectionsSustained: Math.floor(Math.random() * 8),
          objectionsOverruled: Math.floor(Math.random() * 7),
          rhetoricalScore: Math.floor(Math.random() * 40 + 60),
          legalAccuracyScore: Math.floor(Math.random() * 30 + 70),
          overallScore: Math.floor(Math.random() * 35 + 65),
          fillerWordCount: Math.floor(Math.random() * 20 + 5),
          fillerWords: ['um', 'uh', 'like', 'you know'].slice(0, Math.floor(Math.random() * 3) + 1),
          weakPhrases: ['I think', 'maybe', 'sort of'].slice(0, Math.floor(Math.random() * 2) + 1),
          wordsPerMinute: Math.floor(Math.random() * 50 + 120),
          pauseCount: Math.floor(Math.random() * 15 + 5),
          averagePauseLength: Math.random() * 2 + 0.5
        },
        transcript: 'Mock transcript...'
      });
    }
    
    setSessions(prev => [...mockSessions, ...prev]);
    localStorage.setItem(`performance_${activeCase.id}`, JSON.stringify(mockSessions));
  };

  const getSummary = (): PerformanceSummary => {
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
        mostImproved: '',
        needsWork: ''
      };
    }

    const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
    const averageScore = sessions.reduce((sum, s) => sum + (s.metrics?.overallScore || 0), 0) / sessions.length;
    
    const recentSessions = sessions.slice(0, 5);
    const olderSessions = sessions.slice(5, 10);
    const recentAvg = recentSessions.reduce((sum, s) => sum + (s.metrics?.overallScore || 0), 0) / recentSessions.length;
    const olderAvg = olderSessions.length > 0 
      ? olderSessions.reduce((sum, s) => sum + (s.metrics?.overallScore || 0), 0) / olderSessions.length 
      : recentAvg;
    const improvementRate = ((recentAvg - olderAvg) / olderAvg) * 100;

    const trend: PerformanceTrend[] = sessions.slice(0, 7).reverse().map(s => ({
      date: new Date(s.date).toLocaleDateString(),
      overallScore: s.metrics?.overallScore || 0,
      rhetoricalScore: s.metrics?.rhetoricalScore || 0,
      objectionSuccessRate: s.metrics 
        ? Math.round((s.metrics.objectionsOverruled / Math.max(s.metrics.objectionsReceived, 1)) * 100)
        : 0,
      sessionCount: 1
    }));

    const fillerWordCounts: Record<string, number> = {};
    sessions.forEach(s => {
      s.metrics?.fillerWords?.forEach(w => {
        fillerWordCounts[w] = (fillerWordCounts[w] || 0) + 1;
      });
    });
    const topFillerWords = Object.entries(fillerWordCounts)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const avgObjectionSuccess = sessions.reduce((sum, s) => {
      const rate = s.metrics ? (s.metrics.objectionsOverruled / Math.max(s.metrics.objectionsReceived, 1)) : 0;
      return sum + rate;
    }, 0) / sessions.length;

    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (averageScore >= 75) strengths.push('Strong overall performance');
    else weaknesses.push('Overall performance needs improvement');

    if (avgObjectionSuccess >= 0.5) strengths.push('Good at handling objections');
    else weaknesses.push('Objection handling needs work');

    if (topFillerWords.length < 3) strengths.push('Minimal filler words');
    else weaknesses.push('Reduce filler word usage');

    return {
      totalSessions: sessions.length,
      totalDuration,
      averageScore: Math.round(averageScore),
      improvementRate: Math.round(improvementRate),
      strengths,
      weaknesses,
      recentTrend: trend,
      topFillerWords,
      mostImproved: improvementRate > 5 ? 'Overall performance trending up' : 'Consistent performance',
      needsWork: topFillerWords[0]?.word ? `Reduce "${topFillerWords[0].word}" usage` : 'Continue practicing'
    };
  };

  const getRadarData = (metrics: SessionMetrics) => [
    { subject: 'Rhetorical', value: metrics.rhetoricalScore },
    { subject: 'Legal Accuracy', value: metrics.legalAccuracyScore },
    { subject: 'Pacing', value: Math.min(100, Math.max(0, 150 - Math.abs(metrics.wordsPerMinute - 150))) },
    { subject: 'Objection Handling', value: Math.round((metrics.objectionsOverruled / Math.max(metrics.objectionsReceived, 1)) * 100) },
    { subject: 'Clarity', value: Math.max(0, 100 - metrics.fillerWordCount * 3) }
  ];

  const summary = getSummary();

  if (!activeCase) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-slate-500">
        <Target className="mb-4 opacity-50" size={48} />
        <p className="text-lg font-semibold">No Active Case Selected</p>
        <p className="text-sm mt-2 max-w-md text-center leading-relaxed mb-6">
          Select a case to view performance analytics.
        </p>
        <Link to="/app/cases" className="bg-gold-600 hover:bg-gold-500 text-slate-900 font-bold px-6 py-3 rounded-lg transition-colors">
          Go to Case Files
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-white">Performance Analytics</h1>
          <p className="text-slate-400 mt-1">Track your trial preparation progress</p>
        </div>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="all">All Time</option>
          </select>
          <button
            onClick={generateMockSessions}
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg"
          >
            Generate Demo Data
          </button>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h3 className="text-white font-semibold">Tracking for: {activeCase.title}</h3>
        <p className="text-sm text-slate-400">{sessions.length} practice sessions recorded</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gold-900/30 rounded-lg">
              <Award className="text-gold-500" size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Average Score</p>
              <p className="text-2xl font-bold text-white">{summary.averageScore}%</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${summary.improvementRate >= 0 ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
              {summary.improvementRate >= 0 ? (
                <TrendingUp className="text-green-500" size={24} />
              ) : (
                <TrendingDown className="text-red-500" size={24} />
              )}
            </div>
            <div>
              <p className="text-slate-400 text-sm">Improvement</p>
              <p className="text-2xl font-bold text-white">{summary.improvementRate > 0 ? '+' : ''}{summary.improvementRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-900/30 rounded-lg">
              <Mic className="text-blue-500" size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Sessions</p>
              <p className="text-2xl font-bold text-white">{summary.totalSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-900/30 rounded-lg">
              <Clock className="text-purple-500" size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Practice Time</p>
              <p className="text-2xl font-bold text-white">{summary.totalDuration}m</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Performance Trend</h3>
          {summary.recentTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={summary.recentTrend}>
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} />
                <Line type="monotone" dataKey="overallScore" stroke="#d4af37" strokeWidth={2} dot={{ fill: '#d4af37' }} />
                <Line type="monotone" dataKey="rhetoricalScore" stroke="#60a5fa" strokeWidth={2} dot={{ fill: '#60a5fa' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-500">
              No data available
            </div>
          )}
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Session Breakdown</h3>
          {sessions.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={sessions.slice(0, 7).reverse()}>
                <XAxis dataKey={(d) => d.phase.split('-')[0]} stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} />
                <Bar dataKey={(d) => d.metrics?.overallScore} fill="#d4af37" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-500">
              No data available
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="text-green-500" size={20} />
            Strengths
          </h3>
          {summary.strengths.length > 0 ? (
            <ul className="space-y-2">
              {summary.strengths.map((s, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                  <Award className="text-green-500" size={14} />
                  {s}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 text-sm">Complete more sessions to identify strengths</p>
          )}
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="text-orange-500" size={20} />
            Areas for Improvement
          </h3>
          {summary.weaknesses.length > 0 ? (
            <ul className="space-y-2">
              {summary.weaknesses.map((w, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                  <Target className="text-orange-500" size={14} />
                  {w}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 text-sm">Complete more sessions to identify areas for improvement</p>
          )}
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Top Filler Words</h3>
          {summary.topFillerWords.length > 0 ? (
            <div className="space-y-2">
              {summary.topFillerWords.map((fw, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">"{fw.word}"</span>
                  <span className="text-sm text-slate-500">{fw.count} times</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No filler words detected - great job!</p>
          )}
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Sessions</h3>
        <div className="space-y-3">
          {sessions.slice(0, 5).map(session => (
            <div
              key={session.id}
              onClick={() => setSelectedSession(selectedSession?.id === session.id ? null : session)}
              className={`bg-slate-900/50 border rounded-lg p-4 cursor-pointer transition-all ${
                selectedSession?.id === session.id ? 'border-gold-500' : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-white capitalize">{session.phase.replace('-', ' ')}</span>
                  <span className="text-slate-500 mx-2">•</span>
                  <span className="text-sm text-slate-400">{session.mode} mode</span>
                  <span className="text-slate-500 mx-2">•</span>
                  <span className="text-sm text-slate-400">{session.duration} min</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-400">{new Date(session.date).toLocaleDateString()}</span>
                  <span className={`text-lg font-bold ${
                    (session.metrics?.overallScore || 0) >= 80 ? 'text-green-500' :
                    (session.metrics?.overallScore || 0) >= 60 ? 'text-gold-500' : 'text-red-500'
                  }`}>
                    {session.metrics?.overallScore}%
                  </span>
                </div>
              </div>
              
              {selectedSession?.id === session.id && session.metrics && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Objections Received</p>
                      <p className="text-white font-medium">{session.metrics.objectionsReceived}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Sustained/Overruled</p>
                      <p className="text-white font-medium">{session.metrics.objectionsSustained}/{session.metrics.objectionsOverruled}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Words/Min</p>
                      <p className="text-white font-medium">{session.metrics.wordsPerMinute}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Filler Words</p>
                      <p className="text-white font-medium">{session.metrics.fillerWordCount}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PerformanceAnalytics;