/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  AudioSegment, 
  SilenceDetectionConfig, 
  SplitMarker, 
  DenoiseConfig, 
  StereoMode, 
  ActiveToolTab, 
  SplitResultTrack,
  AudioHistoryState,
  ThemeMode 
} from './types/audio';
import { 
  getAudioContext, 
  decodeAudioFile, 
  cloneAudioBuffer, 
  sliceAudioBuffer, 
  cutAudioBuffer, 
  insertAudioBuffer, 
  silenceAudioRange, 
  normalizeAudioBuffer, 
  applyGainToBuffer, 
  applyFadeToBuffer, 
  reverseAudioBuffer, 
  convertStereoChannel, 
  adjustStereoImage, 
  changeSpeedOffline,
  formatTime 
} from './utils/audioCore';
import { 
  analyzeSilence, 
  processSilenceRemoval, 
  SilenceAnalysisResult 
} from './utils/silenceDetector';
import { applyDenoiseFilters } from './utils/noiseFilter';
import { 
  splitBySilence, 
  splitByEqualDuration, 
  splitByMarkers, 
  createZipOfTracks, 
  downloadBlob 
} from './utils/audioSplitter';
import { generateDemoSpeechAudio } from './utils/sampleGenerator';

import { Header } from './components/Header';
import { WaveformCanvas } from './components/WaveformCanvas';
import { AudioPlayerControls } from './components/AudioPlayerControls';
import { SilenceRemoverPanel } from './components/SilenceRemoverPanel';
import { SplitterPanel } from './components/SplitterPanel';
import { ChannelConverterPanel } from './components/ChannelConverterPanel';
import { NoiseRemoverPanel } from './components/NoiseRemoverPanel';
import { EditorToolsPanel } from './components/EditorToolsPanel';
import { AudioRecorderModal } from './components/AudioRecorderModal';
import { FormatConverterModal } from './components/FormatConverterModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { SeoLandingContent } from './components/SeoLandingContent';
import { Footer } from './components/Footer';

import { 
  Sparkles, 
  Split, 
  Layers, 
  ShieldAlert, 
  Upload, 
  Zap, 
  FileAudio,
  Activity,
  Sliders
} from 'lucide-react';

export default function App() {
  // Theme state with localStorage persistence
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('subwave_theme') as ThemeMode) || 'obsidian';
  });

  useEffect(() => {
    localStorage.setItem('subwave_theme', theme);
    document.documentElement.className = `theme-${theme} ${theme !== 'light' ? 'dark' : ''}`;
  }, [theme]);

  // Audio state
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [fileName, setFileName] = useState<string>('demo_podcast_sample.wav');
  const [history, setHistory] = useState<AudioHistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [clipboardBuffer, setClipboardBuffer] = useState<AudioBuffer | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1.0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);

  // Audio nodes refs
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const playbackStartTimeRef = useRef<number>(0);
  const playbackStartOffsetRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // Active Tool Tab
  const [activeTab, setActiveTab] = useState<ActiveToolTab>('silence-remover');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Silence Detection
  const [silenceConfig, setSilenceConfig] = useState<SilenceDetectionConfig>({
    thresholdDb: -36,
    minSilenceDuration: 0.35,
    minSpeechDuration: 0.15,
    paddingDuration: 0.08,
  });
  const [silenceAnalysis, setSilenceAnalysis] = useState<SilenceAnalysisResult | null>(null);
  const [highlightSilence, setHighlightSilence] = useState<boolean>(true);

  // Splitter & Markers
  const [markers, setMarkers] = useState<SplitMarker[]>([]);
  const [splitTracks, setSplitTracks] = useState<SplitResultTrack[]>([]);
  const [isGeneratingZip, setIsGeneratingZip] = useState<boolean>(false);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const trackPreviewSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Denoise Config
  const [denoiseConfig, setDenoiseConfig] = useState<DenoiseConfig>({
    enableHighPass: true,
    highPassFreq: 80,
    enableLowPass: true,
    lowPassFreq: 11000,
    deHumFreq: '60hz',
    noiseGateThresholdDb: -42,
    noiseGateReductionDb: -16,
    voiceClarityBoost: true,
  });

  // Modals
  const [isRecorderOpen, setIsRecorderOpen] = useState<boolean>(false);
  const [isExporterOpen, setIsExporterOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);

  // Helper: Push state to Undo History
  const pushHistory = useCallback((buffer: AudioBuffer, description: string) => {
    setAudioBuffer(buffer);
    setHistory(prev => {
      const nextHistory = prev.slice(0, historyIndex + 1);
      nextHistory.push({
        buffer: cloneAudioBuffer(buffer),
        description,
        timestamp: Date.now(),
      });
      return nextHistory;
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  // Initial Load: Generate synthetic demo speech with pauses and hum
  useEffect(() => {
    const demo = generateDemoSpeechAudio();
    setAudioBuffer(demo);
    setHistory([{
      buffer: cloneAudioBuffer(demo),
      description: 'Initial Demo Audio',
      timestamp: Date.now(),
    }]);
    setHistoryIndex(0);
    setFileName('demo_podcast_sample.wav');

    // Add initial split markers
    setMarkers([
      { id: 'm1', time: 4.0, label: 'Take 1' },
      { id: 'm2', time: 8.5, label: 'Take 2' },
      { id: 'm3', time: 13.0, label: 'Take 3' },
    ]);
  }, []);

  // Run Silence Analysis whenever buffer or silence config changes
  useEffect(() => {
    if (!audioBuffer) {
      setSilenceAnalysis(null);
      return;
    }
    const result = analyzeSilence(audioBuffer, silenceConfig);
    setSilenceAnalysis(result);
  }, [audioBuffer, silenceConfig]);

  // Playback Animation Loop
  const updatePlayhead = useCallback(() => {
    if (!sourceNodeRef.current || !audioBuffer) return;
    const ctx = getAudioContext();
    const elapsed = (ctx.currentTime - playbackStartTimeRef.current) * playbackRate;
    const newTime = playbackStartOffsetRef.current + elapsed;

    if (newTime >= audioBuffer.duration) {
      if (isLooping) {
        seekAudio(0, true);
      } else {
        stopAudio();
      }
      return;
    }

    setCurrentTime(newTime);
    animFrameRef.current = requestAnimationFrame(updatePlayhead);
  }, [audioBuffer, playbackRate, isLooping]);

  // Stop Playback
  const stopAudio = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch (e) {}
      sourceNodeRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // Start Playback from offset
  const playAudio = useCallback((startOffset: number = currentTime) => {
    if (!audioBuffer) return;
    stopAudio();

    const ctx = getAudioContext();
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.playbackRate.value = playbackRate;

    const gainNode = ctx.createGain();
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    sourceNodeRef.current = source;
    gainNodeRef.current = gainNode;

    const safeOffset = Math.max(0, Math.min(audioBuffer.duration, startOffset));
    playbackStartTimeRef.current = ctx.currentTime;
    playbackStartOffsetRef.current = safeOffset;

    source.start(0, safeOffset);
    setIsPlaying(true);
    setCurrentTime(safeOffset);

    animFrameRef.current = requestAnimationFrame(updatePlayhead);
  }, [audioBuffer, currentTime, playbackRate, volume, stopAudio, updatePlayhead]);

  // Toggle Play / Pause
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      stopAudio();
    } else {
      if (currentTime >= (audioBuffer?.duration || 0) - 0.05) {
        playAudio(0);
      } else {
        playAudio(currentTime);
      }
    }
  }, [isPlaying, currentTime, audioBuffer, stopAudio, playAudio]);

  // Seek
  const seekAudio = useCallback((time: number, autoPlay: boolean = isPlaying) => {
    stopAudio();
    setCurrentTime(time);
    if (autoPlay) {
      playAudio(time);
    }
  }, [stopAudio, playAudio, isPlaying]);

  // Play Selection Only
  const playSelection = () => {
    if (!selection || !audioBuffer) return;
    stopAudio();

    const ctx = getAudioContext();
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.playbackRate.value = playbackRate;

    const gainNode = ctx.createGain();
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    sourceNodeRef.current = source;
    gainNodeRef.current = gainNode;

    const start = Math.min(selection.start, selection.end);
    const duration = Math.abs(selection.end - selection.start);

    playbackStartTimeRef.current = ctx.currentTime;
    playbackStartOffsetRef.current = start;

    source.start(0, start, duration);
    setIsPlaying(true);
    setCurrentTime(start);

    animFrameRef.current = requestAnimationFrame(updatePlayhead);
  };

  // Preview Split Track in Splitter Panel
  const handlePreviewTrack = (track: SplitResultTrack) => {
    if (trackPreviewSourceRef.current) {
      try {
        trackPreviewSourceRef.current.stop();
        trackPreviewSourceRef.current.disconnect();
      } catch (e) {}
      trackPreviewSourceRef.current = null;
    }

    if (playingTrackId === track.id) {
      setPlayingTrackId(null);
      return;
    }

    const ctx = getAudioContext();
    const source = ctx.createBufferSource();
    source.buffer = track.buffer;

    const gain = ctx.createGain();
    gain.gain.value = volume;

    source.connect(gain);
    gain.connect(ctx.destination);

    source.onended = () => {
      setPlayingTrackId(null);
    };

    source.start(0);
    trackPreviewSourceRef.current = source;
    setPlayingTrackId(track.id);
  };

  const handleChangeVolume = (val: number) => {
    setVolume(val);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = val;
    }
  };

  const handleChangePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (sourceNodeRef.current) {
      sourceNodeRef.current.playbackRate.value = rate;
    }
  };

  // Undo / Redo
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleUndo = () => {
    if (!canUndo) return;
    stopAudio();
    const nextIdx = historyIndex - 1;
    setHistoryIndex(nextIdx);
    setAudioBuffer(cloneAudioBuffer(history[nextIdx].buffer));
    setCurrentTime(0);
  };

  const handleRedo = () => {
    if (!canRedo) return;
    stopAudio();
    const nextIdx = historyIndex + 1;
    setHistoryIndex(nextIdx);
    setAudioBuffer(cloneAudioBuffer(history[nextIdx].buffer));
    setCurrentTime(0);
  };

  // File Upload Handler
  const handleLoadFile = async (file: File) => {
    try {
      setIsProcessing(true);
      stopAudio();
      const decoded = await decodeAudioFile(file);
      setFileName(file.name);
      setAudioBuffer(decoded);
      setMarkers([]);
      setSplitTracks([]);
      setSelection(null);
      setCurrentTime(0);
      setHistory([{
        buffer: cloneAudioBuffer(decoded),
        description: `Imported ${file.name}`,
        timestamp: Date.now(),
      }]);
      setHistoryIndex(0);
    } catch (err) {
      console.error('Error decoding file:', err);
      alert('Could not decode audio file. Make sure it is a valid MP3, WAV, AAC, OGG, or FLAC file.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Demo Sample Reload
  const handleLoadDemo = () => {
    stopAudio();
    const demo = generateDemoSpeechAudio();
    setAudioBuffer(demo);
    setFileName('demo_podcast_sample.wav');
    setMarkers([
      { id: 'm1', time: 4.0, label: 'Take 1' },
      { id: 'm2', time: 8.5, label: 'Take 2' },
      { id: 'm3', time: 13.0, label: 'Take 3' },
    ]);
    setSplitTracks([]);
    setSelection(null);
    setCurrentTime(0);
    pushHistory(demo, 'Reset to Demo Audio');
  };

  // Silence Removal Execute
  const handleApplySilenceRemoval = (mode: 'strip' | 'shorten', pauseLen: number = 0.25) => {
    if (!audioBuffer || !silenceAnalysis) return;
    stopAudio();
    setIsProcessing(true);
    setTimeout(() => {
      try {
        const processed = processSilenceRemoval(audioBuffer, silenceAnalysis, mode, pauseLen);
        pushHistory(processed, mode === 'strip' ? 'Stripped Silence' : `Shortened Pauses (${pauseLen}s)`);
        setCurrentTime(0);
      } finally {
        setIsProcessing(false);
      }
    }, 50);
  };

  // Automatic Splitter Execute (Supports Lossless WAV or Universal MP3)
  const handleGenerateSplit = (
    mode: 'silence' | 'equal' | 'markers',
    param?: number,
    format: 'wav' | 'mp3' = 'wav'
  ) => {
    if (!audioBuffer) return;
    const base = fileName.replace(/\.[^/.]+$/, '');
    let tracks: SplitResultTrack[] = [];

    if (mode === 'silence' && silenceAnalysis) {
      tracks = splitBySilence(audioBuffer, silenceAnalysis, base, format);
    } else if (mode === 'equal') {
      tracks = splitByEqualDuration(audioBuffer, param || 30, base, format);
    } else if (mode === 'markers') {
      tracks = splitByMarkers(audioBuffer, markers, base, format);
    }

    setSplitTracks(tracks);
  };

  // Download All Split Tracks as ZIP
  const handleDownloadZip = async () => {
    if (splitTracks.length === 0) return;
    try {
      setIsGeneratingZip(true);
      const zipBlob = await createZipOfTracks(splitTracks, `${fileName.replace(/\.[^/.]+$/, '')}_split_bundle.zip`);
      downloadBlob(zipBlob, `${fileName.replace(/\.[^/.]+$/, '')}_tracks_bundle.zip`);
    } catch (e) {
      console.error('ZIP generation error:', e);
      alert('Failed to create ZIP file.');
    } finally {
      setIsGeneratingZip(false);
    }
  };

  // Channel Operations
  const handleApplyChannelMode = (mode: StereoMode) => {
    if (!audioBuffer) return;
    stopAudio();
    const converted = convertStereoChannel(audioBuffer, mode);
    pushHistory(converted, `Channel routing: ${mode}`);
  };

  const handleApplyStereoImage = (panVal: number, widthVal: number) => {
    if (!audioBuffer) return;
    stopAudio();
    const processed = adjustStereoImage(audioBuffer, panVal, widthVal);
    pushHistory(processed, `Pan: ${panVal}, Width: ${widthVal}`);
  };

  // Background Noise Removal
  const handleApplyDenoise = async () => {
    if (!audioBuffer) return;
    stopAudio();
    setIsProcessing(true);
    try {
      const cleaned = await applyDenoiseFilters(audioBuffer, denoiseConfig);
      pushHistory(cleaned, 'Denoise & Background Cleanup');
    } catch (e) {
      console.error('Denoise error:', e);
      alert('Error applying denoise filters.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Waveform Direct Editor Tools
  const handleCut = () => {
    if (!audioBuffer || !selection) return;
    stopAudio();
    const start = Math.min(selection.start, selection.end);
    const end = Math.max(selection.start, selection.end);
    const { cut, remainder } = cutAudioBuffer(audioBuffer, start, end);
    setClipboardBuffer(cut);
    setSelection(null);
    setCurrentTime(start);
    pushHistory(remainder, 'Cut Selection');
  };

  const handleCopy = () => {
    if (!audioBuffer || !selection) return;
    const start = Math.min(selection.start, selection.end);
    const end = Math.max(selection.start, selection.end);
    const sliced = sliceAudioBuffer(audioBuffer, start, end);
    setClipboardBuffer(sliced);
  };

  const handlePaste = () => {
    if (!audioBuffer || !clipboardBuffer) return;
    stopAudio();
    const inserted = insertAudioBuffer(audioBuffer, clipboardBuffer, currentTime);
    pushHistory(inserted, 'Paste Audio');
  };

  const handleDelete = () => {
    if (!audioBuffer || !selection) return;
    stopAudio();
    const start = Math.min(selection.start, selection.end);
    const end = Math.max(selection.start, selection.end);
    const { remainder } = cutAudioBuffer(audioBuffer, start, end);
    setSelection(null);
    setCurrentTime(start);
    pushHistory(remainder, 'Delete Selection');
  };

  const handleTrim = () => {
    if (!audioBuffer || !selection) return;
    stopAudio();
    const start = Math.min(selection.start, selection.end);
    const end = Math.max(selection.start, selection.end);
    const trimmed = sliceAudioBuffer(audioBuffer, start, end);
    setSelection(null);
    setCurrentTime(0);
    pushHistory(trimmed, 'Trim to Selection');
  };

  const handleSilenceRegion = () => {
    if (!audioBuffer || !selection) return;
    stopAudio();
    const start = Math.min(selection.start, selection.end);
    const end = Math.max(selection.start, selection.end);
    const muted = silenceAudioRange(audioBuffer, start, end);
    pushHistory(muted, 'Mute Selection');
  };

  const handleFadeIn = () => {
    if (!audioBuffer) return;
    stopAudio();
    const start = selection ? Math.min(selection.start, selection.end) : 0;
    const end = selection ? Math.max(selection.start, selection.end) : Math.min(2.0, audioBuffer.duration);
    const faded = applyFadeToBuffer(audioBuffer, 'in', start, end);
    pushHistory(faded, 'Fade In');
  };

  const handleFadeOut = () => {
    if (!audioBuffer) return;
    stopAudio();
    const start = selection ? Math.min(selection.start, selection.end) : Math.max(0, audioBuffer.duration - 2.0);
    const end = selection ? Math.max(selection.start, selection.end) : audioBuffer.duration;
    const faded = applyFadeToBuffer(audioBuffer, 'out', start, end);
    pushHistory(faded, 'Fade Out');
  };

  const handleNormalize = () => {
    if (!audioBuffer) return;
    stopAudio();
    const { buffer: normalized } = normalizeAudioBuffer(audioBuffer, -0.1);
    pushHistory(normalized, 'Normalize Peak (-0.1 dB)');
  };

  const handleApplyGain = (gainDb: number) => {
    if (!audioBuffer) return;
    stopAudio();
    const multiplier = Math.pow(10, gainDb / 20);
    const range = selection ? { start: Math.min(selection.start, selection.end), end: Math.max(selection.start, selection.end) } : undefined;
    const boosted = applyGainToBuffer(audioBuffer, multiplier, range);
    pushHistory(boosted, `Gain Boost: ${gainDb > 0 ? `+${gainDb}` : gainDb} dB`);
  };

  const handleReverse = () => {
    if (!audioBuffer) return;
    stopAudio();
    const range = selection ? { start: Math.min(selection.start, selection.end), end: Math.max(selection.start, selection.end) } : undefined;
    const reversed = reverseAudioBuffer(audioBuffer, range);
    pushHistory(reversed, 'Reverse Audio');
  };

  const handleChangeSpeed = async (multiplier: number) => {
    if (!audioBuffer) return;
    stopAudio();
    setIsProcessing(true);
    try {
      const spedUp = await changeSpeedOffline(audioBuffer, multiplier);
      pushHistory(spedUp, `Speed Warp: ${multiplier}x`);
    } catch (e) {
      console.error('Speed warp error:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Marker Operations
  const handleAddMarker = (time: number) => {
    const id = `marker-${Date.now()}`;
    const nextIdx = markers.length + 1;
    const newMarker: SplitMarker = {
      id,
      time,
      label: `Cut ${nextIdx}`,
    };
    setMarkers(prev => [...prev, newMarker]);
  };

  const handleRemoveMarker = (id: string) => {
    setMarkers(prev => prev.filter(m => m.id !== id));
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        seekAudio(Math.max(0, currentTime - 5));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        seekAudio(Math.min(audioBuffer?.duration || 0, currentTime + 5));
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
        if (selection) {
          e.preventDefault();
          handleCut();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        if (selection) {
          e.preventDefault();
          handleCopy();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        if (clipboardBuffer) {
          e.preventDefault();
          handlePaste();
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selection) {
          e.preventDefault();
          handleDelete();
        }
      } else if (e.key === 'Escape') {
        setSelection(null);
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleAddMarker(currentTime);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, seekAudio, currentTime, audioBuffer, handleUndo, handleRedo, selection, clipboardBuffer]);

  // Drag and drop audio files anywhere
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleLoadFile(file);
    }
  };

  // Studio Console Modules with live telemetry
  const consoleModules: { 
    id: ActiveToolTab; 
    label: string; 
    category: string;
    icon: React.ReactNode; 
    status: string;
    statusHighlight?: boolean;
  }[] = [
    { 
      id: 'silence-remover', 
      label: 'Silence Remover', 
      category: 'AI Detection',
      icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
      status: silenceAnalysis ? `${silenceAnalysis.silencePercentage.toFixed(0)}% dead air cut` : 'Ready',
      statusHighlight: !!silenceAnalysis && silenceAnalysis.silencePercentage > 0,
    },
    { 
      id: 'splitter', 
      label: 'Smart Splitter', 
      category: 'Export Stems',
      icon: <Split className="w-4 h-4 text-indigo-400" />,
      status: splitTracks.length > 0 ? `${splitTracks.length} tracks generated` : `${markers.length} markers`,
      statusHighlight: splitTracks.length > 0,
    },
    { 
      id: 'stereo-mono', 
      label: 'Stereo to Mono', 
      category: 'Channel Routing',
      icon: <Layers className="w-4 h-4 text-purple-400" />,
      status: audioBuffer?.numberOfChannels === 1 ? '1 Channel (Mono)' : '2 Channel (Stereo)',
    },
    { 
      id: 'noise-remover', 
      label: 'Neural Denoise', 
      category: 'DSP Cleanup',
      icon: <ShieldAlert className="w-4 h-4 text-emerald-400" />,
      status: denoiseConfig.deHumFreq !== 'none' ? `${denoiseConfig.deHumFreq} Notch Active` : 'Filters Ready',
      statusHighlight: denoiseConfig.deHumFreq !== 'none',
    },
    { 
      id: 'editor-tools', 
      label: 'Waveform DAW', 
      category: 'Splice & DSP',
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      status: selection ? 'Range active' : 'Ready',
      statusHighlight: !!selection,
    },
  ];

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col font-sans transition-colors duration-200"
    >
      {/* Drag Over Overlay */}
      {dragOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-cyan-950/80 backdrop-blur-md border-4 border-dashed border-cyan-400">
          <div className="text-center p-8 bg-[var(--card-bg)] rounded-2xl shadow-2xl border border-[var(--border-subtle)]">
            <Upload className="w-14 h-14 text-cyan-400 mx-auto mb-4 animate-bounce" />
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">Drop Audio to Load into Subwave</h3>
            <p className="text-xs text-[var(--text-secondary)]">Supports WAV, MP3, AAC, M4A, OGG, WebM, FLAC</p>
          </div>
        </div>
      )}

      {/* 3-Zone Top Bar with Theme Toggle */}
      <Header
        onLoadFile={handleLoadFile}
        onLoadDemo={handleLoadDemo}
        onOpenRecorder={() => setIsRecorderOpen(true)}
        onOpenExporter={() => setIsExporterOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        hasAudio={!!audioBuffer}
        theme={theme}
        onChangeTheme={setTheme}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6 sm:space-y-10 overflow-x-hidden">
        {/* Marquee Hero Section */}
        <section className="text-center max-w-3xl mx-auto pt-2 sm:pt-4 pb-2">
          <span className="text-[11px] sm:text-xs font-semibold tracking-wider text-cyan-400 uppercase mb-2 sm:mb-3 block">
            Local-First Audio Engine
          </span>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-[var(--text-primary)] tracking-tight leading-tight mb-3 sm:mb-4">
            The private in-browser audio workstation.
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto mb-4 sm:mb-6">
            Intelligent silence removal, multi-mode splitting, stereo-to-mono routing, and background noise reduction. No cloud processing, no tracking, works completely offline.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-[var(--text-muted)] font-medium">
            <span>100% Client-Side DSP</span>
            <span aria-hidden="true" className="text-slate-600 dark:text-slate-700">·</span>
            <span>Zero Server Uploads</span>
            <span aria-hidden="true" className="text-slate-600 dark:text-slate-700">·</span>
            <span>Zero Setup · Works Offline</span>
          </div>
        </section>

        {/* Central Workstation Viewport Card */}
        <div id="workstation" className="space-y-3 sm:space-y-4">
          {/* Track Metadata Ribbon (Zero-Pill Discipline) */}
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 bg-[var(--card-secondary)] rounded-xl border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
            <div className="flex items-center gap-2">
              <FileAudio className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="font-semibold text-[var(--text-primary)] truncate max-w-[160px] sm:max-w-none">{fileName}</span>
              {audioBuffer && (
                <span className="font-mono tabular-nums text-[var(--text-muted)] hidden sm:inline">
                  · {formatTime(audioBuffer.duration)} · {audioBuffer.sampleRate} Hz · {audioBuffer.numberOfChannels === 1 ? 'Mono' : 'Stereo'}
                </span>
              )}
            </div>

            {history[historyIndex] && (
              <div className="text-[11px] text-[var(--text-secondary)] font-mono hidden md:block">
                {history[historyIndex].description}
              </div>
            )}
          </div>

          {/* Interactive Waveform Viewport */}
          <WaveformCanvas
            audioBuffer={audioBuffer}
            currentTime={currentTime}
            onSeek={seekAudio}
            selection={selection}
            onSelectRange={setSelection}
            silenceSegments={silenceAnalysis?.silentSegments || []}
            speechSegments={silenceAnalysis?.speechSegments || []}
            markers={markers}
            onAddMarker={handleAddMarker}
            onRemoveMarker={handleRemoveMarker}
            highlightSilence={highlightSilence && activeTab === 'silence-remover'}
            theme={theme}
          />

          {/* Floating Player Transport Dock */}
          <AudioPlayerControls
            isPlaying={isPlaying}
            onTogglePlay={togglePlay}
            onStop={() => seekAudio(0, false)}
            currentTime={currentTime}
            duration={audioBuffer?.duration || 0}
            volume={volume}
            onChangeVolume={handleChangeVolume}
            playbackRate={playbackRate}
            onChangePlaybackRate={handleChangePlaybackRate}
            isLooping={isLooping}
            onToggleLoop={() => setIsLooping(l => !l)}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onSkipBack={sec => seekAudio(Math.max(0, currentTime - (sec || 5)))}
            onSkipForward={sec => seekAudio(Math.min(audioBuffer?.duration || 0, currentTime + (sec || 5)))}
            hasSelection={!!selection}
            onPlaySelection={playSelection}
          />
        </div>

        {/* Studio Tool Console (Upgraded from the basic 1-line tab strip) */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">Studio Processing Console</h2>
            </div>
            <div className="text-[11px] sm:text-xs text-[var(--text-muted)] font-mono tabular-nums">
              Session: {audioBuffer?.sampleRate || 44100}Hz · 32-bit Float Core
            </div>
          </div>

          {/* Tactile Tool Module Rack */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
            {consoleModules.map((mod, idx) => {
              const isActive = activeTab === mod.id;
              const isLastOdd = idx === consoleModules.length - 1;
              return (
                <button
                  key={mod.id}
                  onClick={() => setActiveTab(mod.id)}
                  className={`p-3 sm:p-3.5 rounded-xl border text-left transition relative overflow-hidden group ${
                    isLastOdd ? 'col-span-2 sm:col-span-1' : ''
                  } ${
                    isActive
                      ? 'bg-[var(--card-bg)] border-cyan-400/60 shadow-lg shadow-cyan-500/5'
                      : 'bg-[var(--card-secondary)] hover:bg-[var(--card-bg)] border-[var(--border-subtle)] hover:border-[var(--border-highlight)]'
                  }`}
                >
                  {/* Active highlight line */}
                  {isActive && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-indigo-500" />
                  )}

                  <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-muted)]">
                      {mod.category}
                    </span>
                    <span className="p-1 sm:p-1.5 rounded-lg bg-[var(--btn-hover-bg)] border border-[var(--border-subtle)]">
                      {mod.icon}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-[var(--text-primary)] mb-0.5 sm:mb-1">
                    {mod.label}
                  </div>

                  <div className={`text-[10px] sm:text-[11px] font-mono tabular-nums ${
                    mod.statusHighlight ? 'text-cyan-400 font-medium' : 'text-[var(--text-muted)]'
                  }`}>
                    {mod.status}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Tool Module Inspector */}
          <div className="mt-4">
            {activeTab === 'silence-remover' && (
              <SilenceRemoverPanel
                config={silenceConfig}
                onChangeConfig={setSilenceConfig}
                analysis={silenceAnalysis}
                onApplyRemove={handleApplySilenceRemoval}
                onSendToSplitter={() => {
                  setActiveTab('splitter');
                  handleGenerateSplit('silence');
                }}
                isProcessing={isProcessing}
                highlightSilence={highlightSilence}
                onToggleHighlight={() => setHighlightSilence(h => !h)}
              />
            )}

            {activeTab === 'splitter' && (
              <SplitterPanel
                audioBuffer={audioBuffer}
                silenceAnalysis={silenceAnalysis}
                markers={markers}
                splitTracks={splitTracks}
                onGenerateSplit={handleGenerateSplit}
                onDownloadZip={handleDownloadZip}
                isGeneratingZip={isGeneratingZip}
                onPreviewTrack={handlePreviewTrack}
                playingTrackId={playingTrackId}
              />
            )}

            {activeTab === 'stereo-mono' && (
              <ChannelConverterPanel
                audioBuffer={audioBuffer}
                onApplyChannelMode={handleApplyChannelMode}
                onApplyStereoImage={handleApplyStereoImage}
                isProcessing={isProcessing}
              />
            )}

            {activeTab === 'noise-remover' && (
              <NoiseRemoverPanel
                config={denoiseConfig}
                onChangeConfig={setDenoiseConfig}
                onApplyDenoise={handleApplyDenoise}
                isProcessing={isProcessing}
                audioBuffer={audioBuffer}
              />
            )}

            {activeTab === 'editor-tools' && (
              <EditorToolsPanel
                hasSelection={!!selection}
                onCut={handleCut}
                onCopy={handleCopy}
                onPaste={handlePaste}
                onDelete={handleDelete}
                onTrim={handleTrim}
                onSilenceRegion={handleSilenceRegion}
                onFadeIn={handleFadeIn}
                onFadeOut={handleFadeOut}
                onNormalize={handleNormalize}
                onApplyGain={handleApplyGain}
                onReverse={handleReverse}
                onChangeSpeed={handleChangeSpeed}
                hasClipboard={!!clipboardBuffer}
                isProcessing={isProcessing}
              />
            )}
          </div>
        </div>

        {/* Editorial Storytelling & SEO Section */}
        <SeoLandingContent />
      </main>

      {/* Fully Responsive Studio Footer */}
      <Footer
        onSelectTab={setActiveTab}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenRecorder={() => setIsRecorderOpen(true)}
        onOpenExporter={() => setIsExporterOpen(true)}
        theme={theme}
        onChangeTheme={setTheme}
      />

      {/* Pro Broadcast Voice Recorder Modal */}
      <AudioRecorderModal
        isOpen={isRecorderOpen}
        onClose={() => setIsRecorderOpen(false)}
        onLoadRecording={(buffer, name) => {
          stopAudio();
          setAudioBuffer(buffer);
          setFileName(name);
          setMarkers([]);
          setSplitTracks([]);
          setSelection(null);
          setCurrentTime(0);
          pushHistory(buffer, `Recorded ${name}`);
        }}
      />

      {/* Format Exporter Modal */}
      <FormatConverterModal
        isOpen={isExporterOpen}
        onClose={() => setIsExporterOpen(false)}
        audioBuffer={audioBuffer}
        defaultFilename={fileName}
      />

      {/* Keyboard Shortcuts Reference Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
