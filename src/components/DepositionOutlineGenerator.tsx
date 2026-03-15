import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../App';
import { DepositionOutline, DepositionTopic, DepositionQuestion } from '../types';
import { FileText, Plus, Trash2, Download, BrainCircuit, ChevronDown, ChevronUp, GripVertical, Link } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { toast } from 'react-toastify';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const DepositionOutlineGenerator = () => {
  const { activeCase } = useContext(AppContext);
  const [outlines, setOutlines] = useState<DepositionOutline[]>([]);
  const [selectedOutline, setSelectedOutline] = useState<DepositionOutline | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  const [newOutlineData, setNewOutlineData] = useState({
    deponentName: '',
    deponentRole: '',
    notes: ''
  });

  useEffect(() => {
    if (activeCase) {
      const saved = localStorage.getItem(`depositions_${activeCase.id}`);
      if (saved) {
        setOutlines(JSON.parse(saved));
      }
    }
  }, [activeCase]);

  useEffect(() => {
    if (activeCase && outlines.length > 0) {
      localStorage.setItem(`depositions_${activeCase.id}`, JSON.stringify(outlines));
    }
  }, [outlines, activeCase]);

  const generateOutline = async () => {
    if (!activeCase || !newOutlineData.deponentName.trim()) {
      toast.error('Please enter deponent name');
      return;
    }

    setGenerating(true);
    try {
      const prompt = `You are an experienced litigation attorney creating a deposition outline.

Case: ${activeCase.title}
Summary: ${activeCase.summary}
Deponent: ${newOutlineData.deponentName}
Role: ${newOutlineData.deponentRole}
Additional Notes: ${newOutlineData.notes}

Create a comprehensive deposition outline with:
1. 5-8 topic areas with questions for each
2. Include foundation questions, substantive questions, and impeachment setup questions
3. For each question, include the purpose and anticipated objections
4. Suggest exhibits to mark
5. Anticipate objections with response strategies

Return JSON with:
- topics: array of {id, title, order, notes, questions: array of {id, text, type, purpose, anticipatedAnswer, followUpQuestions, linkedExhibit, anticipatedObjection, notes}}
- exhibitList: array of exhibit names
- anticipatedObjections: array of {ground, likelihood, responseStrategy, caseLaw}
- keyDocuments: array of document names`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              topics: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    order: { type: Type.NUMBER },
                    notes: { type: Type.STRING },
                    questions: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          text: { type: Type.STRING },
                          type: { type: Type.STRING },
                          purpose: { type: Type.STRING },
                          anticipatedAnswer: { type: Type.STRING },
                          followUpQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                          linkedExhibit: { type: Type.STRING },
                          anticipatedObjection: { type: Type.STRING },
                          notes: { type: Type.STRING }
                        }
                      }
                    }
                  }
                }
              },
              exhibitList: { type: Type.ARRAY, items: { type: Type.STRING } },
              anticipatedObjections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    ground: { type: Type.STRING },
                    likelihood: { type: Type.STRING },
                    responseStrategy: { type: Type.STRING },
                    caseLaw: { type: Type.STRING }
                  }
                }
              },
              keyDocuments: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      
      const outline: DepositionOutline = {
        id: `dep-${Date.now()}`,
        caseId: activeCase.id,
        deponentName: newOutlineData.deponentName,
        deponentRole: newOutlineData.deponentRole,
        date: new Date().toISOString().split('T')[0],
        topics: result.topics || [],
        exhibitList: result.exhibitList || [],
        anticipatedObjections: result.anticipatedObjections || [],
        keyDocuments: result.keyDocuments || [],
        notes: newOutlineData.notes
      };

      setOutlines([...outlines, outline]);
      setSelectedOutline(outline);
      setShowCreateModal(false);
      setNewOutlineData({ deponentName: '', deponentRole: '', notes: '' });
      toast.success('Deposition outline generated');
    } catch (error) {
      console.error('Generation failed', error);
      toast.error('Failed to generate outline');
    } finally {
      setGenerating(false);
    }
  };

  const addQuestion = (topicId: string) => {
    if (!selectedOutline) return;
    
    const topic = selectedOutline.topics.find(t => t.id === topicId);
    if (!topic) return;

    const newQuestion: DepositionQuestion = {
      id: `q-${Date.now()}`,
      text: '',
      type: 'substantive',
      purpose: ''
    };

    const updatedOutline = {
      ...selectedOutline,
      topics: selectedOutline.topics.map(t => 
        t.id === topicId 
          ? { ...t, questions: [...t.questions, newQuestion] }
          : t
      )
    };

    setSelectedOutline(updatedOutline);
    setOutlines(outlines.map(o => o.id === updatedOutline.id ? updatedOutline : o));
  };

  const updateQuestion = (topicId: string, questionId: string, updates: Partial<DepositionQuestion>) => {
    if (!selectedOutline) return;

    const updatedOutline = {
      ...selectedOutline,
      topics: selectedOutline.topics.map(t => 
        t.id === topicId 
          ? { 
              ...t, 
              questions: t.questions.map(q => 
                q.id === questionId ? { ...q, ...updates } : q
              )
            }
          : t
      )
    };

    setSelectedOutline(updatedOutline);
    setOutlines(outlines.map(o => o.id === updatedOutline.id ? updatedOutline : o));
  };

  const deleteQuestion = (topicId: string, questionId: string) => {
    if (!selectedOutline) return;

    const updatedOutline = {
      ...selectedOutline,
      topics: selectedOutline.topics.map(t => 
        t.id === topicId 
          ? { ...t, questions: t.questions.filter(q => q.id !== questionId) }
          : t
      )
    };

    setSelectedOutline(updatedOutline);
    setOutlines(outlines.map(o => o.id === updatedOutline.id ? updatedOutline : o));
  };

  const deleteOutline = (id: string) => {
    if (window.confirm('Delete this deposition outline?')) {
      setOutlines(outlines.filter(o => o.id !== id));
      if (selectedOutline?.id === id) {
        setSelectedOutline(null);
      }
      toast.success('Outline deleted');
    }
  };

  const toggleTopic = (topicId: string) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId);
    } else {
      newExpanded.add(topicId);
    }
    setExpandedTopics(newExpanded);
  };

  const exportOutline = (outline: DepositionOutline) => {
    let content = `DEPOSITION OUTLINE\n`;
    content += `${'='.repeat(50)}\n\n`;
    content += `Deponent: ${outline.deponentName}\n`;
    content += `Role: ${outline.deponentRole}\n`;
    content += `Date: ${outline.date}\n`;
    content += `Case: ${activeCase?.title}\n\n`;

    outline.topics.forEach((topic, i) => {
      content += `\n${'─'.repeat(40)}\n`;
      content += `TOPIC ${i + 1}: ${topic.title}\n`;
      content += `${'─'.repeat(40)}\n`;
      if (topic.notes) content += `Notes: ${topic.notes}\n\n`;
      
      topic.questions.forEach((q, j) => {
        content += `\nQ${j + 1}. [${q.type.toUpperCase()}] ${q.text}\n`;
        content += `   Purpose: ${q.purpose}\n`;
        if (q.anticipatedAnswer) content += `   Anticipated Answer: ${q.anticipatedAnswer}\n`;
        if (q.anticipatedObjection) content += `   Objection Expected: ${q.anticipatedObjection}\n`;
        if (q.linkedExhibit) content += `   Exhibit: ${q.linkedExhibit}\n`;
        if (q.followUpQuestions && q.followUpQuestions.length > 0) {
          content += `   Follow-ups:\n`;
          q.followUpQuestions.forEach(fq => content += `     - ${fq}\n`);
        }
      });
    });

    if (outline.exhibitList.length > 0) {
      content += `\n\nEXHIBITS TO MARK\n`;
      content += `${'─'.repeat(40)}\n`;
      outline.exhibitList.forEach((e, i) => content += `${i + 1}. ${e}\n`);
    }

    if (outline.anticipatedObjections.length > 0) {
      content += `\n\nANTICIPATED OBJECTIONS\n`;
      content += `${'─'.repeat(40)}\n`;
      outline.anticipatedObjections.forEach(o => {
        content += `\n${o.ground} (${o.likelihood} likelihood)\n`;
        content += `Response: ${o.responseStrategy}\n`;
        if (o.caseLaw) content += `Case Law: ${o.caseLaw}\n`;
      });
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deposition-${outline.deponentName.replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case 'foundation': return 'bg-blue-900/30 text-blue-400 border-blue-700';
      case 'substantive': return 'bg-green-900/30 text-green-400 border-green-700';
      case 'impeachment': return 'bg-red-900/30 text-red-400 border-red-700';
      case 'follow-up': return 'bg-yellow-900/30 text-yellow-400 border-yellow-700';
      case 'closing': return 'bg-purple-900/30 text-purple-400 border-purple-700';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  if (!activeCase) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-slate-500">
        <FileText className="mb-4 opacity-50" size={48} />
        <p className="text-lg font-semibold">No Active Case Selected</p>
        <p className="text-sm mt-2 max-w-md text-center leading-relaxed mb-6">
          Select a case to create deposition outlines.
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
          <h1 className="text-3xl font-bold font-serif text-white">Deposition Outline Generator</h1>
          <p className="text-slate-400 mt-1">AI-powered deposition preparation for: {activeCase.title}</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gold-500 hover:bg-gold-600 text-slate-900 font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          New Outline
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Outlines ({outlines.length})</h3>
            {outlines.length === 0 ? (
              <p className="text-slate-400 text-sm">No deposition outlines yet</p>
            ) : (
              <div className="space-y-2">
                {outlines.map(outline => (
                  <div
                    key={outline.id}
                    onClick={() => setSelectedOutline(outline)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedOutline?.id === outline.id
                        ? 'bg-gold-900/20 border-gold-500'
                        : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-white">{outline.deponentName}</p>
                        <p className="text-xs text-slate-400">{outline.deponentRole}</p>
                        <p className="text-xs text-slate-500 mt-1">{outline.topics.length} topics • {outline.topics.reduce((sum, t) => sum + t.questions.length, 0)} questions</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); exportOutline(outline); }}
                          className="p-1 text-slate-400 hover:text-white transition-colors"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteOutline(outline.id); }}
                          className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedOutline ? (
            <div className="space-y-4">
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedOutline.deponentName}</h2>
                    <p className="text-slate-400">{selectedOutline.deponentRole} • {selectedOutline.date}</p>
                  </div>
                  <button
                    onClick={() => exportOutline(selectedOutline)}
                    className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <Download size={18} />
                    Export
                  </button>
                </div>
              </div>

              {selectedOutline.exhibitList.length > 0 && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Exhibits to Mark</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedOutline.exhibitList.map((e, i) => (
                      <span key={i} className="px-3 py-1 bg-slate-700 text-slate-300 rounded text-sm">
                        {e}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedOutline.anticipatedObjections.length > 0 && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Anticipated Objections</h3>
                  <div className="space-y-2">
                    {selectedOutline.anticipatedObjections.map((o, i) => (
                      <div key={i} className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-white">{o.ground}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            o.likelihood === 'high' ? 'bg-red-900/50 text-red-400' :
                            o.likelihood === 'medium' ? 'bg-yellow-900/50 text-yellow-400' :
                            'bg-green-900/50 text-green-400'
                          }`}>
                            {o.likelihood} likelihood
                          </span>
                        </div>
                        <p className="text-sm text-slate-400">{o.responseStrategy}</p>
                        {o.caseLaw && <p className="text-xs text-gold-400 mt-1">Case: {o.caseLaw}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {selectedOutline.topics.map((topic, topicIndex) => (
                  <div key={topic.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                    <div
                      onClick={() => toggleTopic(topic.id)}
                      className="p-4 cursor-pointer flex items-center justify-between hover:bg-slate-700/30"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-gold-500 font-bold">#{topicIndex + 1}</span>
                        <span className="font-semibold text-white">{topic.title}</span>
                        <span className="text-xs text-slate-500">({topic.questions.length} questions)</span>
                      </div>
                      {expandedTopics.has(topic.id) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>

                    {expandedTopics.has(topic.id) && (
                      <div className="border-t border-slate-700 p-4 space-y-3">
                        {topic.notes && (
                          <p className="text-sm text-slate-400 mb-3">{topic.notes}</p>
                        )}

                        {topic.questions.map((question, qIndex) => (
                          <div key={question.id} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                            <div className="flex items-start gap-3">
                              <span className="text-xs font-mono text-slate-500 mt-1">Q{qIndex + 1}</span>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`text-xs px-2 py-0.5 rounded border ${getQuestionTypeColor(question.type)}`}>
                                    {question.type}
                                  </span>
                                  {question.linkedExhibit && (
                                    <span className="text-xs text-gold-400">Exhibit: {question.linkedExhibit}</span>
                                  )}
                                </div>
                                <p className="text-white text-sm mb-2">{question.text}</p>
                                <p className="text-xs text-slate-400 mb-1"><strong>Purpose:</strong> {question.purpose}</p>
                                {question.anticipatedAnswer && (
                                  <p className="text-xs text-slate-400 mb-1"><strong>Expected:</strong> {question.anticipatedAnswer}</p>
                                )}
                                {question.anticipatedObjection && (
                                  <p className="text-xs text-red-400"><strong>Objection:</strong> {question.anticipatedObjection}</p>
                                )}
                                {question.followUpQuestions && question.followUpQuestions.length > 0 && (
                                  <div className="mt-2 pl-3 border-l-2 border-slate-600">
                                    <p className="text-xs text-slate-500 mb-1">Follow-ups:</p>
                                    {question.followUpQuestions.map((fq, i) => (
                                      <p key={i} className="text-xs text-slate-400">• {fq}</p>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => deleteQuestion(topic.id, question.id)}
                                className="text-slate-400 hover:text-red-400 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}

                        <button
                          onClick={() => addQuestion(topic.id)}
                          className="w-full py-2 border border-dashed border-slate-600 rounded-lg text-slate-400 hover:text-white hover:border-gold-500 transition-colors text-sm"
                        >
                          + Add Question
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
              <BrainCircuit className="mx-auto text-slate-600 mb-4" size={48} />
              <h3 className="text-xl font-semibold text-white mb-2">Select or Create an Outline</h3>
              <p className="text-slate-400">Use AI to generate a comprehensive deposition outline</p>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-lg w-full">
            <h2 className="text-2xl font-bold text-white mb-4">New Deposition Outline</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Deponent Name *</label>
                <input
                  type="text"
                  value={newOutlineData.deponentName}
                  onChange={(e) => setNewOutlineData({ ...newOutlineData, deponentName: e.target.value })}
                  placeholder="e.g., Dr. Sarah Johnson"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-gold-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Role / Relationship</label>
                <input
                  type="text"
                  value={newOutlineData.deponentRole}
                  onChange={(e) => setNewOutlineData({ ...newOutlineData, deponentRole: e.target.value })}
                  placeholder="e.g., Treating Physician, Eyewitness, Expert"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-gold-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Additional Notes</label>
                <textarea
                  value={newOutlineData.notes}
                  onChange={(e) => setNewOutlineData({ ...newOutlineData, notes: e.target.value })}
                  placeholder="Key facts about this witness, documents to cover, specific areas to explore..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-gold-500 outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={generateOutline}
                  disabled={generating || !newOutlineData.deponentName.trim()}
                  className="flex-1 bg-gold-500 hover:bg-gold-600 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <>
                      <BrainCircuit className="animate-pulse" size={18} />
                      Generating...
                    </>
                  ) : (
                    <>
                      <BrainCircuit size={18} />
                      Generate with AI
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewOutlineData({ deponentName: '', deponentRole: '', notes: '' });
                  }}
                  className="px-6 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-colors"
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

export default DepositionOutlineGenerator;