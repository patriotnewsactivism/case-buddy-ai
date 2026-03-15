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

export class AzureDocumentIntelligenceProvider extends BaseServerProvider {
  readonly id: OCRProvider = 'azure-document-intelligence';
  readonly name = 'Azure Document Intelligence';
  readonly capabilities: OCRCapabilities = PROVIDER_INFO['azure-document-intelligence'].capabilities;
  
  private endpoint: string | null = null;

  isConfigured(): boolean {
    return !!(
      this.apiKey ||
      this.config.apiKey ||
      import.meta.env.VITE_AZURE_DOCUMENT_INTELLIGENCE_KEY
    );
  }

  configure(config: Partial<OCRProviderConfig>): void {
    super.configure(config);
    if (config.endpoint) this.endpoint = config.endpoint;
  }

  async process(file: File, options?: OCROptions): Promise<EnhancedOCRResult> {
    const startTime = Date.now();
    
    options?.onProgress?.(0, 'Preparing document...');
    
    const pageCount = await calculatePageCount(file);
    const base64Content = await this.fileToBase64(file);
    const mimeType = this.getMimeType(file);
    
    const modelId = this.selectModel(file, options);
    
    options?.onProgress?.(20, 'Sending to Azure Document Intelligence...');
    
    try {
      const response = await this.callProxy('azure-document-intelligence', 'analyzeDocument', {
        content: base64Content,
        mimeType,
        modelId,
        endpoint: this.endpoint || import.meta.env.VITE_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT
      }, options);
      
      options?.onProgress?.(90, 'Processing results...');
      
      const result = this.parseResponse(response, startTime);
      
      options?.onProgress?.(100, 'Complete');
      
      return result;
    } catch (error) {
      throw new Error(`Azure Document Intelligence processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async processImage(imageData: Blob | HTMLCanvasElement | string, options?: OCROptions): Promise<EnhancedOCRResult> {
    const startTime = Date.now();
    
    let base64Content: string;
    
    if (typeof imageData === 'string') {
      base64Content = imageData.split(',')[1] || imageData;
    } else if (imageData instanceof HTMLCanvasElement) {
      const blob = await new Promise<Blob>((resolve) => {
        imageData.toBlob((b) => resolve(b!), 'image/png');
      });
      base64Content = await this.fileToBase64(blob as File);
    } else {
      const buffer = await imageData.arrayBuffer();
      base64Content = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    }
    
    try {
      const response = await this.callProxy('azure-document-intelligence', 'analyzeDocument', {
        content: base64Content,
        mimeType: 'image/png',
        modelId: 'prebuilt-read',
        endpoint: this.endpoint || import.meta.env.VITE_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT
      }, options);
      
      return this.parseResponse(response, startTime);
    } catch (error) {
      throw new Error(`Azure Document Intelligence processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private selectModel(file: File, options?: OCROptions): string {
    const fileName = file.name.toLowerCase();
    const category = options?.documentCategory;
    
    if (category === 'contract' || fileName.includes('contract') || fileName.includes('agreement')) {
      return 'prebuilt-contract';
    }
    
    if (category === 'financial-records' || fileName.includes('invoice') || fileName.includes('receipt')) {
      return 'prebuilt-invoice';
    }
    
    if (options?.enableFormRecognition || fileName.includes('form')) {
      return 'prebuilt-layout';
    }
    
    if (options?.enableTableExtraction) {
      return 'prebuilt-layout';
    }
    
    return 'prebuilt-read';
  }

  private parseResponse(response: any, startTime: number): EnhancedOCRResult {
    const analyzeResult = response.analyzeResult || response;
    
    const pages: string[] = [];
    const tables: OCRTableData[] = [];
    const forms: OCRFormData = { fields: [], checkboxes: [] };
    
    if (analyzeResult.pages && Array.isArray(analyzeResult.pages)) {
      for (const page of analyzeResult.pages) {
        const lines = page.lines || [];
        const pageText = lines.map((l: any) => l.content || '').join('\n');
        pages.push(pageText);
        
        if (page.tables && Array.isArray(page.tables)) {
          for (const table of page.tables) {
            const tableData = this.parseTable(table);
            if (tableData) {
              tables.push(tableData);
            }
          }
        }
        
        if (page.selectionMarks && Array.isArray(page.selectionMarks)) {
          for (const mark of page.selectionMarks) {
            forms.checkboxes?.push({
              label: this.findSelectionMarkLabel(mark, page.lines || []),
              checked: mark.state === 'selected',
              confidence: mark.confidence * 100
            });
          }
        }
      }
    }
    
    const fullText = pages.join('\n\n--- PAGE BREAK ---\n\n');
    const wordCount = fullText.trim().split(/\s+/).filter(Boolean).length;
    
    if (analyzeResult.documents && Array.isArray(analyzeResult.documents)) {
      for (const doc of analyzeResult.documents) {
        if (doc.fields) {
          for (const [key, field] of Object.entries(doc.fields)) {
            const fieldData = field as any;
            forms.fields.push({
              key,
              value: fieldData.content || fieldData.valueString || '',
              confidence: (fieldData.confidence || 0.9) * 100
            });
          }
        }
      }
    }
    
    if (analyzeResult.keyValuePairs && Array.isArray(analyzeResult.keyValuePairs)) {
      for (const kvp of analyzeResult.keyValuePairs) {
        forms.fields.push({
          key: kvp.key?.content || '',
          value: kvp.value?.content || '',
          confidence: (kvp.confidence || 0.9) * 100
        });
      }
    }
    
    const entities = this.extractEntities(analyzeResult);
    
    let totalConfidence = 90;
    if (analyzeResult.pages && analyzeResult.pages.length > 0) {
      let sum = 0;
      let count = 0;
      for (const page of analyzeResult.pages) {
        if (page.lines) {
          for (const line of page.lines) {
            if (line.confidence !== undefined) {
              sum += line.confidence;
              count++;
            }
          }
        }
      }
      if (count > 0) {
        totalConfidence = (sum / count) * 100;
      }
    }
    
    return {
      text: fullText,
      confidence: Math.round(totalConfidence),
      pages,
      wordCount,
      detectedLanguage: analyzeResult.languages?.[0]?.locale || 'en',
      processingTime: Date.now() - startTime,
      provider: this.id,
      tables: tables.length > 0 ? tables : undefined,
      forms: forms.fields.length > 0 || (forms.checkboxes?.length || 0) > 0 ? forms : undefined,
      entities,
      layoutPreserved: true,
      rawResponse: response
    };
  }

  private parseTable(table: any): OCRTableData | null {
    if (!table.cells || table.cells.length === 0) return null;
    
    const rowCount = table.rowCount || 1;
    const columnCount = table.columnCount || 1;
    
    const headers: string[] = [];
    const rows: string[][] = [];
    
    for (let i = 0; i < rowCount; i++) {
      rows.push(new Array(columnCount).fill(''));
    }
    
    for (const cell of table.cells) {
      const rowIndex = cell.rowIndex || 0;
      const columnIndex = cell.columnIndex || 0;
      const content = cell.content || '';
      
      if (rowIndex < rows.length && columnIndex < rows[rowIndex].length) {
        rows[rowIndex][columnIndex] = content;
        
        if (cell.kind === 'columnHeader' || rowIndex === 0) {
          headers[columnIndex] = content;
        }
      }
    }
    
    return {
      headers: headers.length > 0 ? headers : [],
      rows,
      confidence: (table.confidence || 0.9) * 100
    };
  }

  private findSelectionMarkLabel(mark: any, lines: any[]): string {
    const markY = mark.boundingBox ? 
      (mark.boundingBox[0]?.y + mark.boundingBox[2]?.y) / 2 : 0;
    
    let closestLine: any = null;
    let minDistance = Infinity;
    
    for (const line of lines) {
      if (!line.boundingBox) continue;
      const lineY = (line.boundingBox[0]?.y + line.boundingBox[2]?.y) / 2;
      const distance = Math.abs(lineY - markY);
      
      if (distance < minDistance && distance < 50) {
        minDistance = distance;
        closestLine = line;
      }
    }
    
    return closestLine?.content || '';
  }

  private extractEntities(analyzeResult: any): EnhancedOCRResult['entities'] {
    const entities: EnhancedOCRResult['entities'] = [];
    
    if (analyzeResult.documents && Array.isArray(analyzeResult.documents)) {
      for (const doc of analyzeResult.documents) {
        if (doc.fields) {
          const fieldMap: Record<string, 'person' | 'organization' | 'date' | 'amount' | 'location'> = {
            'VendorName': 'organization',
            'CustomerName': 'organization',
            'InvoiceDate': 'date',
            'DueDate': 'date',
            'AmountDue': 'amount',
            'SubTotal': 'amount',
            'Tax': 'amount',
            'Total': 'amount',
            'Address': 'location',
            'VendorAddress': 'location',
            'CustomerAddress': 'location',
            'Signer': 'person',
            'Parties': 'person'
          };
          
          for (const [key, field] of Object.entries(doc.fields)) {
            const fieldData = field as any;
            const entityType = fieldMap[key];
            if (entityType && fieldData.content) {
              entities.push({
                text: fieldData.content,
                type: entityType,
                confidence: (fieldData.confidence || 0.9) * 100
              });
            }
          }
        }
      }
    }
    
    return entities.length > 0 ? entities : undefined;
  }

  getCostEstimate(pageCount: number): number {
    return pageCount * 0.0015;
  }
}

export default AzureDocumentIntelligenceProvider;
