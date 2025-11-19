import { SavedSession } from '@/types';

const SESSIONS_KEY = 'casebuddy_sessions';
const CURRENT_SESSION_KEY = 'casebuddy_session';

export const saveSession = (session: SavedSession): void => {
  try {
    const sessions = getAllSessions();
    const existingIndex = sessions.findIndex(s => s.id === session.id);
    
    if (existingIndex >= 0) {
      sessions[existingIndex] = session;
    } else {
      sessions.unshift(session);
    }
    
    // Keep last 50 sessions
    const trimmedSessions = sessions.slice(0, 50);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(trimmedSessions));
    localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Failed to save session:', error);
  }
};

export const getAllSessions = (): SavedSession[] => {
  try {
    const data = localStorage.getItem(SESSIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load sessions:', error);
    return [];
  }
};

export const getLastSession = (): SavedSession | null => {
  try {
    const data = localStorage.getItem(CURRENT_SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load last session:', error);
    return null;
  }
};

export const deleteSession = (sessionId: string): void => {
  try {
    const sessions = getAllSessions();
    const filtered = sessions.filter(s => s.id !== sessionId);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete session:', error);
  }
};

export const exportSessionAsJSON = (session: SavedSession): void => {
  const dataStr = JSON.stringify(session, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `casebuddy-session-${session.id}.json`;
  link.click();
  URL.revokeObjectURL(url);
};
