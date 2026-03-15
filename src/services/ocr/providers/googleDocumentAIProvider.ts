import type {
  OCRProvider,
  OCRCapabilities,
  OCRProviderConfig,
  OCROptions,
  EnhancedOCRResult,
  OCRTableData,
  OCRFormData
} from '../types';
import { PROVIDER_INFO } from '../types';
import { BaseServerProvider, calculatePageCount } from './baseProvider';

export class GoogleDocumentAIProvider extends BaseServerProvider {
  readonly id: OCRProvider = 'google-document-ai';
  readonly name = 'Google Document AI';
  readonly capabilities: OCRCapabilities = PROVIDER_INFO['google-document-ai'].capabilities;
  
  private endpoint: string | null = null;
  private processorId: string | null = null;

  isConfigured(): boolean {
    return !!(this.apiKey || this.config.apiKey || 
      (import.meta.env.VITE_GOOGLE_DOCUMENT_AI_KEY));
  }

  configure(config: Partial<OCRProviderConfig>): void {
    super.configure(config);
    if (config.endpoint) this.endpoint = config.endpoint;
    if (config.processorId) this.processorId = config.processorId;
  }

  async process(file: File, options?: OCROptions): Promise<EnhancedOCRResult> {
    const startTime = Date.now();
    
    options?.onProgress?.(0, 'Preparing document...');
    
    const pageCount = await calculatePageCount(file);
    const base64Content = await this.fileToBase64(file);
    const mimeType = this.getMimeType(file);
    
    options?.onProgress?.(20, 'Sending to Google Document AI...');
    
    try {
      const response = await this.callProxy('google-document-ai', 'processDocument', {
        content: base64Content,
        mimeType,
        processorId: this.processorId || import.meta.env.VITE_GOOGLE_DOCUMENT_AI_PROCESSOR_ID
      }, options);
      
      options?.onProgress?.(90, 'Processing results...');
      
      const result = this.parseResponse(response, startTime);
      
      options?.onProgress?.(100, 'Complete');
      
      return result;
    } catch (error) {
      throw new Error(`Google Document AI processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async processImage(imageData: Blob | HTMLCanvasElement | string, options?: OCROptions): Promise<EnhancedOCRResult> {
    const startTime = Date.now();
    
    let base64Content: string;
    let mimeType = 'image/png';
    
    if (typeof imageData === 'string') {
      base64Content = imageData.split(',')[1] || imageData;
      mimeType = 'image/png';
    } else if (imageData instanceof HTMLCanvasElement) {
      const blob = await new Promise<Blob>((resolve) => {
        imageData.toBlob((b) => resolve(b!), 'image/png');
      });
      base64Content = await this.fileToBase64(blob as File);
    } else {
      const buffer = await imageData.arrayBuffer();
      base64Content = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      mimeType = imageData.type || 'image/png';
    }
    
    try {
      const response = await this.callProxy('google-document-ai', 'processDocument', {
        content: base64Content,
        mimeType,
        processorId: this.processorId || import.meta.env.VITE_GOOGLE_DOCUMENT_AI_PROCESSOR_ID
      }, options);
      
      return this.parseResponse(response, startTime);
    } catch (error) {
      throw new Error(`Google Document AI processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseResponse(response: any, startTime: number): EnhancedOCRResult {
    const document = response.document || response;
    
    let fullText = '';
    const pages: string[] = [];
    const tables: OCRTableData[] = [];
    const forms: OCRFormData = { fields: [], checkboxes: [] };
    
    if (document.text) {
      fullText = document.text;
    }
    
    if (document.pages && Array.isArray(document.pages)) {
      for (const page of document.pages) {
        const pageText = page.text || '';
        pages.push(pageText);
        
        if (page.tables && Array.isArray(page.tables)) {
          for (const table of page.tables) {
            const tableData = this.parseTable(table, fullText);
            if (tableData) {
              tables.push(tableData);
            }
          }
        }
        
        if (page.formFields && Array.isArray(page.formFields)) {
          for (const field of page.formFields) {
            forms.fields.push({
              key: this.extractText(field.fieldName, fullText) || '',
              value: this.extractText(field.fieldValue, fullText) || '',
              confidence: field.fieldValue?.confidence || 0.9
            });
          }
        }
      }
    }
    
    const entities = (document.entities || []).map((entity: any) => ({
      text: entity.mentionText || entity.text || '',
      type: this.mapEntityType(entity.type),
      confidence: entity.confidence || 0.9
    }));
    
    const wordCount = fullText.trim().split(/\s+/).filter(Boolean).length;
    
    return {
      text: fullText,
      confidence: this.calculateConfidence(document),
      pages: pages.length > 0 ? pages : undefined,
      wordCount,
      detectedLanguage: document.languageCode || 'en',
      processingTime: Date.now() - startTime,
      provider: this.id,
      tables: tables.length > 0 ? tables : undefined,
      forms: forms.fields.length > 0 ? forms : undefined,
      entities: entities.length > 0 ? entities : undefined,
      layoutPreserved: true,
      rawResponse: response
    };
  }

  private parseTable(table: any, fullText: string): OCRTableData | null {
    if (!table.headerRows && !table.bodyRows) return null;
    
    const headers: string[] = [];
    const rows: string[][] = [];
    
    if (table.headerRows) {
      for (const headerRow of table.headerRows) {
        const headerCells = headerRow.cells || [];
        const headerTexts = headerCells.map((cell: any) => 
          this.extractText(cell.layout, fullText) || ''
        );
        headers.push(...headerTexts);
      }
    }
    
    if (table.bodyRows) {
      for (const bodyRow of table.bodyRows) {
        const bodyCells = bodyRow.cells || [];
        const rowTexts = bodyCells.map((cell: any) => 
          this.extractText(cell.layout, fullText) || ''
        );
        rows.push(rowTexts);
      }
    }
    
    return {
      headers,
      rows,
      confidence: table.layout?.confidence || 0.9
    };
  }

  private extractText(layout: any, fullText: string): string {
    if (!layout?.textAnchor?.textSegments) return '';
    
    const segments = layout.textAnchor.textSegments;
    let text = '';
    
    for (const segment of segments) {
      const start = Number(segment.startIndex) || 0;
      const end = Number(segment.endIndex) || fullText.length;
      text += fullText.substring(start, end);
    }
    
    return text.trim();
  }

  private mapEntityType(type: string): 'person' | 'organization' | 'date' | 'amount' | 'location' | 'other' {
    const typeMap: Record<string, 'person' | 'organization' | 'date' | 'amount' | 'location' | 'other'> = {
      'person': 'person',
      'people': 'person',
      'name': 'person',
      'organization': 'organization',
      'company': 'organization',
      'date': 'date',
      'datetime': 'date',
      'money': 'amount',
      'amount': 'amount',
      'price': 'amount',
      'location': 'location',
      'address': 'location'
    };
    
    return typeMap[type?.toLowerCase()] || 'other';
  }

  private calculateConfidence(document: any): number {
    if (document.pages && document.pages.length > 0) {
      let totalConfidence = 0;
      let count = 0;
      
      for (const page of document.pages) {
        if (page.layout?.confidence) {
          totalConfidence += page.layout.confidence;
          count++;
        }
      }
      
      if (count > 0) {
        return Math.round((totalConfidence / count) * 100);
      }
    }
    
    return 95;
  }

  getCostEstimate(pageCount: number): number {
    return pageCount * 0.0015;
  }
}

export default GoogleDocumentAIProvider;
