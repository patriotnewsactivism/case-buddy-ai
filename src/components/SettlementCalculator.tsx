import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../App';
import { SettlementAnalysis, SettlementFactor, EconomicDamages, NonEconomicDamages } from '../types';
import { Calculator, DollarSign, TrendingUp, TrendingDown, AlertCircle, RefreshCw, Save, Download, Info, Link } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { toast } from 'react-toastify';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const SettlementCalculator = () => {
  const { activeCase, updateCase } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const currentAnalyses = activeCase?.settlementAnalyses || [];
  const [analysis, setAnalysis] = useState<SettlementAnalysis | null>(currentAnalyses[0] || null);
  const [showManual, setShowManual] = useState(false);

  const [economicDamages, setEconomicDamages] = useState<EconomicDamages>({
    medicalExpenses: 0,
    medicalExpensesFuture: 0,
    lostWages: 0,
    lostWagesFuture: 0,
    propertyDamage: 0,
    otherEconomic: 0,
    total: 0
  });

  const [nonEconomicDamages, setNonEconomicDamages] = useState<NonEconomicDamages>({
    painAndSuffering: 0,
    emotionalDistress: 0,
    lossOfConsortium: 0,
    lossOfEnjoyment: 0,
    disfigurement: 0,
    multiplier: 1.5,
    total: 0
  });

  const [comparativeNegligence, setComparativeNegligence] = useState(0);
  const [caseDescription, setCaseDescription] = useState('');

  useEffect(() => {
    const economicTotal = economicDamages.medicalExpenses + economicDamages.medicalExpensesFuture +
      economicDamages.lostWages + economicDamages.lostWagesFuture +
      economicDamages.propertyDamage + economicDamages.otherEconomic;
    setEconomicDamages(prev => ({ ...prev, total: economicTotal }));
  }, [economicDamages.medicalExpenses, economicDamages.medicalExpensesFuture, 
      economicDamages.lostWages, economicDamages.lostWagesFuture, 
      economicDamages.propertyDamage, economicDamages.otherEconomic]);

  useEffect(() => {
    const base = economicDamages.total;
    const nonEconTotal = (base * nonEconomicDamages.multiplier) + 
      nonEconomicDamages.painAndSuffering + nonEconomicDamages.emotionalDistress +
      nonEconomicDamages.lossOfConsortium + nonEconomicDamages.lossOfEnjoyment +
      nonEconomicDamages.disfigurement;
    setNonEconomicDamages(prev => ({ ...prev, total: nonEconTotal }));
  }, [economicDamages.total, nonEconomicDamages.multiplier, 
      nonEconomicDamages.painAndSuffering, nonEconomicDamages.emotionalDistress,
      nonEconomicDamages.lossOfConsortium, nonEconomicDamages.lossOfEnjoyment,
      nonEconomicDamages.disfigurement]);

  const calculateSettlement = async () => {
    if (!activeCase) return;
    if (economicDamages.total === 0 && nonEconomicDamages.total === 0) {
      toast.error('Please enter damages to calculate');
      return;
    }

    const totalDamages = economicDamages.total + nonEconomicDamages.total;
    const adjustedDamages = totalDamages * (1 - comparativeNegligence / 100);
    const lowRange = adjustedDamages * 0.7;
    const highRange = adjustedDamages * 1.1;
    const recommended = adjustedDamages * 0.85;

    const factors: SettlementFactor[] = [];
    
    if (comparativeNegligence > 0) {
      factors.push({
        factor: 'Comparative Negligence',
        impact: 'negative',
        weight: comparativeNegligence,
        description: `Plaintiff ${comparativeNegligence}% at fault reduces recovery`
      });
    }
    
    if (economicDamages.medicalExpenses > 50000) {
      factors.push({
        factor: 'High Medical Damages',
        impact: 'positive',
        weight: 15,
        description: 'Significant medical expenses support higher settlement'
      });
    }

    if (nonEconomicDamages.multiplier >= 2) {
      factors.push({
        factor: 'Pain & Suffering Multiplier',
        impact: 'positive',
        weight: 10,
        description: `Multiplier of ${nonEconomicDamages.multiplier}x applied`
      });
    }

    const result: SettlementAnalysis = {
      id: crypto.randomUUID(),
      caseId: activeCase.id,
      date: new Date().toISOString(),
      economicDamages,
      nonEconomicDamages,
      comparativeNegligence,
      settlementRange: [Math.round(lowRange), Math.round(highRange)],
      recommendedDemand: Math.round(recommended),
      confidenceScore: 70,
      factors,
      negotiationStrategy: `Start demand at $${Math.round(highRange).toLocaleString()}, expect counter around $${Math.round(lowRange * 1.1).toLocaleString()}. Be prepared to justify multiplier with medical evidence and testimony.`
    };

    const nextAnalyses = [result, ...currentAnalyses].slice(0, 10);
    await updateCase(activeCase.id, { settlementAnalyses: nextAnalyses });
    setAnalysis(result);
    toast.success('Settlement calculated successfully');
  };

  const analyzeWithAI = async () => {
    if (!activeCase || !caseDescription.trim()) {
      toast.error('Please provide case details for AI analysis');
      return;
    }

    setLoading(true);
    try {
      const prompt = `You are a settlement calculation expert. Analyze this case and provide settlement recommendations.

Case: ${activeCase.title}
Summary: ${activeCase.summary}
Additional Details: ${caseDescription}

Provide:
1. Estimated economic damages breakdown (medical expenses, lost wages, property damage)
2. Appropriate pain & suffering multiplier (typically 1.5-5x)
3. Comparative negligence percentage estimate
4. Settlement range recommendation
5. Key factors affecting settlement value
6. Negotiation strategy

Return JSON with: economicDamages, nonEconomicDamages (with multiplier), comparativeNegligence, settlementRange [low, high], recommendedDemand, factors (array of {factor, impact, weight, description}), negotiationStrategy, confidenceScore.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              economicDamages: {
                type: Type.OBJECT,
                properties: {
                  medicalExpenses: { type: Type.NUMBER },
                  medicalExpensesFuture: { type: Type.NUMBER },
                  lostWages: { type: Type.NUMBER },
                  lostWagesFuture: { type: Type.NUMBER },
                  propertyDamage: { type: Type.NUMBER },
                  otherEconomic: { type: Type.NUMBER },
                  total: { type: Type.NUMBER }
                }
              },
              nonEconomicDamages: {
                type: Type.OBJECT,
                properties: {
                  multiplier: { type: Type.NUMBER },
                  total: { type: Type.NUMBER }
                }
              },
              comparativeNegligence: { type: Type.NUMBER },
              settlementRange: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              recommendedDemand: { type: Type.NUMBER },
              factors: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    factor: { type: Type.STRING },
                    impact: { type: Type.STRING },
                    weight: { type: Type.NUMBER },
                    description: { type: Type.STRING }
                  }
                }
              },
              negotiationStrategy: { type: Type.STRING },
              confidenceScore: { type: Type.NUMBER }
            }
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      const newAnalysis: SettlementAnalysis = {
        id: crypto.randomUUID(),
        caseId: activeCase.id,
        date: new Date().toISOString(),
        economicDamages: result.economicDamages || economicDamages,
        nonEconomicDamages: result.nonEconomicDamages || nonEconomicDamages,
        comparativeNegligence: result.comparativeNegligence || 0,
        settlementRange: result.settlementRange || [0, 0],
        recommendedDemand: result.recommendedDemand || 0,
        confidenceScore: result.confidenceScore || 50,
        factors: result.factors || [],
        negotiationStrategy: result.negotiationStrategy || ''
      };
      
      const nextAnalyses = [newAnalysis, ...currentAnalyses].slice(0, 10);
      await updateCase(activeCase.id, { settlementAnalyses: nextAnalyses });
      setAnalysis(newAnalysis);
      
      if (result.economicDamages) {
        setEconomicDamages(result.economicDamages);
      }
      if (result.nonEconomicDamages) {
        setNonEconomicDamages(prev => ({ ...prev, ...result.nonEconomicDamages }));
      }
      if (result.comparativeNegligence !== undefined) {
        setComparativeNegligence(result.comparativeNegligence);
      }
      
      toast.success('AI analysis complete');
    } catch (error) {
      console.error('AI analysis failed', error);
      toast.error('AI analysis failed. Check API key.');
    } finally {
      setLoading(false);
    }
  };

  const exportAnalysis = () => {
    if (!analysis) return;
    const content = `SETTLEMENT ANALYSIS REPORT
========================
Case: ${activeCase?.title}
Date: ${new Date(analysis.date).toLocaleDateString()}

ECONOMIC DAMAGES
----------------
Medical Expenses (Past): $${economicDamages.medicalExpenses.toLocaleString()}
Medical Expenses (Future): $${economicDamages.medicalExpensesFuture.toLocaleString()}
Lost Wages (Past): $${economicDamages.lostWages.toLocaleString()}
Lost Wages (Future): $${economicDamages.lostWagesFuture.toLocaleString()}
Property Damage: $${economicDamages.propertyDamage.toLocaleString()}
Other Economic: $${economicDamages.otherEconomic.toLocaleString()}
TOTAL ECONOMIC: $${economicDamages.total.toLocaleString()}

NON-ECONOMIC DAMAGES
--------------------
Pain & Suffering Multiplier: ${nonEconomicDamages.multiplier}x
Total Non-Economic: $${nonEconomicDamages.total.toLocaleString()}

ADJUSTMENTS
-----------
Comparative Negligence: ${comparativeNegligence}%

RECOMMENDATION
--------------
Settlement Range: $${analysis.settlementRange[0].toLocaleString()} - $${analysis.settlementRange[1].toLocaleString()}
Recommended Demand: $${analysis.recommendedDemand.toLocaleString()}
Confidence Score: ${analysis.confidenceScore}%

KEY FACTORS
-----------
${analysis.factors.map(f => `- ${f.factor} (${f.impact}): ${f.description}`).join('\n')}

NEGOTIATION STRATEGY
--------------------
${analysis.negotiationStrategy}
`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `settlement-analysis-${activeCase?.title || 'case'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!activeCase) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-slate-500">
        <AlertCircle size={48} className="mb-4 opacity-50" />
        <p className="text-lg font-semibold">No Active Case Selected</p>
        <p className="text-sm mt-2 max-w-md text-center leading-relaxed mb-6">
          Select a case to calculate settlement values.
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
          <h1 className="text-3xl font-bold font-serif text-white">Settlement Calculator</h1>
          <p className="text-slate-400 mt-1">AI-powered damages analysis for case: {activeCase.title}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowManual(!showManual)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${showManual ? 'bg-gold-500 text-slate-900' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
          >
            {showManual ? 'AI Analysis' : 'Manual Entry'}
          </button>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-2">Case: {activeCase.title}</h3>
        <p className="text-sm text-slate-400">{activeCase.summary}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {showManual ? (
          <>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <DollarSign className="text-green-500" size={20} />
                Economic Damages
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Medical Expenses (Past)</label>
                  <input
                    type="number"
                    value={economicDamages.medicalExpenses || ''}
                    onChange={(e) => setEconomicDamages(prev => ({ ...prev, medicalExpenses: Number(e.target.value) }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-gold-500 outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Medical Expenses (Future)</label>
                  <input
                    type="number"
                    value={economicDamages.medicalExpensesFuture || ''}
                    onChange={(e) => setEconomicDamages(prev => ({ ...prev, medicalExpensesFuture: Number(e.target.value) }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-gold-500 outline-none"
                    placeholder="0"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Lost Wages (Past)</label>
                    <input
                      type="number"
                      value={economicDamages.lostWages || ''}
                      onChange={(e) => setEconomicDamages(prev => ({ ...prev, lostWages: Number(e.target.value) }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-gold-500 outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Lost Wages (Future)</label>
                    <input
                      type="number"
                      value={economicDamages.lostWagesFuture || ''}
                      onChange={(e) => setEconomicDamages(prev => ({ ...prev, lostWagesFuture: Number(e.target.value) }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-gold-500 outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Property Damage</label>
                    <input
                      type="number"
                      value={economicDamages.propertyDamage || ''}
                      onChange={(e) => setEconomicDamages(prev => ({ ...prev, propertyDamage: Number(e.target.value) }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-gold-500 outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Other Economic</label>
                    <input
                      type="number"
                      value={economicDamages.otherEconomic || ''}
                      onChange={(e) => setEconomicDamages(prev => ({ ...prev, otherEconomic: Number(e.target.value) }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-gold-500 outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
                  <span className="text-green-400 font-bold text-lg">Total Economic: ${economicDamages.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="text-purple-500" size={20} />
                  Non-Economic Damages
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Pain & Suffering Multiplier</label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="0.5"
                      value={nonEconomicDamages.multiplier}
                      onChange={(e) => setNonEconomicDamages(prev => ({ ...prev, multiplier: Number(e.target.value) }))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>1x</span>
                      <span className="text-gold-500 font-bold">{nonEconomicDamages.multiplier}x</span>
                      <span>5x</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Additional Pain & Suffering</label>
                      <input
                        type="number"
                        value={nonEconomicDamages.painAndSuffering || ''}
                        onChange={(e) => setNonEconomicDamages(prev => ({ ...prev, painAndSuffering: Number(e.target.value) }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-gold-500 outline-none"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Emotional Distress</label>
                      <input
                        type="number"
                        value={nonEconomicDamages.emotionalDistress || ''}
                        onChange={(e) => setNonEconomicDamages(prev => ({ ...prev, emotionalDistress: Number(e.target.value) }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-gold-500 outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Loss of Consortium</label>
                      <input
                        type="number"
                        value={nonEconomicDamages.lossOfConsortium || ''}
                        onChange={(e) => setNonEconomicDamages(prev => ({ ...prev, lossOfConsortium: Number(e.target.value) }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-gold-500 outline-none"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Loss of Enjoyment</label>
                      <input
                        type="number"
                        value={nonEconomicDamages.lossOfEnjoyment || ''}
                        onChange={(e) => setNonEconomicDamages(prev => ({ ...prev, lossOfEnjoyment: Number(e.target.value) }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-gold-500 outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-4">
                    <span className="text-purple-400 font-bold text-lg">Total Non-Economic: ${nonEconomicDamages.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingDown className="text-red-500" size={20} />
                  Adjustments
                </h2>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Comparative Negligence (%)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={comparativeNegligence}
                    onChange={(e) => setComparativeNegligence(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>0%</span>
                    <span className={`font-bold ${comparativeNegligence > 50 ? 'text-red-500' : 'text-gold-500'}`}>{comparativeNegligence}%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              <button
                onClick={calculateSettlement}
                className="w-full bg-gold-500 hover:bg-gold-600 text-slate-900 font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Calculator size={20} />
                Calculate Settlement
              </button>
            </div>
          </>
        ) : (
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">AI Settlement Analysis</h2>
              <textarea
                value={caseDescription}
                onChange={(e) => setCaseDescription(e.target.value)}
                placeholder="Describe the incident, injuries, medical treatment, lost wages, and any other relevant details for the AI to analyze..."
                className="w-full h-40 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-gold-500 outline-none resize-none"
              />
              <button
                onClick={analyzeWithAI}
                disabled={loading}
                className="mt-4 w-full bg-gold-500 hover:bg-gold-600 disabled:bg-slate-700 text-slate-900 font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="animate-spin" size={20} />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Calculator size={20} />
                    Analyze with AI
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {analysis && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Settlement Analysis Results</h2>
            <button
              onClick={exportAnalysis}
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Download size={18} />
              Export
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 text-center">
              <p className="text-sm text-green-400 mb-1">Low Estimate</p>
              <p className="text-3xl font-bold text-white">${analysis.settlementRange[0].toLocaleString()}</p>
            </div>
            <div className="bg-gold-900/30 border border-gold-600 rounded-lg p-4 text-center">
              <p className="text-sm text-gold-400 mb-1">Recommended Demand</p>
              <p className="text-3xl font-bold text-white">${analysis.recommendedDemand.toLocaleString()}</p>
            </div>
            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 text-center">
              <p className="text-sm text-blue-400 mb-1">High Estimate</p>
              <p className="text-3xl font-bold text-white">${analysis.settlementRange[1].toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Confidence Score:</span>
            <div className="flex-1 bg-slate-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${analysis.confidenceScore >= 70 ? 'bg-green-500' : analysis.confidenceScore >= 50 ? 'bg-gold-500' : 'bg-red-500'}`}
                style={{ width: `${analysis.confidenceScore}%` }}
              />
            </div>
            <span className="text-white font-bold">{analysis.confidenceScore}%</span>
          </div>

          {analysis.factors.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Key Factors</h3>
              <div className="space-y-2">
                {analysis.factors.map((factor, i) => (
                  <div key={i} className={`p-3 rounded-lg border ${factor.impact === 'positive' ? 'bg-green-900/20 border-green-800' : factor.impact === 'negative' ? 'bg-red-900/20 border-red-800' : 'bg-slate-800 border-slate-700'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white">{factor.factor}</span>
                      <span className={`text-xs px-2 py-1 rounded ${factor.impact === 'positive' ? 'bg-green-800 text-green-200' : factor.impact === 'negative' ? 'bg-red-800 text-red-200' : 'bg-slate-700 text-slate-300'}`}>
                        {factor.impact}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">{factor.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.negotiationStrategy && (
            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
              <h3 className="text-sm font-bold text-blue-400 uppercase mb-2 flex items-center gap-2">
                <Info size={16} />
                Negotiation Strategy
              </h3>
              <p className="text-slate-300">{analysis.negotiationStrategy}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SettlementCalculator;