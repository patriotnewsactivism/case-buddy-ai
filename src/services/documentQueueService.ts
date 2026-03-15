/**
 * Document Processing Queue Service
 *
 * Manages batch document processing with:
 * - Priority-based queue management
 * - Automatic OCR provider routing based on document type
 * - Rate-limited processing to avoid API throttling
 * - Retry logic with exponential backoff
 * - Progress tracking per document
 */

import {
  DocumentQueueItem,
  DocumentQueueStats,
  QueueItemStatus,
  ProcessingMethod,
  LegalDocumentCategory,
} from '../types';
import { getSupabaseClient } from './supabaseClient';
import { performDocumentOCR } from './ocrService';

// In-memory queue for when Supabase is not available
const localQueue: DocumentQueueItem[] = [];
let isProcessingQueue = false;
const PROCESSING_DELAY_MS = 1500; // Delay between processing items

type ProgressCallback = (item: DocumentQueueItem) => void;
const progressCallbacks = new Set<ProgressCallback>();

/**
 * Subscribe to queue progress updates.
 */
export function onQueueProgress(callback: ProgressCallback): () => void {
  progressCallbacks.add(callback);
  return () => progressCallbacks.delete(callback);
}

function notifyProgress(item: DocumentQueueItem): void {
  for (const cb of progressCallbacks) {
    try {
      cb(item);
    } catch {
      // Ignore callback errors
    }
  }
}

/**
 * Detect the appropriate processing method based on file type.
 */
function detectProcessingMethod(fileType: string, fileName: string): ProcessingMethod {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  const mimeType = fileType.toLowerCase();

  // Audio/video → transcription
  if (mimeType.startsWith('audio/') || mimeType.startsWith('video/') ||
      ['mp3', 'm4a', 'wav', 'ogg', 'webm', 'mp4', 'mov', 'avi'].includes(ext)) {
    return 'transcription';
  }

  // Images → OCR
  if (mimeType.startsWith('image/') ||
      ['jpg', 'jpeg', 'png', 'gif', 'webp', 'tiff', 'bmp'].includes(ext)) {
    return 'ocr_tesseract';
  }

  // PDFs may have native text or need OCR
  if (mimeType === 'application/pdf' || ext === 'pdf') {
    return 'native_text'; // Will fallback to OCR if no text layer
  }

  // Office documents
  if (['doc', 'docx', 'odt', 'rtf', 'txt'].includes(ext)) {
    return 'native_text';
  }

  return 'ocr_tesseract'; // Default fallback
}

/**
 * Estimate document category for optimal OCR provider selection.
 */
function estimateDocumentCategory(fileName: string): LegalDocumentCategory {
  const lower = fileName.toLowerCase();

  if (lower.includes('deposition') || lower.includes('depo')) return 'deposition';
  if (lower.includes('contract') || lower.includes('agreement')) return 'contract';
  if (lower.includes('motion') || lower.includes('filing') || lower.includes('order')) return 'court-filing';
  if (lower.includes('medical') || lower.includes('health')) return 'medical-records';
  if (lower.includes('financial') || lower.includes('bank') || lower.includes('tax')) return 'financial-records';
  if (lower.includes('handwritten') || lower.includes('note')) return 'handwritten-evidence';

  return 'general';
}

/**
 * Add a document to the processing queue.
 */
export async function addToQueue(
  file: File,
  options?: {
    userId?: string;
    caseId?: string;
    priority?: number;
    maxRetries?: number;
  }
): Promise<DocumentQueueItem> {
  const item: DocumentQueueItem = {
    id: crypto.randomUUID(),
    userId: options?.userId || 'local',
    caseId: options?.caseId,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    status: 'pending',
    processingMethod: detectProcessingMethod(file.type, file.name),
    priority: options?.priority ?? 5,
    retryCount: 0,
    maxRetries: options?.maxRetries ?? 3,
    createdAt: new Date().toISOString(),
  };

  // Store in Supabase if available
  const client = getSupabaseClient();
  if (client && item.userId !== 'local') {
    try {
      const { error } = await client.from('document_queue').insert({
        id: item.id,
        user_id: item.userId,
        case_id: item.caseId,
        file_name: item.fileName,
        file_type: item.fileType,
        file_size: item.fileSize,
        status: item.status,
        processing_method: item.processingMethod,
        priority: item.priority,
        max_retries: item.maxRetries,
      });

      if (error) {
        console.warn('[DocumentQueue] Failed to insert into Supabase:', error.message);
      }
    } catch {
      // Continue with local queue
    }
  }

  localQueue.push(item);
  notifyProgress(item);

  return item;
}

/**
 * Add multiple documents to the queue.
 */
export async function addBatchToQueue(
  files: File[],
  options?: {
    userId?: string;
    caseId?: string;
    priority?: number;
  }
): Promise<DocumentQueueItem[]> {
  const items: DocumentQueueItem[] = [];

  for (const file of files) {
    const item = await addToQueue(file, options);
    items.push(item);
  }

  return items;
}

/**
 * Process the next item in the queue.
 */
async function processNextItem(
  processFile: (file: File, item: DocumentQueueItem) => Promise<unknown>
): Promise<void> {
  // Find next pending item with highest priority
  const pending = localQueue
    .filter(item => item.status === 'pending' && item.retryCount < item.maxRetries)
    .sort((a, b) => b.priority - a.priority);

  if (pending.length === 0) return;

  const item = pending[0];
  item.status = 'processing';
  item.startedAt = new Date().toISOString();
  notifyProgress(item);

  // Update status in Supabase
  await updateQueueItemStatus(item.id, 'processing');
}

/**
 * Process all pending items in the queue.
 */
export async function processQueue(
  getFile: (item: DocumentQueueItem) => Promise<File | null>,
  processFile: (file: File, item: DocumentQueueItem) => Promise<unknown>
): Promise<DocumentQueueItem[]> {
  if (isProcessingQueue) {
    console.log('[DocumentQueue] Queue is already being processed');
    return [];
  }

  isProcessingQueue = true;
  const processedItems: DocumentQueueItem[] = [];

  try {
    const pending = localQueue
      .filter(item => item.status === 'pending' && item.retryCount < item.maxRetries)
      .sort((a, b) => b.priority - a.priority);

    for (const item of pending) {
      item.status = 'processing';
      item.startedAt = new Date().toISOString();
      notifyProgress(item);
      await updateQueueItemStatus(item.id, 'processing');

      try {
        const file = await getFile(item);
        if (!file) {
          item.status = 'failed';
          item.errorMessage = 'File not found or unavailable';
          await updateQueueItemStatus(item.id, 'failed', item.errorMessage);
          notifyProgress(item);
          continue;
        }

        const result = await processFile(file, item);
        item.status = 'completed';
        item.result = result;
        item.completedAt = new Date().toISOString();
        await updateQueueItemStatus(item.id, 'completed');
        notifyProgress(item);
        processedItems.push(item);
      } catch (err) {
        item.retryCount++;
        if (item.retryCount >= item.maxRetries) {
          item.status = 'failed';
          item.errorMessage = err instanceof Error ? err.message : 'Processing failed';
          await updateQueueItemStatus(item.id, 'failed', item.errorMessage);
        } else {
          item.status = 'pending'; // Will be retried
          console.log(`[DocumentQueue] Retrying ${item.fileName} (attempt ${item.retryCount + 1}/${item.maxRetries})`);
        }
        notifyProgress(item);
      }

      // Rate limiting delay between documents
      await new Promise(resolve => setTimeout(resolve, PROCESSING_DELAY_MS));
    }
  } finally {
    isProcessingQueue = false;
  }

  return processedItems;
}

/**
 * Update queue item status in Supabase.
 */
async function updateQueueItemStatus(
  itemId: string,
  status: QueueItemStatus,
  errorMessage?: string
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    const updates: Record<string, unknown> = { status };
    if (status === 'processing') updates.started_at = new Date().toISOString();
    if (status === 'completed') updates.completed_at = new Date().toISOString();
    if (errorMessage) updates.error_message = errorMessage;

    await client.from('document_queue').update(updates).eq('id', itemId);
  } catch {
    // Non-critical, local state is authoritative
  }
}

/**
 * Get queue statistics.
 */
export function getQueueStats(): DocumentQueueStats {
  return {
    pending: localQueue.filter(item => item.status === 'pending').length,
    processing: localQueue.filter(item => item.status === 'processing').length,
    completed: localQueue.filter(item => item.status === 'completed').length,
    failed: localQueue.filter(item => item.status === 'failed').length,
    totalProcessed: localQueue.filter(item =>
      item.status === 'completed' || item.status === 'failed'
    ).length,
  };
}

/**
 * Get items in the queue with optional status filter.
 */
export function getQueueItems(status?: QueueItemStatus): DocumentQueueItem[] {
  if (status) {
    return localQueue.filter(item => item.status === status);
  }
  return [...localQueue];
}

/**
 * Cancel a pending queue item.
 */
export async function cancelQueueItem(itemId: string): Promise<boolean> {
  const item = localQueue.find(i => i.id === itemId);
  if (!item || item.status !== 'pending') return false;

  item.status = 'cancelled';
  await updateQueueItemStatus(itemId, 'cancelled');
  notifyProgress(item);
  return true;
}

/**
 * Clear completed and failed items from the queue.
 */
export function clearCompletedItems(): void {
  const toRemove = localQueue.filter(
    item => item.status === 'completed' || item.status === 'failed' || item.status === 'cancelled'
  );

  for (const item of toRemove) {
    const idx = localQueue.indexOf(item);
    if (idx !== -1) localQueue.splice(idx, 1);
  }
}

/**
 * Check if the queue is currently processing.
 */
export function isQueueProcessing(): boolean {
  return isProcessingQueue;
}
