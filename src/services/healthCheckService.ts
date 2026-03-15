/**
 * Health Check & Monitoring Service
 *
 * Provides system health status for all services:
 * - Supabase connectivity
 * - Gemini API availability
 * - OCR provider status
 * - Cache performance
 * - Rate limit status
 */

import { isSupabaseConfigured, getSupabaseClient } from './supabaseClient';
import { checkProxyHealth, isProxyReady } from './apiProxy';
import { getCacheStats } from './cacheService';
import { getSessionCounters } from './auditLogService';
import { ocrProviderFactory } from './ocr/index';

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unconfigured';
  latencyMs?: number;
  details?: string;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: ServiceHealth[];
  metrics: {
    cacheStats: ReturnType<typeof getCacheStats>;
    sessionCounters: ReturnType<typeof getSessionCounters>;
    ocrProviders: string[];
    memoryUsage?: { usedMB: number; totalMB: number };
  };
}

/**
 * Run a comprehensive health check on all services.
 */
export async function getSystemHealth(): Promise<SystemHealth> {
  const services: ServiceHealth[] = [];

  // Check services in parallel
  const [supabaseHealth, geminiHealth] = await Promise.all([
    checkSupabaseHealth(),
    checkGeminiHealth(),
  ]);

  services.push(supabaseHealth, geminiHealth);

  // OCR providers (sync check)
  const ocrHealth = checkOCRHealth();
  services.push(ocrHealth);

  // Cache health (sync)
  const cacheHealth = checkCacheHealth();
  services.push(cacheHealth);

  // Determine overall status
  const unhealthyCount = services.filter((s) => s.status === 'unhealthy').length;
  const degradedCount = services.filter((s) => s.status === 'degraded').length;

  let overall: SystemHealth['overall'] = 'healthy';
  if (unhealthyCount > 1) {
    overall = 'unhealthy';
  } else if (unhealthyCount > 0 || degradedCount > 1) {
    overall = 'degraded';
  }

  return {
    overall,
    timestamp: new Date().toISOString(),
    services,
    metrics: {
      cacheStats: getCacheStats(),
      sessionCounters: getSessionCounters(),
      ocrProviders: ocrProviderFactory.getAvailableProviders(),
      memoryUsage: getMemoryUsage(),
    },
  };
}

async function checkSupabaseHealth(): Promise<ServiceHealth> {
  if (!isSupabaseConfigured()) {
    return {
      name: 'Supabase',
      status: 'unconfigured',
      details: 'SUPABASE_URL or SUPABASE_ANON_KEY not set',
    };
  }

  const start = Date.now();
  const client = getSupabaseClient();

  if (!client) {
    return { name: 'Supabase', status: 'unhealthy', details: 'Client not available' };
  }

  try {
    const { error } = await client.from('cases').select('id', { count: 'exact', head: true });
    const latencyMs = Date.now() - start;

    if (error) {
      return {
        name: 'Supabase',
        status: 'degraded',
        latencyMs,
        details: error.message,
      };
    }

    return {
      name: 'Supabase',
      status: latencyMs > 3000 ? 'degraded' : 'healthy',
      latencyMs,
    };
  } catch (err) {
    return {
      name: 'Supabase',
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      details: err instanceof Error ? err.message : 'Connection failed',
    };
  }
}

async function checkGeminiHealth(): Promise<ServiceHealth> {
  if (!isProxyReady()) {
    return {
      name: 'Gemini AI',
      status: 'unconfigured',
      details: 'No API key or proxy configured',
    };
  }

  const start = Date.now();
  try {
    const healthy = await checkProxyHealth();
    const latencyMs = Date.now() - start;

    return {
      name: 'Gemini AI',
      status: healthy ? (latencyMs > 5000 ? 'degraded' : 'healthy') : 'unhealthy',
      latencyMs,
    };
  } catch {
    return {
      name: 'Gemini AI',
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      details: 'Health check failed',
    };
  }
}

function checkOCRHealth(): ServiceHealth {
  const available = ocrProviderFactory.getAvailableProviders();

  if (available.length === 0) {
    return {
      name: 'OCR Pipeline',
      status: 'degraded',
      details: 'No OCR providers configured (Tesseract.js available as fallback)',
    };
  }

  return {
    name: 'OCR Pipeline',
    status: 'healthy',
    details: `${available.length} provider(s): ${available.join(', ')}`,
  };
}

function checkCacheHealth(): ServiceHealth {
  const stats = getCacheStats();

  return {
    name: 'AI Cache',
    status: 'healthy',
    details: `Memory: ${stats.memoryCacheSize}/${stats.memoryCacheMaxSize} entries`,
  };
}

function getMemoryUsage(): { usedMB: number; totalMB: number } | undefined {
  if (typeof performance !== 'undefined' && 'memory' in performance) {
    const mem = (performance as any).memory;
    return {
      usedMB: Math.round(mem.usedJSHeapSize / 1024 / 1024),
      totalMB: Math.round(mem.totalJSHeapSize / 1024 / 1024),
    };
  }
  return undefined;
}
