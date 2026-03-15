import React, { useState, useContext } from 'react';
import { AppContext } from '../App';
import { FileText, Send, Clock, CheckCircle, AlertCircle, Plus, X, Search, Download, Trash2, Edit3, Filter } from 'lucide-react';
import { handleSuccess, handleError } from '../utils/errorHandler';

interface FOIARequest {
  id: string;
  caseId: string;
  agency: string;
  subject: string;
  dateFiled: string;
  dueDate: string;
  status: 'Draft' | 'Sent' | 'In Progress' | 'Completed' | 'Denied' | 'Overdue';
  trackingNumber?: string;
  documentsReceived?: string[];
  notes?: string;
}

const PublicRecordsManager = () => {
  const { activeCase } = useContext(AppContext);
  const [requests, setRequests] = useState<FOIARequest[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newRequest, setNewRequest] = useState<Partial<FOIARequest>>({
    agency: '',
    subject: '',
    status: 'Sent',
    dateFiled: new Date().toISOString().split('T')[0]
  });

  const handleAddRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCase) return;

    const request: FOIARequest = {
      id: Date.now().toString(),
      caseId: activeCase.id,
      agency: newRequest.agency || '',
      subject: newRequest.subject || '',
      dateFiled: newRequest.dateFiled || new Date().toISOString().split('T')[0],
      dueDate: newRequest.dueDate || '',
      status: (newRequest.status as any) || 'Sent',
      trackingNumber: newRequest.trackingNumber,
      notes: newRequest.notes
    };

    setRequests([...requests, request]);
    setShowModal(false);
    handleSuccess('FOIA/Public Records Request added');
    setNewRequest({ agency: '', subject: '', status: 'Sent', dateFiled: new Date().toISOString().split('T')[0] });
  };

  const deleteRequest = (id: string) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      setRequests(requests.filter(r => r.id !== id));
      handleSuccess('Record deleted');
    }
  };

  if (!activeCase) {
    return <div className="p-8 text-center text-slate-500">Please select a case to manage public records requests.</div>;
  }

  const caseRequests = requests.filter(r => r.caseId === activeCase.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-serif text-white">Public Records & FOIA</h2>
          <p className="text-sm text-slate-400">Track and manage requests to government agencies and police departments.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-gold-600 hover:bg-gold-500 text-slate-900 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
        >
          <Plus size={18} />
          New Request
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Requests', value: caseRequests.length, color: 'text-blue-400' },
          { label: 'Completed', value: caseRequests.filter(r => r.status === 'Completed').length, color: 'text-green-400' },
          { label: 'Pending', value: caseRequests.filter(r => ['Sent', 'In Progress'].includes(r.status)).length, color: 'text-yellow-400' },
          { label: 'Denied/Overdue', value: caseRequests.filter(r => ['Denied', 'Overdue'].includes(r.status)).length, color: 'text-red-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-800 border border-slate-700 p-4 rounded-xl shadow-lg">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/50 border-b border-slate-700 text-slate-400 uppercase text-[10px] font-bold tracking-widest">
              <tr>
                <th className="px-6 py-4">Agency / Entity</th>
                <th className="px-6 py-4">Subject Matter</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Filed / Due</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {caseRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">
                    No public records requests tracked for this case yet.
                  </td>
                </tr>
              ) : (
                caseRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-slate-700 p-2 rounded-lg text-gold-500">
                          <FileText size={18} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-200">{req.agency}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{req.trackingNumber || 'No tracking ID'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300 max-w-xs truncate">
                      {req.subject}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        req.status === 'Completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                        req.status === 'Denied' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        req.status === 'Overdue' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs">
                        <p className="text-slate-300">{req.dateFiled}</p>
                        <p className="text-slate-500 mt-1 italic">Due: {req.dueDate || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all" title="Edit">
                          <Edit3 size={16} />
                        </button>
                        <button onClick={() => deleteRequest(req.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Plus className="text-gold-500" /> New Public Records Request
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleAddRequest} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Target Agency</label>
                  <input 
                    required
                    type="text" 
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-gold-500 outline-none" 
                    placeholder="e.g. LAPD, City Hall"
                    value={newRequest.agency}
                    onChange={e => setNewRequest({...newRequest, agency: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Tracking # (optional)</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-gold-500 outline-none"
                    placeholder="Ref #12345"
                    value={newRequest.trackingNumber}
                    onChange={e => setNewRequest({...newRequest, trackingNumber: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Subject Matter / Request Text</label>
                <textarea 
                  required
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm focus:border-gold-500 outline-none"
                  placeholder="Bodycam footage, dispatch logs, etc."
                  value={newRequest.subject}
                  onChange={e => setNewRequest({...newRequest, subject: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Status</label>
                  <select 
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm focus:border-gold-500 outline-none"
                    value={newRequest.status}
                    onChange={e => setNewRequest({...newRequest, status: e.target.value as any})}
                  >
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Date Filed</label>
                  <input 
                    type="date" 
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm focus:border-gold-500 outline-none"
                    value={newRequest.dateFiled}
                    onChange={e => setNewRequest({...newRequest, dateFiled: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Statutory Due Date</label>
                  <input 
                    type="date" 
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm focus:border-gold-500 outline-none"
                    value={newRequest.dueDate}
                    onChange={e => setNewRequest({...newRequest, dueDate: e.target.value})}
                  />
                </div>
              </div>
              <button 
                type="submit"
                className="w-full bg-gold-600 hover:bg-gold-500 text-slate-900 font-bold py-3 rounded-lg mt-4 shadow-lg shadow-gold-500/10 transition-all active:scale-[0.98]"
              >
                Create Request
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicRecordsManager;
