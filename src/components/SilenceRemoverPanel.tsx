import React, { useState } from 'react';
import { SilenceDetectionConfig } from '../types/audio';
import { SilenceAnalysisResult } from '../utils/silenceDetector';
import { formatTime } from '../utils/audioCore';
import { Sparkles, Trash2, FastForward, Split, Eye } from 'lucide-react';
import { ToggleSwitch } from './ui/ToggleSwitch';

interface SilenceRemoverPanelProps {
  config: SilenceDetectionConfig;
  onChangeConfig: (newConfig: SilenceDetectionConfig) => void;
  analysis: SilenceAnalysisResult | null;
  onApplyRemove: (mode: 'strip' | 'shorten', pauseLen?: number) => void;
  onSendToSplitter: () => void;
  isProcessing: boolean;
  highlightSilence: boolean;
  onToggleHighlight: () => void;
}

export const SilenceRemoverPanel: React.FC<SilenceRemoverPanelProps> = ({
  config,
  onChangeConfig,
  analysis,
  onApplyRemove,
  onSendToSplitter,
  isProcessing,
  highlightSilence,
  onToggleHighlight,
}) => {
  const [shortenPauseDuration, setShortenPauseDuration] = useState<number>(0.25);

  const presets = [
    { name: 'Studio Voiceover', db: -42, minSec: 0.3, pad: 0.08 },
    { name: 'Podcast / Interview', db: -35, minSec: 0.4, pad: 0.1 },
    { name: 'Lectures / Aggressive', db: -28, minSec: 0.25, pad: 0.05 },
  ];

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-subtle)] rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-xl transition-colors">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
            <span>AI Silence Detection & Pause Trimmer</span>
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Detects natural pauses, dead air, and hesitation gaps in real-time. Remove completely or shorten to natural breathing cadence.
          </p>
        </div>

        {/* Highlight toggle with modern switch */}
        <div className="flex items-center gap-2 bg-[var(--card-secondary)] px-3 py-1.5 rounded-xl border border-[var(--border-subtle)]">
          <Eye className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
          <ToggleSwitch
            checked={highlightSilence}
            onChange={onToggleHighlight}
            label={highlightSilence ? 'Overlay Visible' : 'Show Overlay'}
            size="sm"
          />
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="mb-6">
        <label className="text-xs font-semibold text-[var(--text-secondary)] mb-2 block">Detection Presets</label>
        <div className="flex flex-wrap gap-2">
          {presets.map(p => {
            const isSelected = config.thresholdDb === p.db && config.minSilenceDuration === p.minSec;
            return (
              <button
                key={p.name}
                onClick={() => {
                  onChangeConfig({
                    thresholdDb: p.db,
                    minSilenceDuration: p.minSec,
                    minSpeechDuration: 0.15,
                    paddingDuration: p.pad,
                  });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition active:scale-95 ${
                  isSelected
                    ? 'bg-[var(--text-primary)] text-[var(--bg-canvas)] border-[var(--text-primary)] font-semibold shadow-sm'
                    : 'bg-[var(--card-secondary)] hover:bg-[var(--btn-hover-bg)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {p.name} ({p.db}dB · {p.minSec}s)
              </button>
            );
          })}
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Silence Threshold (dB) */}
        <div className="bg-[var(--card-secondary)] p-4 rounded-xl border border-[var(--border-subtle)]">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-semibold text-[var(--text-primary)]">Silence Threshold</span>
            <span className="text-xs font-mono tabular-nums text-cyan-500 dark:text-cyan-400 font-bold">{config.thresholdDb} dB</span>
          </div>
          <input
            type="range"
            min={-60}
            max={-15}
            step={1}
            value={config.thresholdDb}
            onChange={e => onChangeConfig({ ...config, thresholdDb: parseInt(e.target.value) })}
            className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400 my-2"
          />
          <p className="text-[11px] text-[var(--text-muted)] mt-1">Lower = quieter pauses only; Higher = catches more room noise.</p>
        </div>

        {/* Min Silence Duration */}
        <div className="bg-[var(--card-secondary)] p-4 rounded-xl border border-[var(--border-subtle)]">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-semibold text-[var(--text-primary)]">Min Pause Length</span>
            <span className="text-xs font-mono tabular-nums text-cyan-500 dark:text-cyan-400 font-bold">{config.minSilenceDuration.toFixed(2)}s</span>
          </div>
          <input
            type="range"
            min={0.1}
            max={2.0}
            step={0.05}
            value={config.minSilenceDuration}
            onChange={e => onChangeConfig({ ...config, minSilenceDuration: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400 my-2"
          />
          <p className="text-[11px] text-[var(--text-muted)] mt-1">Gaps shorter than this are kept to prevent unnatural speech cuts.</p>
        </div>

        {/* Speech Boundary Padding */}
        <div className="bg-[var(--card-secondary)] p-4 rounded-xl border border-[var(--border-subtle)]">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-semibold text-[var(--text-primary)]">Boundary Safety Margin</span>
            <span className="text-xs font-mono tabular-nums text-cyan-500 dark:text-cyan-400 font-bold">{(config.paddingDuration * 1000).toFixed(0)} ms</span>
          </div>
          <input
            type="range"
            min={0.02}
            max={0.25}
            step={0.01}
            value={config.paddingDuration}
            onChange={e => onChangeConfig({ ...config, paddingDuration: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400 my-2"
          />
          <p className="text-[11px] text-[var(--text-muted)] mt-1">Preserves vocal plosives, breath intakes, and consonant endings.</p>
        </div>
      </div>

      {/* Analysis Results Display (Zero-Pill Typography) */}
      {analysis && (
        <div className="bg-[var(--card-secondary)] border border-[var(--border-subtle)] rounded-xl p-4 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <span className="text-[11px] text-[var(--text-muted)] block mb-0.5">Silence Detected</span>
              <span className="text-sm font-semibold font-mono tabular-nums text-rose-500 dark:text-rose-400">
                {formatTime(analysis.totalSilenceDuration)}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-[var(--text-muted)] block mb-0.5">Dead Air Cut</span>
              <span className="text-sm font-semibold font-mono tabular-nums text-amber-500 dark:text-amber-400">
                {analysis.silencePercentage.toFixed(1)}%
              </span>
            </div>

            <div>
              <span className="text-[11px] text-[var(--text-muted)] block mb-0.5">Isolated Speech Takes</span>
              <span className="text-sm font-semibold font-mono tabular-nums text-emerald-500 dark:text-emerald-400">
                {analysis.speechSegments.length} segments
              </span>
            </div>

            <div>
              <span className="text-[11px] text-[var(--text-muted)] block mb-0.5">Estimated Duration</span>
              <span className="text-sm font-semibold font-mono tabular-nums text-[var(--text-primary)]">
                {formatTime(Math.max(0, analysis.totalOriginalDuration - analysis.totalSilenceDuration))}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Strip All Silence */}
        <button
          onClick={() => onApplyRemove('strip')}
          disabled={isProcessing || !analysis || analysis.silentSegments.length === 0}
          className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[var(--text-primary)] text-[var(--bg-canvas)] hover:opacity-90 active:scale-95 disabled:opacity-30 disabled:pointer-events-none font-semibold text-xs shadow-md transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Remove Silence Completely</span>
        </button>

        {/* Shorten / Compress Silence */}
        <div className="flex-1 min-w-[260px] flex items-center gap-2 bg-[var(--card-secondary)] p-1.5 rounded-xl border border-[var(--border-subtle)]">
          <button
            onClick={() => onApplyRemove('shorten', shortenPauseDuration)}
            disabled={isProcessing || !analysis || analysis.silentSegments.length === 0}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--card-bg)] hover:bg-[var(--btn-hover-bg)] disabled:opacity-30 disabled:pointer-events-none text-[var(--text-primary)] text-xs font-medium border border-[var(--border-subtle)] transition active:scale-95"
          >
            <FastForward className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
            <span>Shorten Pauses To</span>
          </button>
          <div className="flex items-center gap-1 pr-2">
            <input
              type="number"
              min={0.1}
              max={1.0}
              step={0.05}
              value={shortenPauseDuration}
              onChange={e => setShortenPauseDuration(parseFloat(e.target.value) || 0.25)}
              className="w-14 bg-[var(--card-bg)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded px-1.5 py-1 text-xs font-mono tabular-nums text-center focus:outline-none focus:border-cyan-400"
            />
            <span className="text-xs text-[var(--text-muted)]">sec</span>
          </div>
        </div>

        {/* Send to Splitter */}
        <button
          onClick={onSendToSplitter}
          disabled={!analysis || analysis.speechSegments.length <= 1}
          className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-[var(--card-secondary)] hover:bg-[var(--btn-hover-bg)] disabled:opacity-30 disabled:pointer-events-none text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium border border-[var(--border-subtle)] transition active:scale-95"
        >
          <Split className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
          <span>Split into {analysis ? analysis.speechSegments.length : 0} Tracks</span>
        </button>
      </div>
    </div>
  );
};
