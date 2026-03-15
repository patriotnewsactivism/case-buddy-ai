/**
 * Multi-layer caching service for AI analysis results.
 *
 * Layer 1 (L1): In-memory cache - sub-millisecond lookups
 * Layer 2 (L2): Supabase database cache - persistent across sessions
 *
 * Reduces API costs by caching identical or similar AI requests.
 */

import { CacheEntry, CacheLayer, CacheResult } from '../types';
import { getSupabaseClient } from './supabaseClient';

// L1: In-memory LRU cache
const MEMORY_CACHE_MAX_SIZE = 200;
const MEMORY_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface MemoryCacheEntry {
  data: unknown;
  expiresAt: number;
  analysisType: string;
  lastAccessed: number;
}

const memoryCache = new Map<string, MemoryCacheEntry>();

/**
 * Generate a hash for a prompt string.
 * Uses a simple but effective hash for cache key generation.
 */
export function hashPrompt(input: string): string {
  let hash = 0;
  const str = input.trim().toLowerCase();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert to hex and pad to ensure consistent length
  const hex = (hash >>> 0).toString(16).padStart(8, '0');
  // Add length component for better uniqueness
  const lengthHash = (str.length * 31).toString(16).padStart(4, '0');
  return `${hex}${lengthHash}`;
}

/**
 * Evict least recently used entries when cache exceeds max size.
 */
function evictMemoryCache(): void {
  if (memoryCache.size <= MEMORY_CACHE_MAX_SIZE) return;

  const entries = [...memoryCache.entries()]
    .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

  const toRemove = entries.slice(0, entries.length - MEMORY_CACHE_MAX_SIZE);
  for (const [key] of toRemove) {
    memoryCache.delete(key);
  }
}

/**
 * Clean expired entries from memory cache.
 */
function cleanExpiredMemoryCache(): void {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expiresAt <= now) {
      memoryCache.delete(key);
    }
  }
}

// Periodic cleanup
setInterval(cleanExpiredMemoryCache, 5 * 60 * 1000);

/**
 * Check L1 (memory) cache.
 */
function checkMemoryCache(promptHash: string, analysisType: string): CacheResult {
  const key = `${promptHash}:${analysisType}`;
  const entry = memoryCache.get(key);

  if (!entry) {
    return { hit: false };
  }

  if (entry.expiresAt <= Date.now()) {
    memoryCache.delete(key);
    return { hit: false };
  }

  // Update access time
  entry.lastAccessed = Date.now();
  memoryCache.set(key, entry);

  return {
    hit: true,
    layer: 'memory' as CacheLayer,
    data: entry.data,
  };
}

/**
 * Check L2 (database) cache.
 */
async function checkDatabaseCache(promptHash: string, analysisType: string): Promise<CacheResult> {
  const client = getSupabaseClient();
  if (!client) {
    return { hit: false };
  }

  try {
    const { data, error } = await client
      .from('analysis_cache')
      .select('id, result, model_used, token_count')
      .eq('prompt_hash', promptHash)
      .eq('analysis_type', analysisType)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return { hit: false };
    }

    // Record cache hit
    client.rpc('record_cache_hit', { p_cache_id: data.id }).then(() => {}).catch(() => {});

    // Promote to L1
    const key = `${promptHash}:${analysisType}`;
    memoryCache.set(key, {
      data: data.result,
      expiresAt: Date.now() + MEMORY_CACHE_TTL_MS,
      analysisType,
      lastAccessed: Date.now(),
    });
    evictMemoryCache();

    return {
      hit: true,
      layer: 'database' as CacheLayer,
      data: data.result,
      cacheId: data.id,
    };
  } catch {
    return { hit: false };
  }
}

/**
 * Store result in both cache layers.
 */
async function storeInCache(
  promptHash: string,
  analysisType: string,
  result: unknown,
  options?: {
    documentId?: string;
    modelUsed?: string;
    tokenCount?: number;
    ttlHours?: number;
  }
): Promise<void> {
  const ttlMs = (options?.ttlHours || 168) * 60 * 60 * 1000; // Default 7 days

  // L1: Store in memory
  const key = `${promptHash}:${analysisType}`;
  memoryCache.set(key, {
    data: result,
    expiresAt: Date.now() + Math.min(ttlMs, MEMORY_CACHE_TTL_MS),
    analysisType,
    lastAccessed: Date.now(),
  });
  evictMemoryCache();

  // L2: Store in database
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.from('analysis_cache').upsert(
      {
        prompt_hash: promptHash,
        analysis_type: analysisType,
        document_id: options?.documentId,
        result,
        model_used: options?.modelUsed,
        token_count: options?.tokenCount,
        expires_at: new Date(Date.now() + ttlMs).toISOString(),
      },
      { onConflict: 'prompt_hash,analysis_type' }
    );
  } catch (err) {
    console.warn('[CacheService] Failed to store in database cache:', err);
  }
}

/**
 * Main cache lookup function. Checks L1 then L2.
 */
export async function getCachedResult(
  prompt: string,
  analysisType: string
): Promise<CacheResult> {
  const promptHash = hashPrompt(prompt);

  // L1: Memory cache
  const memResult = checkMemoryCache(promptHash, analysisType);
  if (memResult.hit) {
    cacheHits++;
    console.log(`[CacheService] L1 HIT (memory) for ${analysisType}`);
    return memResult;
  }

  // L2: Database cache
  const dbResult = await checkDatabaseCache(promptHash, analysisType);
  if (dbResult.hit) {
    cacheHits++;
    dbCacheHits++;
    console.log(`[CacheService] L2 HIT (database) for ${analysisType}`);
    return dbResult;
  }

  cacheMisses++;
  console.log(`[CacheService] MISS for ${analysisType}`);
  return { hit: false };
}

/**
 * Cache an AI analysis result.
 */
export async function cacheResult(
  prompt: string,
  analysisType: string,
  result: unknown,
  options?: {
    documentId?: string;
    modelUsed?: string;
    tokenCount?: number;
    ttlHours?: number;
  }
): Promise<void> {
  const promptHash = hashPrompt(prompt);
  await storeInCache(promptHash, analysisType, result, options);
}

/**
 * Invalidate cache entries for a specific document.
 */
export async function invalidateDocumentCache(documentId: string): Promise<void> {
  // Clear from memory cache
  for (const [key, entry] of memoryCache.entries()) {
    if (key.includes(documentId)) {
      memoryCache.delete(key);
    }
  }

  // Clear from database
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.from('analysis_cache').delete().eq('document_id', documentId);
  } catch (err) {
    console.warn('[CacheService] Failed to invalidate document cache:', err);
  }
}

// Hit/miss tracking counters
let cacheHits = 0;
let cacheMisses = 0;
let dbCacheHits = 0;

/**
 * Get cache statistics.
 */
export function getCacheStats(): {
  memoryCacheSize: number;
  memoryCacheMaxSize: number;
  memoryCacheHitRate: string;
  hits: number;
  misses: number;
  dbHits: number;
  totalRequests: number;
} {
  const total = cacheHits + cacheMisses;
  const hitRate = total > 0 ? ((cacheHits / total) * 100).toFixed(1) + '%' : '0%';
  return {
    memoryCacheSize: memoryCache.size,
    memoryCacheMaxSize: MEMORY_CACHE_MAX_SIZE,
    memoryCacheHitRate: hitRate,
    hits: cacheHits,
    misses: cacheMisses,
    dbHits: dbCacheHits,
    totalRequests: total,
  };
}

/**
 * Reset cache statistics counters.
 */
export function resetCacheStats(): void {
  cacheHits = 0;
  cacheMisses = 0;
  dbCacheHits = 0;
}

/**
 * Clear all caches.
 */
export async function clearAllCaches(): Promise<void> {
  memoryCache.clear();

  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.rpc('cleanup_expired_cache');
  } catch (err) {
    console.warn('[CacheService] Failed to cleanup database cache:', err);
  }
}
