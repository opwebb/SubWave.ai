import { createAudioBuffer } from './audioCore';

/**
 * Generates an organic speech-like demo audio track with clear voice phrases,
 * pauses of varying lengths, and subtle background ambient hum.
 * Perfect for 1-click testing of silence removal, noise removal, and splitting.
 */
export function generateDemoSpeechAudio(): AudioBuffer {
  const sampleRate = 44100;
  const totalDuration = 18.0; // 18 seconds
  const totalSamples = Math.floor(sampleRate * totalDuration);
  const buffer = createAudioBuffer(2, totalSamples, sampleRate);

  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  // Define voice phrases with pauses in between
  // [startSec, endSec, pitchHz, vowel]
  const phrases = [
    { start: 0.8, end: 3.2, f0: 165 },  // "Welcome to AudioFlow Studio"
    { start: 4.5, end: 7.0, f0: 175 },  // "Testing silence remover and smart splitting"
    { start: 8.8, end: 12.0, f0: 155 }, // "All processing happens 100% in your browser"
    { start: 13.5, end: 16.8, f0: 180 }, // "Zero server uploads, completely private and fast"
  ];

  // 1. Add background hum & low frequency rumble (60Hz electrical hum + harmonic at 120Hz)
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const hum60 = Math.sin(2 * Math.PI * 60 * t) * 0.035;
    const hum120 = Math.sin(2 * Math.PI * 120 * t) * 0.015;
    const rumble = Math.sin(2 * Math.PI * 28 * t) * 0.02;
    // Low level hiss
    const hiss = (Math.random() * 2 - 1) * 0.008;

    const noise = hum60 + hum120 + rumble + hiss;
    left[i] = noise;
    right[i] = noise * 0.95;
  }

  // 2. Synthesize speech phrases using formant synthesis (formants for /a/, /e/, /o/)
  phrases.forEach((ph, pIdx) => {
    const startSample = Math.floor(ph.start * sampleRate);
    const endSample = Math.floor(ph.end * sampleRate);
    const durationSamples = endSample - startSample;

    for (let i = 0; i < durationSamples; i++) {
      const idx = startSample + i;
      const t = i / sampleRate;

      // Amplitude envelope (words cadence)
      // Syllable modulation (~4 syllables per second)
      const syllableMod = 0.5 + 0.5 * Math.sin(2 * Math.PI * 3.8 * t);
      // Smooth attack and decay for each phrase
      const fadeIn = Math.min(1, (i / sampleRate) / 0.15);
      const fadeOut = Math.min(1, ((durationSamples - i) / sampleRate) / 0.2);
      const phraseEnvelope = fadeIn * fadeOut * syllableMod;

      // Pitch vibrato / intonation
      const pitchWobble = 1 + 0.03 * Math.sin(2 * Math.PI * 5 * t);
      const f0 = ph.f0 * pitchWobble;

      // Formant synthesis for rich voice timbre: F1 (700Hz), F2 (1200Hz), F3 (2500Hz)
      const f1 = Math.sin(2 * Math.PI * 720 * t) * 0.4;
      const f2 = Math.sin(2 * Math.PI * 1250 * t) * 0.3;
      const f3 = Math.sin(2 * Math.PI * 2600 * t) * 0.15;
      const fundamental = Math.sin(2 * Math.PI * f0 * t) * 0.5;

      const voiceSignal = (fundamental + f1 + f2 + f3) * phraseEnvelope * 0.65;

      // Stereo spread: left and right slight phase difference
      const panOffset = (pIdx % 2 === 0) ? 0.05 : -0.05;
      left[idx] += voiceSignal * (1 + panOffset);
      right[idx] += voiceSignal * (1 - panOffset);
    }
  });

  return buffer;
}
