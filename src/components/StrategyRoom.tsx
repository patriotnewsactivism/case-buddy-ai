import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../App';
import { useKnowledge } from '../contexts/KnowledgeContext';
import { MOCK_OPPONENT } from '../constants';
import { predictStrategy } from '../services/geminiService';
import { StrategyInsight } from '../types';
import { BrainCircuit, Target, Shield, AlertOctagon, Lightbulb, RefreshCw } from 'lucide-react';

const StrategyRoom = () => {
  const { activeCase } = useContext(AppContext);
  const { getKnowledgeContext } = useKnowledge();
  const [insights, setInsights] = useState<StrategyInsight[]>([]);
  const [loading, setLoading] = useState(false);

  const opponent = activeCase?.opposingProfile || MOCK_OPPONENT;

  // Initial load
  useEffect(() => {
    if (activeCase && insights.length === 0) {
      handleGenerateStrategy();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCase?.id]);

  const handleGenerateStrategy = async () => {
    if (!activeCase) return;
    setLoading(true);
    const knowledgeContext = getKnowledgeContext(activeCase.id);
    const result = await predictStrategy(
      activeCase.summary,
      JSON.stringify(opponent),
      knowledgeContext
    );
    setInsights(result);
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold font-serif text-white">War Room Strategy</h1>
            <p className="text-slate-400 mt-1">Deep-thought analysis against {opponent.name}</p>
        </div>
        <button 
          onClick={handleGenerateStrategy}
          disabled={loading}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-gold-500 border border-gold-500/30 px-4 py-2 rounded-lg transition-all"
        >
           <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
           {loading ? 'AI Thinking...' : 'Regenerate Strategy'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Opponent Profile Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 h-fit">
           <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
             <Target className="text-red-500" size={20} />
             Opponent Profile
           </h3>
           
           <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center text-2xl font-bold text-slate-400">
                 {opponent.name.charAt(0)}
              </div>
              <div>
                 <div className="font-bold text-white text-lg">{opponent.name}</div>
                 <div className="text-sm text-slate-400">{opponent.firm}</div>
              </div>
           </div>

           <div className="space-y-4">
              <div>
                 <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Aggressiveness</span>
                    <span className="text-white">{opponent.aggressiveness}%</span>
                 </div>
                 <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${opponent.aggressiveness}%` }}></div>
                 </div>
              </div>
              <div>
                 <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Settlement Tendency</span>
                    <span className="text-white">{opponent.settlementTendency}%</span>
                 </div>
                 <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${opponent.settlementTendency}%` }}></div>
                 </div>
              </div>
           </div>

           <div className="mt-6">
              <h4 className="text-sm font-semibold text-slate-300 mb-2">Known Tactics</h4>
              <ul className="space-y-2">
                 {opponent.commonTactics.map((t, i) => (
                    <li key={i} className="text-xs bg-slate-900/50 px-3 py-2 rounded border border-slate-700 text-slate-400">
                       {t}
                    </li>
                 ))}
              </ul>
           </div>
        </div>

        {/* AI Insights Feed */}
        <div className="lg:col-span-2 space-y-6">
           {loading ? (
             <div className="h-64 bg-slate-800/50 rounded-xl border border-slate-700 flex flex-col items-center justify-center animate-pulse">
                <BrainCircuit size={48} className="text-gold-500 mb-4" />
                <p className="text-slate-300 font-medium">Analyzing case precedents and opponent psychology...</p>
                <p className="text-slate-500 text-sm mt-2">Thinking Budget: 2048 tokens</p>
             </div>
           ) : (
             insights.length > 0 ? (
               insights.map((insight, idx) => (
                 <div key={idx} className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-slate-500 transition-colors">
                    <div className="flex items-start gap-4">
                       <div className={`p-3 rounded-lg shrink-0 ${
                          insight.type === 'risk' ? 'bg-red-500/20 text-red-400' :
                          insight.type === 'opportunity' ? 'bg-green-500/20 text-green-400' :
                          'bg-blue-500/20 text-blue-400'
                       }`}>
                          {insight.type === 'risk' && <AlertOctagon size={24} />}
                          {insight.type === 'opportunity' && <Lightbulb size={24} />}
                          {insight.type === 'prediction' && <Shield size={24} />}
                       </div>
                       <div className="flex-1">
                          <h3 className="text-lg font-bold text-white mb-2">{insight.title}</h3>
                          
                          <p className="text-slate-300 leading-relaxed mb-4">{insight.description}</p>
                          
                          <div className="flex items-center gap-3">
                             <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Confidence Score:</span>
                             <div className="flex-1 bg-slate-900 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-1000 ${
                                    insight.confidence >= 80 ? 'bg-green-500' :
                                    insight.confidence >= 50 ? 'bg-gold-500' :
                                    'bg-red-500'
                                  }`} 
                                  style={{ width: `${insight.confidence}%` }}
                                ></div>
                             </div>
                             <span className={`text-xs font-bold ${
                                insight.confidence >= 80 ? 'text-green-400' :
                                insight.confidence >= 50 ? 'text-gold-500' :
                                'text-red-400'
                             }`}>
                                {insight.confidence}%
                             </span>
                          </div>
                       </div>
                    </div>
                 </div>
               ))
             ) : (
               <div className="h-64 bg-slate-800/50 rounded-xl border border-slate-700 flex items-center justify-center text-slate-500">
                  No insights generated yet.
               </div>
             )
           )}
        </div>
      </div>
    </div>
  );
};

export default StrategyRoom;