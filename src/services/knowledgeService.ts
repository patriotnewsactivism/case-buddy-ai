import { Type } from "@google/genai";
import { KnowledgeEntity, KnowledgeFact, DocumentSummary, CaseKnowledge } from "../types";
import { callGeminiProxy } from "./apiProxy";
import { retryWithBackoff } from "../utils/errorHandler";

export const extractEntities = async (text: string, source: string): Promise<KnowledgeEntity[]> => {
  if (!text || text.trim().length === 0) return [];
  
  const prompt = `Extract all legally relevant entities from the following text. Focus on names, organizations, dates, monetary amounts, locations, statutes, and case citations.

Text:
${text.substring(0, 30000)}

Return a JSON array of entities with their type and context.`;

  try {
    const response = await callGeminiProxy({
      prompt,
      model: 'gemini-2.5-flash',
      options: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              type: { type: Type.STRING, enum: ['person', 'organization', 'date', 'amount', 'location', 'statute', 'case-citation', 'other'] },
              confidence: { type: Type.NUMBER },
            }
          }
        }
      }
    });

    if (!response.success || !response.text) {
      throw new Error(response.error?.message || 'Entity extraction failed: No response text received');
    }

    const entities = JSON.parse(response.text);
    return entities.map((e: any) => ({
      ...e,
      source,
      confidence: e.confidence || 0.7
    }));
  } catch (error) {
    console.warn('[KnowledgeService] Entity extraction failed:', error);
    return [];
  }
};

export const extractFacts = async (text: string, source: string): Promise<KnowledgeFact[]> => {
  if (!text || text.trim().length === 0) return [];
  
  const prompt = `Extract key factual assertions from the following legal text. Focus on statements that establish facts, claims, or legal positions.

Text:
${text.substring(0, 30000)}

Return a JSON array of facts with their category and confidence.`;

  try {
    const response = await callGeminiProxy({
      prompt,
      model: 'gemini-2.5-flash',
      options: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              category: { type: Type.STRING, enum: ['procedural', 'factual', 'legal', 'evidentiary', 'testimonial'] },
              confidence: { type: Type.NUMBER },
            }
          }
        }
      }
    });

    if (!response.success || !response.text) {
      throw new Error(response.error?.message || 'Fact extraction failed: No response text received');
    }

    const facts = JSON.parse(response.text);
    return facts.map((f: any, idx: number) => ({
      id: `fact-${Date.now()}-${idx}`,
      text: f.text,
      source,
      confidence: f.confidence || 0.7,
      category: f.category || 'factual',
      createdAt: Date.now()
    }));
  } catch (error) {
    console.warn('[KnowledgeService] Fact extraction failed:', error);
    return [];
  }
};

export const summarizeDocument = async (
  text: string,
  fileName: string,
  existingAnalysis?: {
    summary?: string;
    entities?: string[];
    keyDates?: string[];
    monetaryAmounts?: string[];
    risks?: string[];
  }
): Promise<DocumentSummary> => {
  const summary = existingAnalysis?.summary || '';
  const entities = existingAnalysis?.entities || [];
  const keyDates = existingAnalysis?.keyDates || [];
  const monetaryAmounts = existingAnalysis?.monetaryAmounts || [];
  const risks = existingAnalysis?.risks || [];

  return {
    id: `doc-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    fileName,
    summary,
    entities: entities.map(e => ({
      text: e,
      type: 'other' as const,
      confidence: 0.8,
      source: fileName
    })),
    keyDates,
    monetaryAmounts,
    risks,
    addedAt: Date.now()
  };
};

export const buildContextString = (knowledge: CaseKnowledge | null): string => {
  if (!knowledge) return '';

  const parts: string[] = [];

  if (knowledge.documentSummaries.length > 0) {
    parts.push('## Document Summaries\n');
    knowledge.documentSummaries.forEach(doc => {
      parts.push(`### ${doc.fileName}`);
      parts.push(doc.summary);
      if (doc.keyDates.length > 0) {
        parts.push(`Key Dates: ${doc.keyDates.join(', ')}`);
      }
      if (doc.monetaryAmounts.length > 0) {
        parts.push(`Monetary Amounts: ${doc.monetaryAmounts.join(', ')}`);
      }
      if (doc.risks.length > 0) {
        parts.push(`Risks: ${doc.risks.join(', ')}`);
      }
      parts.push('');
    });
  }

  if (knowledge.entities.length > 0) {
    const groupedEntities: Record<string, string[]> = {};
    knowledge.entities.forEach(e => {
      if (!groupedEntities[e.type]) groupedEntities[e.type] = [];
      if (!groupedEntities[e.type].includes(e.text)) {
        groupedEntities[e.type].push(e.text);
      }
    });

    parts.push('## Key Entities\n');
    Object.entries(groupedEntities).forEach(([type, entities]) => {
      parts.push(`**${type.charAt(0).toUpperCase() + type.slice(1)}s:** ${entities.join(', ')}`);
    });
    parts.push('');
  }

  if (knowledge.facts.length > 0) {
    parts.push('## Key Facts\n');
    knowledge.facts.slice(0, 20).forEach(fact => {
      parts.push(`- ${fact.text} (${fact.category})`);
    });
    parts.push('');
  }

  return parts.join('\n');
};

export const mergeKnowledge = (
  existing: CaseKnowledge | null,
  newEntities: KnowledgeEntity[],
  newFacts: KnowledgeFact[],
  newDocument: DocumentSummary | null
): CaseKnowledge => {
  const caseId = existing?.caseId || '';
  
  const mergedEntities = [...(existing?.entities || [])];
  newEntities.forEach(newEntity => {
    const exists = mergedEntities.some(
      e => e.text.toLowerCase() === newEntity.text.toLowerCase() && e.type === newEntity.type
    );
    if (!exists) {
      mergedEntities.push(newEntity);
    }
  });

  const mergedFacts = [...(existing?.facts || [])];
  newFacts.forEach(newFact => {
    const exists = mergedFacts.some(
      f => f.text.toLowerCase() === newFact.text.toLowerCase()
    );
    if (!exists) {
      mergedFacts.push(newFact);
    }
  });

  const mergedDocs = [...(existing?.documentSummaries || [])];
  if (newDocument) {
    const existingIdx = mergedDocs.findIndex(d => d.fileName === newDocument.fileName);
    if (existingIdx >= 0) {
      mergedDocs[existingIdx] = newDocument;
    } else {
      mergedDocs.push(newDocument);
    }
  }

  return {
    caseId,
    entities: mergedEntities,
    facts: mergedFacts,
    documentSummaries: mergedDocs,
    lastUpdated: Date.now()
  };
};
