import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Download, FileText, Printer, Edit3, Check, X, Users,
  FileAudio, Clock, HardDrive, Languages, Sparkles, ChevronDown
} from 'lucide-react';
import { TranscriptionResultData, TranscriptSegmentData } from '../../types';
import { formatTime } from '../../utils/audioUtils';
import { 
  downloadFile, 
  generateFilename, 
  formatTranscriptWithSpeakers, 
  printLegalDocument,
  getFileMetadata,
  extractDateFromFilename
} from '../../utils/transcriptionFileUtils';
import { getSpeakerSuggestions, saveVoiceProfile, getSavedSpeakerMap, persistSpeakerMap } from '../../services/voiceProfileService';
import { generateTranscriptSummary, translateTranscript } from '../../services/geminiService';

interface TranscriptionResultProps {
  result: TranscriptionResultData;
  audioFile?: File | Blob;
  fileName: string;
  onClose?: () => void;
}

const TranscriptionResult: React.FC<TranscriptionResultProps> = ({ 
  result, 
  audioFile, 
  fileName,
  onClose 
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(-1);
  const [speakerMap, setSpeakerMap] = useState<Record<string, string>>({});
  const [editingSpeaker, setEditingSpeaker] = useState<string | null>(null);
  const [speakerInput, setSpeakerInput] = useState('');
  const [speakerSuggestions, setSpeakerSuggestions] = useState<string[]>([]);
  
  const [editingSegment, setEditingSegment] = useState<number | null>(null);
  const [editedText, setEditedText] = useState('');
  
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [translation, setTranslation] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('Spanish');
  
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [segments, setSegments] = useState<TranscriptSegmentData[]>([]);

  useEffect(() => {
    if (result.segments && result.segments.length > 0) {
      setSegments(result.segments);
    } else if (result.text) {
      const parsed = parsePlainText(result.text);
      setSegments(parsed);
    }
    const savedMap = getSavedSpeakerMap();
    setSpeakerMap(savedMap);
  }, [result]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const parsePlainText = (text: string): TranscriptSegmentData[] => {
    const lines = text.split('\n').filter(line => line.trim());
    return lines.map((line, index) => ({
      start: index * 5,
      end: (index + 1) * 5,
      speaker: 'Speaker 1',
      text: line.trim()
    }));
  };

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const seekTo = useCallback((time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  const seekRelative = useCallback((delta: number) => {
    if (!audioRef.current) return;
    const newTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + delta));
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
    
    if (segments.length > 0) {
      const currentSegment = segments.findIndex(
        seg => audioRef.current!.currentTime >= seg.start && audioRef.current!.currentTime < seg.end
      );
      setActiveSegmentIndex(currentSegment);
    }
  }, [segments]);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, []);

  const handleSegmentClick = useCallback((segment: TranscriptSegmentData) => {
    seekTo(segment.start);
    if (!isPlaying && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [seekTo, isPlaying]);

  const handleWordClick = useCallback((startTime: number) => {
    seekTo(startTime);
  }, [seekTo]);

  const updateSpeakerName = useCallback((originalSpeaker: string, newName: string) => {
    const newMap = { ...speakerMap, [originalSpeaker]: newName };
    setSpeakerMap(newMap);
    persistSpeakerMap(newMap);
    saveVoiceProfile(newName);
    setEditingSpeaker(null);
    setSpeakerInput('');
  }, [speakerMap]);

  const handleSpeakerEdit = useCallback((speaker: string) => {
    setEditingSpeaker(speaker);
    setSpeakerInput(speakerMap[speaker] || speaker);
    setSpeakerSuggestions(getSpeakerSuggestions(''));
  }, [speakerMap]);

  const handleSpeakerInputChange = useCallback((value: string) => {
    setSpeakerInput(value);
    setSpeakerSuggestions(getSpeakerSuggestions(value));
  }, []);

  const updateSegmentText = useCallback((index: number, newText: string) => {
    const newSegments = [...segments];
    newSegments[index] = { ...newSegments[index], text: newText };
    setSegments(newSegments);
    setEditingSegment(null);
    setEditedText('');
  }, [segments]);

  const handleGenerateSummary = useCallback(async () => {
    if (!segments.length) return;
    setIsSummarizing(true);
    try {
      const transcriptText = segments.map(s => `${s.speaker}: ${s.text}`).join('\n');
      const generated = await generateTranscriptSummary(transcriptText);
      setSummary(generated);
    } catch (error) {
      console.error('Failed to generate summary:', error);
    } finally {
      setIsSummarizing(false);
    }
  }, [segments]);

  const handleTranslate = useCallback(async () => {
    if (!segments.length) return;
    setIsTranslating(true);
    try {
      const transcriptText = segments.map(s => `${s.speaker}: ${s.text}`).join('\n');
      const translated = await translateTranscript(transcriptText, targetLanguage);
      setTranslation(translated);
    } catch (error) {
      console.error('Failed to translate:', error);
    } finally {
      setIsTranslating(false);
    }
  }, [segments, targetLanguage]);

  const exportAsTxt = useCallback(() => {
    const text = formatTranscriptWithSpeakers(segments, speakerMap, { includeTimestamps: true });
    downloadFile(text, generateFilename('Transcript', 'txt'), 'text/plain');
  }, [segments, speakerMap]);

  const exportSpeakerSeparated = useCallback(() => {
    const text = formatTranscriptWithSpeakers(segments, speakerMap, { 
      includeTimestamps: true, 
      groupBySpeaker: true 
    });
    downloadFile(text, generateFilename('Transcript_BySpeaker', 'txt'), 'text/plain');
  }, [segments, speakerMap]);

  const exportLegalPrint = useCallback(() => {
    const metadata = {
      filename: fileName,
      recordingDate: extractDateFromFilename(fileName).date || undefined,
      summary: summary || undefined
    };
    printLegalDocument(
      result.text,
      'TRANSCRIPT OF RECORDING',
      segments,
      speakerMap,
      metadata
    );
  }, [segments, speakerMap, fileName, summary, result.text]);

  const uniqueSpeakers = [...new Set(segments.map(s => s.speaker))];
  const fileMetadata = audioFile instanceof File ? getFileMetadata(audioFile) : null;
  const audioUrl = audioFile ? URL.createObjectURL(audioFile) : null;

  const formatPlaybackTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden animate-in fade-in duration-300">
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}

      <div className="p-6 border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gold-500/20 flex items-center justify-center">
              <FileAudio size={24} className="text-gold-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{fileName}</h2>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                {fileMetadata && (
                  <>
                    <span className="flex items-center gap-1"><HardDrive size={12} />{fileMetadata.size}</span>
                    <span className="flex items-center gap-1"><Clock size={12} />{formatTime(duration)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
              >
                <Download size={16} />
                Export
                <ChevronDown size={14} />
              </button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-600 rounded-xl shadow-xl z-50 overflow-hidden">
                  <button onClick={() => { exportAsTxt(); setShowExportMenu(false); }} className="w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-2">
                    <FileText size={16} /> Plain Text (.txt)
                  </button>
                  <button onClick={() => { exportSpeakerSeparated(); setShowExportMenu(false); }} className="w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-2">
                    <Users size={16} /> By Speaker
                  </button>
                  <button onClick={() => { exportLegalPrint(); setShowExportMenu(false); }} className="w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-2">
                    <Printer size={16} /> Legal Print
                  </button>
                </div>
              )}
            </div>
            {onClose && (
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {audioUrl && (
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-4">
              <button onClick={() => seekRelative(-10)} className="p-2 text-slate-400 hover:text-white transition-colors">
                <SkipBack size={20} />
              </button>
              <button 
                onClick={togglePlay}
                className="w-12 h-12 rounded-full bg-gold-500 hover:bg-gold-600 flex items-center justify-center transition-colors"
              >
                {isPlaying ? <Pause size={24} className="text-slate-900" /> : <Play size={24} className="text-slate-900 ml-1" />}
              </button>
              <button onClick={() => seekRelative(10)} className="p-2 text-slate-400 hover:text-white transition-colors">
                <SkipForward size={20} />
              </button>
              
              <div className="flex-1 mx-4">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>{formatPlaybackTime(currentTime)}</span>
                  <span>{formatPlaybackTime(duration)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={(e) => seekTo(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-gold-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setIsMuted(!isMuted)} className="p-2 text-slate-400 hover:text-white transition-colors">
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setVolume(v);
                    setIsMuted(v === 0);
                    if (audioRef.current) audioRef.current.volume = v;
                  }}
                  className="w-20 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-gold-500"
                />
              </div>

              <select
                value={playbackRate}
                onChange={(e) => setPlaybackRate(Number(e.target.value))}
                className="bg-slate-700 text-slate-200 text-sm px-2 py-1 rounded-lg border border-slate-600"
              >
                <option value={0.5}>0.5x</option>
                <option value={0.75}>0.75x</option>
                <option value={1}>1x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {uniqueSpeakers.length > 0 && (
        <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/30">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Users size={14} /> Speakers
          </h3>
          <div className="flex flex-wrap gap-2">
            {uniqueSpeakers.map((speaker) => (
              <div key={speaker} className="relative">
                {editingSpeaker === speaker ? (
                  <div className="flex items-center gap-2 bg-slate-700 rounded-lg p-1">
                    <input
                      type="text"
                      value={speakerInput}
                      onChange={(e) => handleSpeakerInputChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') updateSpeakerName(speaker, speakerInput);
                        if (e.key === 'Escape') setEditingSpeaker(null);
                      }}
                      placeholder="Enter name..."
                      className="bg-slate-800 text-white text-sm px-2 py-1 rounded border border-slate-600 focus:outline-none focus:border-gold-500 w-32"
                      autoFocus
                    />
                    <button onClick={() => updateSpeakerName(speaker, speakerInput)} className="p-1 text-emerald-400 hover:text-emerald-300">
                      <Check size={14} />
                    </button>
                    <button onClick={() => setEditingSpeaker(null)} className="p-1 text-slate-400 hover:text-white">
                      <X size={14} />
                    </button>
                    {speakerSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-slate-800 border border-slate-600 rounded-lg overflow-hidden z-10">
                        {speakerSuggestions.slice(0, 5).map((suggestion) => (
                          <button
                            key={suggestion}
                            onClick={() => {
                              setSpeakerInput(suggestion);
                              updateSpeakerName(speaker, suggestion);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-700"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => handleSpeakerEdit(speaker)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-sm text-slate-200 transition-colors border border-slate-600"
                  >
                    <div className="w-3 h-3 rounded-full bg-gold-500" />
                    {speakerMap[speaker] || speaker}
                    <Edit3 size={12} className="text-slate-400" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto max-h-[400px] p-6 custom-scrollbar">
        <div className="space-y-4">
          {segments.map((segment, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl transition-all duration-200 cursor-pointer ${
                activeSegmentIndex === index 
                  ? 'bg-gold-500/10 border border-gold-500/30' 
                  : 'bg-slate-800/30 border border-transparent hover:bg-slate-800/50'
              }`}
              onClick={() => handleSegmentClick(segment)}
            >
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center shrink-0">
                  <span className="text-xs font-mono text-slate-500">{formatTime(segment.start)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gold-400">
                      {speakerMap[segment.speaker] || segment.speaker}
                    </span>
                  </div>
                  {editingSegment === index ? (
                    <div className="flex items-start gap-2">
                      <textarea
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                        className="flex-1 bg-slate-800 text-slate-200 text-sm p-2 rounded-lg border border-slate-600 focus:outline-none focus:border-gold-500 resize-none"
                        rows={3}
                        autoFocus
                      />
                      <button onClick={() => updateSegmentText(index, editedText)} className="p-1 text-emerald-400 hover:text-emerald-300">
                        <Check size={16} />
                      </button>
                      <button onClick={() => { setEditingSegment(null); setEditedText(''); }} className="p-1 text-slate-400 hover:text-white">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <p className="text-sm text-slate-300 leading-relaxed flex-1">
                        {segment.text.split(' ').map((word, wordIndex) => (
                          <span
                            key={wordIndex}
                            className="hover:text-gold-400 hover:bg-slate-700/50 px-0.5 rounded cursor-pointer transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleWordClick(segment.start + (wordIndex / segment.text.split(' ').length) * (segment.end - segment.start));
                            }}
                          >
                            {word}{' '}
                          </span>
                        ))}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSegment(index);
                          setEditedText(segment.text);
                        }}
                        className="p-1 text-slate-500 hover:text-slate-300 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                      >
                        <Edit3 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 border-t border-slate-700 bg-slate-800/30">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleGenerateSummary}
            disabled={isSummarizing || !segments.length}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles size={16} className={isSummarizing ? 'animate-pulse' : ''} />
            {isSummarizing ? 'Summarizing...' : 'AI Summary'}
          </button>
          
          <div className="flex items-center gap-2">
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="bg-slate-700 text-slate-200 text-sm px-3 py-2 rounded-lg border border-slate-600"
            >
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="German">German</option>
              <option value="Portuguese">Portuguese</option>
              <option value="Chinese">Chinese</option>
              <option value="Japanese">Japanese</option>
            </select>
            <button
              onClick={handleTranslate}
              disabled={isTranslating || !segments.length}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Languages size={16} className={isTranslating ? 'animate-pulse' : ''} />
              {isTranslating ? 'Translating...' : 'Translate'}
            </button>
          </div>
        </div>

        {summary && (
          <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <h4 className="text-sm font-semibold text-amber-300 mb-2 flex items-center gap-2">
              <Sparkles size={14} /> Summary
            </h4>
            <p className="text-sm text-slate-300">{summary}</p>
          </div>
        )}

        {translation && (
          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <h4 className="text-sm font-semibold text-blue-300 mb-2 flex items-center gap-2">
              <Languages size={14} /> Translation ({targetLanguage})
            </h4>
            <p className="text-sm text-slate-300 whitespace-pre-wrap">{translation}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TranscriptionResult;
