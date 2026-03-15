import { useState, useEffect, useCallback } from 'react';
import { TrialSession } from '../types';
import { fetchSessions, upsertSession, removeSession as removeSessionService } from '../services/dataService';

export function useSavedSessions(caseId: string | undefined) {
  const [sessions, setSessions] = useState<TrialSession[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSessions = useCallback(async () => {
    if (!caseId) {
      setSessions([]);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchSessions(caseId);
      setSessions(data);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const addSession = useCallback(async (session: TrialSession) => {
    // Optimistic update
    setSessions(prev => [session, ...prev].slice(0, 20));
    
    try {
      await upsertSession(session);
    } catch (err) {
      console.error('Failed to save session to online database:', err);
      // Fallback or retry logic could go here if needed
    }
  }, []);

  const removeSession = useCallback(async (id: string) => {
    if (!caseId) return;
    
    // Optimistic update
    setSessions(prev => prev.filter(s => s.id !== id));
    
    try {
      await removeSessionService(id, caseId);
    } catch (err) {
      console.error('Failed to remove session from online database:', err);
    }
  }, [caseId]);

  return { sessions, addSession, removeSession, loading, refresh: loadSessions };
}
