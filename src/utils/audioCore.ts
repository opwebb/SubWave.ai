/**
 * Core Web Audio API operations, PCM manipulation, and WAV encoder
 * 100% Client-Side - Zero server calls
 */

let sharedAudioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume();
  }
  return sharedAudioCtx;
}

/**
 * Decodes any audio file format supported by the browser (MP3, WAV, AAC, M4A, OGG, WebM, FLAC)
 */
export async function decodeAudioFile(file: File | Blob): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer();
  const ctx = getAudioContext();
  // decodeAudioData detaches the arrayBuffer, so we clone if needed
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
  return audioBuffer;
}

/**
 * Creates a new empty AudioBuffer
 */
export function createAudioBuffer(channels: number, length: number, sampleRate: number): AudioBuffer {
  const ctx = getAudioContext();
  return ctx.createBuffer(Math.max(1, channels), Math.max(1, length), sampleRate);
}

/**
 * Clones an existing AudioBuffer completely
 */
export function cloneAudioBuffer(source: AudioBuffer): AudioBuffer {
  const clone = createAudioBuffer(source.numberOfChannels, source.length, source.sampleRate);
  for (let ch = 0; ch < source.numberOfChannels; ch++) {
    clone.copyToChannel(source.getChannelData(ch), ch);
  }
  return clone;
}

/**
 * Slices an AudioBuffer from startSec to endSec
 */
export function sliceAudioBuffer(source: AudioBuffer, startSec: number, endSec: number): AudioBuffer {
  const startSample = Math.max(0, Math.floor(startSec * source.sampleRate));
  const endSample = Math.min(source.length, Math.floor(endSec * source.sampleRate));
  const newLength = Math.max(1, endSample - startSample);

  const sliced = createAudioBuffer(source.numberOfChannels, newLength, source.sampleRate);
  for (let ch = 0; ch < source.numberOfChannels; ch++) {
    const srcData = source.getChannelData(ch);
    const subData = srcData.subarray(startSample, endSample);
    sliced.copyToChannel(subData, ch);
  }
  return sliced;
}

/**
 * Cuts a range [startSec, endSec] out of the buffer, returning the cut portion and the remainder
 */
export function cutAudioBuffer(source: AudioBuffer, startSec: number, endSec: number): {
  cut: AudioBuffer;
  remainder: AudioBuffer;
} {
  const startSample = Math.max(0, Math.floor(startSec * source.sampleRate));
  const endSample = Math.min(source.length, Math.floor(endSec * source.sampleRate));
  const cutLength = Math.max(1, endSample - startSample);
  const remLength = Math.max(1, source.length - cutLength);

  const cut = createAudioBuffer(source.numberOfChannels, cutLength, source.sampleRate);
  const remainder = createAudioBuffer(source.numberOfChannels, remLength, source.sampleRate);

  for (let ch = 0; ch < source.numberOfChannels; ch++) {
    const src = source.getChannelData(ch);
    cut.copyToChannel(src.subarray(startSample, endSample), ch);

    const remChannel = remainder.getChannelData(ch);
    remChannel.set(src.subarray(0, startSample), 0);
    remChannel.set(src.subarray(endSample), startSample);
  }

  return { cut, remainder };
}

/**
 * Inserts audioBuffer into target at given position
 */
export function insertAudioBuffer(target: AudioBuffer, insert: AudioBuffer, atSec: number): AudioBuffer {
  const insertSample = Math.max(0, Math.min(target.length, Math.floor(atSec * target.sampleRate)));
  const totalLength = target.length + insert.length;
  const numChannels = Math.max(target.numberOfChannels, insert.numberOfChannels);

  const result = createAudioBuffer(numChannels, totalLength, target.sampleRate);

  for (let ch = 0; ch < numChannels; ch++) {
    const resCh = result.getChannelData(ch);
    const tgtCh = target.numberOfChannels > ch ? target.getChannelData(ch) : target.getChannelData(0);
    const insCh = insert.numberOfChannels > ch ? insert.getChannelData(ch) : insert.getChannelData(0);

    // Copy before insert
    resCh.set(tgtCh.subarray(0, insertSample), 0);
    // Copy inserted audio
    resCh.set(insCh, insertSample);
    // Copy after insert
    resCh.set(tgtCh.subarray(insertSample), insertSample + insert.length);
  }

  return result;
}

/**
 * Silences a time range in place
 */
export function silenceAudioRange(source: AudioBuffer, startSec: number, endSec: number): AudioBuffer {
  const clone = cloneAudioBuffer(source);
  const startSample = Math.max(0, Math.floor(startSec * source.sampleRate));
  const endSample = Math.min(source.length, Math.floor(endSec * source.sampleRate));

  for (let ch = 0; ch < clone.numberOfChannels; ch++) {
    const data = clone.getChannelData(ch);
    for (let i = startSample; i < endSample; i++) {
      data[i] = 0;
    }
  }
  return clone;
}

/**
 * Normalizes audio to target peak dB (default: -0.1 dB)
 */
export function normalizeAudioBuffer(source: AudioBuffer, targetPeakDb: number = -0.1): {
  buffer: AudioBuffer;
  currentPeakDb: number;
  gainAppliedDb: number;
} {
  let maxAbs = 0;
  for (let ch = 0; ch < source.numberOfChannels; ch++) {
    const data = source.getChannelData(ch);
    for (let i = 0; i < data.length; i++) {
      const abs = Math.abs(data[i]);
      if (abs > maxAbs) maxAbs = abs;
    }
  }

  const currentPeakDb = maxAbs > 0 ? 20 * Math.log10(maxAbs) : -100;
  if (maxAbs === 0) {
    return { buffer: cloneAudioBuffer(source), currentPeakDb: -100, gainAppliedDb: 0 };
  }

  const targetLinear = Math.pow(10, targetPeakDb / 20);
  const multiplier = targetLinear / maxAbs;
  const gainAppliedDb = 20 * Math.log10(multiplier);

  const clone = cloneAudioBuffer(source);
  for (let ch = 0; ch < clone.numberOfChannels; ch++) {
    const data = clone.getChannelData(ch);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.max(-1, Math.min(1, data[i] * multiplier));
    }
  }

  return { buffer: clone, currentPeakDb, gainAppliedDb };
}

/**
 * Applies gain (volume multiplier or dB) to buffer, optionally constrained to a range
 */
export function applyGainToBuffer(
  source: AudioBuffer,
  gainMultiplier: number,
  range?: { start: number; end: number }
): AudioBuffer {
  const clone = cloneAudioBuffer(source);
  const startSample = range ? Math.max(0, Math.floor(range.start * source.sampleRate)) : 0;
  const endSample = range ? Math.min(source.length, Math.floor(range.end * source.sampleRate)) : source.length;

  for (let ch = 0; ch < clone.numberOfChannels; ch++) {
    const data = clone.getChannelData(ch);
    for (let i = startSample; i < endSample; i++) {
      data[i] = Math.max(-1, Math.min(1, data[i] * gainMultiplier));
    }
  }
  return clone;
}

/**
 * Applies linear or exponential fade in / out
 */
export function applyFadeToBuffer(
  source: AudioBuffer,
  type: 'in' | 'out',
  startSec: number,
  endSec: number
): AudioBuffer {
  const clone = cloneAudioBuffer(source);
  const startSample = Math.max(0, Math.floor(startSec * source.sampleRate));
  const endSample = Math.min(source.length, Math.floor(endSec * source.sampleRate));
  const fadeLength = Math.max(1, endSample - startSample);

  for (let ch = 0; ch < clone.numberOfChannels; ch++) {
    const data = clone.getChannelData(ch);
    for (let i = 0; i < fadeLength; i++) {
      const idx = startSample + i;
      const progress = i / fadeLength;
      // Smooth cosine fade for natural audio transition
      const gain = type === 'in' 
        ? 0.5 * (1 - Math.cos(Math.PI * progress))
        : 0.5 * (1 + Math.cos(Math.PI * progress));
      data[idx] *= gain;
    }
  }
  return clone;
}

/**
 * Reverses audio buffer in specified range
 */
export function reverseAudioBuffer(source: AudioBuffer, range?: { start: number; end: number }): AudioBuffer {
  const clone = cloneAudioBuffer(source);
  const startSample = range ? Math.max(0, Math.floor(range.start * source.sampleRate)) : 0;
  const endSample = range ? Math.min(source.length, Math.floor(range.end * source.sampleRate)) : source.length;

  for (let ch = 0; ch < clone.numberOfChannels; ch++) {
    const data = clone.getChannelData(ch);
    const sub = data.slice(startSample, endSample);
    sub.reverse();
    data.set(sub, startSample);
  }
  return clone;
}

/**
 * Stereo to Mono / Channel Operations
 */
export function convertStereoChannel(
  source: AudioBuffer,
  mode: 'mix' | 'left' | 'right' | 'swap' | 'invert-phase'
): AudioBuffer {
  if (source.numberOfChannels === 1 && (mode === 'mix' || mode === 'left' || mode === 'right')) {
    return cloneAudioBuffer(source);
  }

  const sampleRate = source.sampleRate;
  const length = source.length;

  if (mode === 'mix') {
    // 1-channel mono mix: (Left + Right) / 2
    const mono = createAudioBuffer(1, length, sampleRate);
    const monoData = mono.getChannelData(0);
    const left = source.getChannelData(0);
    const right = source.numberOfChannels > 1 ? source.getChannelData(1) : left;

    for (let i = 0; i < length; i++) {
      monoData[i] = (left[i] + right[i]) * 0.5;
    }
    return mono;
  }

  if (mode === 'left') {
    // 1-channel mono from Left
    const mono = createAudioBuffer(1, length, sampleRate);
    mono.copyToChannel(source.getChannelData(0), 0);
    return mono;
  }

  if (mode === 'right') {
    // 1-channel mono from Right
    const mono = createAudioBuffer(1, length, sampleRate);
    const right = source.numberOfChannels > 1 ? source.getChannelData(1) : source.getChannelData(0);
    mono.copyToChannel(right, 0);
    return mono;
  }

  if (mode === 'swap') {
    // Swap Left and Right
    const stereo = createAudioBuffer(2, length, sampleRate);
    const left = source.getChannelData(0);
    const right = source.numberOfChannels > 1 ? source.getChannelData(1) : left;
    stereo.copyToChannel(right, 0);
    stereo.copyToChannel(left, 1);
    return stereo;
  }

  if (mode === 'invert-phase') {
    // Invert phase on Right channel (useful for phase cancellation / stereo checks)
    const stereo = createAudioBuffer(2, length, sampleRate);
    const left = source.getChannelData(0);
    const right = source.numberOfChannels > 1 ? source.getChannelData(1) : left;
    stereo.copyToChannel(left, 0);
    const invRight = new Float32Array(length);
    for (let i = 0; i < length; i++) {
      invRight[i] = -right[i];
    }
    stereo.copyToChannel(invRight, 1);
    return stereo;
  }

  return cloneAudioBuffer(source);
}

/**
 * Stereo Pan & Width adjustment
 * pan: -1 (full left) to +1 (full right)
 * width: 0 (mono) to 2 (extra wide)
 */
export function adjustStereoImage(source: AudioBuffer, pan: number = 0, width: number = 1): AudioBuffer {
  const result = createAudioBuffer(2, source.length, source.sampleRate);
  const left = source.getChannelData(0);
  const right = source.numberOfChannels > 1 ? source.getChannelData(1) : left;

  const outL = result.getChannelData(0);
  const outR = result.getChannelData(1);

  // Pan gain coefficients (equal power)
  const panAngle = ((pan + 1) * Math.PI) / 4; // 0 to PI/2
  const gainL = Math.cos(panAngle) * Math.SQRT2;
  const gainR = Math.sin(panAngle) * Math.SQRT2;

  for (let i = 0; i < source.length; i++) {
    const l = left[i];
    const r = right[i];

    // Mid/Side matrix
    const mid = (l + r) * 0.5;
    const side = (l - r) * 0.5;

    // Width scale
    const wideL = mid + side * width;
    const wideR = mid - side * width;

    // Apply pan
    outL[i] = Math.max(-1, Math.min(1, wideL * gainL));
    outR[i] = Math.max(-1, Math.min(1, wideR * gainR));
  }

  return result;
}

/**
 * Changes playback speed / tempo using OfflineAudioContext playbackRate
 */
export async function changeSpeedOffline(source: AudioBuffer, speedMultiplier: number): Promise<AudioBuffer> {
  if (Math.abs(speedMultiplier - 1.0) < 0.001) {
    return cloneAudioBuffer(source);
  }

  const newLength = Math.max(1, Math.round(source.length / speedMultiplier));
  const offlineCtx = new OfflineAudioContext(
    source.numberOfChannels,
    newLength,
    source.sampleRate
  );

  const bufferSource = offlineCtx.createBufferSource();
  bufferSource.buffer = source;
  bufferSource.playbackRate.value = speedMultiplier;

  bufferSource.connect(offlineCtx.destination);
  bufferSource.start(0);

  return await offlineCtx.startRendering();
}

/**
 * Pure Client-Side WAV Encoder (16-bit PCM, 24-bit PCM, or 32-bit Float)
 * Conforms to standard RIFF/WAVE specifications
 */
export function encodeWAV(audioBuffer: AudioBuffer, bitDepth: 16 | 24 | 32 = 16): Blob {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const numSamples = audioBuffer.length;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const bufferSize = 44 + dataSize;

  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  // Helper to write ASCII strings
  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  // RIFF Chunk Descriptor
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true); // ChunkSize
  writeString(8, 'WAVE');

  // "fmt " Sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, bitDepth === 32 ? 3 : 1, true); // AudioFormat: 1 for PCM, 3 for IEEE Float
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, byteRate, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, bitDepth, true); // BitsPerSample

  // "data" Sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true); // Subchunk2Size

  // Write PCM audio data
  const channels: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channels.push(audioBuffer.getChannelData(ch));
  }

  let offset = 44;
  if (bitDepth === 16) {
    for (let i = 0; i < numSamples; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        let sample = channels[ch][i];
        // Clip sample between -1 and 1
        sample = Math.max(-1, Math.min(1, sample));
        // Scale to 16-bit signed integer (-32768 to 32767)
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }
  } else if (bitDepth === 24) {
    for (let i = 0; i < numSamples; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        let sample = channels[ch][i];
        sample = Math.max(-1, Math.min(1, sample));
        const intSample = Math.floor(sample < 0 ? sample * 0x800000 : sample * 0x7fffff);
        view.setUint8(offset, intSample & 0xff);
        view.setUint8(offset + 1, (intSample >> 8) & 0xff);
        view.setUint8(offset + 2, (intSample >> 16) & 0xff);
        offset += 3;
      }
    }
  } else if (bitDepth === 32) {
    for (let i = 0; i < numSamples; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        view.setFloat32(offset, channels[ch][i], true);
        offset += 4;
      }
    }
  }

  return new Blob([view], { type: 'audio/wav' });
}

/**
 * Format time in seconds to mm:ss.ms
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00.00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}
