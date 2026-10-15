import { AudioSegment, SilenceDetectionConfig } from '../types/audio';
import { createAudioBuffer, cloneAudioBuffer } from './audioCore';

export interface SilenceAnalysisResult {
  speechSegments: AudioSegment[];
  silentSegments: AudioSegment[];
  totalOriginalDuration: number;
  totalSilenceDuration: number;
  silencePercentage: number;
}

/**
 * Analyzes an AudioBuffer to find speech and silent intervals based on dB threshold and durations
 */
export function analyzeSilence(
  buffer: AudioBuffer,
  config: SilenceDetectionConfig
): SilenceAnalysisResult {
  const sampleRate = buffer.sampleRate;
  const numChannels = buffer.numberOfChannels;
  const totalDuration = buffer.duration;

  // Window size: 25ms (e.g. 1102 samples at 44.1kHz or 1200 at 48kHz)
  const windowSize = Math.max(128, Math.floor(sampleRate * 0.025));
  const stepSize = Math.max(64, Math.floor(windowSize / 2)); // 50% overlap for smooth detection
  const numSteps = Math.floor((buffer.length - windowSize) / stepSize);

  // Compute max RMS energy across all channels per window
  const channelsData: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channelsData.push(buffer.getChannelData(ch));
  }

  // Precompute linear threshold from dB
  // e.g. -35 dB -> 10^(-35/20) = 0.01778
  const linearThreshold = Math.pow(10, config.thresholdDb / 20);

  const isSilentArray = new Uint8Array(numSteps);

  for (let s = 0; s < numSteps; s++) {
    const offset = s * stepSize;
    let maxRms = 0;

    for (let ch = 0; ch < numChannels; ch++) {
      const data = channelsData[ch];
      let sumSquares = 0;
      for (let i = 0; i < windowSize; i++) {
        const val = data[offset + i];
        sumSquares += val * val;
      }
      const rms = Math.sqrt(sumSquares / windowSize);
      if (rms > maxRms) maxRms = rms;
    }

    isSilentArray[s] = maxRms < linearThreshold ? 1 : 0;
  }

  // Group into raw silent and active segments
  interface RawInterval {
    isSilent: boolean;
    startSec: number;
    endSec: number;
  }

  const rawIntervals: RawInterval[] = [];
  let currentIsSilent = isSilentArray[0] === 1;
  let currentStart = 0;

  for (let s = 1; s < numSteps; s++) {
    const isSil = isSilentArray[s] === 1;
    if (isSil !== currentIsSilent) {
      const time = (s * stepSize) / sampleRate;
      rawIntervals.push({
        isSilent: currentIsSilent,
        startSec: currentStart,
        endSec: time,
      });
      currentIsSilent = isSil;
      currentStart = time;
    }
  }
  rawIntervals.push({
    isSilent: currentIsSilent,
    startSec: currentStart,
    endSec: totalDuration,
  });

  // Filter raw intervals:
  // 1. Silent intervals shorter than minSilenceDuration are converted to active speech
  // 2. Active intervals shorter than minSpeechDuration surrounded by silence are converted to silence
  let refinedIntervals = rawIntervals.map(inv => ({ ...inv }));

  // First pass: eliminate short silence bursts (e.g. stop consonants like 'p', 't', 'k')
  for (let i = 0; i < refinedIntervals.length; i++) {
    const inv = refinedIntervals[i];
    const duration = inv.endSec - inv.startSec;
    if (inv.isSilent && duration < config.minSilenceDuration) {
      inv.isSilent = false;
    }
  }

  // Merge contiguous intervals with the same state
  const merged: RawInterval[] = [];
  for (const inv of refinedIntervals) {
    if (merged.length > 0 && merged[merged.length - 1].isSilent === inv.isSilent) {
      merged[merged.length - 1].endSec = inv.endSec;
    } else {
      merged.push({ ...inv });
    }
  }

  // Second pass: eliminate micro-noise blips in speech
  for (let i = 0; i < merged.length; i++) {
    const inv = merged[i];
    const duration = inv.endSec - inv.startSec;
    if (!inv.isSilent && duration < config.minSpeechDuration) {
      inv.isSilent = true;
    }
  }

  // Re-merge
  const finalIntervals: RawInterval[] = [];
  for (const inv of merged) {
    if (finalIntervals.length > 0 && finalIntervals[finalIntervals.length - 1].isSilent === inv.isSilent) {
      finalIntervals[finalIntervals.length - 1].endSec = inv.endSec;
    } else {
      finalIntervals.push({ ...inv });
    }
  }

  // Apply speech padding (boundary safety margin so words aren't truncated)
  const padding = config.paddingDuration;
  const speechSegments: AudioSegment[] = [];
  const silentSegments: AudioSegment[] = [];

  let speechIdx = 1;
  let silenceIdx = 1;

  for (let i = 0; i < finalIntervals.length; i++) {
    const inv = finalIntervals[i];
    if (!inv.isSilent) {
      // Expand speech start and end by padding
      const start = Math.max(0, inv.startSec - padding);
      const end = Math.min(totalDuration, inv.endSec + padding);
      
      // If previous speech overlaps, merge
      if (speechSegments.length > 0 && speechSegments[speechSegments.length - 1].end >= start) {
        speechSegments[speechSegments.length - 1].end = Math.max(speechSegments[speechSegments.length - 1].end, end);
        speechSegments[speechSegments.length - 1].duration = speechSegments[speechSegments.length - 1].end - speechSegments[speechSegments.length - 1].start;
      } else {
        speechSegments.push({
          id: `speech-${speechIdx++}`,
          start,
          end,
          duration: end - start,
          label: `Speech Take ${speechIdx - 1}`
        });
      }
    }
  }

  // If no speech found, treat entire audio as 1 speech segment to avoid blank output
  if (speechSegments.length === 0) {
    speechSegments.push({
      id: 'speech-1',
      start: 0,
      end: totalDuration,
      duration: totalDuration,
      label: 'Full Audio'
    });
  }

  // Derive final silent segments from speech gaps
  let cursor = 0;
  for (const sp of speechSegments) {
    if (sp.start > cursor + 0.05) {
      silentSegments.push({
        id: `silence-${silenceIdx++}`,
        start: cursor,
        end: sp.start,
        duration: sp.start - cursor,
        label: `Silence ${silenceIdx - 1}`
      });
    }
    cursor = sp.end;
  }
  if (cursor < totalDuration - 0.05) {
    silentSegments.push({
      id: `silence-${silenceIdx++}`,
      start: cursor,
      end: totalDuration,
      duration: totalDuration - cursor,
      label: `Silence ${silenceIdx - 1}`
    });
  }

  const totalSilenceDuration = silentSegments.reduce((acc, s) => acc + s.duration, 0);
  const silencePercentage = totalDuration > 0 ? (totalSilenceDuration / totalDuration) * 100 : 0;

  return {
    speechSegments,
    silentSegments,
    totalOriginalDuration: totalDuration,
    totalSilenceDuration,
    silencePercentage,
  };
}

/**
 * Executes Silence Removal / Compression with click-free crossfades
 */
export function processSilenceRemoval(
  source: AudioBuffer,
  analysis: SilenceAnalysisResult,
  mode: 'strip' | 'shorten',
  shortenPauseDuration: number = 0.25
): AudioBuffer {
  const { speechSegments } = analysis;
  if (speechSegments.length === 0) {
    return cloneAudioBuffer(source);
  }

  const sampleRate = source.sampleRate;
  const numChannels = source.numberOfChannels;
  const crossfadeSamples = Math.min(256, Math.floor(sampleRate * 0.005)); // 5ms smooth crossfade

  if (mode === 'strip') {
    // Calculate total output length
    let totalSamples = 0;
    for (const sp of speechSegments) {
      const spSamples = Math.floor((sp.end - sp.start) * sampleRate);
      totalSamples += spSamples;
    }

    if (totalSamples <= 0) return cloneAudioBuffer(source);

    const outBuffer = createAudioBuffer(numChannels, totalSamples, sampleRate);

    for (let ch = 0; ch < numChannels; ch++) {
      const srcData = source.getChannelData(ch);
      const outData = outBuffer.getChannelData(ch);
      let outCursor = 0;

      for (let sIdx = 0; sIdx < speechSegments.length; sIdx++) {
        const sp = speechSegments[sIdx];
        const startSample = Math.floor(sp.start * sampleRate);
        const endSample = Math.min(source.length, Math.floor(sp.end * sampleRate));
        const segLen = endSample - startSample;

        for (let i = 0; i < segLen && (outCursor + i) < totalSamples; i++) {
          let sample = srcData[startSample + i];

          // Apply micro-fade in at beginning of segment
          if (i < crossfadeSamples && sIdx > 0) {
            sample *= (i / crossfadeSamples);
          }
          // Apply micro-fade out at end of segment
          else if (i > segLen - crossfadeSamples && sIdx < speechSegments.length - 1) {
            sample *= ((segLen - i) / crossfadeSamples);
          }

          outData[outCursor + i] = sample;
        }

        outCursor += segLen;
      }
    }

    return outBuffer;
  }

  // Mode: 'shorten' (keep natural breath pauses but clamped to shortenPauseDuration)
  const pauseSamples = Math.floor(shortenPauseDuration * sampleRate);
  let totalLength = 0;
  for (let i = 0; i < speechSegments.length; i++) {
    const sp = speechSegments[i];
    totalLength += Math.floor((sp.end - sp.start) * sampleRate);
    if (i < speechSegments.length - 1) {
      totalLength += pauseSamples;
    }
  }

  const outBuffer = createAudioBuffer(numChannels, Math.max(1, totalLength), sampleRate);

  for (let ch = 0; ch < numChannels; ch++) {
    const srcData = source.getChannelData(ch);
    const outData = outBuffer.getChannelData(ch);
    let outCursor = 0;

    for (let sIdx = 0; sIdx < speechSegments.length; sIdx++) {
      const sp = speechSegments[sIdx];
      const startSample = Math.floor(sp.start * sampleRate);
      const endSample = Math.min(source.length, Math.floor(sp.end * sampleRate));
      const segLen = endSample - startSample;

      for (let i = 0; i < segLen && (outCursor + i) < totalLength; i++) {
        let sample = srcData[startSample + i];
        if (i < crossfadeSamples && sIdx > 0) {
          sample *= (i / crossfadeSamples);
        } else if (i > segLen - crossfadeSamples && sIdx < speechSegments.length - 1) {
          sample *= ((segLen - i) / crossfadeSamples);
        }
        outData[outCursor + i] = sample;
      }
      outCursor += segLen;

      // Add quiet compressed pause if not the last segment
      if (sIdx < speechSegments.length - 1) {
        // Find natural silence in original audio to keep room tone, or low-level ambience
        const origNextStart = Math.floor(speechSegments[sIdx + 1].start * sampleRate);
        const origPauseLen = origNextStart - endSample;

        for (let p = 0; p < pauseSamples && (outCursor + p) < totalLength; p++) {
          if (origPauseLen > 0 && endSample + (p % origPauseLen) < source.length) {
            // Replicate low room tone gently attenuated
            outData[outCursor + p] = srcData[endSample + (p % origPauseLen)] * 0.3;
          } else {
            outData[outCursor + p] = 0;
          }
        }
        outCursor += pauseSamples;
      }
    }
  }

  return outBuffer;
}
