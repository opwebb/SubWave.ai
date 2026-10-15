import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Repeat, 
  Volume2, 
  VolumeX, 
  FastForward, 
  Rewind, 
  Undo2, 
  Redo2,
  Bookmark
} from 'lucide-react';
import { formatTime } from '../utils/audioCore';

interface AudioPlayerControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStop: () => void;
  currentTime: number;
  duration: number;
  volume: number;
  onChangeVolume: (val: number) => void;
  playbackRate: number;
  onChangePlaybackRate: (rate: number) => void;
  isLooping: boolean;
  onToggleLoop: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSkipBack: (sec?: number) => void;
  onSkipForward: (sec?: number) => void;
  hasSelection: boolean;
  onPlaySelection?: () => void;
}

export const AudioPlayerControls: React.FC<AudioPlayerControlsProps> = ({
  isPlaying,
  onTogglePlay,
  onStop,
  currentTime,
  duration,
  volume,
  onChangeVolume,
  playbackRate,
  onChangePlaybackRate,
  isLooping,
  onToggleLoop,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSkipBack,
  onSkipForward,
  hasSelection,
  onPlaySelection,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 bg-[var(--card-bg)] border border-[var(--border-subtle)] rounded-2xl shadow-xl backdrop-blur-xl transition-colors">
      {/* Group 1: Undo / Redo & Selection Play */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg bg-[var(--card-secondary)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border-subtle)] disabled:opacity-25 disabled:pointer-events-none text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium transition active:scale-95"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Undo</span>
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg bg-[var(--card-secondary)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border-subtle)] disabled:opacity-25 disabled:pointer-events-none text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium transition active:scale-95"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Redo</span>
          </button>
        </div>

        {hasSelection && onPlaySelection && (
          <button
            onClick={onPlaySelection}
            className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-500 dark:text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition active:scale-95"
            title="Play Selection Range Only"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Play Selection</span>
          </button>
        )}
      </div>

      {/* Group 2: Main Transport Controls */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => onSkipBack(5)}
            className="p-2 sm:p-2.5 rounded-lg hover:bg-[var(--btn-hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition active:scale-95"
            title="Rewind 5s (←)"
            aria-label="Rewind 5 seconds"
          >
            <Rewind className="w-4 h-4" />
          </button>

          <button
            onClick={onStop}
            className="p-2 sm:p-2.5 rounded-lg hover:bg-[var(--btn-hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition active:scale-95"
            title="Stop & Reset to Start"
            aria-label="Stop audio"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Main Play / Pause Button */}
          <button
            onClick={onTogglePlay}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-[var(--text-primary)] text-[var(--bg-canvas)] shadow-md hover:opacity-90 active:scale-95 transition"
            title="Play / Pause (Spacebar)"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current translate-x-0.5" />
            )}
          </button>

          <button
            onClick={() => onSkipForward(5)}
            className="p-2 sm:p-2.5 rounded-lg hover:bg-[var(--btn-hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition active:scale-95"
            title="Fast Forward 5s (→)"
            aria-label="Fast forward 5 seconds"
          >
            <FastForward className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleLoop}
            className={`p-2 sm:p-2.5 rounded-lg transition active:scale-95 ${
              isLooping 
                ? 'bg-cyan-500/15 text-cyan-500 dark:text-cyan-400 border border-cyan-500/40' 
                : 'hover:bg-[var(--btn-hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title={isLooping ? 'Looping Enabled' : 'Enable Loop'}
            aria-label="Toggle loop"
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Timecode Readout */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--card-secondary)] border border-[var(--border-subtle)] font-mono tabular-nums text-xs select-none">
          <span className="text-[var(--text-primary)] font-semibold">{formatTime(currentTime)}</span>
          <span className="text-[var(--text-muted)]">/</span>
          <span className="text-[var(--text-secondary)]">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Group 3: Volume & Speed Controls */}
      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto">
        {/* Speed Selector */}
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
          <span className="hidden xs:inline">Speed</span>
          <select
            value={playbackRate}
            onChange={e => onChangePlaybackRate(parseFloat(e.target.value))}
            className="bg-[var(--card-secondary)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-lg px-2 py-1 font-mono tabular-nums text-xs focus:outline-none focus:border-cyan-400 cursor-pointer transition"
          >
            <option value="0.5">0.5x</option>
            <option value="0.75">0.75x</option>
            <option value="1">1.0x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2.0x</option>
          </select>
        </div>

        {/* Volume Slider */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onChangeVolume(volume > 0 ? 0 : 1)}
            className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            title={volume === 0 ? 'Unmute' : 'Mute'}
            aria-label="Mute toggle"
          >
            {volume === 0 ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={e => onChangeVolume(parseFloat(e.target.value))}
            className="w-16 sm:w-20 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            title={`Volume: ${Math.round(volume * 100)}%`}
          />
        </div>
      </div>
    </div>
  );
};
