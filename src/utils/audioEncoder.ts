import { Mp3Encoder } from '@breezystack/lamejs';
import { encodeWAV, convertStereoChannel } from './audioCore';

export type AudioExportFormat = 'wav' | 'mp3' | 'webm';
export type WavBitDepth = 16 | 24 | 32;
export type Mp3Bitrate = 128 | 192 | 320;
export type ExportChannelMode = 'keep' | 'mono' | 'stereo';

export interface ExportAudioOptions {
  format: AudioExportFormat;
  bitDepth?: WavBitDepth;
  bitrate?: Mp3Bitrate;
  channelMode?: ExportChannelMode;
  filename?: string;
}

/**
 * Encodes an AudioBuffer into universal MP3 format (128k, 192k, 320k)
 * 100% Client-Side in browser memory
 */
export function encodeMP3(audioBuffer: AudioBuffer, kbps: Mp3Bitrate = 192): Blob {
  const channels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const encoder = new Mp3Encoder(channels, sampleRate, kbps);

  const leftFloat = audioBuffer.getChannelData(0);
  const rightFloat = channels > 1 ? audioBuffer.getChannelData(1) : null;
  const sampleCount = audioBuffer.length;

  // Convert Float32Array [-1.0, 1.0] to Int16Array [-32768, 32767]
  const leftInt16 = new Int16Array(sampleCount);
  for (let i = 0; i < sampleCount; i++) {
    const s = Math.max(-1, Math.min(1, leftFloat[i]));
    leftInt16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }

  let rightInt16: Int16Array | null = null;
  if (channels > 1 && rightFloat) {
    rightInt16 = new Int16Array(sampleCount);
    for (let i = 0; i < sampleCount; i++) {
      const s = Math.max(-1, Math.min(1, rightFloat[i]));
      rightInt16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
  }

  const sampleBlockSize = 1152;
  const mp3Data: Uint8Array[] = [];

  for (let i = 0; i < sampleCount; i += sampleBlockSize) {
    const leftChunk = leftInt16.subarray(i, i + sampleBlockSize);
    let mp3buf: Uint8Array;
    if (channels === 2 && rightInt16) {
      const rightChunk = rightInt16.subarray(i, i + sampleBlockSize);
      mp3buf = encoder.encodeBuffer(leftChunk, rightChunk);
    } else {
      mp3buf = encoder.encodeBuffer(leftChunk);
    }
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }
  }

  const endBuf = encoder.flush();
  if (endBuf.length > 0) {
    mp3Data.push(endBuf);
  }

  return new Blob(mp3Data as unknown as BlobPart[], { type: 'audio/mp3' });
}

/**
 * Encodes an AudioBuffer into high-quality WebM Opus audio using browser AudioContext
 */
export async function encodeWebM(audioBuffer: AudioBuffer): Promise<Blob> {
  // If MediaRecorder is supported for WebM Opus
  if (typeof MediaRecorder !== 'undefined') {
    return new Promise((resolve, reject) => {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const dest = audioCtx.createMediaStreamDestination();
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(dest);

        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm';

        const recorder = new MediaRecorder(dest.stream, {
          mimeType,
          audioBitsPerSecond: 192000,
        });

        const chunks: Blob[] = [];
        recorder.ondataavailable = e => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
          audioCtx.close();
          resolve(new Blob(chunks, { type: mimeType }));
        };

        recorder.onerror = e => {
          audioCtx.close();
          reject(e);
        };

        recorder.start();
        source.start(0);

        source.onended = () => {
          setTimeout(() => {
            recorder.stop();
          }, 100);
        };
      } catch (err) {
        // Fallback to MP3 or WAV if real-time WebM recording fails
        try {
          const mp3Blob = encodeMP3(audioBuffer, 192);
          resolve(mp3Blob);
        } catch (e) {
          const wavBlob = encodeWAV(audioBuffer, 16);
          resolve(wavBlob);
        }
      }
    });
  } else {
    return encodeMP3(audioBuffer, 192);
  }
}

/**
 * Unified audio export master function
 */
export async function exportAudioBuffer(
  audioBuffer: AudioBuffer,
  options: ExportAudioOptions
): Promise<{ blob: Blob; filename: string; extension: string; sizeBytes: number }> {
  let processedBuffer = audioBuffer;

  // Apply channel mode if requested
  if (options.channelMode === 'mono' && audioBuffer.numberOfChannels > 1) {
    processedBuffer = convertStereoChannel(audioBuffer, 'mix');
  }

  let blob: Blob;
  let ext = 'wav';

  if (options.format === 'mp3') {
    blob = encodeMP3(processedBuffer, options.bitrate || 192);
    ext = 'mp3';
  } else if (options.format === 'webm') {
    blob = await encodeWebM(processedBuffer);
    ext = 'webm';
  } else {
    // Lossless WAV
    const depth = options.bitDepth || 16;
    blob = encodeWAV(processedBuffer, depth);
    ext = 'wav';
  }

  const baseName = options.filename?.replace(/\.[^/.]+$/, '').trim() || 'subwave_audio';
  const finalFilename = `${baseName}.${ext}`;

  return {
    blob,
    filename: finalFilename,
    extension: ext,
    sizeBytes: blob.size,
  };
}

/**
 * Estimate file size in MB based on audio duration and format settings
 */
export function estimateFileSizeMb(
  durationSec: number,
  sampleRate: number,
  channels: number,
  format: AudioExportFormat,
  bitDepth: WavBitDepth = 16,
  bitrate: Mp3Bitrate = 192
): string {
  if (durationSec <= 0) return '0.00';

  if (format === 'mp3') {
    // kbps -> bytes per second = (kbps * 1000) / 8
    const bytes = (bitrate * 1000 / 8) * durationSec;
    return (bytes / (1024 * 1024)).toFixed(2);
  }

  if (format === 'webm') {
    // WebM Opus ~192 kbps
    const bytes = (192 * 1000 / 8) * durationSec;
    return (bytes / (1024 * 1024)).toFixed(2);
  }

  // Lossless WAV: 44 bytes header + (duration * sampleRate * channels * bytesPerSample)
  const bytesPerSample = bitDepth / 8;
  const bytes = 44 + durationSec * sampleRate * channels * bytesPerSample;
  return (bytes / (1024 * 1024)).toFixed(2);
}
