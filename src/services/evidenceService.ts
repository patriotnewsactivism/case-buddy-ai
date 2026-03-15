import { GoogleGenAI, Type } from "@google/genai";
import { AdmissibilityAnalysis, AdmissibilityIssue, CaseLawCitation } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

/**
 * Analyze evidence for admissibility under Federal Rules of Evidence
 */
export const analyzeAdmissibility = async (
  evidenceDescription: string,
  caseContext: string,
  howItWillBeUsed: string
): Promise<AdmissibilityAnalysis> => {
  try {
    const prompt = `You are an expert evidence analyst. Analyze this evidence for admissibility under the Federal Rules of Evidence (FRE).

    Evidence Description:
    ${evidenceDescription}
    
    Case Context:
    ${caseContext}
    
    How It Will Be Used:
    ${howItWillBeUsed}
    
    Analyze for the following issues:
    
    1. RELEVANCE (FRE 401-403)
       - Is it relevant? (tends to make a fact more/less probable)
       - Is probative value substantially outweighed by unfair prejudice?
       - Any 403 balancing issues?
    
    2. HEARSAY (FRE 801-807)
       - Is it an out-of-court statement offered for its truth?
       - If hearsay, are there applicable exceptions?
       - Consider: Present sense impression, Excited utterance, Statements for medical diagnosis, Business records, Public records, etc.
    
    3. AUTHENTICATION (FRE 901-903)
       - How can this evidence be authenticated?
       - What foundation needs to be laid?
    
    4. BEST EVIDENCE RULE (FRE 1001-1008)
       - Is this an original document or duplicate?
       - Is the original required?
    
    5. CHARACTER EVIDENCE (FRE 404)
       - Is this being used to show character?
       - Is character evidence permissible in this context?
    
    6. EXPERT TESTIMONY (FRE 702)
       - Does this require expert testimony?
       - Is the methodology reliable under Daubert?
    
    Return JSON with detailed analysis.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallAdmissibility: { 
              type: Type.STRING, 
              enum: ['admissible', 'conditionally_admissible', 'inadmissible'] 
            },
            confidenceScore: { type: Type.NUMBER, description: '0-100' },
            issues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  severity: { type: Type.STRING, enum: ['fatal', 'serious', 'minor'] },
                  rule: { type: Type.STRING, description: 'FRE rule number' },
                  explanation: { type: Type.STRING },
                  potentialCure: { type: Type.STRING }
                }
              }
            },
            suggestedFoundations: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: 'Steps to lay foundation for admission'
            },
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
                  favorableTo: { type: Type.STRING, enum: ['plaintiff', 'defendant', 'neutral'] },
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
    
    return {
      overallAdmissibility: result.overallAdmissibility || 'conditionally_admissible',
      confidenceScore: result.confidenceScore || 50,
      issues: result.issues || [],
      suggestedFoundations: result.suggestedFoundations || [],
      caseLawSupport: result.caseLawSupport || []
    };

  } catch (error) {
    console.error('Admissibility analysis error:', error);
    throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Generate a motion in limine for the evidence
 */
export const generateMotionInLimine = async (
  evidenceDescription: string,
  analysis: AdmissibilityAnalysis,
  caseName: string,
  caseNumber: string,
  court: string,
  movingParty: 'plaintiff' | 'defendant'
): Promise<string> => {
  try {
    const prompt = `Draft a Motion in Limine ${movingParty === 'plaintiff' ? 'to Admit' : 'to Exclude'} Evidence.
    
    Case: ${caseName}
    Case No: ${caseNumber}
    Court: ${court}
    Moving Party: ${movingParty === 'plaintiff' ? 'Plaintiff' : 'Defendant'}
    
    Evidence at Issue:
    ${evidenceDescription}
    
    Admissibility Analysis:
    ${JSON.stringify(analysis, null, 2)}
    
    Draft a professional motion that:
    1. Identifies the evidence at issue
    2. States the legal basis for admission/exclusion
    3. Cites relevant Federal Rules of Evidence
    4. Cites supporting case law from the analysis
    5. Addresses anticipated counterarguments
    6. Requests specific relief
    7. Follows standard motion format
    
    Use proper legal citation format (Bluebook).
    Include a proposed order.
    
    Return as formatted text ready for attorney review.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    return response.text || '';

  } catch (error) {
    console.error('Motion generation error:', error);
    throw new Error(`Motion generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Identify potential objections to evidence
 */
export const identifyPotentialObjections = async (
  evidenceDescription: string,
  context: string
): Promise<Array<{
  objection: string;
  ground: string;
  rule: string;
  likelihood: 'high' | 'medium' | 'low';
  response: string;
}>> => {
  try {
    const prompt = `Identify potential objections to this evidence in a trial setting.
    
    Evidence:
    ${evidenceDescription}
    
    Context:
    ${context}
    
    For each potential objection, provide:
    - The objection type (e.g., "Objection, hearsay")
    - The legal ground
    - The applicable FRE rule
    - Likelihood of the objection being raised (high/medium/low)
    - A good response to the objection
    
    Return as JSON array.`;

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
              objection: { type: Type.STRING },
              ground: { type: Type.STRING },
              rule: { type: Type.STRING },
              likelihood: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
              response: { type: Type.STRING }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');

  } catch (error) {
    console.error('Objection identification error:', error);
    return [];
  }
};

/**
 * Predict judge's ruling on evidence
 */
export const predictRuling = async (
  evidenceDescription: string,
  analysis: AdmissibilityAnalysis,
  judgeProfile?: string
): Promise<{
  prediction: 'admitted' | 'excluded' | 'limited';
  confidence: number;
  reasoning: string;
  conditions?: string[];
}> => {
  try {
    const prompt = `Predict how a judge would rule on this evidence.
    
    Evidence:
    ${evidenceDescription}
    
    Admissibility Analysis:
    ${JSON.stringify(analysis, null, 2)}
    
    ${judgeProfile ? `Judge Profile: ${judgeProfile}` : ''}
    
    Consider:
    1. The strength of the legal arguments
    2. Precedent and case law
    3. Judicial discretion tendencies
    4. Any limiting instructions that might apply
    
    Return JSON with prediction, confidence (0-100), reasoning, and any conditions.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prediction: { type: Type.STRING, enum: ['admitted', 'excluded', 'limited'] },
            confidence: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
            conditions: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}');

  } catch (error) {
    console.error('Ruling prediction error:', error);
    return {
      prediction: 'admitted',
      confidence: 50,
      reasoning: 'Unable to predict ruling due to error'
    };
  }
};