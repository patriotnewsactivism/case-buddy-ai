import { performDocumentOCR, performPdfOCR, performOCR } from './ocrService';
import { EvidenceItem, TimelineEvent, DocumentType, OCRResult } from '../types';

export interface ProcessedDocument {
  id: string;
  fileName: string;
  fileType: string;
  extractedText: string;
  confidence: number;
  wordCount: number;
  processingTime: number;
  dates: ExtractedDate[];
  entities: ExtractedEntity[];
  monetaryAmounts: string[];
  potentialEvents: TimelineEvent[];
  ocrResult: {
    text: string;
    confidence: number;
    pages?: string[];
  };
}

export interface ExtractedDate {
  date: string;
  context: string;
  type: 'incident' | 'filing' | 'hearing' | 'deadline' | 'other';
}

export interface ExtractedEntity {
  name: string;
  type: 'person' | 'organization' | 'location' | 'document' | 'unknown';
  context: string;
}

const DATE_PATTERNS = [
  /\b(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}\b/gi,
  /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}\b/g,
  /\b\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\b/g,
  /\b(?:on\s+(?:the\s+)?\d{1,2}(?:st|nd|rd|th)?\s+(?:day\s+of\s+)?(?:January|February|March|April|May|June|July|August|September|October|November|December),?\s+\d{4})\b/gi,
];

const MONEY_PATTERNS = [
  /\$[\d,]+(?:\.\d{2})?/g,
  /\b\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:dollars?|USD)\b/gi,
];

const PERSON_PATTERN = /\b(?:Mr\.|Mrs\.|Ms\.|Dr\.|Hon\.|Judge|Attorney|Counsel|Defendant|Plaintiff|Witness)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g;
const ORG_PATTERN = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Inc\.|LLC|Corp\.|Corporation|Company|Co\.|Ltd\.|Bank|Court|Department|Agency|Bureau)\b/g;

export const processDocument = async (
  file: File,
  onProgress?: (progress: number, status: string) => void
): Promise<ProcessedDocument> => {
  const startTime = Date.now();
  
  onProgress?.(0, 'Starting document processing...');
  
  onProgress?.(10, 'Performing OCR...');
  
  const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  let ocrResult: OCRResult;
  
  if (isPDF) {
    ocrResult = await performPdfOCR(file, (p, s) => onProgress?.(10 + p * 0.6, s));
  } else {
    ocrResult = await performOCR(file);
    onProgress?.(70, 'OCR complete, extracting data...');
  }
  
  const text = ocrResult.text;
  
  onProgress?.(75, 'Extracting dates...');
  const dates = extractDates(text);
  
  onProgress?.(80, 'Extracting entities...');
  const entities = extractEntities(text);
  
  onProgress?.(85, 'Extracting monetary amounts...');
  const monetaryAmounts = extractMonetaryAmounts(text);
  
  onProgress?.(90, 'Identifying potential events...');
  const potentialEvents = extractPotentialEvents(text, file.name, dates);
  
  onProgress?.(100, 'Processing complete');
  
  return {
    id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    fileName: file.name,
    fileType: file.type,
    extractedText: text,
    confidence: ocrResult.confidence,
    wordCount: ocrResult.wordCount,
    processingTime: Date.now() - startTime,
    dates,
    entities,
    monetaryAmounts,
    potentialEvents,
    ocrResult: {
      text: ocrResult.text,
      confidence: ocrResult.confidence,
      pages: ocrResult.pages
    }
  };
};

const extractDates = (text: string): ExtractedDate[] => {
  const dates: ExtractedDate[] = [];
  const seen = new Set<string>();
  
  for (const pattern of DATE_PATTERNS) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const dateStr = match[0];
      if (seen.has(dateStr.toLowerCase())) continue;
      seen.add(dateStr.toLowerCase());
      
      const start = Math.max(0, match.index! - 50);
      const end = Math.min(text.length, match.index! + dateStr.length + 50);
      const context = text.slice(start, end).replace(/\s+/g, ' ').trim();
      
      let type: ExtractedDate['type'] = 'other';
      const lowerContext = context.toLowerCase();
      if (lowerContext.includes('incident') || lowerContext.includes('occurred') || lowerContext.includes('happened')) {
        type = 'incident';
      } else if (lowerContext.includes('filed') || lowerContext.includes('filing')) {
        type = 'filing';
      } else if (lowerContext.includes('hearing') || lowerContext.includes('court')) {
        type = 'hearing';
      } else if (lowerContext.includes('deadline') || lowerContext.includes('due') || lowerContext.includes('by')) {
        type = 'deadline';
      }
      
      dates.push({ date: dateStr, context, type });
    }
  }
  
  return dates;
};

const extractEntities = (text: string): ExtractedEntity[] => {
  const entities: ExtractedEntity[] = [];
  const seen = new Set<string>();
  
  const personMatches = text.matchAll(PERSON_PATTERN);
  for (const match of personMatches) {
    const name = match[0];
    if (seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    
    const start = Math.max(0, match.index! - 30);
    const end = Math.min(text.length, match.index! + name.length + 30);
    const context = text.slice(start, end).replace(/\s+/g, ' ').trim();
    
    entities.push({ name, type: 'person', context });
  }
  
  const orgMatches = text.matchAll(ORG_PATTERN);
  for (const match of orgMatches) {
    const name = match[0];
    if (seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    
    const start = Math.max(0, match.index! - 30);
    const end = Math.min(text.length, match.index! + name.length + 30);
    const context = text.slice(start, end).replace(/\s+/g, ' ').trim();
    
    entities.push({ name, type: 'organization', context });
  }
  
  return entities;
};

const extractMonetaryAmounts = (text: string): string[] => {
  const amounts: string[] = [];
  const seen = new Set<string>();
  
  for (const pattern of MONEY_PATTERNS) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const amount = match[0];
      if (seen.has(amount)) continue;
      seen.add(amount);
      amounts.push(amount);
    }
  }
  
  return amounts;
};

const extractPotentialEvents = (
  text: string,
  fileName: string,
  dates: ExtractedDate[]
): TimelineEvent[] => {
  const events: TimelineEvent[] = [];
  
  for (const dateInfo of dates) {
    if (dateInfo.context.length < 20) continue;
    
    let importance: TimelineEvent['importance'] = 'medium';
    const lowerContext = dateInfo.context.toLowerCase();
    if (lowerContext.includes('critical') || lowerContext.includes('emergency') || lowerContext.includes('urgent')) {
      importance = 'critical';
    } else if (lowerContext.includes('important') || lowerContext.includes('significant')) {
      importance = 'high';
    } else if (lowerContext.includes('minor') || lowerContext.includes('routine')) {
      importance = 'low';
    }
    
    const title = dateInfo.context.length > 60 
      ? dateInfo.context.slice(0, 57) + '...'
      : dateInfo.context;
    
    let eventDate: string;
    try {
      const parsed = new Date(dateInfo.date);
      if (!isNaN(parsed.getTime())) {
        eventDate = parsed.toISOString().split('T')[0];
      } else {
        eventDate = new Date().toISOString().split('T')[0];
      }
    } catch {
      eventDate = new Date().toISOString().split('T')[0];
    }
    
    events.push({
      id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: title.charAt(0).toUpperCase() + title.slice(1),
      date: eventDate,
      description: `Extracted from document: ${fileName}. Context: ${dateInfo.context}`,
      type: dateInfo.type === 'hearing' ? 'hearing' : 
            dateInfo.type === 'filing' ? 'filing' :
            dateInfo.type === 'incident' ? 'incident' : 'other',
      importance,
      tags: [fileName.replace(/\.[^/.]+$/, '')]
    });
  }
  
  return events;
};

export const toEvidenceItem = (
  doc: ProcessedDocument,
  caseId: string
): EvidenceItem => {
  return {
    id: doc.id,
    caseId,
    title: doc.fileName,
    type: DocumentType.EVIDENCE,
    source: 'file',
    summary: doc.extractedText.slice(0, 500) + (doc.extractedText.length > 500 ? '...' : ''),
    keyEntities: doc.entities.map(e => e.name),
    risks: [],
    addedAt: new Date().toISOString(),
    fileName: doc.fileName,
    notes: `OCR Confidence: ${doc.confidence}%. Dates found: ${doc.dates.length}. Entities: ${doc.entities.length}.`
  };
};

export const saveTimelineEvents = (caseId: string, events: TimelineEvent[]): void => {
  const storageKey = `timeline_events_${caseId}`;
  const existing = localStorage.getItem(storageKey);
  let existingEvents: TimelineEvent[] = [];
  
  if (existing) {
    try {
      existingEvents = JSON.parse(existing);
    } catch {
      existingEvents = [];
    }
  }
  
  const existingIds = new Set(existingEvents.map(e => e.id));
  const newEvents = events.filter(e => !existingIds.has(e.id));
  
  const merged = [...existingEvents, ...newEvents].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  localStorage.setItem(storageKey, JSON.stringify(merged));
};

export const getTimelineEvents = (caseId: string): TimelineEvent[] => {
  const storageKey = `timeline_events_${caseId}`;
  const stored = localStorage.getItem(storageKey);
  
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  
  return [];
};
