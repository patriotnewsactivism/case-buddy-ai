import React, { useState, useContext } from 'react';
import { AppContext } from '../App';
import { AdmissibilityAnalysis, AdmissibilityIssue, CaseLawCitation } from '../types';
import { Shield, AlertTriangle, CheckCircle, XCircle, FileSearch, Lightbulb, Link } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { toast } from 'react-toastify';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const EvidenceAdmissibility = () => {
  const { activeCase } = useContext(AppContext);
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [evidenceType, setEvidenceType] = useState('document');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AdmissibilityAnalysis | null>(null);

  const analyzeEvidence = async () => {
    if (!evidenceDescription.trim()) {
      toast.error('Please describe the evidence');
      return;
    }

    setLoading(true);
    try {
      const prompt = `You are an evidence law expert. Analyze this evidence for admissibility:

Evidence Type: ${evidenceType}
Description: ${evidenceDescription}
${activeCase ? `Case Context: ${activeCase.summary}` : ''}

Analyze for:
1. Hearsay issues and exceptions
2. Relevance (FRE 401, 402)
3. Prejudicial effect vs probative value (FRE 403)
4. Authentication requirements (FRE 901)
5. Original document rule (FRE 1002)
6. Character evidence issues (FRE 404)
7. Expert witness requirements if applicable (FRE 702)
8. Foundation requirements

Return JSON with:
- overallAdmissibility: "admissible", "conditionally_admissible", or "inadmissible"
- confidenceScore: 0-100
- issues: array of {type, severity ("fatal"/"serious"/"minor"), rule, explanation, potentialCure}
- suggestedFoundations: array of foundation questions or steps needed
- caseLawSupport: array of {caseName, citation, court, date, summary, holding, favorableTo: "plaintiff"/"defendant"/"neutral", stillGoodLaw: boolean, url}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallAdmissibility: { type: Type.STRING, enum: ['admissible', 'conditionally_admissible', 'inadmissible'] },
              confidenceScore: { type: Type.NUMBER },
              issues: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    severity: { type: Type.STRING },
                    rule: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    potentialCure: { type: Type.STRING }
                  }
                }
              },
              suggestedFoundations: { type: Type.ARRAY, items: { type: Type.STRING } },
              caseLawSupport: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    caseName: { type: Type.STRING },
                    citation: { type: Type.STRING },
                    court: { type: Type.STRING },
                    date: { type: Type.STRING },
                    summary: { type: Type.STRING },
                    holding: { type: Type.STRING },
                    favorableTo: { type: Type.STRING },
                    stillGoodLaw: { type: Type.BOOLEAN },
                    url: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      setAnalysis(result);
      toast.success('Analysis complete');
    } catch (error) {
      console.error('Analysis failed', error);
      toast.error('Analysis failed. Check API key.');
    } finally {
      setLoading(false);
    }
  };

  const getAdmissibilityColor = (status: string) => {
    switch (status) {
      case 'admissible': return 'bg-green-900/30 border-green-600 text-green-400';
      case 'conditionally_admissible': return 'bg-yellow-900/30 border-yellow-600 text-yellow-400';
      case 'inadmissible': return 'bg-red-900/30 border-red-600 text-red-400';
      default: return 'bg-slate-800 border-slate-600 text-slate-400';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'fatal': return 'bg-red-900/40 border-red-700';
      case 'serious': return 'bg-orange-900/40 border-orange-700';
      case 'minor': return 'bg-yellow-900/40 border-yellow-700';
      default: return 'bg-slate-800 border-slate-700';
    }
  };

  const exportAnalysis = () => {
    if (!analysis) return;
    
    let content = `EVIDENCE ADMISSIBILITY ANALYSIS\n`;
    content += `${'='.repeat(50)}\n\n`;
    content += `Evidence Type: ${evidenceType}\n`;
    content += `Description: ${evidenceDescription}\n`;
    content += `${activeCase ? `Case: ${activeCase.title}\n` : ''}\n`;
    content += `OVERALL STATUS: ${analysis.overallAdmissibility.toUpperCase()}\n`;
    content += `Confidence: ${analysis.confidenceScore}%\n\n`;
    
    if (analysis.issues.length > 0) {
      content += `ISSUES IDENTIFIED\n`;
      content += `${'-'.repeat(30)}\n`;
      analysis.issues.forEach((issue, i) => {
        content += `\n${i + 1}. ${issue.type} [${issue.severity.toUpperCase()}]\n`;
        content += `   Rule: ${issue.rule}\n`;
        content += `   ${issue.explanation}\n`;
        if (issue.potentialCure) content += `   Cure: ${issue.potentialCure}\n`;
      });
    }
    
    if (analysis.suggestedFoundations.length > 0) {
      content += `\nSUGGESTED FOUNDATIONS\n`;
      content += `${'-'.repeat(30)}\n`;
      analysis.suggestedFoundations.forEach((f, i) => {
        content += `${i + 1}. ${f}\n`;
      });
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admissibility-analysis.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!activeCase) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-slate-500">
        <Shield className="mb-4 opacity-50" size={48} />
        <p className="text-lg font-semibold">No Active Case Selected</p>
        <p className="text-sm mt-2 max-w-md text-center leading-relaxed mb-6">
          Select a case to analyze evidence admissibility.
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
          <h1 className="text-3xl font-bold font-serif text-white">Evidence Admissibility Analyzer</h1>
          <p className="text-slate-400 mt-1">AI-powered analysis of evidence admissibility issues</p>
        </div>
        {analysis && (
          <button
            onClick={exportAnalysis}
            className="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Export Analysis
          </button>
        )}
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h3 className="text-white font-semibold">Analyzing for: {activeCase.title}</h3>
        <p className="text-sm text-slate-400 mt-1">{activeCase.summary}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Evidence Description</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Evidence Type</label>
              <select
                value={evidenceType}
                onChange={(e) => setEvidenceType(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-gold-500 outline-none"
              >
                <option value="document">Document / Record</option>
                <option value="photograph">Photograph</option>
                <option value="video">Video Recording</option>
                <option value="audio">Audio Recording</option>
                <option value="physical">Physical Evidence</option>
                <option value="testimony">Witness Testimony</option>
                <option value="expert">Expert Opinion</option>
                <option value="digital">Digital/Electronic Evidence</option>
                <option value="medical">Medical Records</option>
                <option value="financial">Financial Records</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Describe the Evidence</label>
              <textarea
                value={evidenceDescription}
                onChange={(e) => setEvidenceDescription(e.target.value)}
                placeholder="Describe the evidence in detail. Include: how it was obtained, who created it, when it was created, its purpose, and how you intend to use it..."
                rows={8}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-gold-500 outline-none resize-none"
              />
            </div>

            <button
              onClick={analyzeEvidence}
              disabled={loading || !evidenceDescription.trim()}
              className="w-full bg-gold-500 hover:bg-gold-600 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <FileSearch className="animate-pulse" size={20} />
                  Analyzing...
                </>
              ) : (
                <>
                  <Shield size={20} />
                  Analyze Admissibility
                </>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {!analysis && !loading && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
              <Shield className="mx-auto text-slate-600 mb-4" size={48} />
              <h3 className="text-xl font-semibold text-white mb-2">Evidence Analysis</h3>
              <p className="text-slate-400">Describe your evidence to identify admissibility issues and get solutions</p>
            </div>
          )}

          {analysis && (
            <div className="space-y-4 animate-fadeIn">
              <div className={`rounded-xl border-2 p-6 ${getAdmissibilityColor(analysis.overallAdmissibility)}`}>
                <div className="flex items-center gap-3 mb-3">
                  {analysis.overallAdmissibility === 'admissible' ? (
                    <CheckCircle size={32} />
                  ) : analysis.overallAdmissibility === 'conditionally_admissible' ? (
                    <AlertTriangle size={32} />
                  ) : (
                    <XCircle size={32} />
                  )}
                  <div>
                    <h3 className="text-2xl font-bold uppercase">{analysis.overallAdmissibility.replace('_', ' ')}</h3>
                    <p className="text-sm opacity-80">{analysis.confidenceScore}% confidence</p>
                  </div>
                </div>
              </div>

              {analysis.issues.length > 0 && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <AlertTriangle className="text-orange-500" size={20} />
                    Issues Identified ({analysis.issues.length})
                  </h3>
                  <div className="space-y-3">
                    {analysis.issues.map((issue, i) => (
                      <div key={i} className={`rounded-lg p-4 border ${getSeverityColor(issue.severity)}`}>
                        <div className="flex items-start justify-between mb-2">
                          <span className="font-semibold text-white">{issue.type}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            issue.severity === 'fatal' ? 'bg-red-800 text-red-200' :
                            issue.severity === 'serious' ? 'bg-orange-800 text-orange-200' :
                            'bg-yellow-800 text-yellow-200'
                          }`}>
                            {issue.severity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mb-1">Rule: {issue.rule}</p>
                        <p className="text-sm text-slate-300 mb-2">{issue.explanation}</p>
                        {issue.potentialCure && (
                          <div className="bg-green-900/20 border border-green-800 rounded p-2">
                            <p className="text-xs text-green-400">
                              <strong>Cure:</strong> {issue.potentialCure}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysis.suggestedFoundations.length > 0 && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Lightbulb className="text-gold-500" size={20} />
                    Suggested Foundations
                  </h3>
                  <ol className="space-y-2">
                    {analysis.suggestedFoundations.map((f, i) => (
                      <li key={i} className="flex gap-3 text-sm text-slate-300">
                        <span className="font-bold text-gold-500">{i + 1}.</span>
                        {f}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {analysis.caseLawSupport && analysis.caseLawSupport.length > 0 && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Supporting Case Law</h3>
                  <div className="space-y-3">
                    {analysis.caseLawSupport.map((c, i) => (
                      <div key={i} className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                        <p className="font-semibold text-white text-sm">{c.caseName}</p>
                        <p className="text-xs text-slate-400">{c.citation} ({c.court} {c.date})</p>
                        <p className="text-xs text-slate-300 mt-1">{c.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EvidenceAdmissibility;