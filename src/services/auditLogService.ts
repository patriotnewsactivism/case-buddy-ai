/**
 * Audit Logging Service
 *
 * Tracks all AI requests, user actions, and system events for:
 * - Usage analytics and billing
 * - Security auditing
 * - Performance monitoring
 * - Cost tracking per user/feature
 */

import { getSupabaseClient } from './supabaseClient';

export type AuditAction =
  | 'ai_request'
  | 'ocr_process'
  | 'transcription'
  | 'document_upload'
  | 'courtroom_session'
  | 'cache_hit'
  | 'cache_miss'
  | 'rate_limit_hit'
  | 'auth_login'
  | 'auth_logout'
  | 'data_export'
  | 'data_deletion';

export interface AuditLogEntry {
  userId?: string;
  action: AuditAction;
  resource?: string;
  details?: Record<string, unknown>;
  modelUsed?: string;
  tokenCount?: number;
  estimatedCost?: number;
  durationMs?: number;
  success: boolean;
  errorMessage?: string;
}

// In-memory buffer for batch writing
const LOG_BUFFER_SIZE = 20;
const LOG_FLUSH_INTERVAL_MS = 30000;
const logBuffer: AuditLogEntry[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;

// Aggregate counters for real-time monitoring
const sessionCounters = {
  aiRequests: 0,
  cacheHits: 0,
  cacheMisses: 0,
  ocrProcessed: 0,
  transcriptions: 0,
  rateLimitHits: 0,
  totalTokens: 0,
  totalEstimatedCost: 0,
  errors: 0,
};

/**
 * Log an audit event. Buffers entries and flushes in batches.
 */
export function logAudit(entry: AuditLogEntry): void {
  // Update session counters
  updateCounters(entry);

  // Add timestamp
  const enrichedEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };

  logBuffer.push(enrichedEntry);

  // Also log to console in development
  if (process.env.NODE_ENV !== 'production') {
    const icon = entry.success ? '[OK]' : '[ERR]';
    console.log(
      `[Audit] ${icon} ${entry.action}${entry.resource ? ` on ${entry.resource}` : ''}${
        entry.modelUsed ? ` (${entry.modelUsed})` : ''
      }${entry.tokenCount ? ` ${entry.tokenCount} tokens` : ''}${
        entry.estimatedCost ? ` ~$${entry.estimatedCost.toFixed(5)}` : ''
      }`
    );
  }

  // Flush if buffer is full
  if (logBuffer.length >= LOG_BUFFER_SIZE) {
    flushLogs();
  }

  // Ensure periodic flush is scheduled
  if (!flushTimer) {
    flushTimer = setInterval(flushLogs, LOG_FLUSH_INTERVAL_MS);
  }
}

/**
 * Flush buffered logs to the database.
 */
async function flushLogs(): Promise<void> {
  if (logBuffer.length === 0) return;

  const entries = logBuffer.splice(0, logBuffer.length);

  const client = getSupabaseClient();
  if (!client) {
    // Store in localStorage as fallback
    try {
      const existing = JSON.parse(localStorage.getItem('audit_log_buffer') || '[]');
      const merged = [...existing, ...entries].slice(-500); // Keep last 500
      localStorage.setItem('audit_log_buffer', JSON.stringify(merged));
    } catch {
      // Ignore storage errors
    }
    return;
  }

  try {
    const rows = entries.map((e) => ({
      user_id: e.userId || null,
      action: e.action,
      resource: e.resource || null,
      details: e.details || {},
      model_used: e.modelUsed || null,
      token_count: e.tokenCount || null,
      estimated_cost: e.estimatedCost || null,
      duration_ms: e.durationMs || null,
      success: e.success,
      error_message: e.errorMessage || null,
    }));

    await client.from('audit_logs').insert(rows);
  } catch (err) {
    console.warn('[AuditLog] Failed to flush logs:', err);
    // Re-add to buffer for retry (up to limit)
    if (logBuffer.length + entries.length < LOG_BUFFER_SIZE * 3) {
      logBuffer.push(...entries);
    }
  }
}

function updateCounters(entry: AuditLogEntry): void {
  switch (entry.action) {
    case 'ai_request':
      sessionCounters.aiRequests++;
      if (entry.tokenCount) sessionCounters.totalTokens += entry.tokenCount;
      if (entry.estimatedCost) sessionCounters.totalEstimatedCost += entry.estimatedCost;
      break;
    case 'cache_hit':
      sessionCounters.cacheHits++;
      break;
    case 'cache_miss':
      sessionCounters.cacheMisses++;
      break;
    case 'ocr_process':
      sessionCounters.ocrProcessed++;
      break;
    case 'transcription':
      sessionCounters.transcriptions++;
      break;
    case 'rate_limit_hit':
      sessionCounters.rateLimitHits++;
      break;
  }

  if (!entry.success) {
    sessionCounters.errors++;
  }
}

/**
 * Get session-level audit counters for monitoring.
 */
export function getSessionCounters(): typeof sessionCounters & { cacheHitRate: number } {
  const total = sessionCounters.cacheHits + sessionCounters.cacheMisses;
  return {
    ...sessionCounters,
    cacheHitRate: total > 0 ? sessionCounters.cacheHits / total : 0,
  };
}

/**
 * Reset session counters.
 */
export function resetSessionCounters(): void {
  Object.keys(sessionCounters).forEach((key) => {
    (sessionCounters as Record<string, number>)[key] = 0;
  });
}

/**
 * Force flush any remaining logs (call on app unmount).
 */
export async function forceFlush(): Promise<void> {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  await flushLogs();
}
