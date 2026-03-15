import React, { useState, useContext } from 'react';
import { AppContext } from '../App';
import { Shield, User, BadgeAlert, AlertTriangle, Plus, X, Search, FileText, ChevronRight, Star, HeartPulse, Trash2, Edit3, MapPin, Scale } from 'lucide-react';
import { handleSuccess, handleError } from '../utils/errorHandler';

interface Officer {
  id: string;
  name: string;
  badgeNumber: string;
  agency: string;
  rank: string;
  status: 'Active' | 'Under Investigation' | 'Retired' | 'Terminated';
  incidentCount: number;
  tags: string[];
  notes?: string;
  location?: string;
  rating: number; // 0-5, internal rating for audit/behavior
}

const OfficerDatabase = () => {
  const { activeCase } = useContext(AppContext);
  const [officers, setOfficers] = useState<Officer[]>([
    {
      id: 'o1',
      name: 'Sgt. Robert Miller',
      badgeNumber: '8842',
      agency: 'Metro PD',
      rank: 'Sergeant',
      status: 'Active',
      incidentCount: 12,
      tags: ['Aggressive', '1st Amendment Violation', 'Qualified Immunity Claimed'],
      location: 'Central District',
      rating: 1.5,
      notes: 'Involved in multiple civil rights audits. Known for aggressive response to legal recording.'
    },
    {
      id: 'o2',
      name: 'Officer Sarah Chen',
      badgeNumber: '9910',
      agency: 'County Sheriff',
      rank: 'Deputy',
      status: 'Active',
      incidentCount: 2,
      tags: ['Cooperative', 'Professional'],
      location: 'North Precinct',
      rating: 4.8,
      notes: 'Generally follows policy during audits. No history of misconduct found.'
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [newOfficer, setNewOfficer] = useState<Partial<Officer>>({
    name: '',
    badgeNumber: '',
    agency: '',
    status: 'Active',
    rating: 3
  });

  const handleAddOfficer = (e: React.FormEvent) => {
    e.preventDefault();
    const officer: Officer = {
      id: Date.now().toString(),
      name: newOfficer.name || '',
      badgeNumber: newOfficer.badgeNumber || '',
      agency: newOfficer.agency || '',
      rank: newOfficer.rank || 'Officer',
      status: (newOfficer.status as any) || 'Active',
      incidentCount: 0,
      tags: [],
      rating: newOfficer.rating || 3,
      notes: newOfficer.notes,
      location: newOfficer.location
    };

    setOfficers([...officers, officer]);
    setShowModal(false);
    handleSuccess('Officer profile added to database');
    setNewOfficer({ name: '', badgeNumber: '', agency: '', status: 'Active', rating: 3 });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-serif text-white flex items-center gap-3">
            <Shield className="text-gold-500" /> Law Enforcement Database
          </h2>
          <p className="text-sm text-slate-400">Track and monitor officers, agencies, and patterns of conduct.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or badge..."
              className="bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-gold-500 outline-none w-full md:w-64"
            />
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-gold-600 hover:bg-gold-500 text-slate-900 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <Plus size={18} />
            Add Officer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {officers.map((officer) => (
          <div key={officer.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-gold-500/30 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-700 rounded-full flex items-center justify-center text-slate-400 border-2 border-slate-600 overflow-hidden">
                  <User size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-gold-400 transition-colors">{officer.name}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-2">
                    <span className="font-mono text-gold-500">Badge #{officer.badgeNumber}</span>
                    <span>•</span>
                    <span>{officer.agency}</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-2 ${
                  officer.status === 'Active' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                  officer.status === 'Under Investigation' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                  'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                }`}>
                  {officer.status}
                </span>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={12} 
                      className={i < Math.floor(officer.rating) ? 'text-gold-500 fill-gold-500' : 'text-slate-600'} 
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-slate-900/50 p-2 rounded text-center">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Incidents</p>
                <p className="text-sm font-bold text-white">{officer.incidentCount}</p>
              </div>
              <div className="bg-slate-900/50 p-2 rounded text-center">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Rank</p>
                <p className="text-sm font-bold text-slate-300">{officer.rank}</p>
              </div>
              <div className="bg-slate-900/50 p-2 rounded text-center">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Location</p>
                <p className="text-sm font-bold text-slate-300 truncate">{officer.location || 'N/A'}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {officer.tags.map((tag, i) => (
                <span key={i} className="text-[10px] bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded border border-slate-600">
                  {tag}
                </span>
              ))}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed italic border-l-2 border-slate-700 pl-3 mb-4 line-clamp-2">
              {officer.notes}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
              <div className="flex gap-3">
                <button className="text-xs text-gold-500 hover:text-gold-400 font-bold flex items-center gap-1">
                  <FileText size={14} /> View Case History
                </button>
                <button className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1">
                  <MapPin size={14} /> Linked Audits
                </button>
              </div>
              <div className="flex gap-2">
                <button className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-700 rounded transition-all">
                  <Edit3 size={14} />
                </button>
                <button className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Shield className="text-gold-500" /> Add New Officer Profile
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleAddOfficer} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Full Name</label>
                  <input 
                    required
                    type="text" 
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-gold-500 outline-none" 
                    placeholder="e.g. Robert Miller"
                    value={newOfficer.name}
                    onChange={e => setNewOfficer({...newOfficer, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Badge Number</label>
                  <input 
                    required
                    type="text" 
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-gold-500 outline-none"
                    placeholder="e.g. 1234"
                    value={newOfficer.badgeNumber}
                    onChange={e => setNewOfficer({...newOfficer, badgeNumber: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Agency</label>
                  <input 
                    required
                    type="text" 
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-gold-500 outline-none" 
                    placeholder="e.g. Metro PD"
                    value={newOfficer.agency}
                    onChange={e => setNewOfficer({...newOfficer, agency: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Current Status</label>
                  <select 
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm focus:border-gold-500 outline-none"
                    value={newOfficer.status}
                    onChange={e => setNewOfficer({...newOfficer, status: e.target.value as any})}
                  >
                    <option value="Active">Active</option>
                    <option value="Under Investigation">Under Investigation</option>
                    <option value="Retired">Retired</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Internal Notes / Observations</label>
                <textarea 
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm focus:border-gold-500 outline-none"
                  placeholder="Behavioral patterns, known biases, history..."
                  value={newOfficer.notes}
                  onChange={e => setNewOfficer({...newOfficer, notes: e.target.value})}
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-gold-600 hover:bg-gold-500 text-slate-900 font-bold py-3 rounded-lg mt-4 shadow-lg shadow-gold-500/10 transition-all active:scale-[0.98]"
              >
                Create Profile
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficerDatabase;
