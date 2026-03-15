import React, { useState, useContext, useRef, useEffect } from 'react';
import { AppContext } from '../App';
import { NegotiationScenario, NegotiationRound } from '../types';
import { Handshake, TrendingUp, TrendingDown, DollarSign, Send, RefreshCw, User, Building, AlertTriangle, CheckCircle, Link } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { toast } from 'react-toastify';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const NegotiationSimulator = () => {
  const { activeCase } = useContext(AppContext);
  const [scenario, setScenario] = useState<NegotiationScenario | null>(null);
  const [opponentPersona, setOpponentPersona] = useState('');
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [scenario?.rounds]);

  const startNegotiation = async () => {
    if (!activeCase) return;
    setLoading(true);

    try {
      const prompt = `Create a realistic settlement negotiation scenario for this case:

Case: ${activeCase.title}
Summary: ${activeCase.summary}

Generate:
1. Opponent type (insurance company, corporation, individual, or government entity)
2. Opponent's negotiation tactics (lowballing, delay, credibility attacks, etc.)
3. Realistic settlement range based on case value
4. Initial offer from opponent

Return JSON with:
- opponentType: string
- opponentTactics: array of strings
- settlementRange: [low, high]
- initialOffer: number
- opponentPersona: brief description of who you're negotiating with`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              opponentType: { type: Type.STRING },
              opponentTactics: { type: Type.ARRAY, items: { type: Type.STRING } },
              settlementRange: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              initialOffer: { type: Type.NUMBER },
              opponentPersona: { type: Type.STRING }
            }
          }
        }
      });

      const result = JSON.parse(response.text || '{}');

      const newScenario: NegotiationScenario = {
        id: `neg-${Date.now()}`,
        caseId: activeCase.id,
        opponentType: result.opponentType || 'corporation',
        opponentTactics: result.opponentTactics || ['Lowball offers', 'Delay tactics'],
        settlementRange: result.settlementRange || [50000, 150000],
        initialOffer: result.initialOffer || 40000,
        currentOffer: result.initialOffer || 40000,
        rounds: [],
        status: 'active'
      };

      setScenario(newScenario);
      setOpponentPersona(result.opponentPersona || 'Insurance adjuster');
      setCurrentPosition(result.settlementRange?.[1] || 150000);
      toast.success('Negotiation started');
    } catch (error) {
      console.error('Failed to start negotiation', error);
      toast.error('Failed to initialize negotiation');
    } finally {
      setLoading(false);
    }
  };

  const sendProposal = async () => {
    if (!scenario || !userInput.trim()) return;

    const userAmount = parseInt(userInput.match(/\$?([\d,]+)/)?.[1]?.replace(/,/g, '') || '0');
    if (userAmount === 0) {
      toast.error('Please include a dollar amount in your message');
      return;
    }

    setLoading(true);
    const currentRound = scenario.rounds.length + 1;

    try {
      const prompt = `You are a ${scenario.opponentType} negotiator in a settlement negotiation.

Your persona: ${opponentPersona}
Your tactics: ${scenario.opponentTactics.join(', ')}
Settlement range you're authorized to accept: $${scenario.settlementRange[0].toLocaleString()} - $${scenario.settlementRange[1].toLocaleString()}
Your current offer: $${scenario.currentOffer.toLocaleString()}
The plaintiff's last demand: $${userAmount.toLocaleString()}

The plaintiff's attorney just said: "${userInput}"

Respond as the negotiator. Be realistic - if their demand is close to your range, consider compromising. If they're being unreasonable, hold firm or walk away. Use your negotiation tactics appropriately.

Return JSON with:
- response: your counter-response (2-4 sentences)
- newOffer: your new offer number (if any, otherwise same as current)
- reaction: one of "interested", "firm", "frustrated", "willing", "walking away"`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              response: { type: Type.STRING },
              newOffer: { type: Type.NUMBER },
              reaction: { type: Type.STRING }
            }
          }
        }
      });

      const result = JSON.parse(response.text || '{}');

      const newRound: NegotiationRound = {
        round: currentRound,
        yourPosition: userAmount,
        opponentPosition: result.newOffer || scenario.currentOffer,
        yourArgument: userInput,
        opponentResponse: result.response,
        timestamp: Date.now()
      };

      const updatedScenario = {
        ...scenario,
        rounds: [...scenario.rounds, newRound],
        currentOffer: result.newOffer || scenario.currentOffer,
        status: result.reaction === 'walking away' ? 'impasse' as const :
                Math.abs(userAmount - (result.newOffer || scenario.currentOffer)) < 5000 ? 'settled' as const :
                'active' as const,
        outcome: result.reaction === 'walking away' 
          ? { reason: 'Opponent walked away from negotiation' }
          : Math.abs(userAmount - (result.newOffer || scenario.currentOffer)) < 5000
          ? { settledAmount: Math.round((userAmount + (result.newOffer || scenario.currentOffer)) / 2) }
          : undefined
      };

      setScenario(updatedScenario);
      setUserInput('');

      if (updatedScenario.status === 'settled') {
        toast.success('Settlement reached!');
      } else if (updatedScenario.status === 'impasse') {
        toast.error('Negotiation reached impasse');
      }
    } catch (error) {
      console.error('Negotiation failed', error);
      toast.error('Failed to process proposal');
    } finally {
      setLoading(false);
    }
  };

  const resetNegotiation = () => {
    setScenario(null);
    setUserInput('');
    setCurrentPosition(0);
  };

  const getOpponentIcon = () => {
    switch (scenario?.opponentType) {
      case 'insurance': return Building;
      case 'corporation': return Building;
      case 'government': return Building;
      default: return User;
    }
  };

  const OpponentIcon = scenario ? getOpponentIcon() : User;

  if (!activeCase) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-slate-500">
        <Handshake className="mb-4 opacity-50" size={48} />
        <p className="text-lg font-semibold">No Active Case Selected</p>
        <p className="text-sm mt-2 max-w-md text-center leading-relaxed mb-6">
          Select a case to practice negotiation.
        </p>
        <Link to="/app/cases" className="bg-gold-600 hover:bg-gold-500 text-slate-900 font-bold px-6 py-3 rounded-lg transition-colors">
          Go to Case Files
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-white">Negotiation Simulator</h1>
          <p className="text-slate-400 mt-1">Practice settlement negotiations with AI</p>
        </div>
        {scenario && (
          <button
            onClick={resetNegotiation}
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <RefreshCw size={18} />
            New Negotiation
          </button>
        )}
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h3 className="text-white font-semibold">Negotiating for: {activeCase.title}</h3>
        <p className="text-sm text-slate-400">{activeCase.summary}</p>
      </div>

      {!scenario ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
          <Handshake className="mx-auto text-slate-600 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-white mb-2">Start a Negotiation</h3>
          <p className="text-slate-400 mb-6">Practice your settlement negotiation skills against an AI opponent</p>
          <button
            onClick={startNegotiation}
            disabled={loading}
            className="bg-gold-500 hover:bg-gold-600 disabled:bg-slate-700 text-slate-900 font-bold px-8 py-4 rounded-xl transition-colors flex items-center gap-2 mx-auto"
          >
            {loading ? (
              <>
                <RefreshCw className="animate-spin" size={20} />
                Initializing...
              </>
            ) : (
              <>
                <Handshake size={20} />
                Start Negotiation
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center">
                  <OpponentIcon className="text-slate-400" size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{scenario.opponentType.charAt(0).toUpperCase() + scenario.opponentType.slice(1)} Negotiator</h3>
                  <p className="text-sm text-slate-400">{opponentPersona}</p>
                  <div className="flex gap-2 mt-1">
                    {scenario.opponentTactics.slice(0, 3).map((t, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-slate-700 text-slate-400 rounded">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <div className="h-[400px] overflow-y-auto p-4 space-y-4">
                <div className="flex justify-center">
                  <span className="text-xs text-slate-500 bg-slate-700 px-3 py-1 rounded-full">
                    Negotiation started • Initial offer: ${scenario.initialOffer.toLocaleString()}
                  </span>
                </div>

                {scenario.rounds.map((round) => (
                  <div key={round.round} className="space-y-3">
                    <div className="flex justify-end">
                      <div className="max-w-[80%] bg-blue-600 rounded-2xl rounded-br-none px-4 py-3">
                        <p className="text-sm text-white">{round.yourArgument}</p>
                        <p className="text-xs text-blue-200 mt-1">Position: ${round.yourPosition.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="max-w-[80%] bg-slate-700 rounded-2xl rounded-bl-none px-4 py-3">
                        <p className="text-sm text-white">{round.opponentResponse}</p>
                        <p className="text-xs text-slate-400 mt-1">Counter: ${round.opponentPosition.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {scenario.status !== 'active' && (
                  <div className={`flex justify-center mt-4 ${scenario.status === 'settled' ? 'text-green-400' : 'text-red-400'}`}>
                    <div className={`px-6 py-4 rounded-xl ${scenario.status === 'settled' ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
                      {scenario.status === 'settled' ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle size={24} />
                          <span className="font-bold">Settled at ${scenario.outcome?.settledAmount?.toLocaleString()}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={24} />
                          <span className="font-bold">Impasse - {scenario.outcome?.reason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {scenario.status === 'active' && (
                <div className="border-t border-slate-700 p-4">
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !loading && sendProposal()}
                        placeholder="Make your argument and include a dollar amount..."
                        className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-gold-500 outline-none"
                      />
                    </div>
                    <button
                      onClick={sendProposal}
                      disabled={loading || !userInput.trim()}
                      className="bg-gold-500 hover:bg-gold-600 disabled:bg-slate-700 text-slate-900 font-bold px-6 rounded-lg transition-colors"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Settlement Range</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Floor</span>
                  <span className="text-green-400 font-bold">${scenario.settlementRange[0].toLocaleString()}</span>
                </div>
                <div className="h-4 bg-slate-700 rounded-full relative">
                  <div
                    className="absolute h-4 bg-gradient-to-r from-green-600 to-red-600 rounded-full"
                    style={{ 
                      left: '0%', 
                      right: '0%',
                    }}
                  />
                  <div
                    className="absolute h-4 w-1 bg-white rounded-full"
                    style={{ 
                      left: `${Math.min(100, Math.max(0, ((scenario.currentOffer - scenario.settlementRange[0]) / (scenario.settlementRange[1] - scenario.settlementRange[0])) * 100))}%` 
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Ceiling</span>
                  <span className="text-red-400 font-bold">${scenario.settlementRange[1].toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Current Positions</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
                  <span className="text-blue-400 text-sm">Your Position</span>
                  <span className="text-white font-bold">
                    ${currentPosition.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-900/20 border border-red-700 rounded-lg">
                  <span className="text-red-400 text-sm">Their Offer</span>
                  <span className="text-white font-bold">${scenario.currentOffer.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gold-900/20 border border-gold-700 rounded-lg">
                  <span className="text-gold-400 text-sm">Gap</span>
                  <span className="text-white font-bold">
                    ${Math.abs(currentPosition - scenario.currentOffer).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Round History</h3>
              {scenario.rounds.length === 0 ? (
                <p className="text-slate-400 text-sm">No rounds yet</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {scenario.rounds.map((round) => (
                    <div key={round.round} className="flex items-center justify-between text-sm p-2 bg-slate-900/50 rounded">
                      <span className="text-slate-400">Round {round.round}</span>
                      <div className="flex gap-3">
                        <span className="text-blue-400">${round.yourPosition.toLocaleString()}</span>
                        <span className="text-slate-600">→</span>
                        <span className="text-red-400">${round.opponentPosition.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Tips</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-start gap-2">
                  <TrendingUp className="text-green-500 mt-0.5 flex-shrink-0" size={14} />
                  Start high, leave room to negotiate
                </li>
                <li className="flex items-start gap-2">
                  <DollarSign className="text-gold-500 mt-0.5 flex-shrink-0" size={14} />
                  Justify your demand with facts
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="text-orange-500 mt-0.5 flex-shrink-0" size={14} />
                  Watch for their negotiation tactics
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NegotiationSimulator;