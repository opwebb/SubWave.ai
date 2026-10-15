import React, { useState } from 'react';
import { SplitMarker, SplitResultTrack } from '../types/audio';
import { SilenceAnalysisResult } from '../utils/silenceDetector';
import { formatTime } from '../utils/audioCore';
import { 
  Split, 
  Clock, 
  Download, 
  Archive, 
  Play, 
  Pause, 
  Sparkles,
  MapPin
} from 'lucide-react';
import { downloadBlob } from '../utils/audioSplitter';

interface SplitterPanelProps {
  audioBuffer: AudioBuffer | null;
  silenceAnalysis: SilenceAnalysisResult | null;
  markers: SplitMarker[];
  splitTracks: SplitResultTrack[];
  onGenerateSplit: (mode: 'silence' | 'equal' | 'markers', param?: number, format?: 'wav' | 'mp3') => void;
  onDownloadZip: () => void;
  isGeneratingZip: boolean;
  onPreviewTrack: (track: SplitResultTrack) => void;
  playingTrackId: string | null;
}

export const SplitterPanel: React.FC<SplitterPanelProps> = ({
  audioBuffer,
  silenceAnalysis,
  markers,
  splitTracks,
  onGenerateSplit,
  onDownloadZip,
  isGeneratingZip,
  onPreviewTrack,
  playingTrackId,
}) => {
  const [splitMode, setSplitMode] = useState<'silence' | 'equal' | 'markers'>('silence');
  const [equalDurationSec, setEqualDurationSec] = useState<number>(30);
  const [splitFormat, setSplitFormat] = useState<'wav' | 'mp3'>('wav');

  const duration = audioBuffer ? audioBuffer.duration : 0;

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-subtle)] rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-xl transition-colors">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
            <span>Automatic Track Splitter & Batch Exporter</span>
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Segment audio files automatically by detected silence, equal intervals, or cue markers. Export individually or bundle into a single ZIP archive.
          </p>
        </div>

        {splitTracks.length > 0 && (
          <button
            onClick={onDownloadZip}
            disabled={isGeneratingZip}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--text-primary)] text-[var(--bg-canvas)] hover:opacity-90 active:scale-95 font-semibold text-xs shadow transition disabled:opacity-50"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>{isGeneratingZip ? 'Generating ZIP...' : `Download ${splitTracks.length} Parts (.ZIP)`}</span>
          </button>
        )}
      </div>

      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <button
          onClick={() => setSplitMode('silence')}
          className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition active:scale-[0.99] ${
            splitMode === 'silence'
              ? 'bg-[var(--card-secondary)] border-cyan-400/60 shadow-sm'
              : 'bg-[var(--card-secondary)] hover:bg-[var(--btn-hover-bg)] border-[var(--border-subtle)]'
          }`}
        >
          <Sparkles className={`w-4 h-4 mt-0.5 shrink-0 ${splitMode === 'silence' ? 'text-cyan-500 dark:text-cyan-400' : 'text-[var(--text-muted)]'}`} />
          <div>
            <div className="text-xs font-semibold text-[var(--text-primary)]">Silence Intervals</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Auto-separates speech takes ({silenceAnalysis ? silenceAnalysis.speechSegments.length : 0} parts)
            </div>
          </div>
        </button>

        <button
          onClick={() => setSplitMode('equal')}
          className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition active:scale-[0.99] ${
            splitMode === 'equal'
              ? 'bg-[var(--card-secondary)] border-cyan-400/60 shadow-sm'
              : 'bg-[var(--card-secondary)] hover:bg-[var(--btn-hover-bg)] border-[var(--border-subtle)]'
          }`}
        >
          <Clock className={`w-4 h-4 mt-0.5 shrink-0 ${splitMode === 'equal' ? 'text-cyan-500 dark:text-cyan-400' : 'text-[var(--text-muted)]'}`} />
          <div>
            <div className="text-xs font-semibold text-[var(--text-primary)]">Equal Duration</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Cut into fixed time slices (e.g. 30s, 60s, 5m)
            </div>
          </div>
        </button>

        <button
          onClick={() => setSplitMode('markers')}
          className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition active:scale-[0.99] ${
            splitMode === 'markers'
              ? 'bg-[var(--card-secondary)] border-cyan-400/60 shadow-sm'
              : 'bg-[var(--card-secondary)] hover:bg-[var(--btn-hover-bg)] border-[var(--border-subtle)]'
          }`}
        >
          <MapPin className={`w-4 h-4 mt-0.5 shrink-0 ${splitMode === 'markers' ? 'text-cyan-500 dark:text-cyan-400' : 'text-[var(--text-muted)]'}`} />
          <div>
            <div className="text-xs font-semibold text-[var(--text-primary)]">Cue Markers</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Cut at user-placed points ({markers.length} markers)
            </div>
          </div>
        </button>
      </div>

      {/* Mode Settings & Format Selection Bar */}
      <div className="bg-[var(--card-secondary)] p-4 rounded-xl border border-[var(--border-subtle)] mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Format Picker */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[var(--text-primary)]">Output Format:</span>
            <div className="flex items-center p-0.5 bg-[var(--card-bg)] rounded-lg border border-[var(--border-subtle)]">
              <button
                onClick={() => setSplitFormat('wav')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  splitFormat === 'wav'
                    ? 'bg-cyan-500 text-white font-semibold shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Lossless WAV
              </button>
              <button
                onClick={() => setSplitFormat('mp3')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  splitFormat === 'mp3'
                    ? 'bg-cyan-500 text-white font-semibold shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Universal MP3
              </button>
            </div>
          </div>

          {splitMode === 'equal' && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-[var(--text-secondary)]">Interval:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {[15, 30, 60, 180, 300].map(sec => (
                  <button
                    key={sec}
                    onClick={() => setEqualDurationSec(sec)}
                    className={`px-2 py-1 rounded-md text-xs font-mono tabular-nums border transition active:scale-95 ${
                      equalDurationSec === sec
                        ? 'bg-[var(--text-primary)] text-[var(--bg-canvas)] border-[var(--text-primary)] font-bold shadow-sm'
                        : 'bg-[var(--card-bg)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {sec >= 60 ? `${sec / 60}m` : `${sec}s`}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  max={Math.max(60, Math.floor(duration))}
                  value={equalDurationSec}
                  onChange={e => setEqualDurationSec(Math.max(1, parseInt(e.target.value) || 10))}
                  className="w-14 bg-[var(--card-bg)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded px-1.5 py-1 text-xs font-mono tabular-nums text-center focus:outline-none focus:border-cyan-400"
                />
                <span className="text-xs text-[var(--text-muted)]">sec</span>
              </div>
            </div>
          )}

          {splitMode === 'markers' && (
            <span className="text-xs text-[var(--text-muted)]">
              {markers.length > 0 ? `${markers.length} markers placed` : 'Double-click waveform to add markers'}
            </span>
          )}
        </div>

        <button
          onClick={() => onGenerateSplit(splitMode, equalDurationSec, splitFormat)}
          disabled={!audioBuffer || (splitMode === 'markers' && markers.length === 0)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--text-primary)] text-[var(--bg-canvas)] hover:opacity-90 active:scale-95 font-semibold text-xs shadow transition disabled:opacity-30 disabled:pointer-events-none"
        >
          <Split className="w-3.5 h-3.5" />
          <span>Generate {splitFormat.toUpperCase()} Tracks</span>
        </button>
      </div>

      {/* Generated Tracks List */}
      {splitTracks.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] px-1 mb-1">
            <span>Generated Tracks · {splitTracks.length} files ({splitTracks[0]?.name.split('.').pop()?.toUpperCase() || 'WAV'})</span>
            <span className="font-mono tabular-nums">Total Duration: {formatTime(duration)}</span>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
            {splitTracks.map(track => {
              const isPlaying = playingTrackId === track.id;
              return (
                <div
                  key={track.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[var(--card-secondary)] border border-[var(--border-subtle)] hover:border-[var(--border-highlight)] transition"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onPreviewTrack(track)}
                      className={`p-2 rounded-full transition active:scale-95 ${
                        isPlaying
                          ? 'bg-cyan-500 text-white shadow'
                          : 'bg-[var(--card-bg)] hover:bg-[var(--btn-hover-bg)] text-[var(--text-primary)] border border-[var(--border-subtle)]'
                      }`}
                      title={isPlaying ? 'Pause' : 'Play preview'}
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                    </button>
                    <div>
                      <div className="text-xs font-semibold text-[var(--text-primary)]">{track.name}</div>
                      <div className="text-[11px] font-mono tabular-nums text-[var(--text-muted)]">
                        {formatTime(track.start)} → {formatTime(track.end)} ({formatTime(track.duration)})
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (track.blob) downloadBlob(track.blob, track.name);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--card-bg)] hover:bg-[var(--btn-hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium border border-[var(--border-subtle)] transition active:scale-95"
                      title="Download this single track"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-[var(--text-muted)] text-xs border border-dashed border-[var(--border-subtle)] rounded-xl">
          No split tracks generated yet. Choose a mode and format above, then click &quot;Generate Split Tracks&quot;.
        </div>
      )}
    </div>
  );
};
