import { Type } from "@google/genai";
import { DocumentType, StrategyInsight, CoachingAnalysis, TrialPhase, SimulationMode, SimulatorSettings, CoachingSuggestion, ProactiveCoaching, Message } from "../types";
import { retryWithBackoff, withTimeout, isRateLimitError, getErrorMessage } from "../utils/errorHandler";
import { toast } from "react-toastify";
import { performDocumentOCR } from "./ocrService";
import { generateOpenAIResponse, isOpenAIConfigured } from "./openAIService";
import { callGeminiProxy, callOpenAIProxy, isProxyReady, checkProxyHealth, GeminiProxyRequest } from "./apiProxy";
import { getCachedResult, cacheResult } from "./cacheService";
import { routeAIRequest, getModelString } from "./aiModelRouter";
import { logAudit } from "./auditLogService";

const apiKey = process.env.API_KEY || '';

if (!apiKey) {
  console.warn('[Gemini] API key not set - using Edge Function proxy instead');
}

export const isApiKeyValid = (): boolean => {
  return isProxyReady();
};

export const validateApiKey = async (): Promise<void> => {
  const healthy = await checkProxyHealth();
  if (!healthy) {
    throw new Error('Gemini proxy is not available. Please check your Supabase configuration.');
  }
};

interface ChatSessionData {
  id: string;
  type: 'witness' | 'opponent' | 'trial';
  systemInstruction: string;
  history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
  createdAt: number;
}

const chatSessions = new Map<string, ChatSessionData>();

type QueuedRequest = {
  fn: () => Promise<any>;
  fallbackFn?: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
};

let requestQueue: QueuedRequest[] = [];
let isProcessing = false;
let lastRequestTime = 0;
let currentMinInterval = 1500;
const MAX_INTERVAL = 10000;
const BASE_INTERVAL = 1500;

const processQueue = async () => {
  if (isProcessing || requestQueue.length === 0) return;
  
  isProcessing = true;
  
  while (requestQueue.length > 0) {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < currentMinInterval) {
      await new Promise(r => setTimeout(r, currentMinInterval - timeSinceLastRequest));
    }
    
    const request = requestQueue.shift();
    if (!request) continue;
    
    lastRequestTime = Date.now();
    
    try {
      const result = await request.fn();
      request.resolve(result);
      currentMinInterval = Math.max(BASE_INTERVAL, currentMinInterval * 0.9);
    } catch (error) {
      if (isRateLimitError(error)) {
        console.log(`Rate limited, dynamic interval increased to ${Math.round(currentMinInterval)}ms`);
        currentMinInterval = Math.min(MAX_INTERVAL, currentMinInterval * 2);
        
        if (request.fallbackFn && isOpenAIConfigured()) {
          console.log('Gemini capacity exhausted, attempting OpenAI fallback...');
          try {
            const fallbackResult = await request.fallbackFn();
            request.resolve(fallbackResult);
            continue;
          } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
          }
        }

        toast.warning('Gemini capacity reached, waiting...');
        await new Promise(r => setTimeout(r, 5000));
        requestQueue.unshift(request);
        lastRequestTime = Date.now();
      } else {
        request.reject(error);
      }
    }
  }
  
  isProcessing = false;
};

const queueRequest = async <T>(fn: () => Promise<T>, fallbackFn?: () => Promise<T>): Promise<T> => {
  return new Promise((resolve, reject) => {
    requestQueue.push({ fn, fallbackFn, resolve, reject });
    processQueue();
  });
};

export const createChatSession = (
  id: string,
  type: 'witness' | 'opponent' | 'trial',
  systemInstruction: string,
  initialHistory: { role: 'user' | 'model'; parts: { text: string }[] }[] = []
) => {
  const existing = chatSessions.get(id);
  if (existing) {
    return existing;
  }

  chatSessions.set(id, {
    id,
    type,
    systemInstruction,
    history: initialHistory,
    createdAt: Date.now()
  });

  return chatSessions.get(id);
};

export const getChatSession = (id: string) => {
  return chatSessions.get(id) || null;
};

export const clearChatSession = (id: string) => {
  chatSessions.delete(id);
};

export const clearAllChatSessions = () => {
  chatSessions.clear();
};

export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      const base64Content = base64data.split(',')[1];
      
      let mimeType = file.type || 'application/octet-stream';
      const fileName = file.name.toLowerCase();
      
      if (fileName.endsWith('.pdf')) {
        mimeType = 'application/pdf';
      } else if (fileName.match(/\.(jpg|jpeg)$/)) {
        mimeType = 'image/jpeg';
      } else if (fileName.endsWith('.png')) {
        mimeType = 'image/png';
      } else if (fileName.endsWith('.webp')) {
        mimeType = 'image/webp';
      } else if (fileName.endsWith('.gif')) {
        mimeType = 'image/gif';
      } else if (fileName.match(/\.(mp3|m4a|wav|ogg|webm)$/)) {
        mimeType = file.type || 'audio/mpeg';
      } else if (fileName.match(/\.(mp4|mov|avi)$/)) {
        mimeType = file.type || 'video/mp4';
      } else if (file.type.startsWith('image/')) {
        mimeType = file.type;
      }
      
      resolve({
        inlineData: {
          data: base64Content,
          mimeType,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzePDFDocument = async (
  file: File,
  onProgress?: (progress: number, status: string) => void
): Promise<{ 
  text: string; 
  pageCount: number; 
  summary: string;
  entities: string[];
  keyDates: string[];
  monetaryAmounts: string[];
  risks: string[];
}> => {
  onProgress?.(10, 'Extracting text with OCR...');
  const ocrResult = await performDocumentOCR(file, (p, s) => onProgress?.(10 + p * 0.6, s));
  
  const extractedText = ocrResult.text;
  const pageCount = ocrResult.pages?.length || 1;
  
  onProgress?.(80, 'Analyzing document...');
  
  const prompt = `Analyze this legal document text and extract key information.

Document Text:
${extractedText.substring(0, 50000)}

Provide:
1. A comprehensive summary (3-5 sentences)
2. All entities mentioned (people, organizations, companies)
3. All dates and deadlines
4. All monetary amounts with context
5. Potential legal risks or issues

Return JSON format.`;

  return queueRequest(async () => {
    return retryWithBackoff(async () => {
      const response = await callGeminiProxy({
        prompt,
        model: 'gemini-2.5-flash',
        options: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              entities: { type: Type.ARRAY, items: { type: Type.STRING } },
              keyDates: { type: Type.ARRAY, items: { type: Type.STRING } },
              monetaryAmounts: { type: Type.ARRAY, items: { type: Type.STRING } },
              risks: { type: Type.ARRAY, items: { type: Type.STRING } },
            }
          }
        }
      });

      if (!response.success || !response.text) {
        throw new Error(response.error?.message || 'Document analysis failed: No response text received');
      }

      const analysis = JSON.parse(response.text);
      
      return {
        text: extractedText,
        pageCount,
        confidence: ocrResult.confidence,
        summary: analysis.summary || 'No summary available',
        entities: analysis.entities || [],
        keyDates: analysis.keyDates || [],
        monetaryAmounts: analysis.monetaryAmounts || [],
        risks: analysis.risks || [],
      };
    }, 3, 2000);
  });
};

export const batchAnalyzeDocuments = async (
  files: File[], 
  onProgress?: (current: number, total: number, fileName: string) => void
): Promise<Array<{ fileName: string; result: any; error?: string }>> => {
  const results: Array<{ fileName: string; result: any; error?: string }> = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.(i + 1, files.length, file.name);
    
    try {
      const isPDF = file.name.toLowerCase().endsWith('.pdf');
      
      if (isPDF) {
        const result = await analyzePDFDocument(file);
        results.push({ fileName: file.name, result });
      } else {
        const filePart = await fileToGenerativePart(file);
        const result = await analyzeDocument("Analyze this uploaded document.", filePart);
        results.push({ fileName: file.name, result });
      }
    } catch (error) {
      results.push({ 
        fileName: file.name, 
        result: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
    
    if (i < files.length - 1) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  
  return results;
};

export const analyzeDocument = async (text: string, filePart?: any) => {
  const prompt = `You are a legal document analyst. Analyze the following document thoroughly.

Extract and provide:
1. A comprehensive summary (3-5 sentences for complex documents)
2. Key entities: people, organizations, statutes, dates, case citations
3. Potential legal risks, contradictions, or issues
4. Document type classification
5. Key dates and deadlines mentioned
6. Monetary amounts if present

Return JSON format.`;

  const fullPrompt = prompt + "\n\n" + (text || "Analyze this uploaded document.");

  // Check cache first (skip if file-based analysis with inline data)
  if (!filePart) {
    const cached = await getCachedResult(fullPrompt, 'document_analysis');
    if (cached.hit) {
      logAudit({ action: 'cache_hit', resource: 'document_analysis', success: true });
      return cached.data;
    }
    logAudit({ action: 'cache_miss', resource: 'document_analysis', success: true });
  }

  // Route to optimal model
  const routing = routeAIRequest(fullPrompt, { analysisType: 'document_analysis' });

  return queueRequest(async () => {
    const startTime = Date.now();

    const response = await callGeminiProxy({
      prompt: fullPrompt,
      model: routing.model.model,
      options: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            entities: { type: Type.ARRAY, items: { type: Type.STRING } },
            risks: { type: Type.ARRAY, items: { type: Type.STRING } },
            documentType: { type: Type.STRING },
            keyDates: { type: Type.ARRAY, items: { type: Type.STRING } },
            monetaryAmounts: { type: Type.ARRAY, items: { type: Type.STRING } },
          }
        }
      }
    });

    if (!response.success || !response.text) {
      logAudit({ action: 'ai_request', resource: 'document_analysis', modelUsed: routing.model.model, success: false, errorMessage: response.error?.message });
      throw new Error(response.error?.message || 'Document analysis failed: No response text received');
    }

    const result = JSON.parse(response.text);

    logAudit({
      action: 'ai_request',
      resource: 'document_analysis',
      modelUsed: routing.model.model,
      tokenCount: response.usage?.totalTokenCount || undefined,
      estimatedCost: routing.estimatedCost,
      durationMs: Date.now() - startTime,
      success: true,
    });

    // Cache the result
    if (!filePart) {
      await cacheResult(fullPrompt, 'document_analysis', result, {
        modelUsed: routing.model.model,
        tokenCount: response.usage?.totalTokenCount || undefined,
      });
    }

    return result;
  });
};

export const generateWitnessResponse = async (
  sessionId: string,
  message: string,
  witnessName: string,
  personality: string,
  caseContext: string,
  knowledgeContext?: string,
  forceNew: boolean = false
) => {
  const knowledgeSection = knowledgeContext 
    ? `\n\nRELEVANT CASE KNOWLEDGE:\n${knowledgeContext}\n`
    : '';
    
  const systemInstruction = `You are roleplaying as a witness named ${witnessName} in a legal trial.
    Your personality is: ${personality}.
    Case Context: ${caseContext}.${knowledgeSection}

    Rules:
    1. Stay in character at all times.
    2. If you are 'hostile', be short, evasive, and defensive.
    3. If you are 'nervous', stutter occasionally and be unsure.
    4. If you are 'cooperative', provide helpful details but only what you know.
    5. Do not break character or mention you are an AI.
    6. Keep responses relatively concise, as in a courtroom cross-examination.
    7. Reference specific facts, dates, and evidence from the case knowledge when relevant.`;

  return queueRequest(
    async () => {
      if (forceNew) {
        clearChatSession(sessionId);
      }

      let session = getChatSession(sessionId);
      if (!session) {
        session = createChatSession(sessionId, 'witness', systemInstruction);
      }

      const updatedHistory = [...session.history];
      updatedHistory.push({ role: 'user', parts: [{ text: message }] });

      const response = await callGeminiProxy({
        prompt: message,
        systemPrompt: systemInstruction,
        model: 'gemini-2.5-flash',
        options: {
          temperature: 0.9,
        },
        conversationHistory: session.history.length > 0 ? session.history : undefined
      });

      if (!response.success || !response.text?.trim()) {
        throw new Error(response.error?.message || 'Witness response failed: No response text received');
      }

      session.history = updatedHistory;
      session.history.push({ role: 'model', parts: [{ text: response.text }] });

      return response.text;
    },
    async () => {
      return generateOpenAIResponse(systemInstruction, message);
    }
  );
};

export const predictStrategy = async (
  caseSummary: string,
  opponentProfile: string,
  knowledgeContext?: string
): Promise<StrategyInsight[]> => {
  const knowledgeSection = knowledgeContext
    ? `\n\nRELEVANT CASE KNOWLEDGE:\n${knowledgeContext}\n`
    : '';

  const prompt = `Analyze this case and the opposing counsel profile.
      Case: ${caseSummary}${knowledgeSection}
      Opponent: ${opponentProfile}

      Provide 3 strategic insights (Risks, Opportunities, or Predictions). Return JSON array of objects with fields: title, description, confidence (number), type (risk|opportunity|prediction).`;

  // Check cache
  const cached = await getCachedResult(prompt, 'strategy');
  if (cached.hit) {
    logAudit({ action: 'cache_hit', resource: 'strategy', success: true });
    return cached.data as StrategyInsight[];
  }
  logAudit({ action: 'cache_miss', resource: 'strategy', success: true });

  // Route to optimal model (strategy uses pro for paid users)
  const routing = routeAIRequest(prompt, { analysisType: 'strategy', requiresThinking: true });

  return queueRequest(
    async () => {
      const startTime = Date.now();

      const response = await callGeminiProxy({
        prompt,
        model: routing.model.model,
        options: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                type: { type: Type.STRING, enum: ['risk', 'opportunity', 'prediction'] }
              }
            }
          }
        }
      });

      if (!response.success || !response.text) {
        logAudit({ action: 'ai_request', resource: 'strategy', modelUsed: routing.model.model, success: false, errorMessage: response.error?.message });
        throw new Error(response.error?.message || 'Strategy prediction failed: No response text received');
      }

      const result = JSON.parse(response.text);

      logAudit({
        action: 'ai_request',
        resource: 'strategy',
        modelUsed: routing.model.model,
        tokenCount: response.usage?.totalTokenCount || undefined,
        estimatedCost: routing.estimatedCost,
        durationMs: Date.now() - startTime,
        success: true,
      });

      // Cache strategy results (longer TTL since they're expensive)
      await cacheResult(prompt, 'strategy', result, {
        modelUsed: routing.model.model,
        tokenCount: response.usage?.totalTokenCount || undefined,
        ttlHours: 336, // 2 weeks
      });

      return result;
    },
    async () => {
      const res = await generateOpenAIResponse("You are a legal strategy expert. Output ONLY valid JSON.", prompt);
      try {
        return JSON.parse(res);
      } catch {
        return [];
      }
    }
  );
};

export const generateProactiveCoaching = async (
  phase: TrialPhase,
  caseSummary: string,
  witnessPersonality: string,
  conversationHistory: Message[],
  knowledgeContext?: string
): Promise<ProactiveCoaching> => {
  const historyText = conversationHistory
    .slice(-10)
    .map(m => `${m.sender === 'user' ? 'ATTORNEY' : m.sender.toUpperCase()}: ${m.text}`)
    .join('\n');

  const knowledgeSection = knowledgeContext 
    ? `\n\nRELEVANT CASE KNOWLEDGE:\n${knowledgeContext}\n`
    : '';

  const prompt = `You are an expert legal coach providing proactive guidance for a trial attorney.

PHASE: ${phase}
CASE SUMMARY: ${caseSummary}${knowledgeSection}
WITNESS PERSONALITY: ${witnessPersonality}

RECENT CONVERSATION:
${historyText || 'No conversation yet - this is the start of the session.'}

Generate proactive coaching suggestions. Provide 3-5 specific suggestions for what the attorney should ask or say next.
Consider:
- The phase of trial (opening, cross-exam, etc.)
- The witness personality (hostile witnesses need different approaches)
- What has already been covered in the conversation
- Strategic goals for this phase
- Specific facts and evidence from the case knowledge

Return JSON with suggestions, a general tip, and the strategic goal.`;

  return queueRequest(
    async () => {
      const response = await callGeminiProxy({
        prompt,
        model: 'gemini-2.5-flash',
        options: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['question', 'statement', 'objection', 'follow-up', 'tip'] },
                    text: { type: Type.STRING },
                    context: { type: Type.STRING },
                    priority: { type: Type.STRING, enum: ['high', 'medium', 'low'] }
                  }
                }
              },
              generalTip: { type: Type.STRING },
              strategicGoal: { type: Type.STRING }
            }
          }
        }
      });

      if (!response.success || !response.text) {
        throw new Error(response.error?.message || 'Coaching generation failed: No response text received');
      }

      const parsed = JSON.parse(response.text);
      return {
        suggestions: parsed.suggestions || [],
        generalTip: parsed.generalTip || 'Focus on building your case methodically.',
        strategicGoal: parsed.strategicGoal || 'Establish key facts and credibility.'
      } as ProactiveCoaching;
    },
    async () => {
      const res = await generateOpenAIResponse("You are a legal coaching expert. Output ONLY valid JSON.", prompt);
      try {
        const parsed = JSON.parse(res);
        return {
          suggestions: parsed.suggestions || [],
          generalTip: parsed.generalTip || 'Focus on building your case methodically.',
          strategicGoal: parsed.strategicGoal || 'Establish key facts and credibility.'
        } as ProactiveCoaching;
      } catch {
        return {
          suggestions: [],
          generalTip: 'Prepare your questions in advance.',
          strategicGoal: 'Build a strong case foundation.'
        };
      }
    }
  );
};

export const getTrialSimSystemInstruction = (
  phase: TrialPhase,
  mode: SimulationMode,
  opponentName: string,
  caseContext: string,
  settings?: SimulatorSettings,
  evidenceData?: { summary: string; entities: string[]; keyDates: string[] }[]
) => {
  const baseRole = `You are a realistic courtroom simulator. The user is a practicing attorney who will SPEAK to you. You ONLY speak as the opposing party - NEVER speak on behalf of the user attorney.`;
  
  const realismLevel = settings?.realismLevel || 'professional';
  const interruptionFreq = settings?.interruptionFrequency || 'medium';
  const coachingVerbosity = settings?.coachingVerbosity || 'moderate';
  
  let objectionPolicy = "";
  if (mode === 'trial') {
    objectionPolicy = `MODE: TRIAL (HARD). Be aggressive. Object ONLY when there are legitimate legal grounds (hearsay, relevance, leading on direct, etc.). Make realistic objections that opposing counsel would actually raise.`;
  } else if (mode === 'practice') {
    objectionPolicy = `MODE: PRACTICE (MEDIUM). Object on clear procedural errors. Provide coaching tips after exchanges.`;
  } else {
    objectionPolicy = `MODE: LEARN (EASY). Focus on guiding the user. Rarely object - only on major issues. Provide helpful teleprompter scripts.`;
  }

  objectionPolicy += `\n\nREALISM: ${realismLevel.toUpperCase()}. ${realismLevel === 'intense' ? 'High-stakes, high-pressure environment.' : realismLevel === 'casual' ? 'Relaxed, educational environment.' : 'Professional courtroom atmosphere.'}`;
  objectionPolicy += `\nINTERRUPTION FREQUENCY: ${interruptionFreq.toUpperCase()}.`;
  objectionPolicy += `\nCOACHING DETAIL: ${coachingVerbosity.toUpperCase()}.`;

  const phaseInstructions: Record<TrialPhase, string> = {
    'pre-trial-motions': `PHASE: PRE-TRIAL MOTIONS. You are OPPOSING COUNSEL (${opponentName}). Argue against the user's motions. Be strategic and cite procedural rules.`,
    'voir-dire': `PHASE: VOIR DIRE. You are OPPOSING COUNSEL (${opponentName}). Conduct voir dire and challenge the user's juror selections. Also roleplay individual jurors when asked.`,
    'opening-statement': `PHASE: OPENING STATEMENT. You are OPPOSING COUNSEL (${opponentName}). Listen to their opening, then deliver yours. Object ONLY to argumentative statements that prejudge facts.`,
    'direct-examination': `PHASE: DIRECT EXAMINATION. You are the WITNESS being questioned. Answer naturally based on your role and the case facts. Do NOT object - let the user's direct examination proceed. If they ask leading questions, note it for coaching feedback.`,
    'cross-examination': `PHASE: CROSS EXAMINATION. You are a HOSTILE WITNESS being cross-examined by the user. Be evasive, defensive, and difficult. Challenge unfair questions. Stick to facts from the evidence.`,
    'closing-argument': `PHASE: CLOSING ARGUMENT. You are OPPOSING COUNSEL (${opponentName}). Listen to their closing, then deliver yours. Object only to serious misrepresentations of law.`,
    'defendant-testimony': `PHASE: DEFENDANT TESTIMONY. You are PROSECUTOR (${opponentName}). Cross-examine the defendant aggressively. Challenge inconsistencies.`,
    'sentencing': `PHASE: SENTENCING. You are the JUDGE. Listen to arguments and deliver an appropriate sentence based on guidelines and case facts.`
  };

  let evidenceContext = "";
  if (evidenceData && evidenceData.length > 0) {
    evidenceContext = `\n\nAVAILABLE EVIDENCE FOR THIS CASE:\n${evidenceData.map((e, i) => 
      `Document ${i + 1}: ${e.summary}\nKey Entities: ${e.entities?.slice(0, 5).join(', ') || 'N/A'}\nKey Dates: ${e.keyDates?.slice(0, 3).join(', ') || 'N/A'}`
    ).join('\n\n')}`;
  }

  return `${baseRole}

${phaseInstructions[phase] || ''}

${objectionPolicy}

Case Context: ${caseContext}
${evidenceContext}

CRITICAL RULES:
1. You represent the OPPOSING side ONLY. Never speak the user's lines.
2. Use 'raiseObjection' ONLY when there are legitimate legal grounds (hearsay, relevance, speculation, leading on direct, lack of foundation, etc.)
3. Use 'sendCoachingTip' AFTER the user speaks to provide feedback AND a suggested response they should say next
4. Always include 'teleprompterScript' in coaching tips - this is what the user should say next
5. Stay in character and reference the actual evidence and facts from this case
6. Be realistic - objections should be strategic, not constant`;
};

export const generateTranscriptSummary = async (transcript: string): Promise<string> => {
  const prompt = `Summarize the following transcript concisely. Focus on key points, decisions made, and any action items. Keep the summary brief but comprehensive.

Transcript:
${transcript.substring(0, 30000)}

Provide a clear, well-structured summary in 2-4 paragraphs.`;

  return queueRequest(
    async () => {
      const response = await callGeminiProxy({
        prompt,
        model: 'gemini-2.5-flash',
        options: {
          temperature: 0.3,
        }
      });

      return response.text || 'Unable to generate summary.';
    },
    async () => {
      return generateOpenAIResponse("You are a helpful assistant that summarizes legal transcripts.", prompt);
    }
  );
};

export const translateTranscript = async (transcript: string, targetLanguage: string): Promise<string> => {
  return queueRequest(async () => {
    const prompt = `Translate the following transcript to ${targetLanguage}. Preserve the speaker labels and formatting. Maintain the same level of formality and tone.

Transcript:
${transcript.substring(0, 30000)}

Provide the translation with the same structure as the original.`;

    const response = await callGeminiProxy({
      prompt,
      model: 'gemini-2.5-flash',
      options: {
        temperature: 0.3,
      }
    });

    return response.text || 'Unable to translate transcript.';
  });
};
