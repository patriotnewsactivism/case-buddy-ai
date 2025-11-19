import { useState, useEffect } from 'react';

interface TimerProps {
  onTimeUpdate?: (seconds: number) => void;
}

export const Timer = ({ onTimeUpdate }: TimerProps) => {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(s => {
          const newSeconds = s + 1;
          onTimeUpdate?.(newSeconds);
          return newSeconds;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, onTimeUpdate]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-slate-900/50 rounded-xl border border-slate-700">
      <span className="material-symbols-rounded text-blue-400 text-lg">timer</span>
      <div className="flex flex-col">
        <span className="text-[10px] text-slate-500 font-medium uppercase">Session Time</span>
        <span className="text-lg font-mono font-semibold text-white tabular-nums">
          {formatTime(seconds)}
        </span>
      </div>
      <button
        onClick={() => setIsRunning(!isRunning)}
        className="ml-2 p-1 hover:bg-slate-700 rounded transition-colors"
        title={isRunning ? 'Pause' : 'Resume'}
      >
        <span className="material-symbols-rounded text-slate-400 text-sm">
          {isRunning ? 'pause' : 'play_arrow'}
        </span>
      </button>
    </div>
  );
};
