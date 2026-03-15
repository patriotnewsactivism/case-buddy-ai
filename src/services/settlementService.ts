import { GoogleGenAI, Type } from "@google/genai";
import { SettlementAnalysis, EconomicDamages, NonEconomicDamages, SettlementFactor } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const calculateSettlement = async (
  caseData: {
    caseSummary: string;
    injuries: string[];
    medicalBills: number;
    lostWages: number;
    futureMedicalCosts?: number;
    futureLostWages?: number;
    propertyDamage?: number;
    comparativeNegligence?: number;
    jurisdiction?: string;
  }
): Promise<SettlementAnalysis> => {
  const prompt = `Calculate a comprehensive settlement analysis for this personal injury case.

Case Summary: ${caseData.caseSummary}
Injuries: ${caseData.injuries.join(', ')}
Medical Bills (Past): $${caseData.medicalBills}
Lost Wages (Past): $${caseData.lostWages}
Future Medical Costs: $${caseData.futureMedicalCosts || 0}
Future Lost Wages: $${caseData.futureLostWages || 0}
Property Damage: $${caseData.propertyDamage || 0}
Plaintiff Negligence %: ${caseData.comparativeNegligence || 0}
Jurisdiction: ${caseData.jurisdiction || 'Federal'}

Calculate:
1. Total economic damages
2. Non-economic damages using appropriate multiplier (consider injury severity, jurisdiction tendencies)
3. Settlement range (low-high based on case strengths/weaknesses)
4. Key factors affecting value

Return detailed JSON analysis.`;

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
          date: { type: Type.STRING },
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
              painAndSuffering: { type: Type.NUMBER },
              emotionalDistress: { type: Type.NUMBER },
              lossOfConsortium: { type: Type.NUMBER },
              lossOfEnjoyment: { type: Type.NUMBER },
              disfigurement: { type: Type.NUMBER },
              multiplier: { type: Type.NUMBER },
              total: { type: Type.NUMBER }
            }
          },
          comparativeNegligence: { type: Type.NUMBER },
          settlementRange: { type: Type.ARRAY, items: { type: Type.NUMBER } },
          recommendedDemand: { type: Type.NUMBER },
          confidenceScore: { type: Type.NUMBER },
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
          negotiationStrategy: { type: Type.STRING }
        }
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const simulateNegotiation = async (
  settlementAnalysis: SettlementAnalysis,
  opponentType: 'insurance' | 'corporation' | 'individual' | 'government',
  yourDemand: number,
  round: number,
  priorRounds?: { yourPosition: number; opponentPosition: number; yourArgument: string }[]
): Promise<{
  opponentResponse: string;
  opponentCounterOffer: number;
  negotiationTactics: string[];
  recommendedResponse: string;
}> => {
  const prompt = `You are an insurance adjuster/corporate negotiator. Respond to this settlement demand.

Settlement Analysis: ${JSON.stringify(settlementAnalysis, null, 2)}
Opponent Type: ${opponentType}
Your Demand: $${yourDemand}
Round: ${round}
${priorRounds ? `Prior Rounds: ${JSON.stringify(priorRounds, null, 2)}` : ''}

Generate a realistic negotiation response with:
- Counter-offer (typically 30-50% of demand for first rounds)
- Response/argument
- Tactics being used
- Recommended response for next round

Return JSON.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          opponentResponse: { type: Type.STRING },
          opponentCounterOffer: { type: Type.NUMBER },
          negotiationTactics: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendedResponse: { type: Type.STRING }
        }
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export default {
  calculateSettlement,
  simulateNegotiation
};
