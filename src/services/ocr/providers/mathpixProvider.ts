import type {
  OCRProvider,
  OCRCapabilities,
  OCRProviderConfig,
  OCROptions,
  EnhancedOCRResult,
  OCRTableData
} from '../types';
import { PROVIDER_INFO } from '../types';
import { BaseServerProvider, calculatePageCount } from './baseProvider';

export class MathpixProvider extends BaseServerProvider {
  readonly id: OCRProvider = 'mathpix';
  readonly name = 'Mathpix';
  readonly capabilities: OCRCapabilities = PROVIDER_INFO['mathpix'].capabilities;

  isConfigured(): boolean {
    return !!(
      this.apiKey ||
      this.config.apiKey ||
      import.meta.env.VITE_MATHPIX_API_KEY
    );
  }

  async process(file: File, options?: OCROptions): Promise<EnhancedOCRResult> {
    const startTime = Date.now();
    
    options?.onProgress?.(0, 'Preparing document...');
    
    const pageCount = await calculatePageCount(file);
    const base64Content = await this.fileToBase64(file);
    const mimeType = this.getMimeType(file);
    
    options?.onProgress?.(20, 'Sending to Mathpix...');
    
    try {
      const response = await this.callProxy('mathpix', 'process', {
        content: base64Content,
        mimeType,
        options: {
          math_inline_delimiters: ['$', '$'],
          math_display_delimiters: ['$$', '$$'],
          rm_spaces: false,
          enable_tables: options?.enableTableExtraction !== false,
          enable_handwriting: options?.enableHandwriting !== false
        }
      }, options);
      
      options?.onProgress?.(90, 'Processing results...');
      
      const result = this.parseResponse(response, startTime, pageCount);
      
      options?.onProgress?.(100, 'Complete');
      
      return result;
    } catch (error) {
      throw new Error(`Mathpix processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      const response = await this.callProxy('mathpix', 'process', {
        content: base64Content,
        mimeType: 'image/png',
        options: {
          enable_tables: options?.enableTableExtraction !== false,
          enable_handwriting: options?.enableHandwriting !== false
        }
      }, options);
      
      return this.parseResponse(response, startTime, 1);
    } catch (error) {
      throw new Error(`Mathpix processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseResponse(response: any, startTime: number, pageCount: number): EnhancedOCRResult {
    const text = response.text || response.md || '';
    const pages = response.pages ? 
      response.pages.map((p: any) => p.text || p.md || '') : 
      (text ? [text] : []);
    
    const tables: OCRTableData[] = [];
    
    if (response.tables && Array.isArray(response.tables)) {
      for (const table of response.tables) {
        const tableData = this.parseTable(table);
        if (tableData) {
          tables.push(tableData);
        }
      }
    }
    
    const extractedTables = this.extractMarkdownTables(text);
    tables.push(...extractedTables);
    
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    
    const confidence = this.calculateConfidence(response);
    
    return {
      text,
      confidence,
      pages: pages.length > 0 ? pages : undefined,
      wordCount,
      detectedLanguage: 'en',
      processingTime: Date.now() - startTime,
      provider: this.id,
      tables: tables.length > 0 ? tables : undefined,
      layoutPreserved: true,
      rawResponse: response
    };
  }

  private parseTable(table: any): OCRTableData | null {
    if (!table.cells && !table.data) return null;
    
    const headers: string[] = [];
    const rows: string[][] = [];
    
    if (table.data && Array.isArray(table.data)) {
      const data = table.data;
      
      if (data.length > 0) {
        headers.push(...data[0].map((cell: any) => 
          typeof cell === 'string' ? cell : cell?.text || ''
        ));
        
        for (let i = 1; i < data.length; i++) {
          rows.push(data[i].map((cell: any) => 
            typeof cell === 'string' ? cell : cell?.text || ''
          ));
        }
      }
    } else if (table.cells && Array.isArray(table.cells)) {
      const maxRow = Math.max(...table.cells.map((c: any) => c.row || 0)) + 1;
      const maxCol = Math.max(...table.cells.map((c: any) => c.col || 0)) + 1;
      
      for (let i = 0; i < maxRow; i++) {
        rows.push(new Array(maxCol).fill(''));
      }
      
      for (const cell of table.cells) {
        const row = cell.row || 0;
        const col = cell.col || 0;
        if (row < rows.length && col < rows[row].length) {
          rows[row][col] = cell.text || cell.content || '';
        }
      }
      
      if (rows.length > 0) {
        headers.push(...rows[0]);
        rows.shift();
      }
    }
    
    if (rows.length === 0 && headers.length === 0) return null;
    
    return {
      headers,
      rows,
      confidence: table.confidence ? table.confidence * 100 : 95
    };
  }

  private extractMarkdownTables(text: string): OCRTableData[] {
    const tables: OCRTableData[] = [];
    const tableRegex = /\|[^\n]+\|\n\|[-:\s|]+\|\n((?:\|[^\n]+\|\n?)+)/g;
    
    let match;
    while ((match = tableRegex.exec(text)) !== null) {
      const headerLine = match[0].split('\n')[0];
      const bodyLines = match[1].trim().split('\n');
      
      const headers = headerLine
        .split('|')
        .filter((_, i, arr) => i > 0 && i < arr.length - 1)
        .map(h => h.trim());
      
      const rows = bodyLines
        .filter(line => line.trim())
        .map(line => 
          line.split('|')
            .filter((_, i, arr) => i > 0 && i < arr.length - 1)
            .map(cell => cell.trim())
        );
      
      if (headers.length > 0 && rows.length > 0) {
        tables.push({
          headers,
          rows,
          confidence: 95
        });
      }
    }
    
    return tables;
  }

  private calculateConfidence(response: any): number {
    if (response.confidence !== undefined) {
      return Math.round(response.confidence * 100);
    }
    
    if (response.confidence_rate !== undefined) {
      return Math.round(response.confidence_rate * 100);
    }
    
    if (response.pages && Array.isArray(response.pages)) {
      let totalConf = 0;
      let count = 0;
      
      for (const page of response.pages) {
        if (page.confidence !== undefined) {
          totalConf += page.confidence;
          count++;
        }
      }
      
      if (count > 0) {
        return Math.round((totalConf / count) * 100);
      }
    }
    
    return 95;
  }

  getCostEstimate(pageCount: number): number {
    return pageCount * 0.005;
  }
}

export default MathpixProvider;
