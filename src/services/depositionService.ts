import { GoogleGenAI, Type } from "@google/genai";
import { DepositionOutline, DepositionTopic, DepositionQuestion, AnticipatedObjection } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateDepositionOutline = async (
  caseSummary: string,
  deponentName: string,
  deponentRole: string,
  caseDocuments?: string[]
): Promise<DepositionOutline> => {
  const prompt = `Generate a comprehensive deposition outline for ${deponentName}, who is a ${deponentRole}.

Case Summary:
${caseSummary}

${caseDocuments ? `Available Documents:\n${caseDocuments.join('\n')}` : ''}

Generate an organized deposition outline with:
1. Foundation questions (background, employment, relationship to case)
2. Substantive questions organized by topic
3. Impeachment questions if applicable
4. Questions should be open-ended for direct-style questioning
5. Anticipated objections with response strategies

Return JSON with the full deposition outline.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          caseId: { type: Type.STRING },
          deponentName: { type: Type.STRING },
          deponentRole: { type: Type.STRING },
          date: { type: Type.STRING },
          topics: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
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
                      anticipatedObjection: { type: Type.STRING }
                    }
                  }
                },
                order: { type: Type.NUMBER },
                notes: { type: Type.STRING }
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
                responseStrategy: { type: Type.STRING }
              }
            }
          },
          keyDocuments: { type: Type.ARRAY, items: { type: Type.STRING } },
          notes: { type: Type.STRING }
        }
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const generateFollowUpQuestions = async (
  originalQuestion: string,
  answer: string,
  caseContext: string
): Promise<string[]> => {
  const prompt = `Based on this deposition Q&A, generate follow-up questions:

Q: ${originalQuestion}
A: ${answer}

Case Context: ${caseContext}

Generate 3-5 follow-up questions that probe for more detail or address inconsistencies.
Return as JSON array of strings.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  return JSON.parse(response.text || '[]');
};

export const simulateDepositionWitness = async (
  deponentRole: string,
  question: string,
  caseContext: string,
  priorTestimony?: string[]
): Promise<string> => {
  const systemPrompt = `You are roleplaying as a ${deponentRole} in a deposition.
Stay in character. Answer questions as this witness would.
Be consistent with prior testimony if provided.
If you don't know something, say so.
Do not volunteer information beyond what is asked.`;

  const historyText = priorTestimony?.map(t => `Prior: ${t}`).join('\n') || '';
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `${systemPrompt}\n\nCase Context: ${caseContext}\n${historyText}\n\nQuestion: ${question}`
  });

  return response.text || 'I cannot recall.';
};

export default {
  generateDepositionOutline,
  generateFollowUpQuestions,
  simulateDepositionWitness
};
