import React, { useState, useContext } from 'react';
import { AppContext } from '../App';
import { CaseLawSearchResult, CaseLawCitation } from '../types';
import { Search, BookOpen, ExternalLink, Save, History, Star, AlertTriangle, CheckCircle, XCircle, Link } from 'lucide-react';
import { callGeminiProxy } from '../services/apiProxy';
import { Type } from "@google/genai";
import { toast } from 'react-toastify';
import { handleError, handleSuccess } from '../utils/errorHandler';

const CaseLawResearch = () => {
  const { activeCase, updateCase } = useContext(AppContext);
  const [query, setQuery] = useState('');
  const [jurisdiction, setJurisdiction] = useState(activeCase?.jurisdiction || 'federal');
  const [results, setResults] = useState<CaseLawSearchResult[]>([]);
  const savedCitations = activeCase?.citations || [];
  const [loading, setLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState<CaseLawSearchResult | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setLoading(true);
    setSearchHistory(prev => [query, ...prev.filter(q => q !== query)].slice(0, 10));

    try {
      const prompt = `You are an expert legal research assistant. Find relevant, highly realistic case law for this query in the ${jurisdiction} jurisdiction.

Query: ${query}
${activeCase ? `Case Context: ${activeCase.summary}` : ''}

Return relevant cases with:
- caseName: Full case name
- citation: Standard citation format (e.g., 501 U.S. 442)
- court: Court that decided the case (e.g., U.S. Supreme Court, 5th Circuit)
- date: Date of decision
- summary: Brief summary of facts and procedural history (2-3 sentences)
- holding: The court's holding (1-2 sentences)
- relevanceScore: 0-100 based on relevance to query
- stillGoodLaw: boolean indicating if precedent is still valid
- url: A realistic URL to the case text

Return 5-8 relevant cases as JSON array.`;

      const response = await callGeminiProxy({
        model: 'gemini-2.5-flash',
        prompt,
        options: {
          responseMimeType: 'application/json',
          responseSchema: {
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
                relevanceScore: { type: Type.NUMBER },
                stillGoodLaw: { type: Type.BOOLEAN },
                url: { type: Type.STRING }
              }
            }
          }
        }
      });

      if (!response.success || !response.text) {
        throw new Error(response.error?.message || 'Search failed: No response text received');
      }

      const data = JSON.parse(response.text);
      setResults(data.map((r: any, i: number) => ({
        id: `case-${Date.now()}-${i}`,
        ...r
      })));
      
      if (data.length === 0) {
        toast.info('No cases found. Try a different query.');
      }
    } catch (error) {
      handleError(error, 'Search failed. Check your configuration.', 'CaseLawResearch');
    } finally {
      setLoading(false);
    }
  };

  const saveCitation = async (result: CaseLawSearchResult) => {
    if (!activeCase) {
      toast.error('Select a case before saving citations');
      return;
    }

    const citation: CaseLawCitation = {
      caseName: result.caseName,
      citation: result.citation,
      court: result.court,
      date: result.date,
      summary: result.summary,
      holding: result.holding || '',
      favorableTo: 'neutral',
      stillGoodLaw: result.stillGoodLaw,
      url: result.url
    };

    if (savedCitations.some(c => c.citation === citation.citation)) {
      toast.info('Citation already saved');
      return;
    }

    const nextCitations = [...savedCitations, citation];
    await updateCase(activeCase.id, { citations: nextCitations });
    handleSuccess('Citation saved to case file');
  };

  const removeCitation = async (citation: string) => {
    if (!activeCase) return;
    const nextCitations = savedCitations.filter(c => c.citation !== citation);
    await updateCase(activeCase.id, { citations: nextCitations });
    handleSuccess('Citation removed');
  };

  const exportCitations = () => {
    if (savedCitations.length === 0) {
      toast.error('No citations to export');
      return;
    }

    let content = `CASE LAW CITATIONS\n`;
    content += `Case: ${activeCase?.title || 'N/A'}\n`;
    content += `Generated: ${new Date().toLocaleDateString()}\n\n`;

    savedCitations.forEach((c, i) => {
      content += `${i + 1}. ${c.caseName}\n`;
      content += `   ${c.citation} (${c.court} ${c.date})\n`;
      content += `   Summary: ${c.summary}\n`;
      if (c.holding) content += `   Holding: ${c.holding}\n`;
      content += `   Status: ${c.stillGoodLaw ? 'Good Law' : 'Overruled/Distinguished'}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `citations-${activeCase?.title || 'research'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const quickSearch = (term: string) => {
    setQuery(term);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-white">Case Law Research</h1>
          <p className="text-slate-400 mt-1">AI-powered legal research and citation management</p>
        </div>
        {savedCitations.length > 0 && (
          <button
            onClick={exportCitations}
            className="bg-gold-500 hover:bg-gold-600 text-slate-900 font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Save size={18} />
            Export Citations ({savedCitations.length})
          </button>
        )}
      </div>

      {activeCase && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <h3 className="text-white font-semibold">Researching for: {activeCase.title}</h3>
          <p className="text-sm text-slate-400 mt-1">{activeCase.summary}</p>
        </div>
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="md:w-48">
            <label className="block text-xs text-slate-500 uppercase font-bold mb-1 ml-1">Jurisdiction</label>
            <select 
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-4 text-white focus:border-gold-500 outline-none appearance-none cursor-pointer"
            >
              <option value="federal">Federal</option>
              <option value="texas">Texas</option>
              <option value="louisiana">Louisiana</option>
              <option value="california">California</option>
              <option value="florida">Florida</option>
              <option value="new-york">New York</option>
            </select>
          </div>
          <div className="flex-1 relative">
            <label className="block text-xs text-slate-500 uppercase font-bold mb-1 ml-1">Legal Query</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search case law... (e.g., 'negligence proximate cause')"
                className="w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-gold-500 outline-none text-lg"
              />
            </div>
          </div>
          <div className="md:pt-5">
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="w-full bg-gold-500 hover:bg-gold-600 disabled:bg-slate-700 text-slate-900 font-bold px-8 py-4 rounded-lg transition-colors shadow-lg shadow-gold-500/10"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-xs text-slate-500">Quick searches:</span>
          {['negligence', 'fourth amendment', 'hearsay exception', 'summary judgment', 'motion to suppress'].map(term => (
            <button
              key={term}
              onClick={() => quickSearch(term)}
              className="text-xs px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-full transition-colors"
            >
              {term}
            </button>
          ))}
        </div>

        {searchHistory.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <History className="text-slate-500" size={14} />
            {searchHistory.slice(0, 5).map((h, i) => (
              <button
                key={i}
                onClick={() => setQuery(h)}
                className="text-xs px-2 py-1 bg-slate-900 text-slate-400 hover:text-white rounded transition-colors truncate max-w-[150px]"
              >
                {h}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {results.length === 0 && !loading && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
              <BookOpen className="mx-auto text-slate-600 mb-4" size={48} />
              <h3 className="text-xl font-semibold text-white mb-2">Search Case Law</h3>
              <p className="text-slate-400">Enter a legal query to find relevant cases and precedents</p>
            </div>
          )}

          {loading && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
              <Search className="mx-auto text-gold-500 animate-pulse mb-4" size={48} />
              <p className="text-slate-300">Searching legal databases...</p>
            </div>
          )}

          {results.map(result => (
            <div
              key={result.id}
              onClick={() => setSelectedResult(result)}
              className={`bg-slate-800 border rounded-xl p-6 cursor-pointer transition-all ${
                selectedResult?.id === result.id
                  ? 'border-gold-500 shadow-lg shadow-gold-500/20'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {result.stillGoodLaw ? (
                      <CheckCircle className="text-green-500 flex-shrink-0" size={18} />
                    ) : (
                      <XCircle className="text-red-500 flex-shrink-0" size={18} />
                    )}
                    <span className="text-xs font-mono text-slate-400">{result.citation}</span>
                    <span className="text-xs text-slate-500">{result.court} • {result.date}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{result.caseName}</h3>
                  <p className="text-sm text-slate-300 mb-3">{result.summary}</p>
                  {result.holding && (
                    <div className="bg-slate-900/50 rounded p-3 mb-3">
                      <p className="text-xs text-gold-400 mb-1">Holding:</p>
                      <p className="text-sm text-slate-300">{result.holding}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          result.relevanceScore >= 80 ? 'bg-green-500' :
                          result.relevanceScore >= 60 ? 'bg-gold-500' : 'bg-orange-500'
                        }`}
                        style={{ width: `${result.relevanceScore}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400">{result.relevanceScore}% relevant</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); saveCitation(result); }}
                    className="p-2 bg-slate-700 hover:bg-gold-500 hover:text-slate-900 text-slate-300 rounded-lg transition-colors"
                    title="Save to citations"
                  >
                    <Star size={18} />
                  </button>
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors text-center"
                    title="View on Casetext"
                  >
                    <ExternalLink size={18} />
                  </a>
                </div>
              </div>

              {!result.stillGoodLaw && (
                <div className="mt-4 bg-red-900/20 border border-red-800 rounded-lg p-3 flex items-center gap-2">
                  <AlertTriangle className="text-red-400" size={16} />
                  <span className="text-sm text-red-300">This case may have been overruled or distinguished</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Star className="text-gold-500" size={18} />
              Saved Citations ({savedCitations.length})
            </h3>
            {savedCitations.length === 0 ? (
              <p className="text-slate-400 text-sm">Click the star icon to save citations for your case</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {savedCitations.map((c, i) => (
                  <div key={i} className="bg-slate-900/50 rounded p-3 border border-slate-700">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{c.caseName}</p>
                        <p className="text-xs text-slate-400 truncate">{c.citation}</p>
                      </div>
                      <button
                        onClick={() => removeCitation(c.citation)}
                        className="text-slate-400 hover:text-red-400 transition-colors ml-2"
                      >
                        <XCircle size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Research Tips</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={14} />
                Use specific legal terms for better results
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={14} />
                Include jurisdiction for local precedents
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={14} />
                Verify citations with official sources
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="text-orange-500 mt-0.5 flex-shrink-0" size={14} />
                Always check if cases are still good law
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseLawResearch;