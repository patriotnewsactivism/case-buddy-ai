
import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../App';
import { TrialSession } from '../types';
import { loadTrialSessions, getSessionsByCaseId } from '../utils/storage';
import { Play, Pause, SkipBack, Download, Trash2, Clock, Award, AlertTriangle, MessageSquare, TrendingUp, Calendar, Filter, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const SessionHistory = () => {
  const { cases, activeCase } = useContext(AppContext);
  const [sessions, setSessions] = useState<TrialSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<TrialSession | null>(null);
  const [filterCaseId, setFilterCaseId] = useState<string>('all');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = () => {
    const allSessions = loadTrialSessions();
    setSessions(allSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const filteredSessions = filterCaseId === 'all'
    ? sessions
    : sessions.filter(s => s.caseId === filterCaseId);

  const deleteSession = (sessionId: string) => {
    if (window.confirm('Delete this session? This cannot be undone.')) {
      const updated = sessions.filter(s => s.id !== sessionId);
      setSessions(updated);
      localStorage.setItem('lexsim_trial_sessions', JSON.stringify(updated));
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
      }
    }
  };

  const playAudio = (session: TrialSession) => {
    if (!session.audioUrl) return;

    if (audioElement) {
      audioElement.pause();
      setAudioElement(null);
      setIsPlaying(false);
    }

    const audio = new Audio(session.audioUrl);
    audio.play();
    setAudioElement(audio);
    setIsPlaying(true);

    audio.onended = () => {
      setIsPlaying(false);
      setAudioElement(null);
    };
  };

  const pauseAudio = () => {
    if (audioElement) {
      audioElement.pause();
      setIsPlaying(false);
    }
  };

  const downloadTranscript = (session: TrialSession) => {
    const transcript = session.transcript
      .map(m => `[${m.sender.toUpperCase()}]: ${m.text}`)
      .join('\n\n');

    const content = `
LexSim Trial Session Transcript
================================

Case: ${session.caseTitle}
Phase: ${session.phase}
Mode: ${session.mode}
Date: ${new Date(session.date).toLocaleString()}
Duration: ${Math.floor(session.duration / 60)}m ${session.duration % 60}s
Score: ${session.score}/100

Metrics:
--------
- Objections Received: ${session.metrics?.objectionsReceived || 0}
- Fallacies Committed: ${session.metrics?.fallaciesCommitted || 0}
- Avg Rhetorical Score: ${session.metrics?.avgRhetoricalScore || 0}/100
- Word Count: ${session.metrics?.wordCount || 0}
- Filler Words: ${session.metrics?.fillerWordsCount || 0}

Feedback:
---------
${session.feedback}

Transcript:
-----------
${transcript}
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-${session.id}-transcript.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score: number = 0) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number = 0) => {
    if (score >= 80) return 'bg-green-900/30 border-green-700';
    if (score >= 60) return 'bg-yellow-900/30 border-yellow-700';
    return 'bg-red-900/30 border-red-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white font-serif">Session History</h1>
          <p className="text-slate-400 mt-2 text-sm sm:text-base">Review your past trial simulation sessions and track improvement</p>
        </div>
        <Link
          to="/app/practice"
          className="bg-gold-500 hover:bg-gold-600 text-slate-900 font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
        >
          New Session
        </Link>
      </div>

      {/* Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Filter className="text-slate-400" size={20} />
        <select
          value={filterCaseId}
          onChange={(e) => setFilterCaseId(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
        >
          <option value="all">All Cases</option>
          {cases.map(c => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
        <span className="text-slate-400 text-sm">{filteredSessions.length} sessions</span>
      </div>

      {filteredSessions.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
          <MessageSquare className="mx-auto text-slate-600 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-white mb-2">No Sessions Yet</h3>
          <p className="text-slate-400 mb-6">Start a Trial Simulator session to begin tracking your progress</p>
          <Link
            to="/app/practice"
            className="inline-block bg-gold-500 hover:bg-gold-600 text-slate-900 font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Start Practice Session
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sessions List */}
          <div className="lg:col-span-1 space-y-3 max-h-[400px] sm:max-h-[600px] overflow-y-auto pr-2">
            {filteredSessions.map(session => (
              <button
                key={session.id}
                onClick={() => setSelectedSession(session)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  selectedSession?.id === session.id
                    ? 'bg-gold-500/10 border-gold-500'
                    : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-sm leading-tight mb-1">{session.caseTitle}</h3>
                    <p className="text-xs text-slate-400 capitalize">{session.phase.replace(/-/g, ' ')}</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-bold ${getScoreBg(session.score)}`}>
                    {session.score || 0}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(session.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    {Math.floor(session.duration / 60)}m
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Session Details */}
          <div className="lg:col-span-2">
            {selectedSession ? (
              <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                {/* Header */}
                <div className="bg-slate-900 border-b border-slate-700 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">{selectedSession.caseTitle}</h2>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span className="capitalize">{selectedSession.phase.replace(/-/g, ' ')}</span>
                        <span>•</span>
                        <span className="capitalize">{selectedSession.mode} Mode</span>
                        <span>•</span>
                        <span>{new Date(selectedSession.date).toLocaleString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedSession(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  {/* Score */}
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${getScoreBg(selectedSession.score)}`}>
                    <Award className={getScoreColor(selectedSession.score)} size={20} />
                    <span className="text-white font-bold">Score: {selectedSession.score || 0}/100</span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 md:p-6 bg-slate-900/50">
                  <div className="text-center">
                    <p className="text-xl md:text-2xl font-bold text-white">{selectedSession.metrics?.objectionsReceived || 0}</p>
                    <p className="text-xs text-slate-400 mt-1">Objections</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl md:text-2xl font-bold text-white">{selectedSession.metrics?.fallaciesCommitted || 0}</p>
                    <p className="text-xs text-slate-400 mt-1">Fallacies</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl md:text-2xl font-bold text-white">{selectedSession.metrics?.avgRhetoricalScore || 0}</p>
                    <p className="text-xs text-slate-400 mt-1">Rhetoric Score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl md:text-2xl font-bold text-white">{selectedSession.metrics?.wordCount || 0}</p>
                    <p className="text-xs text-slate-400 mt-1">Words Spoken</p>
                  </div>
                </div>

                {/* Feedback */}
                <div className="p-6 border-b border-slate-700">
                  <h3 className="text-sm font-bold text-gold-500 uppercase mb-2 flex items-center gap-2">
                    <TrendingUp size={16} />
                    Feedback
                  </h3>
                  <p className="text-slate-300">{selectedSession.feedback}</p>
                </div>

                {/* Audio Player */}
                {selectedSession.audioUrl && (
                  <div className="p-6 border-b border-slate-700 bg-slate-900/30">
                    <h3 className="text-sm font-bold text-gold-500 uppercase mb-3">Audio Recording</h3>
                    <div className="flex items-center gap-3">
                      {!isPlaying ? (
                        <button
                          onClick={() => playAudio(selectedSession)}
                          className="flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-slate-900 font-semibold rounded-lg transition-colors"
                        >
                          <Play size={18} />
                          Play Recording
                        </button>
                      ) : (
                        <button
                          onClick={pauseAudio}
                          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
                        >
                          <Pause size={18} />
                          Pause
                        </button>
                      )}
                      <span className="text-sm text-slate-400">
                        Duration: {Math.floor(selectedSession.duration / 60)}m {selectedSession.duration % 60}s
                      </span>
                    </div>
                  </div>
                )}

                {/* Transcript */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gold-500 uppercase flex items-center gap-2">
                      <MessageSquare size={16} />
                      Transcript ({selectedSession.transcript.length} exchanges)
                    </h3>
                    <button
                      onClick={() => downloadTranscript(selectedSession)}
                      className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      <Download size={16} />
                      Download
                    </button>
                  </div>
                  <div className="space-y-3 max-h-64 sm:max-h-96 overflow-y-auto pr-2">
                    {selectedSession.transcript.map(msg => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-lg ${
                          msg.sender === 'user'
                            ? 'bg-blue-900/20 border border-blue-800/30'
                            : 'bg-red-900/20 border border-red-800/30'
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">
                          {msg.sender === 'user' ? 'You' : 'Opponent'}
                        </div>
                        <p className="text-sm text-slate-200">{msg.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="p-6 bg-slate-900/50 border-t border-slate-700 flex gap-3">
                  <button
                    onClick={() => downloadTranscript(selectedSession)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                  >
                    <Download size={18} />
                    Export Transcript
                  </button>
                  <button
                    onClick={() => deleteSession(selectedSession.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-900/20 hover:bg-red-900/30 border border-red-700 text-red-400 font-medium rounded-lg transition-colors ml-auto"
                  >
                    <Trash2 size={18} />
                    Delete Session
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center h-full flex items-center justify-center">
                <div>
                  <MessageSquare className="mx-auto text-slate-600 mb-4" size={48} />
                  <p className="text-slate-400">Select a session to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionHistory;
