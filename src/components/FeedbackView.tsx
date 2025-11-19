import { useState, useEffect } from 'react';
import { SavedSession, FeedbackReport } from '@/types';
import { GoogleGenAI } from '@google/genai';

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';

interface FeedbackViewProps {
  session: SavedSession;
  onComplete: (feedback: FeedbackReport) => void;
  onSkip: () => void;
}

export const FeedbackView = ({ session, onComplete, onSkip }: FeedbackViewProps) => {
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<FeedbackReport | null>(null);

  useEffect(() => {
    generateFeedback();
  }, []);

  const generateFeedback = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      const model = ai.chats.create({
        model: 'gemini-2.0-flash-exp',
        config: {
          systemInstruction: `You are an expert case interview coach and legal mentor. Analyze the session and provide detailed, constructive feedback.
          
          Provide feedback in this exact JSON format:
          {
            "overallScore": <number 0-100>,
            "strengths": [<array of 3-5 specific strengths>],
            "improvements": [<array of 3-5 specific areas to improve>],
            "detailedFeedback": "<2-3 paragraph comprehensive analysis>",
            "specificRecommendations": [<array of 3-5 actionable next steps>]
          }
          
          Be specific, actionable, and encouraging while maintaining high standards.`
        }
      });

      const sessionSummary = `
Session Type: ${session.config.type}
Industry: ${session.config.industry}
Difficulty: ${session.config.difficulty}
Duration: ${Math.floor(session.duration / 60)} minutes

Case Title: ${session.notebook.caseTitle}
Phases Covered: ${session.notebook.caseTimeline.join(', ')}
Framework Used: ${session.notebook.candidateFramework.join(', ')}
Key Data Points: ${session.notebook.keyData.length} items

Please provide comprehensive feedback on this practice session.
`;

      const result = await model.sendMessage({ message: sessionSummary });
      const feedbackText = result.text;
      
      // Extract JSON from response
      const jsonMatch = feedbackText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedFeedback = JSON.parse(jsonMatch[0]);
        setFeedback(parsedFeedback);
        onComplete(parsedFeedback);
      } else {
        throw new Error('Failed to parse feedback');
      }
    } catch (error) {
      console.error('Failed to generate feedback:', error);
      // Provide fallback feedback
      const fallbackFeedback: FeedbackReport = {
        overallScore: 75,
        strengths: [
          'Completed the full session',
          'Engaged with the case material',
          'Demonstrated commitment to practice'
        ],
        improvements: [
          'Continue practicing regularly',
          'Focus on structured thinking',
          'Work on articulating your reasoning clearly'
        ],
        detailedFeedback: 'Thank you for completing this practice session. While we encountered an issue generating detailed AI feedback, your dedication to practice is commendable. Review your session notes and continue building your skills through regular practice.',
        specificRecommendations: [
          'Schedule regular practice sessions',
          'Review framework templates before next session',
          'Focus on time management during cases'
        ]
      };
      setFeedback(fallbackFeedback);
      onComplete(fallbackFeedback);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg font-semibold">Analyzing Your Performance...</p>
          <p className="text-slate-400 text-sm mt-2">Generating comprehensive feedback</p>
        </div>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-rounded text-red-400 text-6xl mb-4 block">error</span>
          <p className="text-white text-lg">Failed to generate feedback</p>
          <button onClick={onSkip} className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg">
            Continue Anyway
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500/10 rounded-full mb-4">
            <span className="material-symbols-rounded text-blue-400 text-5xl">star</span>
          </div>
          <h1 className="text-4xl font-bold mb-2">Session Complete!</h1>
          <p className="text-slate-400">Here's your personalized performance analysis</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-2xl p-8 mb-6">
          <div className="text-center">
            <div className="text-6xl font-bold text-white mb-2">{feedback.overallScore}</div>
            <div className="text-lg text-blue-300">Overall Performance Score</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-slate-800 border border-green-500/30 rounded-xl p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold mb-4 text-green-400">
              <span className="material-symbols-rounded">thumb_up</span>
              Strengths
            </h3>
            <ul className="space-y-3">
              {feedback.strengths.map((strength, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-300">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-800 border border-yellow-500/30 rounded-xl p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold mb-4 text-yellow-400">
              <span className="material-symbols-rounded">trending_up</span>
              Areas to Improve
            </h3>
            <ul className="space-y-3">
              {feedback.improvements.map((improvement, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-300">
                  <span className="text-yellow-400 mt-1">→</span>
                  <span>{improvement}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
            <span className="material-symbols-rounded text-blue-400">description</span>
            Detailed Analysis
          </h3>
          <p className="text-slate-300 leading-relaxed whitespace-pre-line">
            {feedback.detailedFeedback}
          </p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
            <span className="material-symbols-rounded text-purple-400">assignment</span>
            Specific Recommendations
          </h3>
          <ul className="space-y-3">
            {feedback.specificRecommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-3 text-slate-300">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 text-sm font-semibold">
                  {i + 1}
                </span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onSkip}
            className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold text-lg transition-colors"
          >
            Continue to Dashboard
          </button>
          <button
            onClick={() => {
              const text = `
CaseBuddy Session Feedback
Overall Score: ${feedback.overallScore}/100

STRENGTHS:
${feedback.strengths.map((s, i) => `${i + 1}. ${s}`).join('\n')}

AREAS TO IMPROVE:
${feedback.improvements.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}

DETAILED ANALYSIS:
${feedback.detailedFeedback}

RECOMMENDATIONS:
${feedback.specificRecommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}
              `.trim();
              
              const blob = new Blob([text], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `casebuddy-feedback-${Date.now()}.txt`;
              link.click();
              URL.revokeObjectURL(url);
            }}
            className="px-6 py-4 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-rounded">download</span>
            Export
          </button>
        </div>
      </div>
    </div>
  );
};
