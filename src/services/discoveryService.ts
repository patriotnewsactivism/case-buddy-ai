import { GoogleGenAI, Type } from "@google/genai";
import { DiscoveryRequest, DiscoveryDeadline } from "../types";
import { addDays, differenceInDays, format, isPast, isToday } from 'date-fns';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateDiscoveryResponse = async (
  request: DiscoveryRequest,
  caseContext: string,
  documentsAvailable?: string[]
): Promise<{
  response: string;
  objections: string[];
  privilegeIssues: string[];
}> => {
  const prompt = `Generate a response to this discovery request.

Request Type: ${request.type}
Request Number: ${request.number}
Question/Request: ${request.question}

Case Context: ${caseContext}
${documentsAvailable ? `Available Documents: ${documentsAvailable.join(', ')}` : ''}

Generate:
1. A proper response (answer or objection)
2. Any applicable objections with legal basis
3. Any privilege issues that may apply

Return JSON.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          response: { type: Type.STRING },
          objections: { type: Type.ARRAY, items: { type: Type.STRING } },
          privilegeIssues: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });

  return JSON.parse(response.text || '{"response":"","objections":[],"privilegeIssues":[]}');
};

export const calculateDeadlines = (requests: DiscoveryRequest[]): DiscoveryDeadline[] => {
  return requests
    .filter(r => r.servedDate && r.status !== 'responded')
    .map(r => {
      const servedDate = new Date(r.servedDate!);
      const dueDate = addDays(servedDate, 30); // Standard 30-day response
      const daysRemaining = differenceInDays(dueDate, new Date());
      
      let status: 'upcoming' | 'due-today' | 'overdue' | 'completed' = 'upcoming';
      if (isPast(dueDate) && !isToday(dueDate)) status = 'overdue';
      else if (isToday(dueDate)) status = 'due-today';
      
      return {
        id: `deadline-${r.id}`,
        caseId: r.caseId,
        requestType: r.type,
        requestNumber: r.number,
        servedDate: r.servedDate!,
        dueDate: format(dueDate, 'yyyy-MM-dd'),
        daysRemaining,
        status
      };
    });
};

export const generatePrivilegeLog = async (
  documents: Array<{ name: string; description: string; privilegeClaimed: string }>
): Promise<string> => {
  const prompt = `Generate a formal privilege log for these documents:

${documents.map(d => `- ${d.name}: ${d.description} (Claiming: ${d.privilegeClaimed})`).join('\n')}

Generate a professional privilege log that:
1. Lists each document
2. Describes the nature of the document
3. States the privilege being claimed
4. Provides sufficient detail without revealing privileged information

Return formatted text.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt
  });

  return response.text || '';
};

export const generateDiscoveryTemplate = async (
  type: 'interrogatories' | 'request-for-production' | 'request-for-admission',
  caseType: string,
  caseFacts: string,
  party: 'plaintiff' | 'defendant'
): Promise<DiscoveryRequest[]> => {
  const prompt = `Generate ${type === 'interrogatories' ? '25 interrogatories' : type === 'request-for-production' ? '20 requests for production' : '25 requests for admission'} for a ${caseType} case.

Case Facts: ${caseFacts}
Generating for: ${party}

Generate requests that are:
1. Relevant to the case
2. Properly worded
3. Not objectionable on their face
4. Likely to elicit useful information

Return JSON array of requests.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            caseId: { type: Type.STRING },
            type: { type: Type.STRING },
            number: { type: Type.STRING },
            question: { type: Type.STRING },
            status: { type: Type.STRING }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || '[]');
};

export const saveDiscoveryRequests = (caseId: string, requests: DiscoveryRequest[]): void => {
  localStorage.setItem(`discovery_${caseId}`, JSON.stringify(requests));
};

export const getDiscoveryRequests = (caseId: string): DiscoveryRequest[] => {
  const saved = localStorage.getItem(`discovery_${caseId}`);
  return saved ? JSON.parse(saved) : [];
};

export default {
  generateDiscoveryResponse,
  calculateDeadlines,
  generatePrivilegeLog,
  generateDiscoveryTemplate,
  saveDiscoveryRequests,
  getDiscoveryRequests
};
