import React from 'react';

export const StatPill: React.FC<{
  label: string;
  value: string | number;
  color: 'gold' | 'slate' | 'red';
  className?: string;
}> = ({ label, value, color, className = '' }) => {
  const textColor = { gold: 'text-gold-500', slate: 'text-slate-300', red: 'text-red-400' }[color];
  return (
    <div className={`text-center ${className}`}>
      <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
      <p className={`text-xl font-bold ${textColor}`}>{value}</p>
    </div>
  );
};

export const TranscriptBubble: React.FC<{
  label: string;
  text: string;
  color: 'blue' | 'emerald';
}> = ({ label, text, color }) => {
  const cls = {
    blue:    { label: 'text-blue-400',    text: 'text-blue-100' },
    emerald: { label: 'text-emerald-400', text: 'text-emerald-100' },
  }[color];

  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3">
      <p className={`text-[10px] uppercase tracking-widest font-bold mb-1 ${cls.label}`}>{label}</p>
      <p className={`text-sm min-h-[1.25rem] leading-relaxed ${cls.text}`}>{text}</p>
    </div>
  );
};

export const SettingRow: React.FC<{
  label: string;
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
}> = ({ label, options, value, onChange }) => (
  <div>
    <label className="block text-sm text-slate-400 mb-2">{label}</label>
    <div className="flex gap-2">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all ${
            value === opt
              ? 'bg-gold-500 text-slate-900'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);
