import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../App';
import { Settings as SettingsIcon, Key, Database, Download, Upload, AlertCircle, Check, User, Moon, Sun, Palette, Shield, Info, Trash2, CheckCircle, Cloud, Loader2, ClosedCaption, Volume2, Play, FileText, Zap, DollarSign } from 'lucide-react';
import { exportAllData, importAllData, clearAllData, getStorageInfo, savePreferences, loadPreferences } from '../utils/storage';
import { getSupabaseClient } from '../services/supabaseClient';
import { supabaseReady } from '../services/dataService';
import { testAudioPlayback } from '../services/elevenLabsService';
import { browserTTS, getPreferredVoice } from '../services/browserTTSService';
import { toast } from 'react-toastify';
import { 
  getOCRProviderInfo, 
  getAvailableOCRProviders, 
  configureOCRProvider,
  detectDocumentCategoryFromName,
  getDocumentRecommendations,
  estimateOCRCost
} from '../services/ocrService';
import type { OCRProvider, LegalDocumentCategory } from '../types';

interface CaptionSettings {
  enabled: boolean;
  fontSize: 'small' | 'medium' | 'large';
  position: 'bottom' | 'top' | 'center';
  showSpeakerLabel: boolean;
  backgroundColor: string;
}

interface AudioSettings {
  preferElevenLabs: boolean;
  volume: number;
  defaultVoice: string;
}

const CAPTION_STORAGE_KEY = 'captionSettings';
const AUDIO_STORAGE_KEY = 'audioSettings';

const DEFAULT_CAPTION_SETTINGS: CaptionSettings = {
  enabled: true,
  fontSize: 'medium',
  position: 'bottom',
  showSpeakerLabel: true,
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
};

const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  preferElevenLabs: false,
  volume: 80,
  defaultVoice: '',
};

const CAPTION_BG_COLORS = [
  { label: 'Black (80%)', value: 'rgba(0, 0, 0, 0.8)' },
  { label: 'Black (60%)', value: 'rgba(0, 0, 0, 0.6)' },
  { label: 'Black (100%)', value: 'rgba(0, 0, 0, 1)' },
  { label: 'Slate (80%)', value: 'rgba(30, 41, 59, 0.8)' },
  { label: 'Slate (60%)', value: 'rgba(30, 41, 59, 0.6)' },
  { label: 'Gold (80%)', value: 'rgba(212, 175, 55, 0.8)' },
  { label: 'White (80%)', value: 'rgba(255, 255, 255, 0.8)' },
];

const loadCaptionSettings = (): CaptionSettings => {
  try {
    const stored = localStorage.getItem(CAPTION_STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_CAPTION_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.warn('Failed to load caption settings:', e);
  }
  return DEFAULT_CAPTION_SETTINGS;
};

const saveCaptionSettings = (settings: CaptionSettings): void => {
  try {
    localStorage.setItem(CAPTION_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save caption settings:', e);
  }
};

const loadAudioSettings = (): AudioSettings => {
  try {
    const stored = localStorage.getItem(AUDIO_STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_AUDIO_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.warn('Failed to load audio settings:', e);
  }
  return DEFAULT_AUDIO_SETTINGS;
};

const saveAudioSettings = (settings: AudioSettings): void => {
  try {
    localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save audio settings:', e);
  }
};

const Settings = () => {
  const { cases, theme, setTheme } = useContext(AppContext);
  const [displayName, setDisplayName] = useState('');
  const [title, setTitle] = useState('');
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [storageInfo, setStorageInfo] = useState({ used: 0, available: 0, percentage: 0 });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [supabaseStatus, setSupabaseStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');
  const [supabaseMessage, setSupabaseMessage] = useState<string | null>(null);
  const [captionSettings, setCaptionSettings] = useState<CaptionSettings>(DEFAULT_CAPTION_SETTINGS);
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(DEFAULT_AUDIO_SETTINGS);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isTestingAudio, setIsTestingAudio] = useState(false);

  const currentApiKey = process.env.API_KEY || '';
  const isApiKeyConfigured = currentApiKey && currentApiKey !== '';
  const supabaseConfigured = supabaseReady();

  useEffect(() => {
    const prefs = loadPreferences();
    setDisplayName(prefs.displayName);
    setTitle(prefs.title);
    setAutoSaveEnabled(prefs.autoSave);
    updateStorageInfo();
    setCaptionSettings(loadCaptionSettings());
    setAudioSettings(loadAudioSettings());
    setAvailableVoices(browserTTS.getVoices());
  }, []);

  useEffect(() => {
    updateStorageInfo();
  }, [cases]);

  useEffect(() => {
    const handleVoicesChanged = () => {
      setAvailableVoices(browserTTS.getVoices());
    };
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const updateStorageInfo = () => {
    setStorageInfo(getStorageInfo());
  };

  const handleSavePreferences = () => {
    savePreferences({
      displayName,
      title,
      autoSave: autoSaveEnabled,
      theme
    });
    setSaveMessage('Preferences saved successfully!');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    savePreferences({ theme: newTheme });
  };

  const handleAutoSaveToggle = () => {
    const newValue = !autoSaveEnabled;
    setAutoSaveEnabled(newValue);
    savePreferences({ autoSave: newValue });
  };

  const handleCaptionToggle = () => {
    const newSettings = { ...captionSettings, enabled: !captionSettings.enabled };
    setCaptionSettings(newSettings);
    saveCaptionSettings(newSettings);
  };

  const handleCaptionSettingChange = <K extends keyof CaptionSettings>(
    key: K,
    value: CaptionSettings[K]
  ) => {
    const newSettings = { ...captionSettings, [key]: value };
    setCaptionSettings(newSettings);
    saveCaptionSettings(newSettings);
  };

  const handleAudioSettingChange = <K extends keyof AudioSettings>(
    key: K,
    value: AudioSettings[K]
  ) => {
    const newSettings = { ...audioSettings, [key]: value };
    setAudioSettings(newSettings);
    saveAudioSettings(newSettings);
    if (key === 'volume') {
      browserTTS.setVolume(value as number / 100);
    }
  };

  const handleTestAudio = async () => {
    setIsTestingAudio(true);
    try {
      const result = await testAudioPlayback();
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(`Audio test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTestingAudio(false);
    }
  };

  const handleSupabaseCheck = async () => {
    if (!supabaseConfigured) {
      setSupabaseStatus('error');
      setSupabaseMessage('Supabase env vars missing; add SUPABASE_URL and SUPABASE_ANON_KEY to .env.local.');
      return;
    }

    const client = getSupabaseClient();
    if (!client) {
      setSupabaseStatus('error');
      setSupabaseMessage('Supabase client not initialized.');
      return;
    }

    setSupabaseStatus('checking');
    setSupabaseMessage(null);
    const { error } = await client.from('cases').select('id').limit(1);
    if (error) {
      setSupabaseStatus('error');
      setSupabaseMessage(error.message || 'Connection failed. Check RLS/policies and table name.');
    } else {
      setSupabaseStatus('ok');
      setSupabaseMessage('Connection healthy. cases table accessible.');
    }
  };

  const exportData = () => {
    const data = exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lexsim-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setSaveMessage('Data exported successfully!');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (importAllData(data)) {
          setSaveMessage('Data imported successfully! Refreshing page...');
          setTimeout(() => window.location.reload(), 1500);
        } else {
          alert('Failed to import data. Please try again.');
        }
      } catch (error) {
        alert('Failed to import data. Invalid file format.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleClearAllData = () => {
    if (window.confirm('Are you sure you want to delete ALL data? This cannot be undone!')) {
      if (window.confirm('This will delete all cases, sessions, and settings. Continue?')) {
        if (clearAllData()) {
          setSaveMessage('All data cleared. Refreshing...');
          setTimeout(() => window.location.reload(), 1500);
        }
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white font-serif">Settings</h1>
          <p className="text-slate-400 mt-2">Configure your LexSim preferences and API settings</p>
        </div>
        {saveMessage && (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-900/30 border border-green-700 rounded-lg">
            <CheckCircle className="text-green-500" size={18} />
            <span className="text-green-400 text-sm">{saveMessage}</span>
          </div>
        )}
      </div>

      {/* Caption Settings */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <ClosedCaption className="text-gold-500" size={24} />
          <h2 className="text-xl font-semibold text-white">Caption Settings</h2>
        </div>

        <div className="space-y-4">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
            <div>
              <p className="text-slate-300 font-medium">Enable Captions</p>
              <p className="text-xs text-slate-400 mt-1">Display captions during audio playback</p>
            </div>
            <button
              onClick={handleCaptionToggle}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                captionSettings.enabled ? 'bg-gold-500' : 'bg-slate-600'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  captionSettings.enabled ? 'transform translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          {/* Font Size */}
          <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
            <div>
              <p className="text-slate-300 font-medium">Font Size</p>
              <p className="text-xs text-slate-400 mt-1">Size of caption text</p>
            </div>
            <select
              value={captionSettings.fontSize}
              onChange={(e) => handleCaptionSettingChange('fontSize', e.target.value as CaptionSettings['fontSize'])}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 hover:bg-slate-600 transition-colors cursor-pointer"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>

          {/* Position */}
          <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
            <div>
              <p className="text-slate-300 font-medium">Position</p>
              <p className="text-xs text-slate-400 mt-1">Where captions appear on screen</p>
            </div>
            <select
              value={captionSettings.position}
              onChange={(e) => handleCaptionSettingChange('position', e.target.value as CaptionSettings['position'])}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 hover:bg-slate-600 transition-colors cursor-pointer"
            >
              <option value="bottom">Bottom</option>
              <option value="top">Top</option>
              <option value="center">Center</option>
            </select>
          </div>

          {/* Show Speaker Label */}
          <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
            <div>
              <p className="text-slate-300 font-medium">Show Speaker Label</p>
              <p className="text-xs text-slate-400 mt-1">Display who is speaking</p>
            </div>
            <button
              onClick={() => handleCaptionSettingChange('showSpeakerLabel', !captionSettings.showSpeakerLabel)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                captionSettings.showSpeakerLabel ? 'bg-gold-500' : 'bg-slate-600'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  captionSettings.showSpeakerLabel ? 'transform translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          {/* Background Color */}
          <div className="p-3 bg-slate-900/50 rounded-lg">
            <div className="mb-3">
              <p className="text-slate-300 font-medium">Background Color</p>
              <p className="text-xs text-slate-400 mt-1">Caption background with transparency</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {CAPTION_BG_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleCaptionSettingChange('backgroundColor', color.value)}
                  className={`px-3 py-2 rounded-lg border text-xs transition-all ${
                    captionSettings.backgroundColor === color.value
                      ? 'border-gold-500 bg-gold-500/20 text-gold-400'
                      : 'border-slate-600 bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {color.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Audio Settings */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Volume2 className="text-gold-500" size={24} />
          <h2 className="text-xl font-semibold text-white">Audio Settings</h2>
        </div>

        <div className="space-y-4">
          {/* Prefer ElevenLabs */}
          <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
            <div>
              <p className="text-slate-300 font-medium">Prefer ElevenLabs Voices</p>
              <p className="text-xs text-slate-400 mt-1">Use high-quality AI voices instead of browser TTS (requires API key)</p>
            </div>
            <button
              onClick={() => handleAudioSettingChange('preferElevenLabs', !audioSettings.preferElevenLabs)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                audioSettings.preferElevenLabs ? 'bg-gold-500' : 'bg-slate-600'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  audioSettings.preferElevenLabs ? 'transform translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          {/* Volume Slider */}
          <div className="p-3 bg-slate-900/50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-slate-300 font-medium">Volume</p>
                <p className="text-xs text-slate-400 mt-1">Audio playback volume</p>
              </div>
              <span className="text-gold-500 font-bold">{audioSettings.volume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={audioSettings.volume}
              onChange={(e) => handleAudioSettingChange('volume', parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-gold-500"
            />
          </div>

          {/* Test Audio Button */}
          <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
            <div>
              <p className="text-slate-300 font-medium">Test Audio</p>
              <p className="text-xs text-slate-400 mt-1">Play a test tone to verify audio is working</p>
            </div>
            <button
              onClick={handleTestAudio}
              disabled={isTestingAudio}
              className="flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-600 disabled:bg-slate-600 text-slate-900 font-medium rounded-lg transition-colors"
            >
              {isTestingAudio ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Testing...
                </>
              ) : (
                <>
                  <Play size={16} />
                  Test Audio
                </>
              )}
            </button>
          </div>

          {/* Default Voice */}
          <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
            <div>
              <p className="text-slate-300 font-medium">Default Voice</p>
              <p className="text-xs text-slate-400 mt-1">Browser TTS voice selection</p>
            </div>
            <select
              value={audioSettings.defaultVoice}
              onChange={(e) => handleAudioSettingChange('defaultVoice', e.target.value)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 hover:bg-slate-600 transition-colors cursor-pointer max-w-xs"
            >
              <option value="">Auto (System Default)</option>
              {availableVoices.map((voice) => (
                <option key={voice.voiceURI} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>

          {availableVoices.length === 0 && (
            <p className="text-xs text-slate-400 italic">
              No browser voices detected. Voices may load after the first interaction.
            </p>
          )}
        </div>
      </div>

      {/* OCR Provider Settings */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="text-gold-500" size={24} />
          <h2 className="text-xl font-semibold text-white">OCR Providers</h2>
        </div>

        <p className="text-sm text-slate-400 mb-4">
          Configure OCR providers for document processing. Each provider has different strengths for legal document types.
        </p>

        <div className="space-y-3">
          {Object.entries(getOCRProviderInfo()).map(([providerId, info]) => {
            const isAvailable = getAvailableOCRProviders().includes(providerId as OCRProvider);
            
            return (
              <div key={providerId} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-200 font-medium">{info.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        isAvailable 
                          ? 'bg-green-900/40 text-green-300 border border-green-700' 
                          : 'bg-slate-700 text-slate-400 border border-slate-600'
                      }`}>
                        {isAvailable ? 'Configured' : 'Not Configured'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{info.description}</p>
                  </div>
                  <span className="text-xs text-slate-500">{info.pricingInfo}</span>
                </div>
                
                <div className="flex flex-wrap gap-1 mt-2">
                  {info.recommendedFor.map((category: LegalDocumentCategory) => (
                    <span key={category} className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded">
                      {category.replace('-', ' ')}
                    </span>
                  ))}
                </div>
                
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <div className="text-xs text-slate-400">
                    <span className="text-slate-500">Accuracy:</span> ~{info.capabilities.printedTextAccuracy}% | 
                    <span className="text-slate-500 ml-2">Handwriting:</span> {info.capabilities.handwritingSupport ? '✓' : '✗'} | 
                    <span className="text-slate-500 ml-2">Tables:</span> {info.capabilities.tableExtraction ? '✓' : '✗'} | 
                    <span className="text-slate-500 ml-2">Forms:</span> {info.capabilities.formRecognition ? '✓' : '✗'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="text-blue-400 flex-shrink-0 mt-0.5" size={18} />
            <div className="text-sm text-blue-300">
              <p className="font-semibold mb-1">OCR Provider Recommendations:</p>
              <ul className="text-xs text-blue-200 space-y-1">
                <li><strong>Contracts:</strong> Azure Document Intelligence (prebuilt contract model)</li>
                <li><strong>Financial/Medical Records:</strong> AWS Textract (best table extraction)</li>
                <li><strong>Handwritten Evidence:</strong> Mathpix (99%+ handwriting accuracy)</li>
                <li><strong>General Documents:</strong> Google Document AI or Tesseract.js</li>
              </ul>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500 mt-4">
          Configure provider API keys in your <code className="bg-slate-900/50 px-1 rounded">.env.local</code> file.
          See documentation for required environment variables.
        </p>
      </div>

      {/* API Configuration */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Key className="text-gold-500" size={24} />
          <h2 className="text-xl font-semibold text-white">API Configuration</h2>
        </div>

        <div className="space-y-4">
          {/* API Key Status */}
          <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg">
            {isApiKeyConfigured ? (
              <>
                <Check className="text-green-500" size={20} />
                <div>
                  <p className="text-green-400 font-medium">API Key Configured</p>
                  <p className="text-xs text-slate-400 mt-1">Gemini API is ready to use</p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="text-yellow-500" size={20} />
                <div>
                  <p className="text-yellow-400 font-medium">API Key Not Configured</p>
                  <p className="text-xs text-slate-400 mt-1">Add GEMINI_API_KEY to .env.local and restart the server</p>
                </div>
              </>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-blue-300">
                <p className="font-semibold mb-2">How to configure your API key:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-200">
                  <li>Get your API key from <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="text-gold-400 hover:underline">Google AI Studio</a></li>
                  <li>Open <code className="bg-slate-900/50 px-2 py-0.5 rounded">.env.local</code> in your project root</li>
                  <li>Add: <code className="bg-slate-900/50 px-2 py-0.5 rounded">GEMINI_API_KEY=your_key_here</code></li>
                  <li>Restart the development server</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Supabase connectivity */}
        <div className="mt-4 bg-slate-900/50 border border-slate-700 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Cloud className="text-gold-500" size={18} />
            <p className="text-slate-200 font-semibold">Supabase (optional, for cloud persistence)</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2 py-1 rounded ${supabaseConfigured ? 'bg-green-900/40 text-green-300 border border-green-700' : 'bg-yellow-900/40 text-yellow-300 border border-yellow-700'}`}>
              {supabaseConfigured ? 'Env detected' : 'Not configured'}
            </span>
            {supabaseStatus === 'ok' && <span className="text-xs text-green-400 flex items-center gap-1"><Check size={14} /> cases table reachable</span>}
            {supabaseStatus === 'error' && <span className="text-xs text-red-400 flex items-center gap-1"><AlertCircle size={14} /> {supabaseMessage}</span>}
            {supabaseStatus === 'checking' && <span className="text-xs text-slate-300 flex items-center gap-1"><Loader2 className="animate-spin" size={14} /> Checking...</span>}
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-400">
            <span>Add SUPABASE_URL and SUPABASE_ANON_KEY to .env.local.</span>
            <span>Ensure a `cases` table exists (see SUPABASE_SETUP.md).</span>
          </div>
          <button
            onClick={handleSupabaseCheck}
            className="text-sm px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg border border-slate-600 text-slate-100 inline-flex items-center gap-2"
          >
            <Cloud size={16} />
            Run connection check
          </button>
          {supabaseMessage && supabaseStatus !== 'error' && (
            <p className="text-xs text-green-300">{supabaseMessage}</p>
          )}
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Database className="text-gold-500" size={24} />
          <h2 className="text-xl font-semibold text-white">Data Management</h2>
        </div>

        <div className="space-y-4">
          {/* Storage Info */}
          <div className="bg-slate-900/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium">Cases stored</span>
              <span className="text-gold-500 font-bold text-lg">{cases.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium">Storage used</span>
              <span className="text-slate-400 text-sm">{storageInfo.used} KB / {storageInfo.available} KB</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  storageInfo.percentage > 80 ? 'bg-red-500' : storageInfo.percentage > 50 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(storageInfo.percentage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-400">
              Data is cached in localStorage and synced to Supabase when configured.
            </p>
          </div>

          {/* Export/Import */}
          <div className="grid sm:grid-cols-2 gap-3">
            <button
              onClick={exportData}
              disabled={cases.length === 0}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-900 disabled:text-slate-600 border border-slate-600 rounded-lg transition-colors"
            >
              <Download size={18} />
              <span className="font-medium">Export Data</span>
            </button>

            <label className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg transition-colors cursor-pointer">
              <Upload size={18} />
              <span className="font-medium">Import Data</span>
              <input
                type="file"
                accept=".json"
                onChange={importData}
                className="hidden"
              />
            </label>
          </div>

          {/* Auto-save Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
            <div>
              <p className="text-slate-300 font-medium">Auto-save to LocalStorage</p>
              <p className="text-xs text-slate-400 mt-1">Automatically persist data between sessions</p>
            </div>
            <button
              onClick={handleAutoSaveToggle}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                autoSaveEnabled ? 'bg-gold-500' : 'bg-slate-600'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  autoSaveEnabled ? 'transform translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          {/* Clear All Data */}
          <button
            onClick={handleClearAllData}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-900/20 hover:bg-red-900/30 border border-red-700 rounded-lg transition-colors text-red-400"
          >
            <Trash2 size={18} />
            <span className="font-medium">Clear All Data</span>
          </button>
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Palette className="text-gold-500" size={24} />
          <h2 className="text-xl font-semibold text-white">Appearance</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Moon size={20} className="text-gold-500" /> : <Sun size={20} className="text-gold-500" />}
              <span className="text-slate-300">Theme</span>
            </div>
            <select
              value={theme}
              onChange={(e) => handleThemeChange(e.target.value as 'dark' | 'light')}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 hover:bg-slate-600 transition-colors cursor-pointer"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
          <p className="text-xs text-slate-400 italic">Light theme coming soon. Currently, only dark theme is fully supported.</p>
        </div>
      </div>

      {/* User Profile */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <User className="text-gold-500" size={24} />
          <h2 className="text-xl font-semibold text-white">User Profile</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Attorney J. Doe"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Senior Litigator"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>
          <button
            onClick={handleSavePreferences}
            className="w-full bg-gold-500 hover:bg-gold-600 text-slate-900 font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Save Profile
          </button>
          <p className="text-xs text-slate-400">Profile information is stored locally and displayed in the header.</p>
        </div>
      </div>

      {/* Privacy & Security */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="text-gold-500" size={24} />
          <h2 className="text-xl font-semibold text-white">Privacy & Security</h2>
        </div>

        <div className="space-y-3 text-sm text-slate-300">
          <p>
            <strong className="text-white">Data Storage:</strong> Data is cached locally; if Supabase is configured, cases/evidence sync to your project (see SUPABASE_SETUP.md). No other servers are used.
          </p>
          <p>
            <strong className="text-white">API Usage:</strong> Your prompts and case information are sent to Google's Gemini API for processing. Review <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-gold-400 hover:underline">Google's Privacy Policy</a>.
          </p>
          <p>
            <strong className="text-white">Persistence:</strong> Case data is lost on page refresh unless you export it. No backend database is implemented.
          </p>
        </div>
      </div>

      {/* About */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-3">About LexSim</h2>
        <p className="text-sm text-slate-300 mb-2">
          LexSim is an AI-powered legal trial preparation platform built with Google Gemini AI.
        </p>
        <div className="flex gap-4 text-xs text-slate-400">
          <span>Version 1.0.0</span>
          <span>•</span>
          <a href="https://ai.studio/apps/drive/1V2CDhsqj46ydvFpmYDwK7mwA9ZvplvwL" target="_blank" rel="noopener noreferrer" className="text-gold-400 hover:underline">
            View on AI Studio
          </a>
        </div>
      </div>
    </div>
  );
};

export default Settings;
