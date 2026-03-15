import { Case, CaseStatus } from '../types';
import { callGeminiProxy } from './apiProxy';
import { Type } from '@google/genai';

export const generateRealisticCase = async (prompt: string): Promise<Partial<Case>> => {
  const systemPrompt = `You are a legal case generator. Create a highly realistic and detailed legal case based on the user's brief description.
  Include realistic parties, docket numbers, court locations (e.g., "Southern District of New York", "Harris County District Court"), and a detailed summary of the legal theory and key issues.
  
  The case should feel like it's pulled from a real law firm's database.`;

  try {
    const response = await callGeminiProxy({
      prompt: `Generate a realistic legal case based on this: ${prompt}`,
      systemPrompt,
      model: 'gemini-2.5-flash',
      options: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            client: { type: Type.STRING },
            opposingParty: { type: Type.STRING },
            opposingCounsel: { type: Type.STRING },
            judge: { type: Type.STRING },
            docketNumber: { type: Type.STRING },
            courtLocation: { type: Type.STRING },
            jurisdiction: { type: Type.STRING },
            summary: { type: Type.STRING },
            legalTheory: { type: Type.STRING },
            keyIssues: { type: Type.ARRAY, items: { type: Type.STRING } },
            clientType: { type: Type.STRING, enum: ['plaintiff', 'defendant', 'prosecution'] },
          },
          required: ['title', 'client', 'summary']
        }
      }
    });

    if (!response.success || !response.text) {
      throw new Error(response.error?.message || 'Failed to generate case: Empty response from AI');
    }

    const data = JSON.parse(response.text);
    return {
      ...data,
      status: CaseStatus.PRE_TRIAL,
      winProbability: 50,
      evidence: [],
      tasks: [],
      nextCourtDate: 'TBD'
    };
  } catch (error) {
    console.error('Failed to generate realistic case:', error);
    throw error;
  }
};
