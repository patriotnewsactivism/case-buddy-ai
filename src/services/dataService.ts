import { Case, EvidenceItem, TrialSession } from '../types';
import { clearCases, loadCases, saveCases } from '../utils/storage';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

const isNotFoundError = (error: any) => error?.code === 'PGRST116';
const isColumnMismatchError = (error: any) => {
  const message = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`.toLowerCase();
  return message.includes('column') && (message.includes('does not exist') || message.includes('could not find'));
};

type CaseColumnStyle = 'snake' | 'camel';
let detectedCaseColumnStyle: CaseColumnStyle | null = null;

const getFallbackCaseColumnStyle = (style: CaseColumnStyle): CaseColumnStyle => {
  return style === 'snake' ? 'camel' : 'snake';
};

// Map TypeScript camelCase to database columns.
async function caseToRow(c: Case, style: CaseColumnStyle): Promise<Record<string, any>> {
  const client = getSupabaseClient();
  let userId = c.user_id;

  if (!userId && client) {
    const { data: { user } } = await client.auth.getUser();
    userId = user?.id;
  }

  const base: any = {
    id: c.id,
    user_id: userId,
    title: c.title,
    client: c.client,
    status: c.status,
    judge: c.judge,
    summary: c.summary,
    tags: c.tags || [],
    evidence: c.evidence || [],
    tasks: c.tasks || [],
    witnesses: c.witnesses || [],
  };

  if (style === 'camel') {
    return {
      ...base,
      opposingCounsel: c.opposingCounsel,
      nextCourtDate: c.nextCourtDate,
      winProbability: c.winProbability,
      docketNumber: c.docketNumber,
      courtLocation: c.courtLocation,
      jurisdiction: c.jurisdiction,
      clientType: c.clientType,
      opposingParty: c.opposingParty,
      legalTheory: c.legalTheory,
      keyIssues: c.keyIssues,
    };
  }

  return {
    ...base,
    opposing_counsel: c.opposingCounsel,
    next_court_date: c.nextCourtDate,
    win_probability: c.winProbability,
    docket_number: c.docketNumber,
    court_location: c.courtLocation,
    jurisdiction: c.jurisdiction,
    client_type: c.clientType,
    opposing_party: c.opposingParty,
    legal_theory: c.legalTheory,
    key_issues: c.keyIssues,
  };
}

// Map database snake_case columns to TypeScript camelCase
function rowToCase(row: any): Case {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title || row.name || 'Untitled Case',
    client: row.client || row.client_name || 'Unknown Client',
    status: row.status,
    opposingCounsel: row.opposing_counsel ?? row.opposingcounsel ?? row.opposingCounsel,
    judge: row.judge,
    nextCourtDate: row.next_court_date ?? row.nextcourtdate ?? row.nextCourtDate,
    summary: row.summary ?? row.description,
    winProbability: row.win_probability ?? row.winprobability ?? row.winProbability,
    docketNumber: row.docket_number ?? row.docketnumber ?? row.docketNumber ?? row.case_number,
    courtLocation: row.court_location ?? row.courtlocation ?? row.courtLocation ?? row.court_name,
    jurisdiction: row.jurisdiction,
    clientType: row.client_type ?? row.clienttype ?? row.clientType,
    opposingParty: row.opposing_party ?? row.opposingparty ?? row.opposingParty,
    legalTheory: row.legal_theory ?? row.legaltheory ?? row.legalTheory,
    keyIssues: row.key_issues ?? row.keyissues ?? row.keyIssues,
    tags: row.tags || [],
    evidence: row.evidence || [],
    tasks: row.tasks || [],
    witnesses: row.witnesses || [],
  };
}

const hydrateCase = (c: Case): Case => ({
  ...c,
  evidence: c.evidence || [],
  tasks: c.tasks || [],
  tags: c.tags || [],
});

const cacheCases = (cases: Case[]) => {
  saveCases(cases.map(hydrateCase));
};

export const fetchCases = async (): Promise<Case[]> => {
  const client = getSupabaseClient();
  if (!client) {
    console.log('[DataService] Supabase not configured, using local storage');
    return loadCases().map(hydrateCase);
  }

  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    console.log('[DataService] No authenticated user, using local storage');
    return loadCases().map(hydrateCase);
  }

  console.log('[DataService] Fetching cases for user:', user.id);
  const { data, error } = await client
    .from('cases')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null);

  if (error) {
    console.error('[Supabase] fetchCases failed; falling back to local cache', error);
    return loadCases().map(hydrateCase);
  }

  console.log(`[DataService] Successfully fetched ${data?.length || 0} cases from Supabase`);
  const cases = (data || []).map(rowToCase);
  cacheCases(cases);
  return cases;
};

export const upsertCase = async (caseRecord: Case): Promise<void> => {
  console.log(`[DataService] Upserting case: ${caseRecord.title} (${caseRecord.id})`);
  const client = getSupabaseClient();
  if (!client) {
    const current = loadCases().filter(c => c.id !== caseRecord.id);
    cacheCases([...current, hydrateCase(caseRecord)]);
    return;
  }

  // Ensure user_id is present
  if (!caseRecord.user_id) {
    const { data: { user } } = await client.auth.getUser();
    if (user) {
        caseRecord.user_id = user.id;
    } else {
        console.warn('[DataService] Attempted to upsert case without authenticated user. Falling back to local.');
        const current = loadCases().filter(c => c.id !== caseRecord.id);
        cacheCases([...current, hydrateCase(caseRecord)]);
        return;
    }
  }

  const stylesToTry: CaseColumnStyle[] = detectedCaseColumnStyle
    ? [detectedCaseColumnStyle, getFallbackCaseColumnStyle(detectedCaseColumnStyle)]
    : ['snake', 'camel'];

  let lastError: any = null;

  for (const style of stylesToTry) {
    const row = await caseToRow(caseRecord, style);
    console.log(`[DataService] Attempting upsert with ${style} style`);
    
    const { error } = await client.from('cases').upsert(row, { onConflict: 'id' });

    if (!error) {
      console.log(`[DataService] Successfully upserted case with ${style} style`);
      detectedCaseColumnStyle = style;
      return;
    }

    lastError = error;
    console.warn(`[DataService] Upsert failed with ${style} style:`, error.message);
    if (!isColumnMismatchError(error)) {
      break;
    }
  }

  console.error('[Supabase] upsertCase failed after all attempts', lastError);
  throw lastError;
};

export const removeCase = async (caseId: string): Promise<void> => {
  const client = getSupabaseClient();
  if (!client) {
    const updated = loadCases().filter(c => c.id !== caseId);
    cacheCases(updated);
    return;
  }

  const { error } = await client.from('cases').update({ deleted_at: new Date().toISOString() }).eq('id', caseId);
  if (error) {
    console.error('[Supabase] removeCase failed', error);
    throw error;
  }
};

export const appendEvidence = async (caseId: string, evidence: EvidenceItem): Promise<void> => {
  console.log(`[DataService] Appending evidence to case ${caseId}: ${evidence.title}`);
  const client = getSupabaseClient();
  if (!client) {
    const updated = loadCases().map(c => c.id === caseId ? { ...c, evidence: [...(c.evidence || []), evidence] } : c);
    cacheCases(updated);
    return;
  }

  // First, get the current case data to ensure we have the most up-to-date evidence array
  const { data, error } = await client.from('cases').select('evidence, user_id').eq('id', caseId).single();
  
  if (error) {
    console.error('[Supabase] fetch evidence failed', error);
    throw error;
  }

  const existingEvidence: EvidenceItem[] = Array.isArray(data?.evidence) ? data.evidence : [];
  const nextEvidence = [...existingEvidence, { ...evidence, lastUpdated: new Date().toISOString() }];

  console.log(`[DataService] Updating case ${caseId} with ${nextEvidence.length} total evidence items`);
  const { error: updateError } = await client.from('cases').update({ evidence: nextEvidence }).eq('id', caseId);
  
  if (updateError) {
    console.error('[Supabase] appendEvidence failed', updateError);
    throw updateError;
  }

  console.log('[DataService] Successfully updated evidence JSON in cases table');
  
  // Also try to insert into separate evidence table for structured data
  try {
    const { error: tableError } = await client.from('evidence').insert({
        id: evidence.id,
        case_id: caseId,
        name: evidence.title,
        description: evidence.summary,
        type: evidence.type.toLowerCase() === 'evidence' ? 'document' : 'other',
        category: evidence.source,
        ai_analysis: {
            entities: evidence.keyEntities,
            risks: evidence.risks,
            summary: evidence.summary,
            notes: evidence.notes
        },
        file_path: evidence.fileName,
        created_at: evidence.addedAt
    });
    
    if (tableError) {
        console.warn('[Supabase] Failed to insert into dedicated evidence table:', tableError.message);
    } else {
        console.log('[DataService] Successfully inserted into dedicated evidence table');
    }
  } catch (e) {
    console.warn('[Supabase] Evidence table structured insert failed (might not exist)');
  }
};

export const fetchSessions = async (caseId: string): Promise<TrialSession[]> => {
  const client = getSupabaseClient();
  if (!client) {
    try {
      return JSON.parse(localStorage.getItem(`trial_sessions_${caseId}`) ?? '[]');
    } catch {
      return [];
    }
  }

  const { data, error } = await client
    .from('trial_sessions')
    .select('*')
    .eq('case_id', caseId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase] fetchSessions failed', error);
    try {
      return JSON.parse(localStorage.getItem(`trial_sessions_${caseId}`) ?? '[]');
    } catch {
      return [];
    }
  }

  // Map database row to TrialSession interface
  const mapped: TrialSession[] = (data || []).map(row => ({
    id: row.id,
    caseId: row.case_id,
    caseTitle: row.session_name, 
    phase: row.session_type || 'other',
    mode: row.notes || 'practice', 
    date: row.session_date || new Date().toISOString(),
    duration: row.metadata?.duration || 0,
    transcript: Array.isArray(row.key_events) ? row.key_events : [],
    score: row.metadata?.score || 0,
    feedback: row.outcomes || '',
    metrics: row.ai_preparation || {},
  }));

  return mapped;
};

export const upsertSession = async (session: TrialSession): Promise<void> => {
  console.log(`[DataService] Upserting session: ${session.id} for case ${session.caseId}`);
  const client = getSupabaseClient();
  
  // Always update local cache first
  const localSessions = JSON.parse(localStorage.getItem(`trial_sessions_${session.caseId}`) ?? '[]');
  const filtered = localSessions.filter((s: any) => s.id !== session.id);
  localStorage.setItem(`trial_sessions_${session.caseId}`, JSON.stringify([session, ...filtered].slice(0, 20)));

  if (!client) return;

  const row = {
    id: session.id.length > 30 ? session.id : undefined, // Only use if it looks like a UUID
    case_id: session.caseId,
    session_name: session.caseTitle,
    session_date: new Date(session.date).toISOString().split('T')[0],
    session_type: session.phase,
    outcomes: session.feedback,
    notes: session.mode,
    ai_preparation: session.metrics,
    key_events: session.transcript,
    metadata: {
      duration: session.duration,
      score: session.score,
      audioUrl: session.audioUrl
    }
  };

  const { error } = await client.from('trial_sessions').upsert(row, { onConflict: 'id' });
  if (error) {
    console.error('[Supabase] upsertSession failed', error);
    throw error;
  }
  console.log('[DataService] Successfully upserted session to Supabase');
};

export const removeSession = async (sessionId: string, caseId: string): Promise<void> => {
  const client = getSupabaseClient();
  if (!client) {
    const localSessions = JSON.parse(localStorage.getItem(`trial_sessions_${caseId}`) ?? '[]');
    const updated = localSessions.filter((s: any) => s.id !== sessionId);
    localStorage.setItem(`trial_sessions_${caseId}`, JSON.stringify(updated));
    return;
  }

  const { error } = await client.from('trial_sessions').delete().eq('id', sessionId);
  if (error) {
    console.error('[Supabase] removeSession failed', error);
    throw error;
  }
};

export const resetLocalCache = () => {
  clearCases();
};

export const supabaseReady = isSupabaseConfigured;
