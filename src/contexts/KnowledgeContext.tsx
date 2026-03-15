import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { KnowledgeEntity, KnowledgeFact, DocumentSummary, CaseKnowledge } from '../types';
import { 
  extractEntities, 
  extractFacts, 
  summarizeDocument, 
  buildContextString, 
  mergeKnowledge 
} from '../services/knowledgeService';

interface KnowledgeContextType {
  getKnowledgeContext: (caseId: string) => string;
  getKnowledge: (caseId: string) => CaseKnowledge | null;
  ingestDocument: (caseId: string, document: {
    text: string;
    fileName: string;
    analysis?: {
      summary?: string;
      entities?: string[];
      keyDates?: string[];
      monetaryAmounts?: string[];
      risks?: string[];
    };
  }) => Promise<void>;
  addFact: (caseId: string, fact: Omit<KnowledgeFact, 'id' | 'createdAt'>) => void;
  addEntities: (caseId: string, entities: Omit<KnowledgeEntity, 'source'>[]) => void;
  clearKnowledge: (caseId: string) => void;
  clearAllKnowledge: () => void;
  knowledgeVersion: number;
}

const KnowledgeContext = createContext<KnowledgeContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'casebuddy-knowledge-';

export const useKnowledge = (): KnowledgeContextType => {
  const context = useContext(KnowledgeContext);
  if (!context) {
    throw new Error('useKnowledge must be used within a KnowledgeProvider');
  }
  return context;
};

interface KnowledgeProviderProps {
  children: ReactNode;
}

export const KnowledgeProvider: React.FC<KnowledgeProviderProps> = ({ children }) => {
  const [knowledgeStore, setKnowledgeStore] = useState<Map<string, CaseKnowledge>>(new Map());
  const [knowledgeVersion, setKnowledgeVersion] = useState(0);

  const loadFromStorage = useCallback((caseId: string): CaseKnowledge | null => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${caseId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('[KnowledgeContext] Failed to load from storage:', error);
    }
    return null;
  }, []);

  const saveToStorage = useCallback((knowledge: CaseKnowledge) => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${knowledge.caseId}`, JSON.stringify(knowledge));
    } catch (error) {
      console.warn('[KnowledgeContext] Failed to save to storage:', error);
    }
  }, []);

  const getKnowledge = useCallback((caseId: string): CaseKnowledge | null => {
    const cached = knowledgeStore.get(caseId);
    if (cached) return cached;
    
    const stored = loadFromStorage(caseId);
    if (stored) {
      setKnowledgeStore(prev => new Map(prev).set(caseId, stored));
      return stored;
    }
    
    return null;
  }, [knowledgeStore, loadFromStorage]);

  const getKnowledgeContext = useCallback((caseId: string): string => {
    const knowledge = getKnowledge(caseId);
    return buildContextString(knowledge);
  }, [getKnowledge]);

  const ingestDocument = useCallback(async (
    caseId: string, 
    document: {
      text: string;
      fileName: string;
      analysis?: {
        summary?: string;
        entities?: string[];
        keyDates?: string[];
        monetaryAmounts?: string[];
        risks?: string[];
      };
    }
  ): Promise<void> => {
    const existing = getKnowledge(caseId);
    
    let newEntities: KnowledgeEntity[] = [];
    let newFacts: KnowledgeFact[] = [];
    
    if (document.text && document.text.length > 100) {
      try {
        [newEntities, newFacts] = await Promise.all([
          extractEntities(document.text, document.fileName),
          extractFacts(document.text, document.fileName)
        ]);
      } catch (error) {
        console.warn('[KnowledgeContext] Extraction failed:', error);
      }
    }

    const docSummary = await summarizeDocument(
      document.text,
      document.fileName,
      document.analysis
    );

    const updatedKnowledge = mergeKnowledge(existing, newEntities, newFacts, docSummary);
    updatedKnowledge.caseId = caseId;

    setKnowledgeStore(prev => {
      const newStore = new Map(prev);
      newStore.set(caseId, updatedKnowledge);
      return newStore;
    });

    saveToStorage(updatedKnowledge);
    setKnowledgeVersion(v => v + 1);
  }, [getKnowledge, saveToStorage]);

  const addFact = useCallback((caseId: string, fact: Omit<KnowledgeFact, 'id' | 'createdAt'>) => {
    const existing = getKnowledge(caseId);
    const newFact: KnowledgeFact = {
      ...fact,
      id: `fact-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      createdAt: Date.now()
    };

    const updatedKnowledge = mergeKnowledge(existing, [], [newFact], null);
    updatedKnowledge.caseId = caseId;

    setKnowledgeStore(prev => {
      const newStore = new Map(prev);
      newStore.set(caseId, updatedKnowledge);
      return newStore;
    });

    saveToStorage(updatedKnowledge);
    setKnowledgeVersion(v => v + 1);
  }, [getKnowledge, saveToStorage]);

  const addEntities = useCallback((caseId: string, entities: Omit<KnowledgeEntity, 'source'>[]) => {
    const existing = getKnowledge(caseId);
    const newEntities: KnowledgeEntity[] = entities.map(e => ({
      ...e,
      source: 'manual'
    }));

    const updatedKnowledge = mergeKnowledge(existing, newEntities, [], null);
    updatedKnowledge.caseId = caseId;

    setKnowledgeStore(prev => {
      const newStore = new Map(prev);
      newStore.set(caseId, updatedKnowledge);
      return newStore;
    });

    saveToStorage(updatedKnowledge);
    setKnowledgeVersion(v => v + 1);
  }, [getKnowledge, saveToStorage]);

  const clearKnowledge = useCallback((caseId: string) => {
    setKnowledgeStore(prev => {
      const newStore = new Map(prev);
      newStore.delete(caseId);
      return newStore;
    });
    
    try {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${caseId}`);
    } catch (error) {
      console.warn('[KnowledgeContext] Failed to clear storage:', error);
    }
    
    setKnowledgeVersion(v => v + 1);
  }, []);

  const clearAllKnowledge = useCallback(() => {
    setKnowledgeStore(new Map());
    
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith(STORAGE_KEY_PREFIX))
        .forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('[KnowledgeContext] Failed to clear all storage:', error);
    }
    
    setKnowledgeVersion(v => v + 1);
  }, []);

  const value: KnowledgeContextType = {
    getKnowledgeContext,
    getKnowledge,
    ingestDocument,
    addFact,
    addEntities,
    clearKnowledge,
    clearAllKnowledge,
    knowledgeVersion,
  };

  return (
    <KnowledgeContext.Provider value={value}>
      {children}
    </KnowledgeContext.Provider>
  );
};

export default KnowledgeContext;
