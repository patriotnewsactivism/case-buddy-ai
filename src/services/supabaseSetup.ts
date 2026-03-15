import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

export interface SupabaseStatus {
  configured: boolean;
  connected: boolean;
  tablesExist: boolean;
  rlsEnabled: boolean;
  error?: string;
  details?: {
    casesTable: boolean;
    transcriptionsTable: boolean;
    trialSessionsTable: boolean;
    settlementAnalysesTable: boolean;
  };
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  error?: string;
  latency?: number;
}

const ERROR_MESSAGES: Record<string, string> = {
  'Invalid API key': 'Your SUPABASE_ANON_KEY is invalid. Check that you copied the correct key from your Supabase project settings.',
  'JWT expired': 'Your Supabase session has expired. Refresh the page or check your configuration.',
  'relation "public.cases" does not exist': 'The cases table does not exist. Run the setup.sql script in your Supabase SQL Editor.',
  'permission denied': 'Permission denied. RLS policies may not be configured. Run the setup.sql script.',
  'new row violates row-level security policy': 'RLS policies are blocking this operation. Ensure you ran the full setup.sql script.',
  'network error': 'Network error. Check your internet connection and that SUPABASE_URL is correct.',
  'Failed to fetch': 'Could not connect to Supabase. Verify SUPABASE_URL is correct and accessible.',
  'Invalid URL': 'SUPABASE_URL is not a valid URL. It should look like: https://your-project-id.supabase.co',
};

const getErrorMessage = (error: unknown): string => {
  const errorString = error instanceof Error ? error.message : String(error);
  
  for (const [key, message] of Object.entries(ERROR_MESSAGES)) {
    if (errorString.toLowerCase().includes(key.toLowerCase())) {
      return message;
    }
  }
  
  return errorString || 'An unexpected error occurred. Check the console for details.';
};

export const testSupabaseConnection = async (): Promise<ConnectionTestResult> => {
  const startTime = performance.now();
  
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message: 'Supabase is not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY to your .env.local file.',
    };
  }
  
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Supabase client could not be initialized. Check your environment variables.',
    };
  }
  
  try {
    const { error } = await client.from('cases').select('id').limit(1);
    
    const latency = Math.round(performance.now() - startTime);
    
    if (error) {
      return {
        success: false,
        message: 'Connection test failed.',
        error: getErrorMessage(error),
        latency,
      };
    }
    
    return {
      success: true,
      message: 'Successfully connected to Supabase!',
      latency,
    };
  } catch (err) {
    return {
      success: false,
      message: 'Connection test failed with an exception.',
      error: getErrorMessage(err),
      latency: Math.round(performance.now() - startTime),
    };
  }
};

export const getSupabaseStatus = async (): Promise<SupabaseStatus> => {
  const configured = isSupabaseConfigured();
  
  if (!configured) {
    return {
      configured: false,
      connected: false,
      tablesExist: false,
      rlsEnabled: false,
      error: 'Supabase credentials not found in environment variables.',
    };
  }
  
  const client = getSupabaseClient();
  if (!client) {
    return {
      configured: true,
      connected: false,
      tablesExist: false,
      rlsEnabled: false,
      error: 'Supabase client initialization failed.',
    };
  }
  
  const details = {
    casesTable: false,
    transcriptionsTable: false,
    trialSessionsTable: false,
    settlementAnalysesTable: false,
  };
  
  try {
    const [casesResult, transcriptionsResult, trialSessionsResult, settlementResult] = await Promise.all([
      client.from('cases').select('id').limit(1),
      client.from('transcriptions').select('id').limit(1),
      client.from('trial_sessions').select('id').limit(1),
      client.from('settlement_analyses').select('id').limit(1),
    ]);
    
    details.casesTable = !casesResult.error;
    details.transcriptionsTable = !transcriptionsResult.error;
    details.trialSessionsTable = !trialSessionsResult.error;
    details.settlementAnalysesTable = !settlementResult.error;
    
    const tablesExist = details.casesTable && details.transcriptionsTable && 
                        details.trialSessionsTable && details.settlementAnalysesTable;
    
    let rlsEnabled = false;
    try {
      const { data, error } = await client.rpc('exec_sql', { 
        query: "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'" 
      });
      rlsEnabled = !error && Array.isArray(data) && data.length > 0;
    } catch {
      rlsEnabled = tablesExist;
    }
    
    return {
      configured: true,
      connected: true,
      tablesExist,
      rlsEnabled,
      details,
    };
  } catch (err) {
    return {
      configured: true,
      connected: false,
      tablesExist: false,
      rlsEnabled: false,
      error: getErrorMessage(err),
      details,
    };
  }
};

export const verifyTableStructure = async (): Promise<{ valid: boolean; errors: string[] }> => {
  const client = getSupabaseClient();
  const errors: string[] = [];
  
  if (!client) {
    return { valid: false, errors: ['Supabase client not initialized'] };
  }
  
  const requiredTables = [
    { name: 'cases', columns: ['id', 'title', 'client', 'status', 'evidence', 'tasks'] },
    { name: 'transcriptions', columns: ['id', 'caseId', 'fileName', 'text', 'timestamp'] },
    { name: 'trial_sessions', columns: ['id', 'caseId', 'phase', 'mode', 'transcript'] },
    { name: 'settlement_analyses', columns: ['id', 'caseId', 'settlementRange', 'factors'] },
  ];
  
  for (const table of requiredTables) {
    try {
      const { error } = await client
        .from(table.name)
        .select(table.columns.join(','))
        .limit(0);
      
      if (error) {
        if (error.message.includes('does not exist')) {
          errors.push(`Table '${table.name}' does not exist`);
        } else if (error.message.includes('column') || error.message.includes('does not exist')) {
          errors.push(`Table '${table.name}' is missing required columns`);
        } else {
          errors.push(`Table '${table.name}': ${error.message}`);
        }
      }
    } catch (err) {
      errors.push(`Failed to verify table '${table.name}': ${err}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

export const getSetupInstructions = (): string[] => {
  return [
    '1. Create a Supabase project at https://supabase.com',
    '2. Go to Project Settings > API and copy your Project URL and anon/public key',
    '3. Add to .env.local:',
    '   SUPABASE_URL=https://your-project-id.supabase.co',
    '   SUPABASE_ANON_KEY=your_anon_key_here',
    '4. Go to SQL Editor in Supabase dashboard',
    '5. Copy the contents of supabase/setup.sql and run it',
    '6. Restart your dev server: npm run dev',
    '7. Run testSupabaseConnection() to verify setup',
  ];
};
