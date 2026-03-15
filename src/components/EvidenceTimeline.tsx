
import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { DocumentType, Evidence, EvidenceStatus, TimelineEvent, TimelineEventImportance, TimelineEventType } from '../types';
import { Calendar, Clock, Plus, Edit2, Trash2, AlertCircle, FileText, Filter, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

const EvidenceTimeline = () => {
  const { activeCase } = useContext(AppContext);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showAddEvidence, setShowAddEvidence] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'importance'>('date');

  // New event form
  const [newEvent, setNewEvent] = useState<Partial<TimelineEvent>>({
    type: 'incident',
    importance: 'medium',
    date: new Date().toISOString().split('T')[0]
  });

  // New evidence form
  const [newEvidence, setNewEvidence] = useState<Partial<Evidence>>({
    type: DocumentType.EVIDENCE,
    status: 'pending',
    dateObtained: new Date().toISOString().split('T')[0]
  });

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.date) return;

    const event: TimelineEvent = {
      id: `event-${Date.now()}`,
      title: newEvent.title,
      date: newEvent.date,
      time: newEvent.time,
      description: newEvent.description || '',
      type: newEvent.type as TimelineEventType,
      importance: newEvent.importance as TimelineEventImportance,
      tags: newEvent.tags,
      linkedEvidence: newEvent.linkedEvidence,
      linkedWitnesses: newEvent.linkedWitnesses
    };

    setEvents([...events, event].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    setNewEvent({
      type: 'incident',
      importance: 'medium',
      date: new Date().toISOString().split('T')[0]
    });
    setShowAddEvent(false);
  };

  const handleAddEvidence = () => {
    if (!newEvidence.name) return;

    const evidence: Evidence = {
      id: `evidence-${Date.now()}`,
      name: newEvidence.name!,
      type: newEvidence.type!,
      description: newEvidence.description || '',
      dateObtained: newEvidence.dateObtained!,
      exhibitNumber: newEvidence.exhibitNumber,
      source: newEvidence.source,
      status: newEvidence.status as EvidenceStatus,
      tags: newEvidence.tags,
      notes: newEvidence.notes
    };

    setEvidenceList([...evidenceList, evidence]);
    setNewEvidence({
      type: DocumentType.EVIDENCE,
      status: 'pending',
      dateObtained: new Date().toISOString().split('T')[0]
    });
    setShowAddEvidence(false);
  };

  const deleteEvent = (id: string) => {
    if (window.confirm('Delete this timeline event?')) {
      setEvents(events.filter(e => e.id !== id));
    }
  };

  const deleteEvidence = (id: string) => {
    if (window.confirm('Delete this evidence?')) {
      setEvidenceList(evidenceList.filter(e => e.id !== id));
    }
  };

  const exportTimeline = () => {
    const data = {
      caseTitle: activeCase?.title,
      exportDate: new Date().toISOString(),
      events: events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      evidence: evidenceList
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timeline-${activeCase?.title || 'case'}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      incident: 'bg-red-900/30 border-red-700 text-red-400',
      evidence: 'bg-blue-900/30 border-blue-700 text-blue-400',
      witness: 'bg-purple-900/30 border-purple-700 text-purple-400',
      filing: 'bg-yellow-900/30 border-yellow-700 text-yellow-400',
      hearing: 'bg-green-900/30 border-green-700 text-green-400',
      other: 'bg-slate-800 border-slate-700 text-slate-400'
    };
    return colors[type] || colors.other;
  };

  const getImportanceBadge = (importance: string) => {
    const styles: Record<string, string> = {
      critical: 'bg-red-600 text-white',
      high: 'bg-orange-600 text-white',
      medium: 'bg-yellow-600 text-slate-900',
      low: 'bg-slate-600 text-white'
    };
    return styles[importance] || styles.low;
  };

  const filteredEvents = filterType === 'all'
    ? events
    : events.filter(e => e.type === filterType);

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    } else {
      const importanceOrder: Record<TimelineEventImportance, number> = { critical: 4, high: 3, medium: 2, low: 1 };
      return importanceOrder[b.importance] - importanceOrder[a.importance];
    }
  });

  if (!activeCase) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-slate-500">
        <AlertCircle size={48} className="mb-4 opacity-50" />
        <p className="text-lg font-semibold">No Active Case Selected</p>
        <p className="text-sm mt-2 max-w-md text-center leading-relaxed mb-6">
          Select a case to organize its evidence timeline.
        </p>
        <Link to="/app/cases" className="bg-gold-600 hover:bg-gold-500 text-slate-900 font-bold px-6 py-3 rounded-lg transition-colors">
          Go to Case Files
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white font-serif">Evidence Timeline</h1>
          <p className="text-slate-400 mt-2">Organize case events and exhibits chronologically</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddEvent(true)}
            className="bg-gold-500 hover:bg-gold-600 text-slate-900 font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus size={18} />
            Add Event
          </button>
          <button
            onClick={() => setShowAddEvidence(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <FileText size={18} />
            Add Evidence
          </button>
          {events.length > 0 && (
            <button
              onClick={exportTimeline}
              className="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Download size={18} />
              Export
            </button>
          )}
        </div>
      </div>

      {/* Active Case */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h3 className="text-white font-semibold">Case: {activeCase.title}</h3>
        <p className="text-sm text-slate-400 mt-1">{activeCase.summary}</p>
      </div>

      {/* Filters & Sort */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="text-slate-400" size={18} />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm"
          >
            <option value="all">All Types</option>
            <option value="incident">Incidents</option>
            <option value="evidence">Evidence</option>
            <option value="witness">Witnesses</option>
            <option value="filing">Filings</option>
            <option value="hearing">Hearings</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-sm">Sort by:</span>
          <button
            onClick={() => setSortBy('date')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              sortBy === 'date' ? 'bg-gold-500 text-slate-900' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Date
          </button>
          <button
            onClick={() => setSortBy('importance')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              sortBy === 'importance' ? 'bg-gold-500 text-slate-900' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Importance
          </button>
        </div>

        <span className="text-slate-400 text-sm ml-auto">{sortedEvents.length} events</span>
      </div>

      {/* Timeline */}
      {sortedEvents.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
          <Calendar className="mx-auto text-slate-600 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-white mb-2">No Timeline Events Yet</h3>
          <p className="text-slate-400 mb-6">Start building your case timeline by adding events</p>
          <button
            onClick={() => setShowAddEvent(true)}
            className="bg-gold-500 hover:bg-gold-600 text-slate-900 font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Add First Event
          </button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Timeline Events */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-700"></div>

              {sortedEvents.map((event, index) => (
                <div key={event.id} className="relative pl-16 pb-8">
                  {/* Timeline dot */}
                  <div className={`absolute left-3 w-6 h-6 rounded-full border-4 ${getTypeColor(event.type)} flex items-center justify-center`}>
                    <div className="w-2 h-2 rounded-full bg-current"></div>
                  </div>

                  {/* Event card */}
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white">{event.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded ${getImportanceBadge(event.importance)}`}>
                            {event.importance}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(event.date).toLocaleDateString()}
                          </span>
                          {event.time && (
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {event.time}
                            </span>
                          )}
                          <span className={`capitalize px-2 py-0.5 rounded text-xs ${getTypeColor(event.type)}`}>
                            {event.type}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button className="p-1 text-slate-400 hover:text-white transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => deleteEvent(event.id)}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {event.description && (
                      <p className="text-sm text-slate-300 mt-2">{event.description}</p>
                    )}

                    {event.tags && event.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {event.tags.map((tag, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 bg-slate-700 text-slate-400 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Evidence List */}
          <div className="space-y-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <FileText size={18} />
                Evidence List ({evidenceList.length})
              </h3>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {evidenceList.map(evidence => (
                  <div key={evidence.id} className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1 min-w-0">
                        {evidence.exhibitNumber && (
                          <span className="text-xs font-mono text-gold-500">{evidence.exhibitNumber}</span>
                        )}
                        <h4 className="font-semibold text-white text-sm">{evidence.name}</h4>
                        <p className="text-xs text-slate-400 mt-1">{evidence.description}</p>
                      </div>
                      <button
                        onClick={() => deleteEvidence(evidence.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        evidence.status === 'admitted' ? 'bg-green-900/30 text-green-400' :
                        evidence.status === 'excluded' ? 'bg-red-900/30 text-red-400' :
                        evidence.status === 'challenged' ? 'bg-yellow-900/30 text-yellow-400' :
                        'bg-slate-700 text-slate-400'
                      }`}>
                        {evidence.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-4">Add Timeline Event</h2>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Date *</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Time</label>
                  <input
                    type="time"
                    value={newEvent.time || ''}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Title *</label>
                <input
                  type="text"
                  value={newEvent.title || ''}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="E.g., Incident occurred at 123 Main St"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea
                  value={newEvent.description || ''}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Detailed description of what happened..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
                  <select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as TimelineEventType })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                  >
                    <option value="incident">Incident</option>
                    <option value="evidence">Evidence</option>
                    <option value="witness">Witness</option>
                    <option value="filing">Filing</option>
                    <option value="hearing">Hearing</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Importance</label>
                  <select
                    value={newEvent.importance}
                    onChange={(e) => setNewEvent({ ...newEvent, importance: e.target.value as TimelineEventImportance })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddEvent}
                  disabled={!newEvent.title || !newEvent.date}
                  className="flex-1 bg-gold-500 hover:bg-gold-600 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 font-semibold py-2 rounded-lg transition-colors"
                >
                  Add Event
                </button>
                <button
                  onClick={() => {
                    setShowAddEvent(false);
                    setNewEvent({
                      type: 'incident',
                      importance: 'medium',
                      date: new Date().toISOString().split('T')[0]
                    });
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

      {/* Add Evidence Modal */}
      {showAddEvidence && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-4">Add Evidence</h2>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Exhibit Number</label>
                  <input
                    type="text"
                    value={newEvidence.exhibitNumber || ''}
                    onChange={(e) => setNewEvidence({ ...newEvidence, exhibitNumber: e.target.value })}
                    placeholder="E.g., Plaintiff Ex. 1"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Date Obtained</label>
                  <input
                    type="date"
                    value={newEvidence.dateObtained}
                    onChange={(e) => setNewEvidence({ ...newEvidence, dateObtained: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Name *</label>
                <input
                  type="text"
                  value={newEvidence.name || ''}
                  onChange={(e) => setNewEvidence({ ...newEvidence, name: e.target.value })}
                  placeholder="E.g., Security Camera Footage"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea
                  value={newEvidence.description || ''}
                  onChange={(e) => setNewEvidence({ ...newEvidence, description: e.target.value })}
                  placeholder="Describe the evidence..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                  <select
                    value={newEvidence.status}
                    onChange={(e) => setNewEvidence({ ...newEvidence, status: e.target.value as EvidenceStatus })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="admitted">Admitted</option>
                    <option value="excluded">Excluded</option>
                    <option value="challenged">Challenged</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Source</label>
                  <input
                    type="text"
                    value={newEvidence.source || ''}
                    onChange={(e) => setNewEvidence({ ...newEvidence, source: e.target.value })}
                    placeholder="E.g., Police Report"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddEvidence}
                  disabled={!newEvidence.name}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-2 rounded-lg transition-colors"
                >
                  Add Evidence
                </button>
                <button
                  onClick={() => {
                    setShowAddEvidence(false);
                    setNewEvidence({
                      type: DocumentType.EVIDENCE,
                      status: 'pending',
                      dateObtained: new Date().toISOString().split('T')[0]
                    });
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

export default EvidenceTimeline;
