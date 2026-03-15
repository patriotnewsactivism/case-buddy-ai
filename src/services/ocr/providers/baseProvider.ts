import type {
  OCRProvider,
  OCRCapabilities,
  OCRProviderConfig,
  OCROptions,
  EnhancedOCRResult
} from '../types';
import { PROVIDER_INFO } from '../types';

export abstract class BaseServerProvider {
  abstract readonly id: OCRProvider;
  abstract readonly name: string;
  abstract readonly capabilities: OCRCapabilities;
  
  protected config: Partial<OCRProviderConfig> = {};
  protected apiKey: string | null = null;
  
  abstract isConfigured(): boolean;
  abstract process(file: File, options?: OCROptions): Promise<EnhancedOCRResult>;
  abstract processImage(imageData: Blob | HTMLCanvasElement | string, options?: OCROptions): Promise<EnhancedOCRResult>;
  abstract getCostEstimate(pageCount: number): number;

  configure(config: Partial<OCRProviderConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.apiKey) {
      this.apiKey = config.apiKey;
    }
  }

  protected fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  protected async callProxy(
    provider: string,
    action: string,
    payload: Record<string, any>,
    options?: OCROptions
  ): Promise<any> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/ocr-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify({
        provider,
        action,
        payload,
        options: {
          language: options?.language,
          enableHandwriting: options?.enableHandwriting,
          enableTableExtraction: options?.enableTableExtraction,
          enableFormRecognition: options?.enableFormRecognition,
          preserveLayout: options?.preserveLayout
        }
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `OCR proxy error: ${response.status}`);
    }

    return response.json();
  }

  protected getMimeType(file: File): string {
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.pdf')) return 'application/pdf';
    if (fileName.match(/\.(jpg|jpeg)$/)) return 'image/jpeg';
    if (fileName.endsWith('.png')) return 'image/png';
    if (fileName.endsWith('.webp')) return 'image/webp';
    if (fileName.endsWith('.gif')) return 'image/gif';
    if (fileName.match(/\.(tiff|tif)$/)) return 'image/tiff';
    
    return file.type || 'application/octet-stream';
  }
}

export const calculatePageCount = async (file: File): Promise<number> => {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return 1;
  }

  try {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    return pdf.numPages;
  } catch {
    return 1;
  }
};
