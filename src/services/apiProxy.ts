import { supabase, isSupabaseConfigured } from './supabaseClient';
import { GoogleGenAI, Type } from '@google/genai';

export interface ProxyError {
  code: string;
  message: string;
  status?: number;
  details?: unknown;
}

export interface GeminiProxyRequest {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
  options?: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
    responseMimeType?: string;
    responseSchema?: unknown;
  };
  conversationHistory?: Array<{
    role: 'user' | 'model';
    parts: Array<{ text: string }>;
  }>;
}

export interface GeminiProxyResponse {
  success: boolean;
  text: string;
  model: string;
  usage?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  } | null;
  rateLimit?: {
    remaining: number;
    resetAt: string;
  };
  error?: ProxyError;
}

export interface OpenAIProxyRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  model?: string;
  options?: {
    temperature?: number;
    max_tokens?: number;
  };
  stream?: boolean;
}

export interface OpenAIProxyResponse {
  success: boolean;
  content: string;
  error?: ProxyError;
}

export interface WhisperProxyResponse {
  success: boolean;
  text: string;
  duration?: number;
  language?: string;
  segments?: Array<{
    id: number;
    start: number;
    end: number;
    text: string;
    speaker?: string;
  }>;
  error?: ProxyError;
}

export interface ElevenLabsProxyRequest {
  text: string;
  voiceId: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
  apiKey?: string;
}

export interface ElevenLabsProxyResponse {
  success: boolean;
  audioUrl?: string;
  audioBase64?: string;
  error?: ProxyError;
}

let proxyHealth: 'unknown' | 'healthy' | 'unhealthy' = 'unknown';
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 60000;

// Direct Gemini client for fallback
let directGeminiClient: GoogleGenAI | null = null;
const getDirectGeminiClient = (): GoogleGenAI | null => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!directGeminiClient) {
    directGeminiClient = new GoogleGenAI({ apiKey });
  }
  return directGeminiClient;
};

// Direct OpenAI API call (fallback when proxy fails)
const callOpenAIDirect = async (request: OpenAIProxyRequest): Promise<OpenAIProxyResponse> => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      content: '',
      error: createProxyError('NOT_CONFIGURED', 'OpenAI API key not configured'),
    };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: request.model || 'gpt-4o-mini',
        messages: request.messages,
        temperature: request.options?.temperature ?? 0.7,
        max_tokens: request.options?.max_tokens ?? 1000,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API error');
    }

    const data = await response.json();
    return {
      success: true,
      content: data.choices[0].message.content,
    };
  } catch (error: any) {
    console.error('[apiProxy] Direct OpenAI error:', error);
    return {
      success: false,
      content: '',
      error: createProxyError('API_ERROR', error.message),
    };
  }
};

// Direct ElevenLabs API call (fallback when proxy fails)
const callElevenLabsDirect = async (request: ElevenLabsProxyRequest): Promise<ElevenLabsProxyResponse> => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: createProxyError('NOT_CONFIGURED', 'ElevenLabs API key not configured'),
    };
  }

  try {
    const voiceId = request.voiceId || '21m00Tcm4TlvDq8ikWAM';
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: request.text,
        model_id: request.modelId || 'eleven_turbo_v2_5',
        voice_settings: {
          stability: request.stability ?? 0.5,
          similarity_boost: request.similarityBoost ?? 0.75,
          style: request.style ?? 0,
          use_speaker_boost: request.useSpeakerBoost ?? true,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail?.message || 'ElevenLabs API error');
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );

    return {
      success: true,
      audioBase64: base64,
    };
  } catch (error: any) {
    console.error('[apiProxy] Direct ElevenLabs error:', error);
    return {
      success: false,
      error: createProxyError('API_ERROR', error.message),
    };
  }
};

const getEdgeFunctionUrl = (functionName: string): string => {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL is not configured');
  }
  return `${supabaseUrl}/functions/v1/${functionName}`;
};

const getAuthToken = async (): Promise<string | null> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('[apiProxy] Error getting session:', error.message);
      return null;
    }
    return session?.access_token ?? null;
  } catch {
    return null;
  }
};

const createProxyError = (code: string, message: string, status?: number, details?: unknown): ProxyError => ({
  code,
  message,
  status,
  details,
});

const handleProxyError = (error: unknown, context: string): ProxyError => {
  if (error instanceof Error) {
    return createProxyError('PROXY_ERROR', error.message, undefined, { context, originalError: error.message });
  }
  return createProxyError('UNKNOWN_ERROR', `Unknown error in ${context}`, undefined, error);
};

export const checkProxyHealth = async (): Promise<boolean> => {
  const now = Date.now();
  if (proxyHealth !== 'unknown' && now - lastHealthCheck < HEALTH_CHECK_INTERVAL) {
    return proxyHealth === 'healthy';
  }

  if (!isSupabaseConfigured()) {
    proxyHealth = 'unhealthy';
    lastHealthCheck = now;
    return false;
  }

  try {
    const { error } = await supabase.functions.invoke('gemini-proxy', {
      body: { prompt: 'health check', options: { maxOutputTokens: 5 } },
    });

    proxyHealth = error ? 'unhealthy' : 'healthy';
    lastHealthCheck = now;
    return proxyHealth === 'healthy';
  } catch {
    proxyHealth = 'unhealthy';
    lastHealthCheck = now;
    return false;
  }
};

// Direct Gemini API call (fallback when proxy fails)
const callGeminiDirect = async (request: GeminiProxyRequest): Promise<GeminiProxyResponse> => {
  const client = getDirectGeminiClient();
  if (!client) {
    return {
      success: false,
      text: '',
      model: '',
      error: createProxyError('NOT_CONFIGURED', 'Gemini API key not configured'),
    };
  }

  try {
    const model = request.model || 'gemini-2.5-flash';
    
    const contents: Array<{ role: string; parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> }> = [];
    
    if (request.conversationHistory && request.conversationHistory.length > 0) {
      contents.push(...request.conversationHistory);
    }
    
    const currentParts: any[] = [];
    if (request.systemPrompt) {
      currentParts.push({ text: `System: ${request.systemPrompt}\n\nUser: ${request.prompt}` });
    } else {
      currentParts.push({ text: request.prompt });
    }

    if (request.inlineData) {
      currentParts.push({ inlineData: request.inlineData });
    }

    contents.push({
      role: 'user',
      parts: currentParts,
    });

    const config: any = {
      temperature: request.options?.temperature ?? 0.7,
      maxOutputTokens: request.options?.maxOutputTokens ?? 8192,
      topP: request.options?.topP ?? 0.95,
    };

    if (request.options?.responseMimeType) {
      config.responseMimeType = request.options.responseMimeType;
    }
    if (request.options?.responseSchema) {
      config.responseSchema = request.options.responseSchema;
    }

    const response = await client.models.generateContent({
      model,
      contents,
      config,
    });

    const text = response.text || '';

    return {
      success: true,
      text,
      model,
      usage: response.usageMetadata,
    };
  } catch (error: any) {
    console.error('[apiProxy] Direct Gemini error:', error);
    return {
      success: false,
      text: '',
      model: '',
      error: createProxyError('API_ERROR', error?.message || 'Gemini API error'),
    };
  }
};

export const callGeminiProxy = async (
  request: GeminiProxyRequest
): Promise<GeminiProxyResponse> => {
  // Try proxy first if Supabase is configured (preferred for CORS)
  if (isSupabaseConfigured()) {
    try {
      console.log('[apiProxy] Attempting Gemini Edge Function proxy...');
      const { data, error } = await supabase.functions.invoke('gemini-proxy', {
        body: request,
      });

      if (error) {
        console.error('[apiProxy] Supabase function error:', error);
        throw error;
      }

      if (data && data.success) {
        return data as GeminiProxyResponse;
      }

      console.warn('[apiProxy] Proxy returned success=false:', data?.error || 'Unknown proxy error');
    } catch (err: any) {
      console.warn('[apiProxy] Proxy failure, falling back to direct:', err.message || err);
      // If it's a CORS error or function not found, we fall back to direct
    }
  }

  // Fallback to direct client-side API
  console.log('[apiProxy] Using direct Gemini API fallback (Client-side)');
  return callGeminiDirect(request);
};

export const callOpenAIProxy = async (
  request: OpenAIProxyRequest
): Promise<OpenAIProxyResponse> => {
  // Try direct API if we have a key (avoids CORS issues with proxy)
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 20) {
    return callOpenAIDirect(request);
  }

  if (!isSupabaseConfigured()) {
    return {
      success: false,
      content: '',
      error: createProxyError('NOT_CONFIGURED', 'Supabase is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY.'),
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke('openai-proxy', {
      body: { ...request, stream: false },
    });

    if (error) {
      console.warn('[apiProxy] OpenAI Proxy failed:', error.message);
      // Last resort: try direct even if it might fail
      return callOpenAIDirect(request);
    }

    if (!data?.success) {
      return {
        success: false,
        content: '',
        error: createProxyError('FUNCTION_ERROR', data?.error || 'OpenAI proxy returned unsuccessful response'),
      };
    }

    return {
      success: true,
      content: data.text || data.content || '',
    };
  } catch (err) {
    console.warn('[apiProxy] OpenAI Proxy exception:', err);
    return callOpenAIDirect(request);
  }
};

export async function* streamOpenAIProxy(
  request: OpenAIProxyRequest
): AsyncGenerator<string, void, unknown> {
  if (!isSupabaseConfigured()) {
    // If no proxy, we can't stream directly from client to OpenAI easily due to CORS
    // but we can try to get a single response as a fallback
    const direct = await callOpenAIDirect(request);
    if (direct.success) {
      yield direct.content;
      return;
    }
    throw createProxyError('NOT_CONFIGURED', 'Supabase is not configured and direct streaming fallback failed.');
  }

  const url = getEdgeFunctionUrl('openai-proxy');
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...request, stream: true }),
    });

    if (!response.ok) {
      // Fallback to direct non-streaming if proxy fails
      const direct = await callOpenAIDirect(request);
      if (direct.success) {
        yield direct.content;
        return;
      }
      throw createProxyError('HTTP_ERROR', `Proxy failed and direct fallback failed`, response.status);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw createProxyError('NO_BODY', 'Response body is null');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (value) {
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line || !line.startsWith('data:')) continue;

          const data = line.slice(5).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch {
            // Skip non-JSON lines
          }
        }
      }

      if (done) break;
    }
  } catch (err) {
    console.warn('[apiProxy] OpenAI Stream exception, falling back to direct:', err);
    const direct = await callOpenAIDirect(request);
    if (direct.success) {
      yield direct.content;
    } else {
      throw err;
    }
  }
}

export const callWhisperProxy = async (file: File): Promise<WhisperProxyResponse> => {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      text: '',
      error: createProxyError('NOT_CONFIGURED', 'Supabase is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY.'),
    };
  }

  try {
    const url = getEdgeFunctionUrl('whisper-proxy');
    const token = await getAuthToken();

    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      let errorDetails: unknown;
      try {
        errorDetails = await response.json();
      } catch {
        errorDetails = await response.text();
      }

      const errorMessage = typeof errorDetails === 'object' && errorDetails !== null && 'error' in errorDetails
        ? String((errorDetails as Record<string, unknown>).error)
        : `HTTP ${response.status}`;

      return {
        success: false,
        text: '',
        error: createProxyError('HTTP_ERROR', errorMessage, response.status, errorDetails),
      };
    }

    const result = await response.json();

    if (result.error) {
      return {
        success: false,
        text: '',
        error: createProxyError('FUNCTION_ERROR', result.error),
      };
    }

    return {
      success: true,
      text: result.text ?? '',
      duration: result.duration,
      language: result.language,
      segments: result.segments,
    };
  } catch (err) {
    return {
      success: false,
      text: '',
      error: handleProxyError(err, 'callWhisperProxy'),
    };
  }
};

export const callElevenLabsProxy = async (
  request: ElevenLabsProxyRequest
): Promise<ElevenLabsProxyResponse> => {
  // Try direct API if we have a key
  if (process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_API_KEY.length > 20) {
    return callElevenLabsDirect(request);
  }

  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: createProxyError('NOT_CONFIGURED', 'Supabase is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY.'),
    };
  }

  try {
    const url = getEdgeFunctionUrl('elevenlabs-proxy');
    const token = await getAuthToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      console.warn('[apiProxy] ElevenLabs Proxy failed, falling back to direct:', response.statusText);
      return callElevenLabsDirect(request);
    }

    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const result = await response.json();
      if (result.error) {
        return {
          success: false,
          error: createProxyError('FUNCTION_ERROR', result.error),
        };
      }
      return {
        success: true,
        audioUrl: result.audioUrl,
        audioBase64: result.audioBase64,
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );
    return {
      success: true,
      audioBase64: base64,
    };
  } catch (err) {
    console.warn('[apiProxy] ElevenLabs Proxy exception, falling back to direct:', err);
    return callElevenLabsDirect(request);
  }
};

export const isProxyReady = (): boolean => {
  // Return true if either Supabase or direct Gemini is available
  return isSupabaseConfigured() || !!getDirectGeminiClient();
};
