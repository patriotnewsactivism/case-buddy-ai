import React, { useCallback, useState, useRef } from 'react';
import { Upload, FileAudio, FileVideo, X, FolderInput, Files, HardDrive, Loader2 } from 'lucide-react';

interface FileUploaderProps {
  onFilesSelect: (files: File[]) => void;
  onDriveSelect: () => void;
  driveLoadingState: string | null;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFilesSelect, onDriveSelect, driveLoadingState }) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateFile = (file: File) => {
    return file.type.startsWith('audio/') || file.type.startsWith('video/');
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles: File[] = [];
      Array.from(e.dataTransfer.files).forEach((file: File) => {
          if (validateFile(file)) validFiles.push(file);
      });
      
      if (validFiles.length > 0) {
        onFilesSelect(validFiles);
      } else {
        alert("No valid audio or video files found in selection.");
      }
    }
  }, [onFilesSelect]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
        const validFiles: File[] = [];
        Array.from(e.target.files).forEach((file: File) => {
            if (validateFile(file)) validFiles.push(file);
        });
        
        if (validFiles.length > 0) {
            onFilesSelect(validFiles);
        } else {
             alert("No valid audio or video files found.");
        }
    }
  }, [onFilesSelect]);

  return (
    <div className="w-full max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div
        className={`relative flex flex-col items-center justify-center w-full min-h-[350px] p-8 rounded-3xl border-2 border-dashed transition-all duration-300 ease-in-out group ${
          dragActive
            ? 'border-gold-500 bg-gold-500/10 scale-[1.02]'
            : 'border-slate-700 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-6 text-center pointer-events-none z-10">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${dragActive ? 'bg-gold-500 text-slate-900' : 'bg-slate-700 text-slate-400 group-hover:bg-slate-600 group-hover:text-slate-200'}`}>
              <Upload className="w-10 h-10" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold text-slate-100">
                Upload Recordings
              </h3>
              <p className="text-slate-400 max-w-sm mx-auto">
                Drag & drop files or folders here, or choose an option below.
              </p>
            </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 z-20">
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-6 py-3 bg-gold-500 text-slate-900 rounded-xl font-medium hover:bg-gold-600 transition-colors shadow-lg shadow-gold-500/5"
            >
                <Files size={18} />
                Select Files
            </button>
            <button 
                onClick={() => folderInputRef.current?.click()}
                className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-slate-200 rounded-xl font-medium hover:bg-slate-600 transition-colors border border-slate-600"
            >
                <FolderInput size={18} />
                Select Folder
            </button>
             <button 
                onClick={onDriveSelect}
                disabled={!!driveLoadingState}
                className={`flex items-center gap-2 px-6 py-3 bg-blue-600/20 text-blue-300 rounded-xl font-medium hover:bg-blue-600/30 transition-colors border border-blue-600/30 ${driveLoadingState ? 'opacity-70 cursor-wait' : ''}`}
            >
                {driveLoadingState ? <Loader2 size={18} className="animate-spin"/> : <HardDrive size={18} />}
                {driveLoadingState ? driveLoadingState : 'Google Drive'}
            </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept="audio/*,video/*"
          onChange={handleFileChange}
        />
        <input
          ref={folderInputRef}
          type="file"
          className="hidden"
          // @ts-ignore - webkitdirectory is standard in modern browsers but not in React types
          webkitdirectory=""
          directory=""
          onChange={handleFileChange}
        />

        <div className="absolute bottom-6 text-xs text-slate-500 font-mono">
            Supported: MP3, WAV, MP4, MOV, MKV • Auto-converts Video to Audio
        </div>
      </div>
    </div>
  );
};

export default FileUploader;
