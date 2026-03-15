import { GoogleGenAI, Type } from "@google/genai";
import { EvidenceItem, Case, Jurisdiction, AdmissibilityAnalysis, AdmissibilityIssue, CaseLawCitation } from '../types';
import { OBJECTION_GROUNDS, HEARSAY_EXCEPTIONS, BEST_EVIDENCE_EXCEPTIONS, AUTHENTICATION_METHODS, getHearsayExceptions, getAuthenticationMethods } from '../utils/objectionRules';
import { retryWithBackoff, withTimeout } from '../utils/errorHandler';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

interface HearsayAnalysisResult {
  isHearsay: boolean;
  exceptions: string[];
  explanation: string;
}

interface BestEvidenceAnalysisResult {
  requiresOriginal: boolean;
  exceptions: string[];
  explanation: string;
}

interface AuthenticationResult {
  requiredSteps: string[];
  complexity: 'low' | 'medium' | 'high';
  explanation: string;
}

export const analyzeEvidenceAdmissibility = async (
  evidence: EvidenceItem,
  caseContext: Case,
  jurisdiction: Jurisdiction
): Promise<AdmissibilityAnalysis> => {
  try {
    const response = await retryWithBackoff(async () => {
      return withTimeout(
        ai.models.generateContent({
          model: 'gemini-2.5-pro',
          contents: `You are an expert evidence law attorney analyzing admissibility.

EVIDENCE TO ANALYZE:
Title: ${evidence.title}
Type: ${evidence.type}
Summary: ${evidence.summary}
Key Entities: ${evidence.keyEntities.join(', ')}
Risks: ${evidence.risks.join(', ')}
Notes: ${evidence.notes || 'None'}

CASE CONTEXT:
Case: ${caseContext.title}
Client: ${caseContext.client}
Summary: ${caseContext.summary}
Status: ${caseContext.status}

JURISDICTION: ${jurisdiction}

Analyze this evidence for admissibility. Consider:
1. Relevance (FRE 401-403)
2. Hearsay issues (FRE 801-807)
3. Authentication requirements (FRE 901-902)
4. Best evidence rule (FRE 1001-1008)
5. Character evidence issues (FRE 404-405)
6. Privilege concerns (FRE 501-502)
7. Expert testimony requirements if applicable (FRE 702)

Think deeply about each potential objection ground and applicable exceptions.

Return a comprehensive analysis with probability of admission.`,
          config: {
            thinkingConfig: { thinkingBudget: 4096 },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                overallAdmissibility: {
                  type: Type.STRING,
                  enum: ['admissible', 'conditionally_admissible', 'inadmissible']
                },
                confidenceScore: {
                  type: Type.NUMBER,
                  description: '0 to 100 confidence in admissibility assessment'
                },
                issues: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      type: { type: Type.STRING },
                      severity: { type: Type.STRING, enum: ['fatal', 'serious', 'minor'] },
                      rule: { type: Type.STRING },
                      explanation: { type: Type.STRING },
                      potentialCure: { type: Type.STRING }
                    }
                  }
                },
                suggestedFoundations: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
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
        }),
        60000
      );
    }, 3);

    return JSON.parse(response.text || '{}');
  } catch (error) {
    throw new Error(`Evidence admissibility analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const generateFoundationQuestions = async (
  evidenceType: string,
  jurisdiction: Jurisdiction
): Promise<string[]> => {
  try {
    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: `You are an expert trial attorney. Generate foundation questions for admitting ${evidenceType} evidence in ${jurisdiction} jurisdiction.

The questions should:
1. Be phrased as direct examination questions to a witness
2. Establish each required foundation element
3. Be in proper form (not leading, clear, concise)
4. Follow a logical sequence

Generate 5-10 foundation questions that would establish proper foundation for this type of evidence.`,
        config: {
          thinkingConfig: { thinkingBudget: 2048 },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      }),
      45000
    );

    return JSON.parse(response.text || '[]');
  } catch (error) {
    const defaultQuestions = getDefaultFoundationQuestions(evidenceType);
    return defaultQuestions;
  }
};

export const checkAuthenticationRequirements = async (
  evidence: EvidenceItem,
  jurisdiction: Jurisdiction
): Promise<AuthenticationResult> => {
  try {
    const authMethods = getAuthenticationMethods(evidence.type.toLowerCase());
    
    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: `Analyze authentication requirements for the following evidence in ${jurisdiction} jurisdiction:

EVIDENCE:
Title: ${evidence.title}
Type: ${evidence.type}
Summary: ${evidence.summary}

AVAILABLE AUTHENTICATION METHODS:
${authMethods.join('\n')}

Determine:
1. What authentication steps are required for this type of evidence
2. The complexity of authentication (low = straightforward, medium = requires foundation, high = expert testimony or extensive foundation needed)
3. A brief explanation of the authentication approach`,
        config: {
          thinkingConfig: { thinkingBudget: 2048 },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              requiredSteps: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              complexity: {
                type: Type.STRING,
                enum: ['low', 'medium', 'high']
              },
              explanation: { type: Type.STRING }
            }
          }
        }
      }),
      45000
    );

    return JSON.parse(response.text || '{"requiredSteps":[],"complexity":"medium","explanation":""}');
  } catch (error) {
    return {
      requiredSteps: getAuthenticationMethods(evidence.type.toLowerCase()),
      complexity: 'medium',
      explanation: 'Standard authentication required for this evidence type.'
    };
  }
};

export const analyzeHearsayIssues = async (
  evidence: EvidenceItem,
  jurisdiction: Jurisdiction
): Promise<HearsayAnalysisResult> => {
  try {
    const applicableExceptions = getHearsayExceptions(jurisdiction);
    const exceptionNames = applicableExceptions.map(e => `${e.name} (${e.ruleNumber})`).join('\n');

    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: `Analyze hearsay issues for the following evidence in ${jurisdiction} jurisdiction:

EVIDENCE:
Title: ${evidence.title}
Type: ${evidence.type}
Summary: ${evidence.summary}

APPLICABLE HEARSAY EXCEPTIONS IN THIS JURISDICTION:
${exceptionNames}

Determine:
1. Whether this evidence contains or constitutes hearsay (out-of-court statement offered for truth)
2. What exceptions might apply if it is hearsay
3. Detailed explanation of the analysis`,
        config: {
          thinkingConfig: { thinkingBudget: 2048 },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isHearsay: { type: Type.BOOLEAN },
              exceptions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              explanation: { type: Type.STRING }
            }
          }
        }
      }),
      45000
    );

    return JSON.parse(response.text || '{"isHearsay":false,"exceptions":[],"explanation":"Unable to analyze"}');
  } catch (error) {
    return {
      isHearsay: false,
      exceptions: [],
      explanation: 'Unable to analyze hearsay issues due to an error.'
    };
  }
};

export const analyzeBestEvidenceIssues = async (
  evidence: EvidenceItem
): Promise<BestEvidenceAnalysisResult> => {
  try {
    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: `Analyze best evidence rule issues for the following evidence:

EVIDENCE:
Title: ${evidence.title}
Type: ${evidence.type}
Summary: ${evidence.summary}

BEST EVIDENCE RULE EXCEPTIONS:
${BEST_EVIDENCE_EXCEPTIONS.join('\n')}

The best evidence rule (FRE 1001-1008) requires the original document when proving its content.

Determine:
1. Whether this evidence requires an original under the best evidence rule
2. What exceptions might apply if an original is required
3. Detailed explanation of the analysis`,
        config: {
          thinkingConfig: { thinkingBudget: 2048 },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              requiresOriginal: { type: Type.BOOLEAN },
              exceptions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              explanation: { type: Type.STRING }
            }
          }
        }
      }),
      45000
    );

    return JSON.parse(response.text || '{"requiresOriginal":false,"exceptions":[],"explanation":"Unable to analyze"}');
  } catch (error) {
    return {
      requiresOriginal: false,
      exceptions: [],
      explanation: 'Unable to analyze best evidence issues due to an error.'
    };
  }
};

const getDefaultFoundationQuestions = (evidenceType: string): string[] => {
  const questionSets: Record<string, string[]> = {
    document: [
      'Can you please state your name and occupation for the record?',
      'Are you familiar with the document marked as Exhibit ___?',
      'How are you familiar with this document?',
      'When did you first see or create this document?',
      'Is this document kept in the regular course of business?',
      'Was this document made at or near the time of the events it describes?',
      'Does this document appear to be in the same condition as when you first saw it?',
      'I offer Exhibit ___ into evidence.'
    ],
    photograph: [
      'Can you please state your name for the record?',
      'Are you familiar with the location depicted in the photograph marked as Exhibit ___?',
      'When were you last at that location?',
      'Does this photograph fairly and accurately represent that location as it appeared on [date]?',
      'I offer Exhibit ___ into evidence.'
    ],
    recording: [
      'Can you please state your name and occupation?',
      'Were you present during the conversation recorded on [date]?',
      'Do you recognize the voices on the recording marked as Exhibit ___?',
      'Can you identify who is speaking at each point in the recording?',
      'Was this recording made with the consent of at least one party?',
      'Has the recording been altered in any way since it was made?',
      'I offer Exhibit ___ into evidence.'
    ],
    physical: [
      'Can you please state your name and occupation?',
      'I show you what has been marked as Exhibit ___. Do you recognize this item?',
      'How are you familiar with this item?',
      'When did you first come into contact with this item?',
      'What did you do with this item after you discovered it?',
      'Has this item been in your custody or under your control since that time?',
      'Is this item in substantially the same condition as when you first saw it?',
      'I offer Exhibit ___ into evidence.'
    ]
  };

  const type = evidenceType.toLowerCase();
  for (const key of Object.keys(questionSets)) {
    if (type.includes(key)) {
      return questionSets[key];
    }
  }

  return questionSets.document;
};
