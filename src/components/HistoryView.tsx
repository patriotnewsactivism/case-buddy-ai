import { useState } from 'react';
import { SavedSession } from '@/types';
import { getAllSessions, deleteSession, exportSessionAsJSON } from '@/utils/storage';

interface HistoryViewProps {
  onBack: () => void;
  onResumeSession: (session: SavedSession) => void;
}

export const HistoryView = ({ onBack, onResumeSession }: HistoryViewProps) => {
  const [sessions, setSessions] = useState<SavedSession[]>(getAllSessions());
  const [selectedSession, setSelectedSession] = useState<SavedSession | null>(null);

  const handleDelete = (sessionId: string) => {
    if (confirm('Delete this session? This cannot be undone.')) {
      deleteSession(sessionId);
      setSessions(getAllSessions());
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-rounded">arrow_back</span>
          </button>
          <div>
            <h1 className="text-3xl font-bold">Practice History</h1>
            <p className="text-slate-400 mt-1">{sessions.length} sessions recorded</p>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-16">
            <span className="material-symbols-rounded text-slate-600 text-6xl mb-4 block">history</span>
            <p className="text-slate-500 text-lg">No practice sessions yet</p>
            <p className="text-slate-600 text-sm mt-2">Start a new session to track your progress</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`bg-slate-800 border rounded-xl p-6 transition-all cursor-pointer ${
                    selectedSession?.id === session.id
                      ? 'border-blue-500 ring-2 ring-blue-500/20'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                  onClick={() => setSelectedSession(session)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {session.notebook.caseTitle || 'Untitled Session'}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-rounded text-xs">event</span>
                          {formatDate(session.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-rounded text-xs">timer</span>
                          {formatDuration(session.duration)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          exportSessionAsJSON(session);
                        }}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        title="Export"
                      >
                        <span className="material-symbols-rounded text-slate-400 text-lg">download</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(session.id);
                        }}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <span className="material-symbols-rounded text-red-400 text-lg">delete</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full">
                      {session.config.type}
                    </span>
                    <span className="px-3 py-1 bg-slate-700 text-slate-300 text-xs rounded-full">
                      {session.config.industry}
                    </span>
                    <span className="px-3 py-1 bg-slate-700 text-slate-300 text-xs rounded-full">
                      {session.config.difficulty}
                    </span>
                  </div>

                  {session.feedback && (
                    <div className="mt-4 pt-4 border-t border-slate-700">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="material-symbols-rounded text-yellow-500 text-lg">star</span>
                        <span className="font-semibold text-white">{session.feedback.overallScore}/100</span>
                        <span className="text-slate-400">Overall Score</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="lg:col-span-1">
              {selectedSession ? (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 sticky top-6">
                  <h3 className="text-lg font-semibold mb-4">Session Details</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm text-slate-400 mb-2">Case Timeline</h4>
                      <div className="space-y-2">
                        {selectedSession.notebook.caseTimeline.slice(0, 5).map((event, i) => (
                          <div key={i} className="text-sm text-slate-300 pl-3 border-l-2 border-blue-500">
                            {event}
                          </div>
                        ))}
                        {selectedSession.notebook.caseTimeline.length > 5 && (
                          <div className="text-xs text-slate-500 italic">
                            +{selectedSession.notebook.caseTimeline.length - 5} more events
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedSession.feedback && (
                      <div>
                        <h4 className="text-sm text-slate-400 mb-2">Performance Summary</h4>
                        <div className="bg-slate-900/50 rounded-lg p-3 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-300">Overall Score</span>
                            <span className="text-lg font-bold text-blue-400">
                              {selectedSession.feedback.overallScore}/100
                            </span>
                          </div>
                          <div className="text-xs text-slate-400">
                            {selectedSession.feedback.strengths.length} strengths, {selectedSession.feedback.improvements.length} areas for improvement
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => onResumeSession(selectedSession)}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-colors"
                    >
                      Resume Session
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 text-center">
                  <span className="material-symbols-rounded text-slate-600 text-4xl mb-2 block">touch_app</span>
                  <p className="text-slate-500 text-sm">Select a session to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
