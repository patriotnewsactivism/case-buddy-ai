import { TranscriptSegmentData } from '../types';

/**
 * Triggers a file download in the browser.
 */
export function downloadFile(data: string | Blob, filename: string, mimeType: string): void {
  const blob = typeof data === 'string' ? new Blob([data], { type: mimeType }) : data;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates a timestamped filename with the given prefix and extension.
 */
export function generateFilename(prefix: string, extension: string): string {
  const now = new Date();
  const timestamp = now
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .slice(0, 19);
  return `${prefix}_${timestamp}.${extension}`;
}

interface FormatOptions {
  includeTimestamps?: boolean;
  groupBySpeaker?: boolean;
}

/**
 * Formats transcript segments into a readable string, optionally with timestamps
 * and/or grouped by speaker.
 */
export function formatTranscriptWithSpeakers(
  segments: TranscriptSegmentData[],
  speakerMap: Record<string, string> = {},
  options: FormatOptions = {}
): string {
  const { includeTimestamps = false, groupBySpeaker = false } = options;

  const resolveSpeaker = (speaker: string) => speakerMap[speaker] || speaker;

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (groupBySpeaker) {
    const groups: { speaker: string; entries: { time: string; text: string }[] }[] = [];
    let currentSpeaker: string | null = null;

    for (const seg of segments) {
      const speaker = resolveSpeaker(seg.speaker);
      if (speaker !== currentSpeaker) {
        groups.push({ speaker, entries: [] });
        currentSpeaker = speaker;
      }
      const time = includeTimestamps ? formatTime(seg.start) : '';
      groups[groups.length - 1].entries.push({ time, text: seg.text });
    }

    return groups
      .map((group) => {
        const header = `[${group.speaker}]`;
        const lines = group.entries.map((e) =>
          e.time ? `  [${e.time}] ${e.text}` : `  ${e.text}`
        );
        return [header, ...lines].join('\n');
      })
      .join('\n\n');
  }

  return segments
    .map((seg) => {
      const speaker = resolveSpeaker(seg.speaker);
      const time = includeTimestamps ? `[${formatTime(seg.start)}] ` : '';
      return `${time}${speaker}: ${seg.text}`;
    })
    .join('\n');
}

interface LegalDocMetadata {
  filename?: string;
  recordingDate?: string;
  summary?: string;
}

/**
 * Opens a browser print dialog with a formatted legal document.
 */
export function printLegalDocument(
  text: string,
  title: string,
  segments: TranscriptSegmentData[],
  speakerMap: Record<string, string>,
  metadata: LegalDocMetadata = {}
): void {
  const formattedTranscript =
    segments && segments.length > 0
      ? formatTranscriptWithSpeakers(segments, speakerMap, { includeTimestamps: true })
      : text;

  const printDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; margin: 1in; color: #000; }
    h1 { text-align: center; font-size: 14pt; text-transform: uppercase; margin-bottom: 0.5em; }
    .meta { text-align: center; font-size: 10pt; color: #555; margin-bottom: 1em; border-bottom: 1px solid #000; padding-bottom: 0.5em; }
    .summary { background: #f9f9f9; border-left: 3px solid #333; padding: 0.5em 1em; margin-bottom: 1em; font-size: 11pt; }
    pre { white-space: pre-wrap; word-wrap: break-word; font-family: inherit; font-size: 11pt; line-height: 1.6; }
    @media print { body { margin: 0.75in; } }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="meta">
    ${metadata.filename ? `File: ${metadata.filename}<br/>` : ''}
    ${metadata.recordingDate ? `Recording Date: ${metadata.recordingDate}<br/>` : ''}
    Printed: ${printDate}
  </div>
  ${metadata.summary ? `<div class="summary"><strong>Summary:</strong> ${metadata.summary}</div>` : ''}
  <pre>${formattedTranscript}</pre>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  }
}

interface FileMetadata {
  size: string;
  type: string;
  lastModified: string;
}

/**
 * Returns human-readable metadata for a File object.
 */
export function getFileMetadata(file: File): FileMetadata {
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return {
    size: formatSize(file.size),
    type: file.type || 'unknown',
    lastModified: new Date(file.lastModified).toLocaleDateString(),
  };
}

/**
 * Attempts to extract a date from a filename string.
 * Returns { date: string | null }.
 */
export function extractDateFromFilename(filename: string): { date: string | null } {
  // Match common date patterns: YYYY-MM-DD, YYYYMMDD, MM-DD-YYYY, etc.
  const patterns = [
    /(\d{4}[-_]\d{2}[-_]\d{2})/,
    /(\d{2}[-_]\d{2}[-_]\d{4})/,
    /(\d{8})/,
  ];

  for (const pattern of patterns) {
    const match = filename.match(pattern);
    if (match) {
      return { date: match[1] };
    }
  }

  return { date: null };
}
