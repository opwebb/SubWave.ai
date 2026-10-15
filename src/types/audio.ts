export type ThemeMode = 'obsidian' | 'charcoal' | 'light';

export interface AudioSegment {
  id: string;
  start: number; // in seconds
  end: number;   // in seconds
  duration: number;
  label?: string;
}

export interface SilenceDetectionConfig {
  thresholdDb: number; // e.g. -35 dB
  minSilenceDuration: number; // e.g. 0.35s
  minSpeechDuration: number; // e.g. 0.15s
  paddingDuration: number; // e.g. 0.08s
}

export interface SplitMarker {
  id: string;
  time: number;
  label: string;
}

export interface DenoiseConfig {
  enableHighPass: boolean;
  highPassFreq: number; // Hz (e.g. 80Hz)
  enableLowPass: boolean;
  lowPassFreq: number; // Hz (e.g. 10000Hz)
  deHumFreq: 'none' | '50hz' | '60hz';
  noiseGateThresholdDb: number; // e.g. -42 dB
  noiseGateReductionDb: number; // e.g. -18 dB
  voiceClarityBoost: boolean;
}

export type StereoMode = 'mix' | 'left' | 'right' | 'swap' | 'invert-phase';

export interface AudioHistoryState {
  buffer: AudioBuffer;
  description: string;
  timestamp: number;
}

export interface SplitResultTrack {
  id: string;
  index: number;
  name: string;
  start: number;
  end: number;
  duration: number;
  buffer: AudioBuffer;
  blob?: Blob;
}

export type ActiveToolTab = 
  | 'silence-remover' 
  | 'splitter' 
  | 'stereo-mono' 
  | 'noise-remover' 
  | 'editor-tools';
