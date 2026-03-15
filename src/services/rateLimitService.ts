/**
 * Client-side tier-based rate limiting service.
 *
 * Enforces usage limits based on user subscription tier.
 * Works with both localStorage tracking and Supabase usage_tracking table.
 */

import { UserTier, TierLimits, TIER_LIMITS } from '../types';
import { getSupabaseClient } from './supabaseClient';

// In-memory rate limit tracking for current session
interface RateLimitWindow {
  count: number;
  windowStart: number;
}

const rateLimitWindows = new Map<string, RateLimitWindow>();
const WINDOW_MS = 60 * 1000; // 1 minute window for burst protection

// Per-minute burst limits by tier
const BURST_LIMITS: Record<UserTier, Record<string, number>> = {
  free: {
    ai_requests: 5,
    ocr_pages: 3,
    transcription: 1,
    courtroom_sessions: 1,
  },
  pro: {
    ai_requests: 20,
    ocr_pages: 10,
    transcription: 5,
    courtroom_sessions: 5,
  },
  enterprise: {
    ai_requests: 50,
    ocr_pages: 30,
    transcription: 15,
    courtroom_sessions: 15,
  },
};

export interface RateLimitCheckResult {
  allowed: boolean;
  remaining: number;
  limit: number | 'unlimited';
  resetAt?: number;
  upgradeMessage?: string;
}

/**
 * Check burst rate limit (per-minute).
 */
function checkBurstLimit(userId: string, action: string, tier: UserTier): RateLimitCheckResult {
  const key = `${userId}:${action}`;
  const now = Date.now();
  const burstLimit = BURST_LIMITS[tier]?.[action] ?? 10;

  const window = rateLimitWindows.get(key);

  if (!window || now - window.windowStart > WINDOW_MS) {
    rateLimitWindows.set(key, { count: 1, windowStart: now });
    return {
      allowed: true,
      remaining: burstLimit - 1,
      limit: burstLimit,
      resetAt: now + WINDOW_MS,
    };
  }

  if (window.count >= burstLimit) {
    const nextTier = getNextTier(tier);
    return {
      allowed: false,
      remaining: 0,
      limit: burstLimit,
      resetAt: window.windowStart + WINDOW_MS,
      upgradeMessage: nextTier
        ? `Rate limit reached. Upgrade to ${nextTier} for higher limits.`
        : undefined,
    };
  }

  window.count++;
  return {
    allowed: true,
    remaining: burstLimit - window.count,
    limit: burstLimit,
    resetAt: window.windowStart + WINDOW_MS,
  };
}

/**
 * Check monthly usage limit against tier limits.
 */
async function checkMonthlyLimit(
  userId: string,
  action: string,
  tier: UserTier
): Promise<RateLimitCheckResult> {
  const limits = TIER_LIMITS[tier];
  const limitKey = actionToLimitKey(action);
  const monthlyLimit = limits[limitKey as keyof TierLimits];

  if (monthlyLimit === 'unlimited') {
    return { allowed: true, remaining: Infinity, limit: 'unlimited' };
  }

  const limit = monthlyLimit as number;

  // Try to get usage from Supabase
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client.rpc('get_usage', {
        p_user_id: userId,
        p_action: action,
      });

      if (!error && data !== null) {
        const used = data as number;
        const remaining = Math.max(0, limit - used);

        if (remaining <= 0) {
          const nextTier = getNextTier(tier);
          return {
            allowed: false,
            remaining: 0,
            limit,
            upgradeMessage: nextTier
              ? `Monthly limit of ${limit} ${action} reached. Upgrade to ${nextTier} for more.`
              : 'Monthly limit reached.',
          };
        }

        return { allowed: true, remaining, limit };
      }
    } catch {
      // Fall through to localStorage
    }
  }

  // Fallback: localStorage tracking
  const storageKey = `usage_${userId}_${action}_${getMonthKey()}`;
  const used = parseInt(localStorage.getItem(storageKey) || '0', 10);
  const remaining = Math.max(0, limit - used);

  if (remaining <= 0) {
    const nextTier = getNextTier(tier);
    return {
      allowed: false,
      remaining: 0,
      limit,
      upgradeMessage: nextTier
        ? `Monthly limit of ${limit} ${action} reached. Upgrade to ${nextTier} for more.`
        : 'Monthly limit reached.',
    };
  }

  return { allowed: true, remaining, limit };
}

/**
 * Check if an action is allowed under current rate limits.
 * Checks both burst (per-minute) and monthly limits.
 */
export async function checkRateLimit(
  userId: string,
  action: string,
  tier: UserTier = 'free'
): Promise<RateLimitCheckResult> {
  // Check burst limit first (fast, in-memory)
  const burstResult = checkBurstLimit(userId, action, tier);
  if (!burstResult.allowed) {
    return burstResult;
  }

  // Check monthly limit
  const monthlyResult = await checkMonthlyLimit(userId, action, tier);
  if (!monthlyResult.allowed) {
    return monthlyResult;
  }

  // Return the more restrictive remaining count
  return {
    allowed: true,
    remaining: Math.min(burstResult.remaining, monthlyResult.remaining),
    limit: monthlyResult.limit,
    resetAt: burstResult.resetAt,
  };
}

/**
 * Record usage after a successful action.
 */
export async function recordUsage(
  userId: string,
  action: string,
  count: number = 1
): Promise<void> {
  // Record in Supabase
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.rpc('increment_usage', {
        p_user_id: userId,
        p_action: action,
        p_increment: count,
      });
      return;
    } catch {
      // Fall through to localStorage
    }
  }

  // Fallback: localStorage
  const storageKey = `usage_${userId}_${action}_${getMonthKey()}`;
  const current = parseInt(localStorage.getItem(storageKey) || '0', 10);
  localStorage.setItem(storageKey, String(current + count));
}

/**
 * Get the user's current tier.
 */
export async function getUserTier(userId: string): Promise<UserTier> {
  const client = getSupabaseClient();
  if (!client) {
    return 'free';
  }

  try {
    const { data, error } = await client
      .from('user_tiers')
      .select('tier, expires_at')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return 'free';
    }

    // Check if tier has expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return 'free';
    }

    return data.tier as UserTier;
  } catch {
    return 'free';
  }
}

/**
 * Get usage summary for the current month.
 */
export async function getUsageSummary(
  userId: string,
  tier: UserTier
): Promise<Record<string, { used: number; limit: number | 'unlimited' }>> {
  const actions = ['ai_requests', 'ocr_pages', 'transcription', 'courtroom_sessions'];
  const summary: Record<string, { used: number; limit: number | 'unlimited' }> = {};
  const limits = TIER_LIMITS[tier];

  for (const action of actions) {
    const limitKey = actionToLimitKey(action);
    const limit = limits[limitKey as keyof TierLimits];
    let used = 0;

    const client = getSupabaseClient();
    if (client) {
      try {
        const { data } = await client.rpc('get_usage', {
          p_user_id: userId,
          p_action: action,
        });
        used = (data as number) || 0;
      } catch {
        const storageKey = `usage_${userId}_${action}_${getMonthKey()}`;
        used = parseInt(localStorage.getItem(storageKey) || '0', 10);
      }
    } else {
      const storageKey = `usage_${userId}_${action}_${getMonthKey()}`;
      used = parseInt(localStorage.getItem(storageKey) || '0', 10);
    }

    summary[action] = { used, limit: limit as number | 'unlimited' };
  }

  return summary;
}

// Helper functions

function getNextTier(tier: UserTier): UserTier | null {
  const tiers: UserTier[] = ['free', 'pro', 'enterprise'];
  const idx = tiers.indexOf(tier);
  return idx < tiers.length - 1 ? tiers[idx + 1] : null;
}

function actionToLimitKey(action: string): string {
  const mapping: Record<string, string> = {
    ai_requests: 'aiRequests',
    ocr_pages: 'ocrPages',
    transcription: 'transcriptionMinutes',
    courtroom_sessions: 'courtroomSessions',
  };
  return mapping[action] || action;
}

function getMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Clean up expired rate limit windows from memory.
 */
export function cleanupRateLimitWindows(): void {
  const now = Date.now();
  for (const [key, window] of rateLimitWindows.entries()) {
    if (now - window.windowStart > WINDOW_MS) {
      rateLimitWindows.delete(key);
    }
  }
}

// Periodic cleanup
setInterval(cleanupRateLimitWindows, 60 * 1000);
