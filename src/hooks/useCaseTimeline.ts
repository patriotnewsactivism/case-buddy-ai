import { useState, useEffect, useCallback } from 'react';
import { TimelineEvent } from '../types';

const getStorageKey = (caseId: string) => `timeline_events_${caseId}`;

export const useCaseTimeline = (caseId: string | undefined) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    if (!caseId) {
      setEvents([]);
      return;
    }
    
    const stored = localStorage.getItem(getStorageKey(caseId));
    if (stored) {
      try {
        setEvents(JSON.parse(stored));
      } catch {
        setEvents([]);
      }
    } else {
      setEvents([]);
    }
  }, [caseId]);

  const addEvents = useCallback((newEvents: TimelineEvent[]) => {
    if (!caseId) return;
    
    setEvents(prev => {
      const updated = [...prev, ...newEvents].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      localStorage.setItem(getStorageKey(caseId), JSON.stringify(updated));
      return updated;
    });
  }, [caseId]);

  const removeEvent = useCallback((eventId: string) => {
    if (!caseId) return;
    
    setEvents(prev => {
      const updated = prev.filter(e => e.id !== eventId);
      localStorage.setItem(getStorageKey(caseId), JSON.stringify(updated));
      return updated;
    });
  }, [caseId]);

  const clearEvents = useCallback(() => {
    if (!caseId) return;
    localStorage.removeItem(getStorageKey(caseId));
    setEvents([]);
  }, [caseId]);

  return { events, addEvents, removeEvent, clearEvents };
};
