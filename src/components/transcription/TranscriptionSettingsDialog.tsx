import React, { useState, useEffect } from 'react';
import { X, Save, Shield, Cpu, Cloud, HardDrive, Settings2, BookOpen, Plus } from 'lucide-react';
import { TranscriptionProvider, TranscriptionSettings } from '../../types';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TranscriptionSettings;
  onSave: (settings: TranscriptionSettings) => void;
}

const TranscriptionSettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [localSettings, setLocalSettings] = React.useState<TranscriptionSettings>(settings);
  const [newVocabWord, setNewVocabWord] = useState('');

  useEffect(() => { setLocalSettings(settings); }, [settings, isOpen]);
  if (!isOpen) return null;

  const handleSave = () => { onSave({ ...localSettings, openaiKey: localSettings.openaiKey.trim(), assemblyAiKey: localSettings.assemblyAiKey.trim(), googleClientId: localSettings.googleClientId.trim(), googleApiKey: localSettings.googleApiKey.trim() }); onClose(); };
  const addVocabulary = () => { if (!newVocabWord.trim() || localSettings.customVocabulary.includes(newVocabWord.trim())) return; setLocalSettings(prev => ({ ...prev, customVocabulary: [...prev.customVocabulary, newVocabWord.trim()] })); setNewVocabWord(''); };
  const removeVocabulary = (word: string) => setLocalSettings(prev => ({ ...prev, customVocabulary: prev.customVocabulary.filter(w => w !== word) }));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-slate-900/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><Settings2 size={20} className="text-slate-400" />Transcription Settings</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
        </div>
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">General Preferences</h3>
            <div className="flex items-start gap-3 p-4 bg-gold-500/10 border border-gold-500/20 rounded-xl">
              <Shield className="text-gold-400 shrink-0 mt-1" size={20} />
              <div className="flex-1">
                <label className="flex items-center justify-between cursor-pointer"><span className="font-semibold text-gold-100">Legal Grade Mode</span><input type="checkbox" className="sr-only" checked={localSettings.legalMode} onChange={(e) => setLocalSettings({ ...localSettings, legalMode: e.target.checked })} /><div className={`w-12 h-6 rounded-full border border-slate-600 ${localSettings.legalMode ? 'bg-gold-500' : 'bg-slate-700'}`}><div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${localSettings.legalMode ? 'translate-x-6' : 'translate-x-0.5'} mt-0.5`} /></div></label>
                <p className="text-xs text-gold-300/80 mt-1">Verbatim transcription, speaker labels, timestamps.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-slate-800/30 border border-slate-700 rounded-xl">
              <Cloud className="text-slate-400 shrink-0 mt-1" size={20} />
              <div className="flex-1">
                <label className="flex items-center justify-between cursor-pointer"><span className="font-semibold text-slate-200">Auto-Download Audio</span><input type="checkbox" className="sr-only" checked={localSettings.autoDownloadAudio} onChange={(e) => setLocalSettings({ ...localSettings, autoDownloadAudio: e.target.checked })} /><div className={`w-12 h-6 rounded-full border border-slate-600 ${localSettings.autoDownloadAudio ? 'bg-gold-500' : 'bg-slate-700'}`}><div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${localSettings.autoDownloadAudio ? 'translate-x-6' : 'translate-x-0.5'} mt-0.5`} /></div></label>
              </div>
            </div>
          </div>
          <hr className="border-slate-700" />
          <div className="space-y-4">
            <div className="flex items-center gap-2"><BookOpen size={18} className="text-amber-500" /><h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Vocabulary</h3></div>
            <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700">
              <p className="text-sm text-slate-400 mb-3">Add words/phrases for AI to prioritize in transcriptions.</p>
              <div className="flex gap-2 mb-3">
                <input type="text" value={newVocabWord} onChange={(e) => setNewVocabWord(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addVocabulary()} placeholder="Add vocabulary..." className="flex-1 bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold-500" />
                <button onClick={addVocabulary} className="bg-gold-500 hover:bg-gold-600 text-slate-900 p-2 rounded-lg"><Plus size={18} /></button>
              </div>
              <div className="flex flex-wrap gap-2">{localSettings.customVocabulary.map((word, idx) => (<div key={idx} className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-200 px-3 py-1 rounded-full text-xs">{word}<button onClick={() => removeVocabulary(word)}><X size={12} /></button></div>))}</div>
            </div>
          </div>
          <hr className="border-slate-700" />
          <div className="space-y-4">
            <div className="flex items-center gap-2"><HardDrive size={18} className="text-blue-500" /><h3 className="text-sm font-bold text-white uppercase tracking-wider">Google Drive</h3></div>
            <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700 space-y-3">
              <label className="flex items-center justify-between cursor-pointer"><span className="text-sm font-medium text-slate-300">Auto-Upload to Drive</span><input type="checkbox" className="sr-only" checked={localSettings.autoDriveUpload} onChange={(e) => setLocalSettings({ ...localSettings, autoDriveUpload: e.target.checked })} /><div className={`w-10 h-5 rounded-full border border-slate-600 ${localSettings.autoDriveUpload ? 'bg-blue-500' : 'bg-slate-700'}`}><div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform ${localSettings.autoDriveUpload ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`} /></div></label>
              <input type="password" value={localSettings.googleClientId || ''} onChange={(e) => setLocalSettings({ ...localSettings, googleClientId: e.target.value })} placeholder="OAuth Client ID" className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold-500" />
              <input type="password" value={localSettings.googleApiKey || ''} onChange={(e) => setLocalSettings({ ...localSettings, googleApiKey: e.target.value })} placeholder="Google Cloud API Key" className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold-500" />
            </div>
          </div>
          <hr className="border-slate-700" />
          <div className="space-y-4">
            <div className="flex items-center gap-2"><Cpu size={18} className="text-gold-500" /><h3 className="text-sm font-bold text-white uppercase tracking-wider">Engine</h3></div>
            <div className="grid grid-cols-3 gap-2">
              {[TranscriptionProvider.GEMINI, TranscriptionProvider.OPENAI, TranscriptionProvider.ASSEMBLYAI].map((p) => (<button key={p} onClick={() => setLocalSettings({ ...localSettings, provider: p })} className={`py-2 px-3 rounded-lg text-sm font-medium transition-all border ${localSettings.provider === p ? 'bg-gold-500 text-slate-900 border-gold-500' : 'bg-slate-700/50 text-slate-400 border-slate-600 hover:bg-slate-700'}`}>{p}</button>))}
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-slate-700"><button onClick={handleSave} className="w-full flex items-center justify-center gap-2 py-2.5 bg-gold-500 text-slate-900 font-semibold rounded-lg hover:bg-gold-600 transition-colors"><Save size={18} />Save Configuration</button></div>
      </div>
    </div>
  );
};

export default TranscriptionSettingsDialog;
