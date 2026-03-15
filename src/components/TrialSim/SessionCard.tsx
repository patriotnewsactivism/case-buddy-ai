import React from 'react';
import { Download, FileText, Pause, Play, Trash2 } from 'lucide-react';
import { TrialSession } from '../../types';

interface IconButtonProps {
  onClick: () => void;
  title: string;
  colorClass: string;
  children: React.ReactNode;
}

const IconButton: React.FC<IconButtonProps> = ({ onClick, title, colorClass, children }) => (
  <button
    onClick={onClick}
    title={title}
    className={`p-2 rounded-lg transition-opacity hover:opacity-80 active:scale-95 ${colorClass}`}
  >
    {children}
  </button>
);

interface SessionCardProps {
  session: TrialSession;
  isPlaying: boolean;
  onPlay: () => void;
  onDownload: () => void;
  onExport: () => void;
  onDelete: () => void;
}

const SessionCard: React.FC<SessionCardProps> = ({ session: s, isPlaying, onPlay, onDownload, onExport, onDelete }) => (
  <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="font-semibold text-white capitalize">{s.phase.replace(/-/g, ' ')}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          {new Date(s.date).toLocaleDateString()} · {Math.floor(s.duration / 60)}m {s.duration % 60}s · {s.mode}
        </p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="text-xs font-semibold text-gold-400">Score: {s.score}%</span>
          {s.metrics && (
            <>
              <span className="text-slate-600 text-xs">·</span>
              <span className="text-xs text-slate-500">
                {s.metrics.objectionsReceived ?? 0} objections
              </span>
              <span className="text-slate-600 text-xs">·</span>
              <span className="text-xs text-slate-500">
                {s.metrics.wordCount ?? 0} words
              </span>
            </>
          )}
        </div>
      </div>
      <div className="flex gap-1 shrink-0">
        {s.audioUrl && (
          <IconButton onClick={onPlay} title={isPlaying ? 'Pause audio' : 'Play audio'} colorClass="bg-gold-500 text-slate-900">
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </IconButton>
        )}
        <IconButton onClick={onDownload} title="Download audio" colorClass="bg-slate-700 text-slate-300 hover:text-white">
          <Download size={16} />
        </IconButton>
        <IconButton onClick={onExport} title="Export transcript" colorClass="bg-slate-700 text-blue-400 hover:text-blue-300">
          <FileText size={16} />
        </IconButton>
        <IconButton onClick={onDelete} title="Delete session" colorClass="bg-slate-700 text-red-400 hover:text-red-300">
          <Trash2 size={16} />
        </IconButton>
      </div>
    </div>
    {(s.transcript ?? []).length > 0 && (
      <div className="mt-3 pt-3 border-t border-slate-700">
        <p className="text-xs text-slate-500 line-clamp-2">
          {s.transcript!.slice(0, 2).map(m =>
            `${m.sender === 'user' ? 'You' : 'Opp'}: ${m.text.slice(0, 60)}`
          ).join(' · ')}
        </p>
      </div>
    )}
  </div>
);

export default SessionCard;
