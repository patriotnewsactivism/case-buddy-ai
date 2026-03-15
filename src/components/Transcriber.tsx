import React, { useState, useEffect, useRef, useContext } from 'react';
import { AppContext } from '../App';
import { Mic, Upload, Settings2, ArrowLeft, Activity } from 'lucide-react';
import { AppMode, TranscriptionStatus, TranscriptionProvider, TranscriptionSettings, BatchItem } from '../types';
import { transcribeAudio } from '../services/transcriptionService';
import { processMediaFile } from '../utils/audioUtils';
import { downloadFile, generateFilename, formatTranscriptWithSpeakers } from '../utils/transcriptionFileUtils';
import { openDrivePicker, uploadToDrive } from '../services/driveService';

import AudioRecorder from './transcription/AudioRecorder';
import FileUploader from './transcription/FileUploader';
import BatchQueue from './transcription/BatchQueue';
import TranscriptionResult from './transcription/TranscriptionResult';
import TranscriptionSettingsDialog from './transcription/TranscriptionSettingsDialog';

const DEFAULT_SETTINGS: TranscriptionSettings = {
  provider: TranscriptionProvider.GEMINI,
  openaiKey: '',
  assemblyAiKey: '',
  googleClientId: '',
  googleApiKey: '',
  legalMode: false,
  autoDownloadAudio: false,
  autoDriveUpload: false,
  customVocabulary: [],
};

const Transcriber = () => {
  const { activeCase } = useContext(AppContext);
  const [mode, setMode] = useState<AppMode>(AppMode.UPLOAD);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<TranscriptionSettings>(DEFAULT_SETTINGS);
  
  const [queue, setQueue] = useState<BatchItem[]>([]);
  const [viewingItemId, setViewingItemId] = useState<string | null>(null);
  const isProcessingRef = useRef(false);
  const [processCounter, setProcessCounter] = useState(0);

  const [driveLoadingState, setDriveLoadingState] = useState<string | null>(null);

  useEffect(() => {
    const savedSettings = localStorage.getItem('transcription_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed, customVocabulary: parsed.customVocabulary || [] });
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  const handleSaveSettings = (newSettings: TranscriptionSettings) => {
    setSettings(newSettings);
    localStorage.setItem('transcription_settings', JSON.stringify(newSettings));
  };

  const handleFilesSelect = (files: File[]) => {
    const newItems: BatchItem[] = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      status: 'QUEUED',
      stage: 'Pending',
      progress: 0
    }));
    setQueue(prev => [...prev, ...newItems]);
    setMode(AppMode.UPLOAD);
  };

  const handleRecordingComplete = (blob: Blob) => {
    const file = new File([blob], `Recording_${new Date().toLocaleTimeString()}.webm`, { type: 'audio/webm' });
    handleFilesSelect([file]);
  };

  const handleDriveSelect = async () => {
    if (!settings.googleClientId || !settings.googleApiKey) {
      alert("Please configure Google Drive Client ID and API Key in Settings first.");
      setIsSettingsOpen(true);
      return;
    }
    setDriveLoadingState("Connecting...");
    try {
      const files = await openDrivePicker(settings.googleClientId, settings.googleApiKey, (msg) => setDriveLoadingState(msg));
      if (files.length > 0) {
        setDriveLoadingState("Finalizing...");
        handleFilesSelect(files);
      }
    } catch (e) {
      console.error("Drive Selection Error", e);
      alert(`Drive Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setDriveLoadingState(null);
    }
  };

  const updateItem = (id: string, updates: Partial<BatchItem>) => {
    setQueue(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  useEffect(() => {
    const processNext = async () => {
      if (isProcessingRef.current) return;
      const nextItem = queue.find(i => i.status === 'QUEUED');
      if (!nextItem) return;

      isProcessingRef.current = true;
      const itemId = nextItem.id;

      try {
        const skipConversion = settings.provider === TranscriptionProvider.GEMINI;
        updateItem(itemId, { status: 'PROCESSING', stage: skipConversion ? 'Uploading Evidence...' : 'Optimizing Audio...', progress: 5 });
        
        const fileToProcess = await processMediaFile(nextItem.file, skipConversion, (progress) => {
          updateItem(itemId, { stage: `Optimizing Audio (${progress}%)`, progress: 5 + Math.round(progress * 0.1) });
        });
        updateItem(itemId, { stage: 'Processing Evidence...', progress: 15 });

        const result = await transcribeAudio(fileToProcess, '', settings, (pct) => {
          const mappedProgress = 15 + Math.round(pct * 0.75);
          updateItem(itemId, { stage: pct === 100 ? 'Analyzing & Transcribing...' : `Uploading (${pct}%)`, progress: mappedProgress });
        });

        updateItem(itemId, { status: 'COMPLETED', progress: 100, result: result });

        if (settings.autoDriveUpload && settings.googleClientId) {
          try {
            const formattedTranscript = result.segments && result.segments.length > 0
              ? formatTranscriptWithSpeakers(result.segments)
              : result.text;
            await uploadToDrive(settings.googleClientId, "CaseBuddyTranscripts", `Transcript_${nextItem.file.name}.txt`, formattedTranscript, "text/plain");
            await uploadToDrive(settings.googleClientId, "CaseBuddyTranscripts", nextItem.file.name, nextItem.file, nextItem.file.type);
          } catch (driveErr) {
            console.error("Auto-save failed", driveErr);
          }
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error(`Error processing file ${nextItem.file.name}:`, err);
        updateItem(itemId, { status: 'ERROR', error: err.message || 'Processing Failed' });
      } finally {
        isProcessingRef.current = false;
        setProcessCounter(c => c + 1);
      }
    };
    processNext();
  }, [queue, settings, processCounter]);

  const handleDownloadAll = () => {
    const completed = queue.filter(i => i.status === 'COMPLETED' && i.result);
    if (completed.length === 0) return;
    const combinedText = completed.map(i => {
      const transcriptText = i.result?.segments && i.result.segments.length > 0
        ? formatTranscriptWithSpeakers(i.result.segments)
        : i.result?.text || '';
      return `--- FILE: ${i.file.name} ---\n\n${transcriptText}\n\n`;
    }).join('\n========================================\n\n');
    downloadFile(combinedText, generateFilename('All_Transcripts', 'txt'), 'text/plain');
  };

  const resetQueue = () => {
    if (confirm("Clear all files and results?")) {
      setQueue([]);
      setViewingItemId(null);
    }
  };

  const viewingItem = viewingItemId ? queue.find(i => i.id === viewingItemId) : null;

  if (!activeCase) {
    return (
      <div className="min-h-screen bg-slate-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center">
            <Mic className="mx-auto mb-4 text-slate-500" size={64} />
            <h2 className="text-2xl font-bold text-white mb-2">No Active Case</h2>
            <p className="text-slate-400">Please select or create a case to use the transcription service.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Activity className="text-gold-500" size={28} />
            <div>
              <h1 className="text-2xl font-bold text-white font-serif">CaseBuddy Whisper</h1>
              <p className="text-sm text-slate-400">Case: <span className="text-gold-400">{activeCase.title}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button onClick={() => { setMode(AppMode.RECORD); setViewingItemId(null); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === AppMode.RECORD ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}><Mic size={16} />Record</button>
              <button onClick={() => { setMode(AppMode.UPLOAD); setViewingItemId(null); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === AppMode.UPLOAD ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}><Upload size={16} />Upload</button>
            </div>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"><Settings2 size={18} /></button>
          </div>
        </div>

        <TranscriptionSettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={settings} onSave={handleSaveSettings} />

        <main className="flex flex-col items-center">
          {viewingItem && viewingItem.result ? (
            <div className="w-full animate-in slide-in-from-right duration-300">
              <button onClick={() => setViewingItemId(null)} className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><ArrowLeft size={18} /> Back to Queue</button>
              <h2 className="text-xl font-bold text-white mb-6 px-1">{viewingItem.file.name}</h2>
              <TranscriptionResult result={viewingItem.result} audioFile={viewingItem.file} fileName={viewingItem.file.name} />
            </div>
          ) : (
            <>
              {queue.length === 0 && (
                <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">{mode === AppMode.UPLOAD ? 'Upload Evidence.' : 'Record Voice.'}</h2>
                  <p className="text-lg text-slate-400 max-w-2xl mx-auto">{mode === AppMode.UPLOAD ? "Process video and audio files instantly. Gemini Engine auto-transcribes with high fidelity." : "Record proceedings directly. Audio is enhanced and transcribed in real-time."}</p>
                </div>
              )}

              {queue.length === 0 && (
                <div className="w-full">
                  {mode === AppMode.RECORD ? (
                    <AudioRecorder onRecordingComplete={handleRecordingComplete} status={TranscriptionStatus.IDLE} autoDownload={settings.autoDownloadAudio} />
                  ) : (
                    <FileUploader onFilesSelect={handleFilesSelect} onDriveSelect={handleDriveSelect} driveLoadingState={driveLoadingState} />
                  )}
                </div>
              )}

              {queue.length > 0 && (
                <div className="w-full">
                  <div className="flex justify-end mb-4">
                    <button onClick={resetQueue} className="text-sm text-slate-500 hover:text-red-400 px-3 py-2">Clear Queue</button>
                  </div>
                  <BatchQueue queue={queue} onViewResult={(item) => setViewingItemId(item.id)} onDownloadAll={handleDownloadAll} />
                  <div className="mt-8 pt-8 border-t border-slate-800">
                    <p className="text-center text-slate-600 text-sm mb-4">Add more files</p>
                    <div className="max-w-md mx-auto opacity-50 hover:opacity-100 transition-opacity">
                      <FileUploader onFilesSelect={handleFilesSelect} onDriveSelect={handleDriveSelect} driveLoadingState={driveLoadingState} />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Transcriber;
