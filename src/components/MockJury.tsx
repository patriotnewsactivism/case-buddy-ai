
import React, { useState, useContext, useRef, useEffect } from 'react';
import { AppContext } from '../App';
import { Juror, JuryDeliberation, JuryVerdict } from '../types';
import { Users, Play, AlertCircle, TrendingUp, TrendingDown, Minus, CheckCircle, XCircle, MessageSquare, Loader2, Info, Brain, Scale } from 'lucide-react';
import { callGeminiProxy } from '../services/apiProxy';
import { Type } from "@google/genai";
import { Link } from 'react-router-dom';
import { handleError, handleSuccess } from '../utils/errorHandler';

// Generate diverse jury pool
const generateJuryPool = (): Juror[] => {
  const occupations = ['Teacher', 'Engineer', 'Nurse', 'Accountant', 'Retail Manager', 'Social Worker', 'IT Consultant', 'Construction Worker', 'Librarian', 'Chef', 'Mechanic', 'Artist'];
  const educations = ['High School', 'Some College', 'Associates', 'Bachelors', 'Masters', 'PhD'];
  const firstNames = ['James', 'Maria', 'Robert', 'Jennifer', 'Michael', 'Linda', 'David', 'Patricia', 'John', 'Elizabeth', 'William', 'Sarah'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Chen', 'Lee'];

  return Array.from({ length: 12 }, (_, i) => ({
    id: `juror-${i + 1}`,
    name: `${firstNames[i]} ${lastNames[i]}`,
    age: 25 + Math.floor(Math.random() * 50),
    occupation: occupations[i],
    education: educations[Math.floor(Math.random() * educations.length)],
    background: generateBackground(occupations[i]),
    biases: generateBiases(),
    leaningScore: Math.floor(Math.random() * 40) - 20, // Start near neutral
    avatar: `https://picsum.photos/id/${100 + i}/200/200`
  }));
};

const generateBackground = (occupation: string): string => {
  const backgrounds: Record<string, string> = {
    'Teacher': 'Works with children daily, values education and structure.',
    'Engineer': 'Analytical thinker, relies on facts and data.',
    'Nurse': 'Compassionate, has seen trauma, understands medical evidence.',
    'Accountant': 'Detail-oriented, skeptical of financial claims.',
    'Retail Manager': 'People person, judges character quickly.',
    'Social Worker': 'Empathetic to disadvantaged, aware of systemic issues.',
    'IT Consultant': 'Tech-savvy, understands digital evidence.',
    'Construction Worker': 'Practical, no-nonsense approach.',
    'Librarian': 'Well-read, values thorough research.',
    'Chef': 'Creative, reads body language well.',
    'Mechanic': 'Hands-on problem solver, trusts experience.',
    'Artist': 'Intuitive, sees multiple perspectives.'
  };
  return backgrounds[occupation] || 'Average citizen with diverse life experience.';
};

const generateBiases = (): string[] => {
  const allBiases = [
    'Trusts authority figures',
    'Skeptical of police',
    'Strong law and order beliefs',
    'Believes in rehabilitation',
    'Distrusts corporate entities',
    'Has personal experience with crime',
    'Religious background influences views',
    'Prior jury service'
  ];
  const numBiases = Math.floor(Math.random() * 3);
  return allBiases.sort(() => 0.5 - Math.random()).slice(0, numBiases);
};

const MockJury = () => {
  const { activeCase, cases } = useContext(AppContext);
  const [jurors, setJurors] = useState<Juror[]>([]);
  const [deliberations, setDeliberations] = useState<JuryDeliberation[]>([]);
  const [verdict, setVerdict] = useState<JuryVerdict | null>(null);
  const [isDeliberating, setIsDeliberating] = useState(false);
  const [currentStatement, setCurrentStatement] = useState('');
  const [openingStatement, setOpeningStatement] = useState('');
  const [closingArgument, setClosingArgument] = useState('');
  const [phase, setPhase] = useState<'setup' | 'opening' | 'closing' | 'deliberation' | 'verdict'>('setup');
  const deliberationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setJurors(generateJuryPool());
  }, []);

  useEffect(() => {
    deliberationRef.current?.scrollTo({ top: deliberationRef.current.scrollHeight, behavior: 'smooth' });
  }, [deliberations]);

  const startDeliberation = async () => {
    if (!activeCase || !openingStatement || !closingArgument) return;

    setIsDeliberating(true);
    setPhase('deliberation');
    setDeliberations([]);

    try {
      const juryContext = jurors.map(j =>
        `${j.name} (${j.occupation}, age ${j.age}): ${j.background}${j.biases && j.biases.length > 0 ? ' Biases: ' + j.biases.join(', ') : ''}`
      ).join('\n');

      const prompt = `You are simulating a realistic jury deliberation for a legal case.

**Case Summary:**
${activeCase.summary}

**Opposing Counsel:** ${activeCase.opposingCounsel}

**Attorney's Opening Statement:**
${openingStatement}

**Attorney's Closing Argument:**
${closingArgument}

**Jury Panel:**
${juryContext}

**Instructions:**
Simulate a realistic jury deliberation where these 12 jurors discuss the case. Each juror should speak in character based on their background and biases. Show how opinions shift during deliberation. Generate 8-12 exchanges where jurors debate evidence, credibility, and the law.

Return a JSON array of deliberation statements in this format:
[
  {
    "jurorId": "juror-1",
    "statement": "I think we need to focus on the forensic evidence first..."
  },
  ...
]
`;

      const response = await callGeminiProxy({
        model: 'gemini-2.5-flash',
        prompt,
        options: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                jurorId: { type: Type.STRING },
                statement: { type: Type.STRING }
              }
            }
          }
        }
      });

      if (!response.success || !response.text) {
        throw new Error(response.error?.message || 'Deliberation failed: No response text received');
      }

      const deliberationData = JSON.parse(response.text);

      // Animate deliberations appearing one by one
      for (let i = 0; i < deliberationData.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay between statements
        setDeliberations(prev => [...prev, {
          jurorId: deliberationData[i].jurorId,
          statement: deliberationData[i].statement,
          timestamp: Date.now()
        }]);
        setCurrentStatement(deliberationData[i].statement);
      }

      // Generate verdict
      await generateVerdict(deliberationData);

    } catch (error) {
      handleError(error, 'Deliberation failed. Check API key and try again.', 'MockJury');
      setIsDeliberating(false);
    }
  };

  const generateVerdict = async (deliberationData: any[]) => {
    if (!activeCase) return;

    try {
      const prompt = `Based on the following jury deliberation, determine the verdict.

**Case:** ${activeCase.title}
**Summary:** ${activeCase.summary}

**Opening Statement:** ${openingStatement}
**Closing Argument:** ${closingArgument}

**Deliberation:**
${deliberationData.map((d, i) => `${i + 1}. ${d.jurorId}: ${d.statement}`).join('\n')}

Provide a realistic verdict with reasoning. Consider:
- Was the burden of proof met?
- How persuasive were the arguments?
- What weaknesses exist in the case?

Return JSON with:
- verdict: "guilty", "not guilty", or "hung"
- confidence: 0-100
- voteTally: { guilty: number, notGuilty: number }
- reasoning: string (2-3 sentences)
- weaknesses: array of case weaknesses identified
- strengths: array of case strengths identified
`;

      const response = await callGeminiProxy({
        model: 'gemini-2.5-pro',
        prompt,
        options: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              verdict: { type: Type.STRING, enum: ['guilty', 'not guilty', 'hung'] },
              confidence: { type: Type.NUMBER },
              voteTally: {
                type: Type.OBJECT,
                properties: {
                  guilty: { type: Type.NUMBER },
                  notGuilty: { type: Type.NUMBER }
                }
              },
              reasoning: { type: Type.STRING },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      });

      if (!response.success || !response.text) {
        throw new Error(response.error?.message || 'Verdict generation failed: No response text received');
      }

      const verdictData = JSON.parse(response.text);
      setVerdict(verdictData);
      setPhase('verdict');
      setIsDeliberating(false);

    } catch (error) {
      handleError(error, 'Verdict generation failed', 'MockJury');
      setIsDeliberating(false);
    }
  };

  const resetSimulation = () => {
    setPhase('setup');
    setDeliberations([]);
    setVerdict(null);
    setOpeningStatement('');
    setClosingArgument('');
    setCurrentStatement('');
    setJurors(generateJuryPool());
  };

  const getJurorById = (id: string) => jurors.find(j => j.id === id);

  const getLeaningIcon = (score: number) => {
    if (score > 20) return <TrendingUp className="text-red-500" size={16} />;
    if (score < -20) return <TrendingDown className="text-green-500" size={16} />;
    return <Minus className="text-slate-400" size={16} />;
  };

  const getLeaningLabel = (score: number) => {
    if (score > 40) return 'Strong Prosecution';
    if (score > 20) return 'Leans Prosecution';
    if (score < -40) return 'Strong Defense';
    if (score < -20) return 'Leans Defense';
    return 'Neutral';
  };

  if (!activeCase) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-slate-500">
        <AlertCircle size={48} className="mb-4 opacity-50" />
        <p className="text-lg font-semibold">No Active Case Selected</p>
        <p className="text-sm mt-2 max-w-md text-center leading-relaxed mb-6">
          Select a case to simulate jury deliberation and predict the verdict.
        </p>
        <Link to="/app/cases" className="bg-gold-600 hover:bg-gold-500 text-slate-900 font-bold px-6 py-3 rounded-lg transition-colors">
          Go to Case Files
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white font-serif">Mock Jury Simulation</h1>
          <p className="text-slate-400 mt-2">Predict how a jury will deliberate and decide your case</p>
        </div>
        {phase !== 'setup' && (
          <button
            onClick={resetSimulation}
            disabled={isDeliberating}
            className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Active Case Display */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Scale className="text-gold-500" size={20} />
          <h3 className="text-white font-semibold">Active Case: {activeCase.title}</h3>
        </div>
        <p className="text-sm text-slate-300">{activeCase.summary}</p>
      </div>

      {phase === 'setup' && (
        <div className="space-y-6">
          {/* Jury Panel */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Users size={24} />
              Jury Panel (12 Members)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {jurors.map(juror => (
                <div key={juror.id} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-start gap-3">
                    <img src={juror.avatar} alt={juror.name} className="w-12 h-12 rounded-full" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white text-sm">{juror.name}</h4>
                      <p className="text-xs text-slate-400">{juror.occupation}, {juror.age}</p>
                      <p className="text-xs text-slate-500 mt-1">{juror.education}</p>
                    </div>
                  </div>
                  {juror.biases && juror.biases.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {juror.biases.map((bias, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 bg-slate-800 text-slate-400 rounded">
                          {bias}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Input Statements */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Opening Statement</h3>
              <textarea
                value={openingStatement}
                onChange={(e) => setOpeningStatement(e.target.value)}
                placeholder="Enter your opening statement to the jury... Introduce your case, preview the evidence, and establish your narrative."
                className="w-full h-40 sm:h-48 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none"
              />
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Closing Argument</h3>
              <textarea
                value={closingArgument}
                onChange={(e) => setClosingArgument(e.target.value)}
                placeholder="Enter your closing argument... Summarize the evidence, address weaknesses, and make your final appeal to the jury."
                className="w-full h-40 sm:h-48 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none"
              />
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={startDeliberation}
            disabled={!openingStatement || !closingArgument || isDeliberating}
            className="w-full bg-gold-500 hover:bg-gold-600 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 font-bold text-lg py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isDeliberating ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                Jury Deliberating...
              </>
            ) : (
              <>
                <Play size={24} />
                Start Jury Deliberation
              </>
            )}
          </button>
        </div>
      )}

      {(phase === 'deliberation' || phase === 'verdict') && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Deliberation Transcript */}
          <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <div className="bg-slate-900 border-b border-slate-700 p-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <MessageSquare size={24} />
                Jury Deliberation Room
              </h2>
            </div>
            <div ref={deliberationRef} className="p-4 md:p-6 space-y-4 max-h-[400px] sm:max-h-[600px] overflow-y-auto">
              {deliberations.map((delib, i) => {
                const juror = getJurorById(delib.jurorId);
                return (
                  <div key={i} className="flex gap-3 animate-fadeIn">
                    <img src={juror?.avatar} alt={juror?.name} className="w-10 h-10 rounded-full flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white text-sm">{juror?.name}</span>
                        <span className="text-xs text-slate-500">{juror?.occupation}</span>
                        {getLeaningIcon(juror?.leaningScore || 0)}
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed">{delib.statement}</p>
                    </div>
                  </div>
                );
              })}
              {isDeliberating && (
                <div className="flex items-center gap-2 text-slate-400">
                  <Loader2 className="animate-spin" size={16} />
                  <span className="text-sm">Jurors are deliberating...</span>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Jury Status or Verdict */}
          <div className="space-y-4">
            {verdict ? (
              <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                <div className={`p-6 ${verdict.verdict === 'guilty' ? 'bg-red-900/30' : verdict.verdict === 'not guilty' ? 'bg-green-900/30' : 'bg-yellow-900/30'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    {verdict.verdict === 'guilty' ? (
                      <XCircle className="text-red-500" size={32} />
                    ) : verdict.verdict === 'not guilty' ? (
                      <CheckCircle className="text-green-500" size={32} />
                    ) : (
                      <AlertCircle className="text-yellow-500" size={32} />
                    )}
                    <div>
                      <h3 className="text-2xl font-bold text-white uppercase">{verdict.verdict}</h3>
                      <p className="text-sm text-slate-400">{verdict.confidence}% Confidence</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Vote:</span>
                    <span className="text-white font-semibold">
                      {verdict.voteTally.guilty} Guilty / {verdict.voteTally.notGuilty} Not Guilty
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-gold-500 uppercase mb-2">Reasoning</h4>
                    <p className="text-sm text-slate-300">{verdict.reasoning}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-green-500 uppercase mb-2 flex items-center gap-1">
                      <CheckCircle size={14} /> Strengths
                    </h4>
                    <ul className="space-y-1">
                      {verdict.strengths.map((s, i) => (
                        <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-red-500 uppercase mb-2 flex items-center gap-1">
                      <AlertCircle size={14} /> Weaknesses
                    </h4>
                    <ul className="space-y-1">
                      {verdict.weaknesses.map((w, i) => (
                        <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                          <span className="text-red-500 mt-0.5">•</span>
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Brain size={20} />
                  Jury Status
                </h3>
                <p className="text-sm text-slate-400">
                  The jury is deliberating. Watch as jurors debate the evidence and try to reach a unanimous verdict.
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                  <Info size={14} />
                  <span>{deliberations.length} statements so far</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MockJury;
