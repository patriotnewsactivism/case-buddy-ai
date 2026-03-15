import type {
  OCRProvider,
  OCRProviderConfig,
  OCROptions,
  EnhancedOCRResult,
  LegalDocumentCategory
} from '../../types';
import {
  DOCUMENT_CATEGORY_RECOMMENDATIONS,
  PROVIDER_INFO,
  OCRProviderInterface
} from './types';
import { TesseractProvider } from './providers/tesseractProvider';
import { GoogleDocumentAIProvider } from './providers/googleDocumentAIProvider';
import { AWSTextractProvider } from './providers/awsTextractProvider';
import { AzureDocumentIntelligenceProvider } from './providers/azureDocumentIntelligenceProvider';
import { MathpixProvider } from './providers/mathpixProvider';

class OCRProviderFactory {
  private static instance: OCRProviderFactory;
  private providers: Map<OCRProvider, OCRProviderInterface> = new Map();
  private configs: Map<OCRProvider, OCRProviderConfig> = new Map();
  
  private constructor() {
    this.providers.set('tesseract', new TesseractProvider());
    this.providers.set('google-document-ai', new GoogleDocumentAIProvider());
    this.providers.set('aws-textract', new AWSTextractProvider());
    this.providers.set('azure-document-intelligence', new AzureDocumentIntelligenceProvider());
    this.providers.set('mathpix', new MathpixProvider());
  }
  
  static getInstance(): OCRProviderFactory {
    if (!OCRProviderFactory.instance) {
      OCRProviderFactory.instance = new OCRProviderFactory();
    }
    return OCRProviderFactory.instance;
  }
  
  getProvider(providerId: OCRProvider): OCRProviderInterface | undefined {
    return this.providers.get(providerId);
  }
  
  configureProvider(providerId: OCRProvider, config: Partial<OCRProviderConfig>): void {
    const provider = this.providers.get(providerId);
    if (provider) {
      provider.configure(config);
      
      const existingConfig = this.configs.get(providerId) || {
        provider: providerId,
        enabled: true,
        priority: 1,
        documentCategories: [],
        capabilities: PROVIDER_INFO[providerId].capabilities,
        costPerPage: 0.0015
      };
      
      this.configs.set(providerId, { ...existingConfig, ...config });
    }
  }
  
  getAvailableProviders(): OCRProvider[] {
    return Array.from(this.providers.entries())
      .filter(([_, provider]) => provider.isConfigured())
      .map(([id]) => id);
  }
  
  getConfiguredProviders(): OCRProviderConfig[] {
    return Array.from(this.configs.values());
  }
  
  getProviderConfig(providerId: OCRProvider): OCRProviderConfig | undefined {
    return this.configs.get(providerId);
  }
  
  getProviderInfo(providerId: OCRProvider) {
    return PROVIDER_INFO[providerId];
  }
  
  getAllProviderInfo() {
    return PROVIDER_INFO;
  }
}

export const ocrProviderFactory = OCRProviderFactory.getInstance();

export const selectProvider = (
  options?: OCROptions,
  availableProviders?: OCRProvider[]
): OCRProvider => {
  const available = availableProviders || ocrProviderFactory.getAvailableProviders();
  
  if (available.length === 0) {
    return 'tesseract';
  }
  
  if (options?.provider && available.includes(options.provider)) {
    return options.provider;
  }
  
  if (options?.documentCategory) {
    const recommended = DOCUMENT_CATEGORY_RECOMMENDATIONS[options.documentCategory];
    
    for (const providerId of recommended) {
      if (available.includes(providerId)) {
        return providerId;
      }
    }
  }
  
  if (options?.enableHandwriting) {
    const handwritingProviders: OCRProvider[] = ['mathpix', 'aws-textract', 'google-document-ai'];
    for (const providerId of handwritingProviders) {
      if (available.includes(providerId)) {
        return providerId;
      }
    }
  }
  
  if (options?.enableTableExtraction) {
    const tableProviders: OCRProvider[] = ['aws-textract', 'mathpix', 'azure-document-intelligence'];
    for (const providerId of tableProviders) {
      if (available.includes(providerId)) {
        return providerId;
      }
    }
  }
  
  if (available.includes('google-document-ai')) {
    return 'google-document-ai';
  }
  
  if (available.includes('azure-document-intelligence')) {
    return 'azure-document-intelligence';
  }
  
  if (available.includes('aws-textract')) {
    return 'aws-textract';
  }
  
  return available[0];
};

export const detectDocumentCategory = (
  fileName: string,
  content?: string
): LegalDocumentCategory => {
  const lowerName = fileName.toLowerCase();
  const lowerContent = (content || '').toLowerCase();
  
  if (lowerName.includes('deposition') || lowerContent.includes('deposition')) {
    return 'deposition';
  }
  
  if (lowerName.includes('contract') || 
      lowerName.includes('agreement') ||
      lowerContent.includes('hereby agree') ||
      lowerContent.includes('terms and conditions')) {
    return 'contract';
  }
  
  if (lowerName.includes('motion') ||
      lowerName.includes('filing') ||
      lowerName.includes('court') ||
      lowerName.includes('pleading')) {
    return 'court-filing';
  }
  
  if (lowerName.includes('invoice') ||
      lowerName.includes('receipt') ||
      lowerName.includes('bill') ||
      lowerName.includes('financial') ||
      lowerContent.includes('amount due') ||
      lowerContent.includes('invoice number')) {
    return 'financial-records';
  }
  
  if (lowerName.includes('medical') ||
      lowerName.includes('health') ||
      lowerName.includes('patient') ||
      lowerContent.includes('diagnosis') ||
      lowerContent.includes('treatment')) {
    return 'medical-records';
  }
  
  if (lowerName.includes('form') ||
      lowerName.includes('application') ||
      lowerContent.includes('check') ||
      lowerContent.includes('☐') ||
      lowerContent.includes('☒')) {
    return 'form';
  }
  
  const tableIndicators = [
    /\|.*\|.*\|/,
    /\t.*\t/,
    /row\s+\d+/i,
    /column\s+\d+/i
  ];
  
  for (const pattern of tableIndicators) {
    if (pattern.test(lowerContent)) {
      return 'table-heavy';
    }
  }
  
  return 'general';
};

export const estimateCost = (
  pageCount: number,
  providerId: OCRProvider
): number => {
  const provider = ocrProviderFactory.getProvider(providerId);
  if (provider) {
    return provider.getCostEstimate(pageCount);
  }
  
  const pricing: Record<OCRProvider, number> = {
    'tesseract': 0,
    'google-document-ai': 0.0015,
    'aws-textract': 0.0015,
    'azure-document-intelligence': 0.0015,
    'mathpix': 0.005
  };
  
  return pageCount * pricing[providerId];
};

export const processDocument = async (
  file: File,
  options?: OCROptions
): Promise<EnhancedOCRResult> => {
  const availableProviders = ocrProviderFactory.getAvailableProviders();
  const selectedProvider = selectProvider(options, availableProviders);
  
  const provider = ocrProviderFactory.getProvider(selectedProvider);
  
  if (!provider) {
    throw new Error(`OCR provider '${selectedProvider}' not found`);
  }
  
  if (!provider.isConfigured()) {
    const tesseract = ocrProviderFactory.getProvider('tesseract');
    if (tesseract && tesseract.isConfigured()) {
      console.warn(`Provider '${selectedProvider}' not configured, falling back to Tesseract`);
      return tesseract.process(file, options);
    }
    throw new Error('No OCR providers configured');
  }
  
  return provider.process(file, options);
};

export {
  PROVIDER_INFO,
  DOCUMENT_CATEGORY_RECOMMENDATIONS
};

export default ocrProviderFactory;
