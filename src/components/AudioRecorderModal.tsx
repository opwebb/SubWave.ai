import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  Square, 
  Check, 
  X, 
  Download, 
  Play, 
  Pause, 
  RotateCcw, 
  Sliders, 
  Activity, 
  Radio, 
  Sparkles 
} from 'lucide-react';
import { getAudioContext, formatTime, decodeAudioFile } from '../utils/audioCore';
import { downloadBlob } from '../utils/audioSplitter';
import { ToggleSwitch } from './ui/ToggleSwitch';

interface AudioRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadRecording: (buffer: AudioBuffer, filename: string) => void;
}

export const AudioRecorderModal: React.FC<AudioRecorderModalProps> = ({
  isOpen,
  onClose,
  onLoadRecording,
}) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // Audio Processing Presets
  const [preset, setPreset] = useState<'podcast' | 'broadcast' | 'music'>('podcast');
  const [echoCancellation, setEchoCancellation] = useState<boolean>(true);
  const [noiseSuppression, setNoiseSuppression] = useState<boolean>(true);
  const [autoGainControl, setAutoGainControl] = useState<boolean>(false);

  // Input Gain Calibration (-12dB to +12dB)
  const [inputGainDb, setInputGainDb] = useState<number>(0);

  // Pre-roll Countdown (3, 2, 1, 0)
  const [countdown, setCountdown] = useState<number | null>(null);

  // Preview Playback State for recorded take
  const [previewBuffer, setPreviewBuffer] = useState<AudioBuffer | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState<boolean>(false);
  const [previewCurrentTime, setPreviewCurrentTime] = useState<number>(0);
  const previewSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const previewAnimFrameRef = useRef<number | null>(null);
  const previewStartTimeRef = useRef<number>(0);

  // Meter levels
  const [meterLevelDb, setMeterLevelDb] = useState<number>(-60);
  const [peakHoldDb, setPeakHoldDb] = useState<number>(-60);

  // Nodes & references
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  // Canvases
  const oscCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fftCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Preset switch handler
  const handleSelectPreset = (p: 'podcast' | 'broadcast' | 'music') => {
    setPreset(p);
    if (p === 'podcast') {
      setEchoCancellation(true);
      setNoiseSuppression(true);
      setAutoGainControl(false);
      setInputGainDb(0);
    } else if (p === 'broadcast') {
      setEchoCancellation(false);
      setNoiseSuppression(false);
      setAutoGainControl(false);
      setInputGainDb(3);
    } else if (p === 'music') {
      setEchoCancellation(false);
      setNoiseSuppression(false);
      setAutoGainControl(false);
      setInputGainDb(0);
    }
  };

  // Enumerate input devices
  useEffect(() => {
    if (!isOpen) return;
    navigator.mediaDevices?.enumerateDevices().then(devices => {
      const inputs = devices.filter(d => d.kind === 'audioinput');
      setAudioDevices(inputs);
      if (inputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(inputs[0].deviceId);
      }
    }).catch(err => {
      console.warn('Could not enumerate audio devices:', err);
    });
  }, [isOpen, selectedDeviceId]);

  // Clean up stream & timers on unmount or close
  const cleanup = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (previewAnimFrameRef.current) {
      cancelAnimationFrame(previewAnimFrameRef.current);
      previewAnimFrameRef.current = null;
    }
    if (previewSourceRef.current) {
      try { previewSourceRef.current.stop(); } catch(e) {}
      previewSourceRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (!isOpen) {
      cleanup();
      setIsRecording(false);
      setIsPaused(false);
      setRecordingTime(0);
      setRecordedBlob(null);
      setPreviewBuffer(null);
      setIsPreviewPlaying(false);
      setCountdown(null);
    }
  }, [isOpen]);

  // Update live gain if slider moves during recording
  useEffect(() => {
    if (gainNodeRef.current) {
      const linear = Math.pow(10, inputGainDb / 20);
      gainNodeRef.current.gain.value = linear;
    }
  }, [inputGainDb]);

  // Visualizer loop: Vocal Oscilloscope + 32-Band FFT Frequency Spectrum
  const startVisualizers = (stream: MediaStream) => {
    try {
      const ctx = getAudioContext();
      const source = ctx.createMediaStreamSource(stream);

      // Create Gain Node for input calibration
      const gainNode = ctx.createGain();
      gainNode.gain.value = Math.pow(10, inputGainDb / 20);
      source.connect(gainNode);
      gainNodeRef.current = gainNode;

      // Analyser Node (fftSize: 256 for responsive 128 frequency bins)
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.75;
      gainNode.connect(analyser);
      analyserRef.current = analyser;

      const timeDomainData = new Uint8Array(analyser.frequencyBinCount);
      const frequencyData = new Uint8Array(analyser.frequencyBinCount);

      const render = () => {
        // 1. Oscilloscope Render
        const oscCanvas = oscCanvasRef.current;
        if (oscCanvas) {
          const oscCtx = oscCanvas.getContext('2d');
          if (oscCtx) {
            analyser.getByteTimeDomainData(timeDomainData);
            const w = oscCanvas.width;
            const h = oscCanvas.height;

            oscCtx.fillStyle = '#07080b';
            oscCtx.fillRect(0, 0, w, h);

            oscCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            oscCtx.beginPath();
            oscCtx.moveTo(0, h / 2);
            oscCtx.lineTo(w, h / 2);
            oscCtx.stroke();

            oscCtx.lineWidth = 2;
            oscCtx.strokeStyle = '#22d3ee';
            oscCtx.beginPath();

            const sliceW = w / timeDomainData.length;
            let x = 0;
            let sumSq = 0;

            for (let i = 0; i < timeDomainData.length; i++) {
              const v = timeDomainData[i] / 128.0;
              const norm = v - 1.0;
              sumSq += norm * norm;
              const y = (v * h) / 2;

              if (i === 0) oscCtx.moveTo(x, y);
              else oscCtx.lineTo(x, y);
              x += sliceW;
            }
            oscCtx.lineTo(w, h / 2);
            oscCtx.stroke();

            // RMS dB calculation
            const rms = Math.sqrt(sumSq / timeDomainData.length);
            const db = rms > 0.0001 ? 20 * Math.log10(rms) : -60;
            const clamped = Math.max(-60, Math.min(0, db));
            setMeterLevelDb(clamped);
            setPeakHoldDb(prev => Math.max(clamped, prev - 0.4));
          }
        }

        // 2. 32-Band FFT Frequency Spectrum Render
        const fftCanvas = fftCanvasRef.current;
        if (fftCanvas) {
          const fftCtx = fftCanvas.getContext('2d');
          if (fftCtx) {
            analyser.getByteFrequencyData(frequencyData);
            const w = fftCanvas.width;
            const h = fftCanvas.height;

            fftCtx.fillStyle = '#07080b';
            fftCtx.fillRect(0, 0, w, h);

            const numBars = 32;
            const barSpacing = 2;
            const totalSpacing = barSpacing * (numBars - 1);
            const barW = Math.max(2, (w - totalSpacing) / numBars);

            for (let b = 0; b < numBars; b++) {
              // Logarithmic bin selection across speech frequencies (50Hz - 16kHz)
              const binIndex = Math.floor(Math.pow(b / numBars, 1.6) * (frequencyData.length - 1));
              const value = frequencyData[binIndex] || 0; // 0 to 255
              const barHeight = Math.max(2, (value / 255) * (h - 6));
              const barX = b * (barW + barSpacing);
              const barY = h - barHeight;

              // Gradient bar color (Cyan -> Violet)
              const barGrad = fftCtx.createLinearGradient(0, h, 0, 0);
              barGrad.addColorStop(0, '#06b6d4');
              barGrad.addColorStop(1, '#818cf8');

              fftCtx.fillStyle = barGrad;
              fftCtx.fillRect(barX, barY, barW, barHeight);
            }
          }
        }

        animFrameRef.current = requestAnimationFrame(render);
      };

      render();
    } catch (e) {
      console.error('Visualizer initialization error:', e);
    }
  };

  // Pre-roll countdown trigger
  const handleInitiateRecording = () => {
    setCountdown(3);
    const interval = window.setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          startActualCapture();
          return null;
        }
        return prev - 1;
      });
    }, 800);
  };

  const startActualCapture = async () => {
    try {
      cleanup();
      chunksRef.current = [];
      setRecordedBlob(null);
      setPreviewBuffer(null);

      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          echoCancellation,
          noiseSuppression,
          autoGainControl,
          sampleRate: 48000,
          channelCount: 2,
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
        ? 'audio/ogg;codecs=opus'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 256000,
      });

      mediaRecorder.ondataavailable = e => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const fullBlob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(fullBlob);
        try {
          const dec = await decodeAudioFile(fullBlob);
          setPreviewBuffer(dec);
        } catch (e) {
          console.warn('Could not decode preview take:', e);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100);
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);

      timerIntervalRef.current = window.setInterval(() => {
        setRecordingTime(t => t + 0.1);
      }, 100);

      startVisualizers(stream);
    } catch (err) {
      console.error('Could not start recording:', err);
      alert('Microphone access is required for in-browser recording.');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingTime(t => t + 0.1);
      }, 100);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    cleanup();
    setIsRecording(false);
    setIsPaused(false);
  };

  // Preview take playback handlers
  const handleTogglePreviewPlay = () => {
    if (!previewBuffer) return;
    const ctx = getAudioContext();

    if (isPreviewPlaying) {
      if (previewSourceRef.current) {
        try { previewSourceRef.current.stop(); } catch(e) {}
        previewSourceRef.current = null;
      }
      if (previewAnimFrameRef.current) cancelAnimationFrame(previewAnimFrameRef.current);
      setIsPreviewPlaying(false);
      return;
    }

    const source = ctx.createBufferSource();
    source.buffer = previewBuffer;
    source.connect(ctx.destination);

    source.onended = () => {
      setIsPreviewPlaying(false);
      setPreviewCurrentTime(0);
    };

    const startOffset = previewCurrentTime >= previewBuffer.duration ? 0 : previewCurrentTime;
    previewStartTimeRef.current = ctx.currentTime - startOffset;
    source.start(0, startOffset);
    previewSourceRef.current = source;
    setIsPreviewPlaying(true);

    const updatePreviewPlayhead = () => {
      const cur = ctx.currentTime - previewStartTimeRef.current;
      if (cur >= previewBuffer.duration) {
        setIsPreviewPlaying(false);
        setPreviewCurrentTime(0);
        return;
      }
      setPreviewCurrentTime(cur);
      previewAnimFrameRef.current = requestAnimationFrame(updatePreviewPlayhead);
    };
    previewAnimFrameRef.current = requestAnimationFrame(updatePreviewPlayhead);
  };

  const handleSendToEditor = async () => {
    if (!recordedBlob) return;
    try {
      const buffer = previewBuffer || await decodeAudioFile(recordedBlob);
      const filename = `take_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.wav`;
      onLoadRecording(buffer, filename);
      onClose();
    } catch (err) {
      console.error('Failed to decode recording:', err);
      alert('Failed to load recording into editor.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[var(--card-bg)] border border-[var(--border-subtle)] rounded-2xl p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.04] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 sm:mb-6 pr-8">
          <div className="p-2 sm:p-2.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 shrink-0">
            <Radio className="w-4 sm:w-5 h-4 sm:h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">Broadcast Recording Studio</h3>
            <p className="text-[11px] sm:text-xs text-[var(--text-secondary)]">
              Calibrated in-browser capture with real-time FFT spectrum, input gain staging, and pre-roll countdown.
            </p>
          </div>
        </div>

        {/* Studio Presets Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-5">
          <span className="text-xs text-[var(--text-muted)] font-medium shrink-0">Studio Preset:</span>
          <div className="flex flex-wrap gap-1.5 p-1 bg-[var(--card-secondary)] rounded-xl border border-[var(--border-subtle)] w-full sm:w-auto">
            {[
              { id: 'podcast', label: 'Podcast Voice', desc: 'Noise-suppressed speech' },
              { id: 'broadcast', label: 'Broadcast Studio', desc: 'Raw uncompressed mic' },
              { id: 'music', label: 'Music & Instruments', desc: 'Wide acoustic capture' },
            ].map(p => (
              <button
                key={p.id}
                disabled={isRecording}
                onClick={() => handleSelectPreset(p.id as any)}
                className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition text-center ${
                  preset === p.id
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--btn-hover-bg)]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dual Visualizers: Oscilloscope + 32-Band FFT Spectrum */}
        <div className="relative mb-5 bg-[#07080b] rounded-xl border border-white/[0.08] overflow-hidden">
          {/* Pre-Roll Countdown Overlay */}
          {countdown !== null && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-100">
              <span className="text-6xl font-black text-cyan-400 font-mono animate-ping">
                {countdown}
              </span>
              <span className="text-xs font-medium text-slate-400 mt-2 uppercase tracking-widest">
                Get ready to speak...
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.06]">
            {/* Oscilloscope */}
            <div className="p-3">
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mb-1">
                <span>Vocal Envelope</span>
                <span>Oscilloscope</span>
              </div>
              <canvas ref={oscCanvasRef} width={280} height={90} className="w-full h-22 block" />
            </div>

            {/* 32-Band FFT Spectrum */}
            <div className="p-3">
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mb-1">
                <span>Frequency Spectrum</span>
                <span>50Hz — 16kHz</span>
              </div>
              <canvas ref={fftCanvasRef} width={280} height={90} className="w-full h-22 block" />
            </div>
          </div>

          {/* Timecode Badge */}
          <div className="absolute top-3 left-3 px-2.5 py-1 bg-[#0d0e13]/90 rounded-md border border-white/[0.08] text-xs font-mono tabular-nums font-semibold text-white">
            {formatTime(recordingTime)}
          </div>

          {/* Recording Status Flag */}
          {isRecording && !isPaused && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/15 border border-rose-500/40 text-rose-400 text-xs font-semibold animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              <span>ON AIR</span>
            </div>
          )}

          {/* Stereo dB VU Meter Bar */}
          <div className="p-3 bg-[#07080b] border-t border-white/[0.06]">
            <div className="flex justify-between items-center text-[10px] font-mono tabular-nums text-slate-500 mb-1">
              <span>-60 dB</span>
              <span>-30 dB</span>
              <span>-12 dB</span>
              <span>-6 dB</span>
              <span className={meterLevelDb > -1 ? 'text-rose-400 font-bold' : 'text-slate-500'}>0 dB CLIP</span>
            </div>
            <div className="relative w-full h-2 bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 transition-all duration-75"
                style={{
                  width: `${Math.max(0, Math.min(100, ((meterLevelDb + 60) / 60) * 100))}%`,
                }}
              />
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white"
                style={{
                  left: `${Math.max(0, Math.min(99, ((peakHoldDb + 60) / 60) * 100))}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Input Gain Calibration & Device Selector */}
        <div className="bg-[var(--card-secondary)] p-4 rounded-xl border border-[var(--border-subtle)] mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Input Device */}
            <div>
              <label className="text-[11px] text-[var(--text-secondary)] block mb-1">Microphone Input</label>
              <select
                value={selectedDeviceId}
                disabled={isRecording}
                onChange={e => setSelectedDeviceId(e.target.value)}
                className="w-full bg-[var(--card-bg)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-400 disabled:opacity-40"
              >
                {audioDevices.map(d => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Microphone (${d.deviceId.slice(0, 6)}...)`}
                  </option>
                ))}
              </select>
            </div>

            {/* Input Gain Slider */}
            <div>
              <div className="flex justify-between items-center mb-1 text-[11px]">
                <span className="text-[var(--text-secondary)]">Input Pre-Amp Gain</span>
                <span className="font-mono tabular-nums text-cyan-500 dark:text-cyan-400 font-bold">
                  {inputGainDb > 0 ? `+${inputGainDb}` : inputGainDb} dB
                </span>
              </div>
              <input
                type="range"
                min={-12}
                max={12}
                step={1}
                value={inputGainDb}
                onChange={e => setInputGainDb(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400 my-1.5"
              />
              <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                <span>-12 dB</span>
                <span>0 dB (Unity)</span>
                <span>+12 dB</span>
              </div>
            </div>
          </div>

          {/* Audio Constraints Toggles with ToggleSwitch */}
          <div className="flex flex-wrap items-center gap-6 text-xs pt-3 border-t border-[var(--border-subtle)]">
            <ToggleSwitch
              checked={echoCancellation}
              onChange={setEchoCancellation}
              disabled={isRecording}
              label="Echo Cancellation"
              size="sm"
            />

            <ToggleSwitch
              checked={noiseSuppression}
              onChange={setNoiseSuppression}
              disabled={isRecording}
              label="Noise Gate"
              size="sm"
            />

            <ToggleSwitch
              checked={autoGainControl}
              onChange={setAutoGainControl}
              disabled={isRecording}
              label="Auto Gain"
              size="sm"
            />
          </div>
        </div>

        {/* Take Review Scrubber (if take is recorded) */}
        {recordedBlob && !isRecording && (
          <div className="p-3.5 bg-[var(--card-secondary)] rounded-xl border border-[var(--border-subtle)] mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleTogglePreviewPlay}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-cyan-500 text-white shadow transition active:scale-95"
                title={isPreviewPlaying ? 'Pause Take' : 'Play Take Preview'}
              >
                {isPreviewPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <div>
                <div className="text-xs font-semibold text-[var(--text-primary)]">Review Captured Take</div>
                <div className="text-[11px] font-mono tabular-nums text-[var(--text-muted)]">
                  {formatTime(previewCurrentTime)} / {formatTime(previewBuffer?.duration || 0)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadBlob(recordedBlob, 'take_recording.webm')}
                className="p-2 rounded-lg bg-[var(--card-bg)] hover:bg-[var(--btn-hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs border border-[var(--border-subtle)] transition active:scale-95"
                title="Download raw take"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={handleSendToEditor}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--text-primary)] text-[var(--bg-canvas)] hover:opacity-90 active:scale-95 font-semibold text-xs shadow transition"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Open in Workstation</span>
              </button>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-3">
          {!isRecording ? (
            <button
              onClick={handleInitiateRecording}
              disabled={countdown !== null}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--text-primary)] text-[var(--bg-canvas)] hover:opacity-90 active:scale-95 font-semibold text-xs shadow transition"
            >
              <Mic className="w-4 h-4 text-rose-500" />
              <span>{recordedBlob ? 'Record New Take (3s Pre-Roll)' : 'Start Recording (3s Pre-Roll)'}</span>
            </button>
          ) : (
            <>
              <button
                onClick={isPaused ? resumeRecording : pauseRecording}
                className="px-4 py-3 rounded-xl bg-[var(--card-secondary)] hover:bg-[var(--btn-hover-bg)] text-[var(--text-primary)] border border-[var(--border-subtle)] text-xs font-semibold transition active:scale-95"
              >
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              <button
                onClick={stopRecording}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow transition active:scale-95"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Stop Recording</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
