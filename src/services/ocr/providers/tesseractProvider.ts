import { createWorker, type Worker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import {
  OCRProviderInterface,
  OCRProvider,
  OCRCapabilities,
  OCRProviderConfig,
  OCROptions,
  EnhancedOCRResult,
  PROVIDER_INFO
} from '../types';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export class TesseractProvider implements OCRProviderInterface {
  readonly id: OCRProvider = 'tesseract';
  readonly name = 'Tesseract.js';
  readonly capabilities: OCRCapabilities = PROVIDER_INFO['tesseract'].capabilities;
  
  private worker: Worker | null = null;
  private config: Partial<OCRProviderConfig> = {};
  private initialized = false;

  isConfigured(): boolean {
    return true;
  }

  configure(config: Partial<OCRProviderConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private async getWorker(): Promise<Worker> {
    if (!this.worker || !this.initialized) {
      this.worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`[Tesseract] Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });
      this.initialized = true;
    }
    return this.worker;
  }

  async process(file: File, options?: OCROptions): Promise<EnhancedOCRResult> {
    const startTime = Date.now();
    
    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    
    if (isPDF) {
      return this.processPDF(file, options);
    }
    
    const result = await this.processImage(file, options);
    
    return {
      ...result,
      processingTime: Date.now() - startTime
    };
  }

  async processImage(
    imageData: Blob | HTMLCanvasElement | string,
    options?: OCROptions
  ): Promise<EnhancedOCRResult> {
    const startTime = Date.now();
    
    options?.onProgress?.(0, 'Initializing Tesseract...');
    const worker = await this.getWorker();
    
    options?.onProgress?.(30, 'Performing OCR...');
    const result = await worker.recognize(imageData);
    
    const text = result.data.text || '';
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    
    options?.onProgress?.(100, 'Complete');
    
    return {
      text,
      confidence: Math.round(result.data.confidence || 0),
      wordCount,
      detectedLanguage: 'en',
      processingTime: Date.now() - startTime,
      provider: this.id,
      layoutPreserved: false
    };
  }

  private async processPDF(file: File, options?: OCROptions): Promise<EnhancedOCRResult> {
    const startTime = Date.now();
    
    options?.onProgress?.(0, 'Loading PDF...');
    
    const arrayBuffer = await fileToArrayBuffer(file);
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;
    
    options?.onProgress?.(5, `Processing ${totalPages} pages...`);
    
    const textPages = await this.extractPdfText(pdf);
    const totalTextLength = textPages.reduce((sum, p) => sum + p.length, 0);
    const needsOCR = totalTextLength < totalPages * 100;
    
    const allPages: string[] = [];
    let totalConfidence = 0;
    
    if (!needsOCR) {
      options?.onProgress?.(50, 'Text layer extracted successfully');
      allPages.push(...textPages);
      totalConfidence = 95;
    } else {
      options?.onProgress?.(10, 'Detected scanned PDF - performing OCR...');
      
      for (let i = 1; i <= totalPages; i++) {
        const progress = 10 + (i / totalPages) * 80;
        options?.onProgress?.(Math.round(progress), `Processing page ${i} of ${totalPages}...`);
        
        const page = await pdf.getPage(i);
        const canvas = await this.renderPageToCanvas(page, 2.0);
        const blob = await canvasToBlob(canvas);
        
        const result = await this.processImage(blob);
        allPages.push(result.text);
        totalConfidence += result.confidence;
      }
      
      totalConfidence = totalConfidence / totalPages;
    }
    
    options?.onProgress?.(95, 'Finalizing...');
    
    const fullText = allPages.join('\n\n--- PAGE BREAK ---\n\n');
    const wordCount = fullText.trim().split(/\s+/).filter(Boolean).length;
    
    return {
      text: fullText,
      confidence: Math.round(totalConfidence),
      pages: allPages,
      wordCount,
      detectedLanguage: 'en',
      processingTime: Date.now() - startTime,
      provider: this.id,
      layoutPreserved: false
    };
  }

  private async extractPdfText(pdf: pdfjsLib.PDFDocumentProxy): Promise<string[]> {
    const pages: string[] = [];
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      pages.push(pageText);
    }
    
    return pages;
  }

  private async renderPageToCanvas(
    page: pdfjsLib.PDFPageProxy,
    scale: number = 2.0
  ): Promise<HTMLCanvasElement> {
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    const context = canvas.getContext('2d')!;
    await page.render({
      canvasContext: context,
      viewport,
      canvas
    } as any).promise;
    
    return canvas;
  }

  getCostEstimate(pageCount: number): number {
    return 0;
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.initialized = false;
    }
  }
}

function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
}

export default TesseractProvider;
