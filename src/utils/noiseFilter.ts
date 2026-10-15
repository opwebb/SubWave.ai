import { DenoiseConfig } from '../types/audio';
import { cloneAudioBuffer } from './audioCore';

/**
 * Applies studio-grade audio cleanup, filtering, and noise gating using OfflineAudioContext & Float32 DSP
 */
export async function applyDenoiseFilters(
  source: AudioBuffer,
  config: DenoiseConfig
): Promise<AudioBuffer> {
  const sampleRate = source.sampleRate;
  const numChannels = source.numberOfChannels;
  const length = source.length;

  // Use OfflineAudioContext for hardware-accelerated biquad filtering
  const offlineCtx = new OfflineAudioContext(numChannels, length, sampleRate);
  const sourceNode = offlineCtx.createBufferSource();
  sourceNode.buffer = source;

  let currentNode: AudioNode = sourceNode;

  // 1. High-Pass Filter (Rumble, Wind, Sub-bass noise)
  if (config.enableHighPass && config.highPassFreq > 20) {
    const highpass = offlineCtx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = config.highPassFreq;
    highpass.Q.value = 0.707; // Butterworth response
    currentNode.connect(highpass);
    currentNode = highpass;
  }

  // 2. Low-Pass Filter (High frequency hiss / coil whine)
  if (config.enableLowPass && config.lowPassFreq < sampleRate / 2) {
    const lowpass = offlineCtx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = config.lowPassFreq;
    lowpass.Q.value = 0.707;
    currentNode.connect(lowpass);
    currentNode = lowpass;
  }

  // 3. Mains Power De-Hummer (50Hz EU/Asia or 60Hz US electrical buzz + harmonics)
  if (config.deHumFreq === '50hz' || config.deHumFreq === '60hz') {
    const baseFreq = config.deHumFreq === '50hz' ? 50 : 60;
    const harmonics = [baseFreq, baseFreq * 2, baseFreq * 3];

    for (const freq of harmonics) {
      if (freq < sampleRate / 2) {
        const notch = offlineCtx.createBiquadFilter();
        notch.type = 'notch';
        notch.frequency.value = freq;
        notch.Q.value = 18; // Narrow notch to isolate hum without cutting speech
        currentNode.connect(notch);
        currentNode = notch;
      }
    }
  }

  // 4. Voice Clarity EQ (Gentle presence boost around 3 kHz for voice intelligibility)
  if (config.voiceClarityBoost) {
    const clarityEq = offlineCtx.createBiquadFilter();
    clarityEq.type = 'peaking';
    clarityEq.frequency.value = 3200;
    clarityEq.Q.value = 1.2;
    clarityEq.gain.value = 3.2; // +3.2 dB presence boost
    currentNode.connect(clarityEq);
    currentNode = clarityEq;
  }

  currentNode.connect(offlineCtx.destination);
  sourceNode.start(0);

  const filteredBuffer = await offlineCtx.startRendering();

  // 5. Adaptive Spectral Noise Gate / Downward Expander (Float32 DSP)
  // If threshold is below -70 dB, noise gate is effectively disabled
  if (config.noiseGateThresholdDb <= -70) {
    return filteredBuffer;
  }

  const gatedBuffer = cloneAudioBuffer(filteredBuffer);
  const thresholdLinear = Math.pow(10, config.noiseGateThresholdDb / 20);
  const maxAttenuationLinear = Math.pow(10, -Math.abs(config.noiseGateReductionDb) / 20);

  // Envelope follower parameters
  const attackSamples = Math.max(1, Math.floor(sampleRate * 0.005)); // 5ms attack
  const releaseSamples = Math.max(1, Math.floor(sampleRate * 0.060)); // 60ms release
  const attackCoeff = Math.exp(-1 / attackSamples);
  const releaseCoeff = Math.exp(-1 / releaseSamples);

  // Soft knee factor (in linear units)
  const kneeWidthLinear = thresholdLinear * 0.5;
  const lowerKnee = Math.max(0, thresholdLinear - kneeWidthLinear);
  const upperKnee = thresholdLinear + kneeWidthLinear;

  for (let ch = 0; ch < gatedBuffer.numberOfChannels; ch++) {
    const channelData = gatedBuffer.getChannelData(ch);
    let envelope = 0;

    for (let i = 0; i < channelData.length; i++) {
      const absSample = Math.abs(channelData[i]);

      // Peak envelope follower
      if (absSample > envelope) {
        envelope = attackCoeff * envelope + (1 - attackCoeff) * absSample;
      } else {
        envelope = releaseCoeff * envelope + (1 - releaseCoeff) * absSample;
      }

      // Compute expansion gain multiplier
      let targetGain = 1.0;
      if (envelope < lowerKnee) {
        targetGain = maxAttenuationLinear;
      } else if (envelope < upperKnee) {
        // Soft knee interpolation
        const kneeT = (envelope - lowerKnee) / (upperKnee - lowerKnee);
        // Hermite smoothstep
        const smoothT = kneeT * kneeT * (3 - 2 * kneeT);
        targetGain = maxAttenuationLinear + (1.0 - maxAttenuationLinear) * smoothT;
      } else {
        targetGain = 1.0;
      }

      channelData[i] *= targetGain;
    }
  }

  return gatedBuffer;
}
