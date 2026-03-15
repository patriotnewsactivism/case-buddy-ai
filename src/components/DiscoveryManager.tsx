import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../App';
import { DiscoveryRequest, DiscoveryDeadline } from '../types';
import { FileSearch, Plus, Calendar, Clock, AlertTriangle, CheckCircle, XCircle, Filter, Download, Upload, Send, Link } from 'lucide-react';
import { toast } from 'react-toastify';

const DiscoveryManager = () => {
  const { activeCase, updateCase } = useContext(AppContext);
  const requests = activeCase?.discoveryRequests || [];
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [newRequest, setNewRequest] = useState<Partial<DiscoveryRequest>>({
    type: 'interrogatory',
    number: '',
    question: '',
    status: 'pending'
  });

  const [aiGeneratedRequests, setAiGeneratedRequests] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);

  const handleAddRequest = async () => {
    if (!newRequest.number || !newRequest.question) {
      toast.error('Please fill in all required fields');
      return;
    }

    const request: DiscoveryRequest = {
      id: crypto.randomUUID(),
      caseId: activeCase!.id,
      type: newRequest.type as any,
      number: newRequest.number,
      question: newRequest.question,
      response: newRequest.response,
      objections: newRequest.objections,
      servedDate: newRequest.servedDate,
      responseDueDate: newRequest.responseDueDate,
      responseDate: newRequest.responseDate,
      status: newRequest.status as any,
      privilegeLogEntry: newRequest.privilegeLogEntry,
      notes: newRequest.notes
    };

    const nextRequests = [...requests, request];
    await updateCase(activeCase!.id, { discoveryRequests: nextRequests });
    setNewRequest({ type: 'interrogatory', number: '', question: '', status: 'pending' });
    setShowAddModal(false);
    toast.success('Discovery request added');
  };

  const updateRequestStatus = async (id: string, status: DiscoveryRequest['status']) => {
    const nextRequests = requests.map(r => r.id === id ? { ...r, status } : r);
    await updateCase(activeCase!.id, { discoveryRequests: nextRequests });
    toast.success('Status updated');
  };

  const deleteRequest = async (id: string) => {
    if (window.confirm('Delete this discovery request?')) {
      const nextRequests = requests.filter(r => r.id !== id);
      await updateCase(activeCase!.id, { discoveryRequests: nextRequests });
      toast.success('Request deleted');
    }
  };

  const generateWithAI = async () => {
    if (!activeCase) return;
    setGenerating(true);
    try {
      const { GoogleGenAI, Type } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

      const prompt = `Generate discovery requests for this case:
      
Case: ${activeCase.title}
Summary: ${activeCase.summary}

Generate:
1. 10 interrogatories
2. 5 requests for production
3. 5 requests for admission

Return JSON array with objects containing: type (interrogatory/request-for-production/request-for-admission), number, question.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                number: { type: Type.STRING },
                question: { type: Type.STRING }
              }
            }
          }
        }
      });

      const generated = JSON.parse(response.text || '[]');
      const newRequests: DiscoveryRequest[] = generated.map((g: any, i: number) => ({
        id: crypto.randomUUID(),
        caseId: activeCase.id,
        type: g.type,
        number: g.number,
        question: g.question,
        status: 'pending' as const
      }));

      const nextRequests = [...requests, ...newRequests];
      await updateCase(activeCase.id, { discoveryRequests: nextRequests });
      toast.success(`Generated ${newRequests.length} discovery requests`);
    } catch (error) {
      console.error('AI generation failed', error);
      toast.error('Failed to generate requests');
    } finally {
      setGenerating(false);
    }
  };

  const exportDiscovery = () => {
    let content = `DISCOVERY REQUESTS\n`;
    content += `Case: ${activeCase?.title}\n`;
    content += `Generated: ${new Date().toLocaleDateString()}\n\n`;

    const types = ['interrogatory', 'request-for-production', 'request-for-admission'];
    const typeLabels = ['INTERROGATORIES', 'REQUESTS FOR PRODUCTION', 'REQUESTS FOR ADMISSION'];

    types.forEach((type, idx) => {
      const filtered = requests.filter(r => r.type === type);
      if (filtered.length > 0) {
        content += `${'='.repeat(50)}\n${typeLabels[idx]}\n${'='.repeat(50)}\n\n`;
        filtered.forEach(r => {
          content += `${r.number}. ${r.question}\n`;
          if (r.response) content += `Response: ${r.response}\n`;
          if (r.objections && r.objections.length > 0) content += `Objections: ${r.objections.join(', ')}\n`;
          content += `Status: ${r.status}\n\n`;
        });
      }
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `discovery-${activeCase?.title || 'case'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getDeadlines = (): DiscoveryDeadline[] => {
    return requests
      .filter(r => r.responseDueDate)
      .map(r => ({
        id: r.id,
        caseId: r.caseId,
        requestType: r.type,
        requestNumber: r.number,
        servedDate: r.servedDate || '',
        dueDate: r.responseDueDate || '',
        daysRemaining: Math.ceil((new Date(r.responseDueDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        status: r.status === 'responded' ? 'completed' as const : r.status === 'overdue' ? 'overdue' as const : 'upcoming' as const
      }))
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  };

  const filteredRequests = requests.filter(r => {
    if (filterType !== 'all' && r.type !== filterType) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-900/30 text-yellow-400 border-yellow-700';
      case 'responded': return 'bg-green-900/30 text-green-400 border-green-700';
      case 'objected': return 'bg-red-900/30 text-red-400 border-red-700';
      case 'overdue': return 'bg-red-900/50 text-red-300 border-red-600';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'interrogatory': return 'INT';
      case 'request-for-production': return 'RFP';
      case 'request-for-admission': return 'RFA';
      case 'deposition': return 'DEP';
      default: return type;
    }
  };

  if (!activeCase) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-slate-500">
        <AlertTriangle size={48} className="mb-4 opacity-50" />
        <p className="text-lg font-semibold">No Active Case Selected</p>
        <p className="text-sm mt-2 max-w-md text-center leading-relaxed mb-6">
          Select a case to manage discovery requests.
        </p>
        <Link to="/app/cases" className="bg-gold-600 hover:bg-gold-500 text-slate-900 font-bold px-6 py-3 rounded-lg transition-colors">
          Go to Case Files
        </Link>
      </div>
    );
  }

  const deadlines = getDeadlines();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-white">Discovery Manager</h1>
          <p className="text-slate-400 mt-1">Track and manage discovery requests for: {activeCase.title}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gold-500 hover:bg-gold-600 text-slate-900 font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus size={18} />
            Add Request
          </button>
          <button
            onClick={generateWithAI}
            disabled={generating}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            {generating ? 'Generating...' : 'AI Generate'}
          </button>
          {requests.length > 0 && (
            <button
              onClick={exportDiscovery}
              className="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Download size={18} />
              Export
            </button>
          )}
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h3 className="text-white font-semibold">Case: {activeCase.title}</h3>
        <p className="text-sm text-slate-400">{requests.length} discovery requests tracked</p>
      </div>

      {deadlines.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Clock className="text-red-500" size={20} />
            Upcoming Deadlines
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {deadlines.slice(0, 5).map(d => (
              <div key={d.id} className={`flex-shrink-0 p-3 rounded-lg border ${
                d.status === 'overdue' ? 'bg-red-900/30 border-red-700' :
                d.daysRemaining <= 3 ? 'bg-orange-900/30 border-orange-700' :
                'bg-slate-800 border-slate-700'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-slate-400">{getTypeLabel(d.requestType)}-{d.requestNumber}</span>
                  <span className={`text-xs font-bold ${
                    d.status === 'overdue' ? 'text-red-400' :
                    d.daysRemaining <= 3 ? 'text-orange-400' : 'text-green-400'
                  }`}>
                    {d.status === 'completed' ? 'Completed' :
                     d.status === 'overdue' ? 'OVERDUE' :
                     `${d.daysRemaining} days`}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{new Date(d.dueDate).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="text-slate-400" size={18} />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm"
          >
            <option value="all">All Types</option>
            <option value="interrogatory">Interrogatories</option>
            <option value="request-for-production">Requests for Production</option>
            <option value="request-for-admission">Requests for Admission</option>
            <option value="deposition">Depositions</option>
          </select>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="responded">Responded</option>
          <option value="objected">Objected</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
          <FileSearch className="mx-auto text-slate-600 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-white mb-2">No Discovery Requests</h3>
          <p className="text-slate-400 mb-6">Add requests manually or use AI to generate them</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gold-500 hover:bg-gold-600 text-slate-900 font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Add First Request
            </button>
            <button
              onClick={generateWithAI}
              disabled={generating}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              {generating ? 'Generating...' : 'Generate with AI'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map(request => (
            <div key={request.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-mono px-2 py-1 bg-slate-700 rounded text-slate-300">
                      {getTypeLabel(request.type)}-{request.number}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                    {request.objections && request.objections.length > 0 && (
                      <span className="text-xs text-red-400">Objections: {request.objections.length}</span>
                    )}
                  </div>
                  <p className="text-white text-sm mb-2">{request.question}</p>
                  {request.response && (
                    <div className="bg-slate-900/50 rounded p-3 mt-2">
                      <p className="text-xs text-slate-400 mb-1">Response:</p>
                      <p className="text-sm text-slate-300">{request.response}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                    {request.servedDate && (
                      <span>Served: {new Date(request.servedDate).toLocaleDateString()}</span>
                    )}
                    {request.responseDueDate && (
                      <span>Due: {new Date(request.responseDueDate).toLocaleDateString()}</span>
                    )}
                    {request.privilegeLogEntry && (
                      <span className="text-purple-400">Privilege Logged</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={request.status}
                    onChange={(e) => updateRequestStatus(request.id, e.target.value as any)}
                    className="text-xs bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-300"
                  >
                    <option value="pending">Pending</option>
                    <option value="responded">Responded</option>
                    <option value="objected">Objected</option>
                    <option value="overdue">Overdue</option>
                  </select>
                  <button
                    onClick={() => deleteRequest(request.id)}
                    className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-4">Add Discovery Request</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
                  <select
                    value={newRequest.type}
                    onChange={(e) => setNewRequest({ ...newRequest, type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="interrogatory">Interrogatory</option>
                    <option value="request-for-production">Request for Production</option>
                    <option value="request-for-admission">Request for Admission</option>
                    <option value="deposition">Deposition Notice</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Number</label>
                  <input
                    type="text"
                    value={newRequest.number || ''}
                    onChange={(e) => setNewRequest({ ...newRequest, number: e.target.value })}
                    placeholder="e.g., 1, 2.1, A"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Question / Request *</label>
                <textarea
                  value={newRequest.question || ''}
                  onChange={(e) => setNewRequest({ ...newRequest, question: e.target.value })}
                  placeholder="State the question or request..."
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Date Served</label>
                  <input
                    type="date"
                    value={newRequest.servedDate || ''}
                    onChange={(e) => setNewRequest({ ...newRequest, servedDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Response Due</label>
                  <input
                    type="date"
                    value={newRequest.responseDueDate || ''}
                    onChange={(e) => setNewRequest({ ...newRequest, responseDueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Response</label>
                <textarea
                  value={newRequest.response || ''}
                  onChange={(e) => setNewRequest({ ...newRequest, response: e.target.value })}
                  placeholder="Enter the response when received..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Objections</label>
                <input
                  type="text"
                  value={newRequest.objections?.join(', ') || ''}
                  onChange={(e) => setNewRequest({ ...newRequest, objections: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder="e.g., Overbroad, Vague, Irrelevant"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="privilege"
                  checked={newRequest.privilegeLogEntry || false}
                  onChange={(e) => setNewRequest({ ...newRequest, privilegeLogEntry: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="privilege" className="text-sm text-slate-300">Add to Privilege Log</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddRequest}
                  disabled={!newRequest.number || !newRequest.question}
                  className="flex-1 bg-gold-500 hover:bg-gold-600 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 font-semibold py-2 rounded-lg transition-colors"
                >
                  Add Request
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewRequest({ type: 'interrogatory', number: '', question: '', status: 'pending' });
                  }}
                  className="px-6 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscoveryManager;