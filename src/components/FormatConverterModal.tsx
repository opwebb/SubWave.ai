import React, { useState } from 'react';
import { Download, X, FileAudio, HardDrive, Check, Sparkles, Loader2 } from 'lucide-react';
import { 
  exportAudioBuffer, 
  estimateFileSizeMb, 
  AudioExportFormat, 
  WavBitDepth, 
  Mp3Bitrate, 
  ExportChannelMode 
} from '../utils/audioEncoder';
import { downloadBlob } from '../utils/audioSplitter';

interface FormatConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
  audioBuffer: AudioBuffer | null;
  defaultFilename: string;
}

export const FormatConverterModal: React.FC<FormatConverterModalProps> = ({
  isOpen,
  onClose,
  audioBuffer,
  defaultFilename,
}) => {
  const [filename, setFilename] = useState<string>(
    defaultFilename ? defaultFilename.replace(/\.[^/.]+$/, '') : 'subwave_export'
  );
  const [format, setFormat] = useState<AudioExportFormat>('wav');
  const [wavBitDepth, setWavBitDepth] = useState<WavBitDepth>(16);
  const [mp3Bitrate, setMp3Bitrate] = useState<Mp3Bitrate>(192);
  const [channelMode, setChannelMode] = useState<ExportChannelMode>('keep');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  if (!isOpen || !audioBuffer) return null;

  const duration = audioBuffer.duration;
  const sampleRate = audioBuffer.sampleRate;
  const originalChannels = audioBuffer.numberOfChannels;
  const activeChannels = channelMode === 'mono' ? 1 : channelMode === 'stereo' ? 2 : originalChannels;

  const estimatedMb = estimateFileSizeMb(
    duration,
    sampleRate,
    activeChannels,
    format,
    wavBitDepth,
    mp3Bitrate
  );

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Small timeout to allow UI to render spinner
      await new Promise(r => setTimeout(r, 40));

      const result = await exportAudioBuffer(audioBuffer, {
        format,
        bitDepth: wavBitDepth,
        bitrate: mp3Bitrate,
        channelMode,
        filename,
      });

      downloadBlob(result.blob, result.filename);
      onClose();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[var(--card-bg)] border border-[var(--border-subtle)] rounded-2xl p-5 sm:p-6 shadow-2xl transition-colors max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          disabled={isExporting}
          className="absolute top-4 right-4 p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--btn-hover-bg)] transition disabled:opacity-30"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-500 dark:text-cyan-400 border border-cyan-500/30">
            <FileAudio className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">Master Audio Export</h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Lossless PCM rendering or universal compressed audio encoded directly in your browser.
            </p>
          </div>
        </div>

        {/* Filename Input */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1.5">File Name</label>
          <div className="flex items-center bg-[var(--card-secondary)] border border-[var(--border-subtle)] rounded-xl px-3 py-2.5">
            <input
              type="text"
              value={filename}
              onChange={e => setFilename(e.target.value)}
              className="w-full bg-transparent text-xs text-[var(--text-primary)] focus:outline-none font-medium"
              placeholder="subwave_export"
            />
            <span className="text-xs font-mono text-cyan-500 dark:text-cyan-400 font-bold ml-2">
              .{format}
            </span>
          </div>
        </div>

        {/* 1. Format Family Selector */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1.5">Target Format Extension</label>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              onClick={() => setFormat('wav')}
              className={`p-3 rounded-xl border text-left transition active:scale-[0.99] ${
                format === 'wav'
                  ? 'bg-[var(--card-secondary)] border-cyan-500 shadow-sm'
                  : 'bg-[var(--card-secondary)] hover:bg-[var(--btn-hover-bg)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-bold text-[var(--text-primary)]">Lossless WAV</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-semibold">.wav</span>
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">Uncompressed PCM master quality</div>
            </button>

            <button
              onClick={() => setFormat('mp3')}
              className={`p-3 rounded-xl border text-left transition active:scale-[0.99] ${
                format === 'mp3'
                  ? 'bg-[var(--card-secondary)] border-cyan-500 shadow-sm'
                  : 'bg-[var(--card-secondary)] hover:bg-[var(--btn-hover-bg)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-bold text-[var(--text-primary)]">Universal MP3</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-500 font-semibold">.mp3</span>
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">Plays on all phones & platforms</div>
            </button>

            <button
              onClick={() => setFormat('webm')}
              className={`p-3 rounded-xl border text-left transition active:scale-[0.99] ${
                format === 'webm'
                  ? 'bg-[var(--card-secondary)] border-cyan-500 shadow-sm'
                  : 'bg-[var(--card-secondary)] hover:bg-[var(--btn-hover-bg)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-bold text-[var(--text-primary)]">WebM Opus</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-500 font-semibold">.webm</span>
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">Next-gen web streaming audio</div>
            </button>
          </div>
        </div>

        {/* 2. Format Sub-options */}
        {format === 'wav' && (
          <div className="mb-5 p-3.5 bg-[var(--card-secondary)] rounded-xl border border-[var(--border-subtle)]">
            <label className="text-xs font-semibold text-[var(--text-primary)] block mb-2">
              Lossless Bit Depth Resolution
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 16, label: '16-bit PCM', desc: 'CD Standard (1411 kbps)' },
                { id: 24, label: '24-bit PCM', desc: 'Studio Master (2116 kbps)' },
                { id: 32, label: '32-bit Float', desc: 'Max Dynamic Headroom' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setWavBitDepth(f.id as WavBitDepth)}
                  className={`p-2.5 rounded-lg border text-left transition active:scale-95 ${
                    wavBitDepth === f.id
                      ? 'bg-[var(--text-primary)] text-[var(--bg-canvas)] border-[var(--text-primary)] shadow-sm'
                      : 'bg-[var(--card-bg)] hover:bg-[var(--btn-hover-bg)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <div className="text-xs font-bold">{f.label}</div>
                  <div className="text-[10px] opacity-80 mt-0.5">{f.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {format === 'mp3' && (
          <div className="mb-5 p-3.5 bg-[var(--card-secondary)] rounded-xl border border-[var(--border-subtle)]">
            <label className="text-xs font-semibold text-[var(--text-primary)] block mb-2">
              MP3 Audio Encoding Bitrate
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 128, label: '128 kbps', desc: 'Compact Voice / Fast DL' },
                { id: 192, label: '192 kbps', desc: 'Standard Hi-Fi Speech' },
                { id: 320, label: '320 kbps', desc: 'Broadcast Master Quality' },
              ].map(b => (
                <button
                  key={b.id}
                  onClick={() => setMp3Bitrate(b.id as Mp3Bitrate)}
                  className={`p-2.5 rounded-lg border text-left transition active:scale-95 ${
                    mp3Bitrate === b.id
                      ? 'bg-[var(--text-primary)] text-[var(--bg-canvas)] border-[var(--text-primary)] shadow-sm'
                      : 'bg-[var(--card-bg)] hover:bg-[var(--btn-hover-bg)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <div className="text-xs font-bold">{b.label}</div>
                  <div className="text-[10px] opacity-80 mt-0.5">{b.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {format === 'webm' && (
          <div className="mb-5 p-3.5 bg-[var(--card-secondary)] rounded-xl border border-[var(--border-subtle)]">
            <div className="flex items-center gap-2 text-xs text-[var(--text-primary)]">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="font-semibold">Opus Audio Codec (192 kbps VBR)</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              Encodes using native browser hardware Opus encoder with superior audio clarity at low bitrates.
            </p>
          </div>
        )}

        {/* 3. Channel Routing */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1.5">Channel Configuration</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'keep', label: `Keep Original (${originalChannels}ch)` },
              { id: 'mono', label: 'Force Mono (1ch)' },
              { id: 'stereo', label: 'Force Stereo (2ch)' },
            ].map(c => (
              <button
                key={c.id}
                onClick={() => setChannelMode(c.id as ExportChannelMode)}
                className={`p-2.5 rounded-xl border text-center text-xs font-medium transition active:scale-95 ${
                  channelMode === c.id
                    ? 'bg-[var(--text-primary)] text-[var(--bg-canvas)] border-[var(--text-primary)] font-bold shadow-sm'
                    : 'bg-[var(--card-secondary)] hover:bg-[var(--btn-hover-bg)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Estimated Output Specs Summary */}
        <div className="p-3.5 bg-[var(--card-secondary)] rounded-xl border border-[var(--border-subtle)] flex items-center justify-between text-xs font-mono tabular-nums text-[var(--text-secondary)] mb-6">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
            <span>Estimated Size: <strong className="text-[var(--text-primary)] font-bold font-mono">~{estimatedMb} MB</strong></span>
          </div>
          <div className="text-[11px] text-[var(--text-muted)]">
            {format.toUpperCase()} · {activeChannels === 1 ? 'Mono' : 'Stereo'} · {sampleRate} Hz
          </div>
        </div>

        {/* 5. Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2.5 rounded-xl bg-[var(--card-secondary)] hover:bg-[var(--btn-hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium border border-[var(--border-subtle)] transition active:scale-95 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--text-primary)] text-[var(--bg-canvas)] hover:opacity-90 active:scale-95 font-semibold text-xs shadow-md transition disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Encoding {format.toUpperCase()}...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download {format.toUpperCase()} ({estimatedMb} MB)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
