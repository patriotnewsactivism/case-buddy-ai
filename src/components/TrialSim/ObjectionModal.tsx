import React from 'react';
import { OBJECTION_RESPONSES } from '../../constants/voiceConstants';

interface ObjectionModalProps {
  grounds: string;
  explanation: string;
  onRespond: (response: string) => void;
  onDismiss: () => void;
}

const ObjectionModal: React.FC<ObjectionModalProps> = ({ grounds, explanation, onRespond, onDismiss }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
    role="dialog"
    aria-modal="true"
    aria-label="Objection"
  >
    <div className="bg-red-700 p-6 rounded-2xl text-center max-w-sm w-full shadow-2xl border border-red-500/50">
      <p className="text-4xl font-black text-white mb-1 tracking-tighter">OBJECTION!</p>
      <p className="text-xl text-red-100 font-bold mb-2">{grounds}</p>
      <p className="text-sm text-white/80 mb-6">{explanation}</p>
      <div className="space-y-2">
        {OBJECTION_RESPONSES.map(({ label, text }) => (
          <button
            key={label}
            onClick={() => onRespond(text)}
            className="w-full py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition-all text-sm"
          >
            {label}
          </button>
        ))}
        <button
          onClick={onDismiss}
          className="w-full pt-2 pb-1 text-white/50 hover:text-white/80 text-sm transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  </div>
);

export default ObjectionModal;
