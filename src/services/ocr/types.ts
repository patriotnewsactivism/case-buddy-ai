import type {
  OCRProvider,
  LegalDocumentCategory,
  OCRCapabilities,
  OCRProviderConfig,
  OCROptions,
  OCRTableData,
  OCRFormData,
  EnhancedOCRResult,
  OCRProviderInfo,
  OCRBoundingBox
} from '../../types';

export type {
  OCRProvider,
  LegalDocumentCategory,
  OCRCapabilities,
  OCRProviderConfig,
  OCROptions,
  OCRTableData,
  OCRFormData,
  EnhancedOCRResult,
  OCRProviderInfo,
  OCRBoundingBox
};

export interface OCRProviderInterface {
  readonly id: OCRProvider;
  readonly name: string;
  readonly capabilities: OCRCapabilities;
  
  isConfigured(): boolean;
  configure(config: Partial<OCRProviderConfig>): void;
  process(file: File, options?: OCROptions): Promise<EnhancedOCRResult>;
  processImage(imageData: Blob | HTMLCanvasElement | string, options?: OCROptions): Promise<EnhancedOCRResult>;
  getCostEstimate(pageCount: number): number;
}

export const PROVIDER_INFO: Record<OCRProvider, OCRProviderInfo> = {
  'tesseract': {
    id: 'tesseract',
    name: 'Tesseract.js',
    description: 'Client-side OCR engine. Free and works offline, but lower accuracy for complex documents.',
    capabilities: {
      printedTextAccuracy: 85,
      handwritingSupport: false,
      tableExtraction: false,
      multiColumnSupport: false,
      lowQualitySupport: false,
      formRecognition: false,
      clientSide: true
    },
    pricingInfo: 'Free - runs entirely in browser',
    recommendedFor: ['general'],
    setupRequired: []
  },
  'google-document-ai': {
    id: 'google-document-ai',
    name: 'Google Document AI',
    description: 'Enterprise-grade OCR with excellent accuracy, entity extraction, and form processing.',
    capabilities: {
      printedTextAccuracy: 98,
      handwritingSupport: true,
      tableExtraction: true,
      multiColumnSupport: true,
      lowQualitySupport: true,
      formRecognition: true,
      clientSide: false
    },
    pricingInfo: '$1.50/1K pages (OCR), $30/1K (extraction)',
    recommendedFor: ['general', 'deposition', 'form', 'handwritten-evidence'],
    setupRequired: ['Google Cloud Project', 'Document AI API enabled', 'Processor created', 'Service account key']
  },
  'aws-textract': {
    id: 'aws-textract',
    name: 'AWS Textract',
    description: 'Best for tables and forms. Excellent layout preservation and HIPAA eligible.',
    capabilities: {
      printedTextAccuracy: 98,
      handwritingSupport: true,
      tableExtraction: true,
      multiColumnSupport: true,
      lowQualitySupport: true,
      formRecognition: true,
      clientSide: false
    },
    pricingInfo: '$1.50/1K pages (text), $15/1K (forms), $50/1K (tables)',
    recommendedFor: ['financial-records', 'medical-records', 'table-heavy', 'form'],
    setupRequired: ['AWS Account', 'Textract permissions', 'Access key ID', 'Secret access key']
  },
  'azure-document-intelligence': {
    id: 'azure-document-intelligence',
    name: 'Azure Document Intelligence',
    description: 'Best for contracts with prebuilt models. Strong form and layout analysis.',
    capabilities: {
      printedTextAccuracy: 98,
      handwritingSupport: true,
      tableExtraction: true,
      multiColumnSupport: true,
      lowQualitySupport: true,
      formRecognition: true,
      clientSide: false
    },
    pricingInfo: '$1.50/1K pages',
    recommendedFor: ['contract', 'court-filing', 'deposition'],
    setupRequired: ['Azure Account', 'Document Intelligence resource', 'Endpoint URL', 'API key']
  },
  'mathpix': {
    id: 'mathpix',
    name: 'Mathpix',
    description: '99%+ accuracy on tables and handwriting. Best for complex documents.',
    capabilities: {
      printedTextAccuracy: 99,
      handwritingSupport: true,
      tableExtraction: true,
      multiColumnSupport: true,
      lowQualitySupport: true,
      formRecognition: false,
      clientSide: false
    },
    pricingInfo: '$0.005/page PDF, $0.002/image',
    recommendedFor: ['handwritten-evidence', 'table-heavy', 'financial-records'],
    setupRequired: ['Mathpix account', 'API key']
  }
};

export const DOCUMENT_CATEGORY_RECOMMENDATIONS: Record<LegalDocumentCategory, OCRProvider[]> = {
  'general': ['tesseract', 'google-document-ai'],
  'deposition': ['aws-textract', 'google-document-ai', 'azure-document-intelligence'],
  'contract': ['azure-document-intelligence', 'google-document-ai'],
  'court-filing': ['aws-textract', 'google-document-ai', 'azure-document-intelligence'],
  'financial-records': ['aws-textract', 'mathpix', 'google-document-ai'],
  'medical-records': ['aws-textract', 'azure-document-intelligence'],
  'handwritten-evidence': ['mathpix', 'aws-textract', 'google-document-ai'],
  'form': ['aws-textract', 'azure-document-intelligence', 'google-document-ai'],
  'table-heavy': ['aws-textract', 'mathpix', 'azure-document-intelligence']
};
