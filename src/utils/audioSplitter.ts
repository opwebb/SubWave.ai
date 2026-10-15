import JSZip from 'jszip';
import { SplitMarker, SplitResultTrack } from '../types/audio';
import { sliceAudioBuffer, encodeWAV } from './audioCore';
import { encodeMP3 } from './audioEncoder';
import { SilenceAnalysisResult } from './silenceDetector';

/**
 * Splits an AudioBuffer at silence gaps into separate speech tracks
 */
export function splitBySilence(
  source: AudioBuffer,
  silenceAnalysis: SilenceAnalysisResult,
  baseName: string = 'track',
  format: 'wav' | 'mp3' = 'wav'
): SplitResultTrack[] {
  const { speechSegments } = silenceAnalysis;
  const tracks: SplitResultTrack[] = [];
  const ext = format === 'mp3' ? 'mp3' : 'wav';

  speechSegments.forEach((segment, idx) => {
    const buffer = sliceAudioBuffer(source, segment.start, segment.end);
    const blob = format === 'mp3' ? encodeMP3(buffer, 192) : encodeWAV(buffer, 16);
    const index = idx + 1;
    tracks.push({
      id: segment.id,
      index,
      name: `${baseName}_part_${index.toString().padStart(2, '0')}.${ext}`,
      start: segment.start,
      end: segment.end,
      duration: segment.duration,
      buffer,
      blob,
    });
  });

  return tracks;
}

/**
 * Splits an AudioBuffer into equal duration chunks (e.g. every 60 seconds)
 */
export function splitByEqualDuration(
  source: AudioBuffer,
  chunkDurationSec: number,
  baseName: string = 'track',
  format: 'wav' | 'mp3' = 'wav'
): SplitResultTrack[] {
  const totalDuration = source.duration;
  const safeChunk = Math.max(1, chunkDurationSec);
  const tracks: SplitResultTrack[] = [];
  const ext = format === 'mp3' ? 'mp3' : 'wav';

  let cursor = 0;
  let index = 1;

  while (cursor < totalDuration) {
    const end = Math.min(totalDuration, cursor + safeChunk);
    const buffer = sliceAudioBuffer(source, cursor, end);
    const blob = format === 'mp3' ? encodeMP3(buffer, 192) : encodeWAV(buffer, 16);

    tracks.push({
      id: `chunk-${index}`,
      index,
      name: `${baseName}_part_${index.toString().padStart(2, '0')}.${ext}`,
      start: cursor,
      end,
      duration: end - cursor,
      buffer,
      blob,
    });

    cursor = end;
    index++;
  }

  return tracks;
}

/**
 * Splits an AudioBuffer based on user-placed cue markers
 */
export function splitByMarkers(
  source: AudioBuffer,
  markers: SplitMarker[],
  baseName: string = 'track',
  format: 'wav' | 'mp3' = 'wav'
): SplitResultTrack[] {
  const sorted = [...markers].sort((a, b) => a.time - b.time);
  const totalDuration = source.duration;
  const tracks: SplitResultTrack[] = [];
  const ext = format === 'mp3' ? 'mp3' : 'wav';

  // Add boundary points: 0 and totalDuration
  const cutPoints: number[] = [0];
  for (const m of sorted) {
    if (m.time > 0.05 && m.time < totalDuration - 0.05) {
      cutPoints.push(m.time);
    }
  }
  cutPoints.push(totalDuration);

  for (let i = 0; i < cutPoints.length - 1; i++) {
    const start = cutPoints[i];
    const end = cutPoints[i + 1];
    const index = i + 1;
    const buffer = sliceAudioBuffer(source, start, end);
    const blob = format === 'mp3' ? encodeMP3(buffer, 192) : encodeWAV(buffer, 16);

    const markerLabel = sorted[i - 1]?.label;
    const name = markerLabel
      ? `${baseName}_${markerLabel.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`
      : `${baseName}_part_${index.toString().padStart(2, '0')}.${ext}`;

    tracks.push({
      id: `marker-track-${index}`,
      index,
      name,
      start,
      end,
      duration: end - start,
      buffer,
      blob,
    });
  }

  return tracks;
}

/**
 * Creates a downloadable ZIP archive containing all split audio tracks
 */
export async function createZipOfTracks(
  tracks: SplitResultTrack[],
  _zipFilename: string = 'audio_split_tracks.zip'
): Promise<Blob> {
  const zip = new JSZip();

  tracks.forEach(track => {
    if (track.blob) {
      zip.file(track.name, track.blob);
    } else {
      const blob = encodeWAV(track.buffer, 16);
      zip.file(track.name, blob);
    }
  });

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Triggers a direct browser file download
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
