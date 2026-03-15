import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

export const loadFFmpeg = async () => {
  if (ffmpeg) return ffmpeg;

  ffmpeg = new FFmpeg();
  
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  return ffmpeg;
};

/**
 * Extracts audio from a video file and converts it to WAV (16kHz, mono).
 */
export const extractAudio = async (videoFile: File, onProgress?: (progress: number) => void): Promise<Blob> => {
  const ffmpeg = await loadFFmpeg();
  
  const inputName = videoFile.name;
  const outputName = 'output.wav';

  if (onProgress) {
    ffmpeg.on('progress', ({ progress }) => {
      onProgress(Math.round(progress * 100));
    });
  }

  await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

  // Convert to WAV: 16kHz, Mono, PCM 16-bit
  await ffmpeg.exec([
    '-i', inputName,
    '-ar', '16000',
    '-ac', '1',
    '-c:a', 'pcm_s16le',
    outputName
  ]);

  const data = await ffmpeg.readFile(outputName);
  
  // Cleanup
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);

  return new Blob([data], { type: 'audio/wav' });
};

/**
 * Compresses an audio file to a smaller format (MP3) for faster upload.
 */
export const compressAudio = async (audioFile: File | Blob, onProgress?: (progress: number) => void): Promise<Blob> => {
  const ffmpeg = await loadFFmpeg();
  
  const inputName = 'input_audio';
  const outputName = 'compressed.mp3';

  if (onProgress) {
    ffmpeg.on('progress', ({ progress }) => {
      onProgress(Math.round(progress * 100));
    });
  }

  await ffmpeg.writeFile(inputName, await fetchFile(audioFile));

  // Convert to MP3: 64kbps (good enough for speech)
  await ffmpeg.exec([
    '-i', inputName,
    '-b:a', '64k',
    outputName
  ]);

  const data = await ffmpeg.readFile(outputName);
  
  // Cleanup
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);

  return new Blob([data], { type: 'audio/mp3' });
};
