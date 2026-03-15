/**
 * GDPR Compliance Service
 *
 * Provides data export and deletion endpoints for user data.
 * Complies with GDPR Article 17 (Right to Erasure) and Article 20 (Data Portability).
 */

import { getSupabaseClient } from './supabaseClient';
import { logAudit } from './auditLogService';

export interface UserDataExport {
  exportDate: string;
  userId: string;
  profile: Record<string, unknown> | null;
  cases: unknown[];
  sessions: unknown[];
  transcriptions: unknown[];
  performanceMetrics: unknown[];
  usageHistory: unknown[];
  auditLogs: unknown[];
}

/**
 * Export all user data as a JSON object.
 * GDPR Article 20 - Right to Data Portability.
 */
export async function exportUserData(userId: string): Promise<UserDataExport> {
  const client = getSupabaseClient();

  const exportData: UserDataExport = {
    exportDate: new Date().toISOString(),
    userId,
    profile: null,
    cases: [],
    sessions: [],
    transcriptions: [],
    performanceMetrics: [],
    usageHistory: [],
    auditLogs: [],
  };

  if (!client) {
    // Fallback: export from localStorage
    exportData.cases = getLocalStorageData('cases', userId);
    exportData.sessions = getLocalStorageData('sessions', userId);

    logAudit({
      userId,
      action: 'data_export',
      details: { source: 'localStorage' },
      success: true,
    });

    return exportData;
  }

  try {
    // Fetch all user data in parallel
    const [
      profileResult,
      casesResult,
      sessionsResult,
      metricsResult,
      usageResult,
    ] = await Promise.all([
      client.from('profiles').select('*').eq('id', userId).single(),
      client.from('cases').select('*').eq('user_id', userId),
      client.from('courtroom_sessions').select('*, simulation_transcripts(*), objection_tracker(*)').eq('user_id', userId),
      client.from('simulation_metrics').select('*').eq('user_id', userId),
      client.from('usage_tracking').select('*').eq('user_id', userId),
    ]);

    exportData.profile = profileResult.data;
    exportData.cases = casesResult.data || [];
    exportData.sessions = sessionsResult.data || [];
    exportData.performanceMetrics = metricsResult.data || [];
    exportData.usageHistory = usageResult.data || [];

    logAudit({
      userId,
      action: 'data_export',
      details: {
        source: 'supabase',
        casesCount: exportData.cases.length,
        sessionsCount: exportData.sessions.length,
      },
      success: true,
    });
  } catch (err) {
    console.error('[GDPR] Export failed:', err);
    logAudit({
      userId,
      action: 'data_export',
      success: false,
      errorMessage: err instanceof Error ? err.message : 'Export failed',
    });
    throw err;
  }

  return exportData;
}

/**
 * Download user data as a JSON file.
 */
export async function downloadUserData(userId: string): Promise<void> {
  const data = await exportUserData(userId);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `lexsim-data-export-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Delete all user data.
 * GDPR Article 17 - Right to Erasure.
 *
 * This performs a cascading deletion of all user-associated data.
 * The user's auth account must be deleted separately via Supabase Auth.
 */
export async function deleteAllUserData(userId: string): Promise<{
  success: boolean;
  deletedCounts: Record<string, number>;
}> {
  const client = getSupabaseClient();
  const deletedCounts: Record<string, number> = {};

  if (!client) {
    // Clear localStorage data
    clearLocalStorageData(userId);
    logAudit({
      userId,
      action: 'data_deletion',
      details: { source: 'localStorage' },
      success: true,
    });
    return { success: true, deletedCounts: { localStorage: 1 } };
  }

  try {
    // Delete in reverse dependency order to respect foreign keys

    // 1. Delete simulation metrics
    const { count: metricsCount } = await client
      .from('simulation_metrics')
      .delete({ count: 'exact' })
      .eq('user_id', userId);
    deletedCounts.simulation_metrics = metricsCount || 0;

    // 2. Delete courtroom sessions (cascades to transcripts, objections)
    const { count: sessionsCount } = await client
      .from('courtroom_sessions')
      .delete({ count: 'exact' })
      .eq('user_id', userId);
    deletedCounts.courtroom_sessions = sessionsCount || 0;

    // 3. Delete document queue
    const { count: queueCount } = await client
      .from('document_queue')
      .delete({ count: 'exact' })
      .eq('user_id', userId);
    deletedCounts.document_queue = queueCount || 0;

    // 4. Delete usage tracking
    const { count: usageCount } = await client
      .from('usage_tracking')
      .delete({ count: 'exact' })
      .eq('user_id', userId);
    deletedCounts.usage_tracking = usageCount || 0;

    // 5. Delete user tier
    const { count: tierCount } = await client
      .from('user_tiers')
      .delete({ count: 'exact' })
      .eq('user_id', userId);
    deletedCounts.user_tiers = tierCount || 0;

    // 6. Delete cases (and their evidence)
    const { count: casesCount } = await client
      .from('cases')
      .delete({ count: 'exact' })
      .eq('user_id', userId);
    deletedCounts.cases = casesCount || 0;

    // 7. Delete audit logs for this user
    const { count: auditCount } = await client
      .from('audit_logs')
      .delete({ count: 'exact' })
      .eq('user_id', userId);
    deletedCounts.audit_logs = auditCount || 0;

    // Also clear localStorage
    clearLocalStorageData(userId);

    logAudit({
      // Log as system action since user data is being deleted
      action: 'data_deletion',
      details: { userId, deletedCounts, source: 'supabase' },
      success: true,
    });

    return { success: true, deletedCounts };
  } catch (err) {
    console.error('[GDPR] Deletion failed:', err);
    logAudit({
      userId,
      action: 'data_deletion',
      success: false,
      errorMessage: err instanceof Error ? err.message : 'Deletion failed',
    });
    return { success: false, deletedCounts };
  }
}

// Helpers

function getLocalStorageData(key: string, userId: string): unknown[] {
  try {
    const stored = localStorage.getItem(`${key}_${userId}`);
    if (stored) return JSON.parse(stored);

    // Also check for data keyed by the generic key
    const generic = localStorage.getItem(key);
    if (generic) return JSON.parse(generic);
  } catch {
    // Ignore parse errors
  }
  return [];
}

function clearLocalStorageData(userId: string): void {
  const keysToCheck = [
    'cases', 'sessions', 'transcriptions', 'settings',
    'saved_sessions', 'timeline_events', 'performance',
  ];

  for (const key of keysToCheck) {
    localStorage.removeItem(`${key}_${userId}`);
    localStorage.removeItem(key);
  }

  // Clear usage tracking keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes(userId) || key.startsWith('usage_'))) {
      localStorage.removeItem(key);
    }
  }
}
