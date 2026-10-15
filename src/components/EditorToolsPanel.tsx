import React, { useState } from 'react';
import { 
  Scissors, 
  Copy, 
  Clipboard, 
  Trash2, 
  VolumeX, 
  TrendingUp, 
  TrendingDown, 
  Maximize, 
  RotateCw,
  Gauge,
  Sparkles
} from 'lucide-react';

interface EditorToolsPanelProps {
  hasSelection: boolean;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDelete: () => void;
  onTrim: () => void;
  onSilenceRegion: () => void;
  onFadeIn: () => void;
  onFadeOut: () => void;
  onNormalize: () => void;
  onApplyGain: (gainDb: number) => void;
  onReverse: () => void;
  onChangeSpeed: (multiplier: number) => void;
  hasClipboard: boolean;
  isProcessing: boolean;
}

export const EditorToolsPanel: React.FC<EditorToolsPanelProps> = ({
  hasSelection,
  onCut,
  onCopy,
  onPaste,
  onDelete,
  onTrim,
  onSilenceRegion,
  onFadeIn,
  onFadeOut,
  onNormalize,
  onApplyGain,
  onReverse,
  onChangeSpeed,
  hasClipboard,
  isProcessing,
}) => {
  const [gainDb, setGainDb] = useState<number>(3);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.25);

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-subtle)] rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-xl transition-colors">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
            <span>Direct Waveform Editing & DSP Effects</span>
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Precision audio editing: trim, splice, fade, volume boost, normalize, and reverse selection with instant undo.
          </p>
        </div>

        <div className="text-xs text-[var(--text-muted)]">
          {hasSelection ? (
            <span className="text-cyan-500 dark:text-cyan-400 font-semibold">Range Selected</span>
          ) : (
            <span>Tip: Drag on waveform to select a range</span>
          )}
        </div>
      </div>

      {/* Primary Cut / Copy / Paste / Trim Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 mb-6">
        <button
          onClick={onCut}
          disabled={!hasSelection || isProcessing}
          className="flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-xl bg-[var(--card-secondary)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border-subtle)] hover:border-cyan-400/50 disabled:opacity-20 disabled:pointer-events-none text-[var(--text-primary)] transition active:scale-95 group"
          title="Cut selection (Ctrl+X)"
        >
          <Scissors className="w-4 h-4 text-cyan-500 dark:text-cyan-400 mb-1 group-hover:scale-110 transition" />
          <span className="text-xs font-semibold">Cut</span>
          <span className="text-[10px] text-[var(--text-muted)] font-mono">Ctrl+X</span>
        </button>

        <button
          onClick={onCopy}
          disabled={!hasSelection || isProcessing}
          className="flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-xl bg-[var(--card-secondary)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border-subtle)] hover:border-cyan-400/50 disabled:opacity-20 disabled:pointer-events-none text-[var(--text-primary)] transition active:scale-95 group"
          title="Copy selection (Ctrl+C)"
        >
          <Copy className="w-4 h-4 text-cyan-500 dark:text-cyan-400 mb-1 group-hover:scale-110 transition" />
          <span className="text-xs font-semibold">Copy</span>
          <span className="text-[10px] text-[var(--text-muted)] font-mono">Ctrl+C</span>
        </button>

        <button
          onClick={onPaste}
          disabled={!hasClipboard || isProcessing}
          className="flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-xl bg-[var(--card-secondary)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border-subtle)] hover:border-cyan-400/50 disabled:opacity-20 disabled:pointer-events-none text-[var(--text-primary)] transition active:scale-95 group"
          title="Paste at playhead (Ctrl+V)"
        >
          <Clipboard className="w-4 h-4 text-cyan-500 dark:text-cyan-400 mb-1 group-hover:scale-110 transition" />
          <span className="text-xs font-semibold">Paste</span>
          <span className="text-[10px] text-[var(--text-muted)] font-mono">Ctrl+V</span>
        </button>

        <button
          onClick={onTrim}
          disabled={!hasSelection || isProcessing}
          className="flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-xl bg-[var(--card-secondary)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border-subtle)] hover:border-emerald-400/50 disabled:opacity-20 disabled:pointer-events-none text-[var(--text-primary)] transition active:scale-95 group"
          title="Trim (keep only selected region)"
        >
          <Maximize className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mb-1 group-hover:scale-110 transition" />
          <span className="text-xs font-semibold">Trim</span>
          <span className="text-[10px] text-[var(--text-muted)]">Keep Selection</span>
        </button>

        <button
          onClick={onDelete}
          disabled={!hasSelection || isProcessing}
          className="flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-xl bg-[var(--card-secondary)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border-subtle)] hover:border-rose-400/50 disabled:opacity-20 disabled:pointer-events-none text-[var(--text-primary)] transition active:scale-95 group"
          title="Delete selected region"
        >
          <Trash2 className="w-4 h-4 text-rose-500 dark:text-rose-400 mb-1 group-hover:scale-110 transition" />
          <span className="text-xs font-semibold">Delete</span>
          <span className="text-[10px] text-[var(--text-muted)] font-mono">Del</span>
        </button>

        <button
          onClick={onSilenceRegion}
          disabled={!hasSelection || isProcessing}
          className="flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-xl bg-[var(--card-secondary)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border-subtle)] hover:border-amber-400/50 disabled:opacity-20 disabled:pointer-events-none text-[var(--text-primary)] transition active:scale-95 group"
          title="Mute selection in-place"
        >
          <VolumeX className="w-4 h-4 text-amber-500 dark:text-amber-400 mb-1 group-hover:scale-110 transition" />
          <span className="text-xs font-semibold">Silence</span>
          <span className="text-[10px] text-[var(--text-muted)]">Mute Region</span>
        </button>
      </div>

      {/* DSP Effects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Transitions & Levels */}
        <div className="bg-[var(--card-secondary)] p-4 rounded-xl border border-[var(--border-subtle)] space-y-2.5">
          <span className="text-xs font-bold text-[var(--text-primary)] block mb-2">Transitions & Levels</span>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onFadeIn}
              disabled={isProcessing}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[var(--card-bg)] hover:bg-[var(--btn-hover-bg)] text-[var(--text-primary)] text-xs font-medium border border-[var(--border-subtle)] transition active:scale-95"
            >
              <TrendingUp className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
              <span>Fade In</span>
            </button>

            <button
              onClick={onFadeOut}
              disabled={isProcessing}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[var(--card-bg)] hover:bg-[var(--btn-hover-bg)] text-[var(--text-primary)] text-xs font-medium border border-[var(--border-subtle)] transition active:scale-95"
            >
              <TrendingDown className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
              <span>Fade Out</span>
            </button>
          </div>

          <button
            onClick={onNormalize}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[var(--text-primary)] text-[var(--bg-canvas)] hover:opacity-90 active:scale-95 text-xs font-semibold shadow transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Normalize Peak (-0.1 dB)</span>
          </button>

          <button
            onClick={onReverse}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[var(--card-bg)] hover:bg-[var(--btn-hover-bg)] text-[var(--text-primary)] text-xs font-medium border border-[var(--border-subtle)] transition active:scale-95"
          >
            <RotateCw className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>Reverse Audio</span>
          </button>
        </div>

        {/* Volume / Gain Booster */}
        <div className="bg-[var(--card-secondary)] p-4 rounded-xl border border-[var(--border-subtle)]">
          <div className="flex justify-between items-center mb-1 text-xs">
            <span className="font-bold text-[var(--text-primary)]">Volume / Gain Boost</span>
            <span className="font-mono tabular-nums text-cyan-500 dark:text-cyan-400 font-bold">{gainDb > 0 ? `+${gainDb}` : gainDb} dB</span>
          </div>
          <input
            type="range"
            min={-18}
            max={18}
            step={1}
            value={gainDb}
            onChange={e => setGainDb(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400 my-2"
          />
          <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-3">
            <span>-18 dB</span>
            <span>0 dB</span>
            <span>+18 dB</span>
          </div>

          <div className="flex gap-2">
            {[3, 6, 9].map(db => (
              <button
                key={db}
                onClick={() => onApplyGain(db)}
                disabled={isProcessing}
                className="flex-1 py-1.5 px-2 rounded-md bg-[var(--card-bg)] hover:bg-[var(--btn-hover-bg)] text-[var(--text-primary)] text-xs font-mono tabular-nums border border-[var(--border-subtle)] transition active:scale-95"
              >
                +{db}dB
              </button>
            ))}
            <button
              onClick={() => onApplyGain(gainDb)}
              disabled={isProcessing}
              className="flex-1 py-1.5 px-3 rounded-lg bg-[var(--text-primary)] text-[var(--bg-canvas)] hover:opacity-90 active:scale-95 text-xs font-semibold shadow transition"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Speed / Tempo Multiplier */}
        <div className="bg-[var(--card-secondary)] p-4 rounded-xl border border-[var(--border-subtle)]">
          <div className="flex justify-between items-center mb-1 text-xs">
            <span className="font-bold text-[var(--text-primary)]">Tempo / Speed Warp</span>
            <span className="font-mono tabular-nums text-cyan-500 dark:text-cyan-400 font-bold">{speedMultiplier}x</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={2.0}
            step={0.05}
            value={speedMultiplier}
            onChange={e => setSpeedMultiplier(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400 my-2"
          />
          <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-3">
            <span>0.5x</span>
            <span>1.0x</span>
            <span>2.0x</span>
          </div>

          <button
            onClick={() => onChangeSpeed(speedMultiplier)}
            disabled={isProcessing || speedMultiplier === 1.0}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-[var(--text-primary)] text-[var(--bg-canvas)] hover:opacity-90 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-xs font-semibold shadow transition"
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Process Speed Change</span>
          </button>
        </div>
      </div>
    </div>
  );
};
