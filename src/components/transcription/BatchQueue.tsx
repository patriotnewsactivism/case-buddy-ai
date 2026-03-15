import React from 'react';
import { BatchItem } from '../../types';
import { FileAudio, FileVideo, Loader2, AlertCircle, Clock, Eye, Download } from 'lucide-react';

interface BatchQueueProps {
  queue: BatchItem[];
  onViewResult: (item: BatchItem) => void;
  onDownloadAll: () => void;
}

const BatchQueue: React.FC<BatchQueueProps> = ({ queue, onViewResult, onDownloadAll }) => {
  const completedCount = queue.filter(i => i.status === 'COMPLETED').length;
  const progressPercent = queue.length > 0 ? Math.round((completedCount / queue.length) * 100) : 0;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-8 duration-500">
      <div className="flex items-center justify-between bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">Batch Processing<span className="px-2 py-0.5 rounded-full bg-slate-700 text-xs text-slate-400 border border-slate-600">{queue.length} Files</span></h2>
          <p className="text-sm text-slate-500 mt-1">Processing queue sequentially to ensure highest quality.</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-mono font-light text-white">{completedCount}<span className="text-slate-500">/</span>{queue.length}</div>
          <div className="text-xs text-slate-500 uppercase tracking-wider font-medium">Completed</div>
        </div>
      </div>
      {progressPercent < 100 && queue.length > 0 && <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-gold-500 transition-all duration-500" style={{ width: `${progressPercent}%` }} /></div>}
      {completedCount > 0 && <div className="flex justify-end"><button onClick={onDownloadAll} className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 hover:underline"><Download size={14} /> Download All Completed Transcripts</button></div>}
      <div className="grid gap-3">
        {queue.map((item) => (
          <div key={item.id} className={`group relative overflow-hidden p-4 rounded-xl border transition-all duration-300 ${item.status === 'PROCESSING' ? 'bg-slate-800/80 border-gold-500/50 shadow-lg shadow-gold-500/10' : item.status === 'COMPLETED' ? 'bg-slate-800/30 border-slate-700 hover:bg-slate-800 hover:border-slate-600' : 'bg-slate-800/10 border-slate-700/50 opacity-60'}`}>
            {item.status === 'PROCESSING' && <div className="absolute bottom-0 left-0 h-0.5 bg-gold-500 transition-all duration-300" style={{ width: `${item.progress}%` }} />}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${item.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : item.status === 'PROCESSING' ? 'bg-gold-500/10 text-gold-400' : item.status === 'ERROR' ? 'bg-red-500/10 text-red-400' : 'bg-slate-700 text-slate-500'}`}>
                  {item.file.type.startsWith('video') ? <FileVideo size={20} /> : <FileAudio size={20} />}
                </div>
                <div className="min-w-0">
                  <h4 className="font-medium text-slate-200 truncate">{item.file.name}</h4>
                  <p className="text-xs text-slate-500 flex items-center gap-2">{(item.file.size / (1024 * 1024)).toFixed(2)} MB{item.status === 'PROCESSING' && <span className="text-gold-400 font-mono">• {item.stage} ({item.progress}%)</span>}</p>
                </div>
              </div>
              <div className="shrink-0">
                {item.status === 'QUEUED' && <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700/50 text-slate-500 text-xs font-medium"><Clock size={14} /> Pending</div>}
                {item.status === 'PROCESSING' && <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gold-500/10 text-gold-400 text-xs font-medium animate-pulse"><Loader2 size={14} className="animate-spin" /> Processing</div>}
                {item.status === 'ERROR' && <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium" title={item.error}><AlertCircle size={14} /> Failed</div>}
                {item.status === 'COMPLETED' && <button onClick={() => onViewResult(item)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white text-sm font-medium transition-colors border border-slate-600"><Eye size={16} /> View Transcript</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BatchQueue;
