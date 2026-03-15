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

export class AWSTextractProvider extends BaseServerProvider {
  readonly id: OCRProvider = 'aws-textract';
  readonly name = 'AWS Textract';
  readonly capabilities: OCRCapabilities = PROVIDER_INFO['aws-textract'].capabilities;
  
  private region: string = 'us-east-1';
  private accessKeyId: string | null = null;
  private secretAccessKey: string | null = null;

  isConfigured(): boolean {
    return !!(
      (this.accessKeyId && this.secretAccessKey) ||
      (this.config.apiKey) ||
      import.meta.env.VITE_AWS_ACCESS_KEY_ID
    );
  }

  configure(config: Partial<OCRProviderConfig>): void {
    super.configure(config);
    if (config.region) this.region = config.region;
    if (this.config.apiKey) {
      const parts = this.config.apiKey.split(':');
      if (parts.length === 2) {
        this.accessKeyId = parts[0];
        this.secretAccessKey = parts[1];
      }
    }
  }

  async process(file: File, options?: OCROptions): Promise<EnhancedOCRResult> {
    const startTime = Date.now();
    
    options?.onProgress?.(0, 'Preparing document...');
    
    const pageCount = await calculatePageCount(file);
    const base64Content = await this.fileToBase64(file);
    const mimeType = this.getMimeType(file);
    
    const featureTypes = this.getFeatureTypes(options);
    
    options?.onProgress?.(20, 'Sending to AWS Textract...');
    
    try {
      const response = await this.callProxy('aws-textract', 'detectDocumentText', {
        content: base64Content,
        mimeType,
        featureTypes,
        region: this.region
      }, options);
      
      options?.onProgress?.(90, 'Processing results...');
      
      const result = this.parseResponse(response, startTime, pageCount);
      
      options?.onProgress?.(100, 'Complete');
      
      return result;
    } catch (error) {
      throw new Error(`AWS Textract processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      const response = await this.callProxy('aws-textract', 'detectDocumentText', {
        content: base64Content,
        mimeType: 'image/png',
        featureTypes: this.getFeatureTypes(options),
        region: this.region
      }, options);
      
      return this.parseResponse(response, startTime, 1);
    } catch (error) {
      throw new Error(`AWS Textract processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getFeatureTypes(options?: OCROptions): string[] {
    const features: string[] = ['TABLES', 'FORMS'];
    
    if (options?.enableTableExtraction !== false) {
      features.push('TABLES');
    }
    if (options?.enableFormRecognition !== false) {
      features.push('FORMS');
    }
    
    return [...new Set(features)];
  }

  private parseResponse(response: any, startTime: number, pageCount: number): EnhancedOCRResult {
    const blocks = response.Blocks || [];
    
    const pageTexts: Map<number, string[]> = new Map();
    const tables: OCRTableData[] = [];
    const forms: OCRFormData = { fields: [], checkboxes: [] };
    
    const blockMap = new Map<string, any>();
    for (const block of blocks) {
      blockMap.set(block.Id, block);
    }
    
    for (const block of blocks) {
      if (block.BlockType === 'PAGE') {
        const pageNum = block.Page || 1;
        if (!pageTexts.has(pageNum)) {
          pageTexts.set(pageNum, []);
        }
      }
    }
    
    for (const block of blocks) {
      if (block.BlockType === 'LINE') {
        const pageNum = block.Page || 1;
        if (!pageTexts.has(pageNum)) {
          pageTexts.set(pageNum, []);
        }
        pageTexts.get(pageNum)!.push(block.Text || '');
      }
    }
    
    for (const block of blocks) {
      if (block.BlockType === 'TABLE') {
        const table = this.parseTable(block, blockMap);
        if (table) {
          tables.push(table);
        }
      }
      
      if (block.BlockType === 'KEY_VALUE_SET') {
        if (block.EntityTypes?.includes('KEY')) {
          const keyText = this.getBlockText(block, blockMap);
          const valueBlock = this.findValueBlock(block, blockMap);
          const valueText = valueBlock ? this.getBlockText(valueBlock, blockMap) : '';
          
          forms.fields.push({
            key: keyText,
            value: valueText,
            confidence: block.Confidence || 90
          });
        }
      }
      
      if (block.BlockType === 'SELECTION_ELEMENT') {
        forms.checkboxes?.push({
          label: this.findCheckboxLabel(block, blockMap),
          checked: block.SelectionStatus === 'SELECTED',
          confidence: block.Confidence || 90
        });
      }
    }
    
    const pages = Array.from(pageTexts.entries())
      .sort(([a], [b]) => a - b)
      .map(([, lines]) => lines.join(' '));
    
    const fullText = pages.join('\n\n--- PAGE BREAK ---\n\n');
    const wordCount = fullText.trim().split(/\s+/).filter(Boolean).length;
    
    let totalConfidence = 0;
    let confidenceCount = 0;
    for (const block of blocks) {
      if (block.Confidence) {
        totalConfidence += block.Confidence;
        confidenceCount++;
      }
    }
    const avgConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 90;
    
    return {
      text: fullText,
      confidence: Math.round(avgConfidence),
      pages,
      wordCount,
      detectedLanguage: 'en',
      processingTime: Date.now() - startTime,
      provider: this.id,
      tables: tables.length > 0 ? tables : undefined,
      forms: forms.fields.length > 0 || (forms.checkboxes?.length || 0) > 0 ? forms : undefined,
      layoutPreserved: true,
      rawResponse: response
    };
  }

  private parseTable(tableBlock: any, blockMap: Map<string, any>): OCRTableData | null {
    const relationships = tableBlock.Relationships || [];
    const cells: any[] = [];
    
    for (const rel of relationships) {
      if (rel.Type === 'CHILD') {
        for (const cellId of rel.Ids || []) {
          const cell = blockMap.get(cellId);
          if (cell) {
            cells.push(cell);
          }
        }
      }
    }
    
    if (cells.length === 0) return null;
    
    const maxRow = Math.max(...cells.map(c => c.RowIndex || 1));
    const maxCol = Math.max(...cells.map(c => c.ColumnIndex || 1));
    
    const headers: string[] = [];
    const rows: string[][] = [];
    
    for (let i = 0; i < maxRow; i++) {
      rows.push(new Array(maxCol).fill(''));
    }
    
    for (const cell of cells) {
      const row = (cell.RowIndex || 1) - 1;
      const col = (cell.ColumnIndex || 1) - 1;
      const text = this.getBlockText(cell, blockMap);
      
      if (row >= 0 && row < rows.length && col >= 0 && col < rows[row].length) {
        rows[row][col] = text;
        
        if (row === 0 && cell.EntityTypes?.includes('COLUMN_HEADER')) {
          headers[col] = text;
        }
      }
    }
    
    return {
      headers: headers.length > 0 ? headers : rows[0] || [],
      rows: headers.length > 0 ? rows.slice(1) : rows,
      confidence: tableBlock.Confidence || 90
    };
  }

  private getBlockText(block: any, blockMap: Map<string, any>): string {
    const texts: string[] = [];
    
    for (const rel of block.Relationships || []) {
      if (rel.Type === 'CHILD') {
        for (const childId of rel.Ids || []) {
          const child = blockMap.get(childId);
          if (child?.Text) {
            texts.push(child.Text);
          }
        }
      }
    }
    
    return texts.join(' ') || block.Text || '';
  }

  private findValueBlock(keyBlock: any, blockMap: Map<string, any>): any | null {
    for (const rel of keyBlock.Relationships || []) {
      if (rel.Type === 'VALUE') {
        for (const valueId of rel.Ids || []) {
          return blockMap.get(valueId);
        }
      }
    }
    return null;
  }

  private findCheckboxLabel(block: any, blockMap: Map<string, any>): string {
    for (const rel of block.Relationships || []) {
      if (rel.Type === 'CHILD') {
        for (const childId of rel.Ids || []) {
          const child = blockMap.get(childId);
          if (child?.Text) {
            return child.Text;
          }
        }
      }
    }
    return '';
  }

  getCostEstimate(pageCount: number): number {
    return pageCount * 0.0015;
  }
}

export default AWSTextractProvider;
