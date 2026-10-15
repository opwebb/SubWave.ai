import React, { useState } from 'react';
import { Layers, Check, Compass, Zap } from 'lucide-react';
import { StereoMode } from '../types/audio';

interface ChannelConverterPanelProps {
  audioBuffer: AudioBuffer | null;
  onApplyChannelMode: (mode: StereoMode) => void;
  onApplyStereoImage: (pan: number, width: number) => void;
  isProcessing: boolean;
}

export const ChannelConverterPanel: React.FC<ChannelConverterPanelProps> = ({
  audioBuffer,
  onApplyChannelMode,
  onApplyStereoImage,
  isProcessing,
}) => {
  const [pan, setPan] = useState<number>(0);
  const [width, setWidth] = useState<number>(1);

  const channels = audioBuffer ? audioBuffer.numberOfChannels : 2;

  const modes: { id: StereoMode; label: string; desc: string }[] = [
    {
      id: 'mix',
      label: 'Sum to Mono (L + R / 2)',
      desc: 'Blends both left and right channels into a single centered mono track. Perfect for podcasts and voiceover distribution.',
    },
    {
      id: 'left',
      label: 'Extract Left Channel Only',
      desc: 'Discards right channel. Ideal when a voiceover or single mic was recorded strictly to channel 1 / Left.',
    },
    {
      id: 'right',
      label: 'Extract Right Channel Only',
      desc: 'Discards left channel. Useful for isolated dual-mic recordings recorded strictly to channel 2 / Right.',
    },
    {
      id: 'swap',
      label: 'Swap Left & Right Channels',
      desc: 'Inverts stereo positioning (Left becomes Right, Right becomes Left).',
    },
    {
      id: 'invert-phase',
      label: 'Invert Right Phase (180°)',
      desc: 'Flips polarity of the right channel to correct out-of-phase stereo mic setups.',
    },
  ];

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-subtle)] rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-xl transition-colors">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
            <span>Stereo to Mono & Spatial Channel Routing</span>
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Convert stereo audio to mono, isolate specific microphone channels, adjust spatial width, and fix polarity phase cancellation.
          </p>
        </div>

        <div className="text-xs font-mono tabular-nums text-[var(--text-secondary)]">
          Source: <span className="text-[var(--text-primary)] font-semibold">{channels === 1 ? '1 Channel (Mono)' : '2 Channels (Stereo)'}</span>
        </div>
      </div>

      {/* Channel Converter Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {modes.map(mode => (
          <button
            key={mode.id}
            onClick={() => onApplyChannelMode(mode.id)}
            disabled={isProcessing || !audioBuffer}
            className="group flex flex-col justify-between p-4 rounded-xl bg-[var(--card-secondary)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border-subtle)] hover:border-cyan-400/50 text-left transition active:scale-[0.99] disabled:opacity-30 disabled:pointer-events-none"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-[var(--text-primary)] group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition">
                  {mode.label}
                </span>
                <Zap className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition shrink-0 ml-2" />
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{mode.desc}</p>
            </div>
            <div className="mt-4 pt-2 border-t border-[var(--border-subtle)] flex items-center text-[10px] font-semibold text-cyan-500 dark:text-cyan-400 group-hover:translate-x-0.5 transition">
              <span>Apply conversion</span> →
            </div>
          </button>
        ))}
      </div>

      {/* Stereo Width & Pan Sliders */}
      <div className="bg-[var(--card-secondary)] p-4 rounded-xl border border-[var(--border-subtle)]">
        <h3 className="text-xs font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
          <Compass className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
          <span>Stereo Panning & Width Enhancer</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          {/* Pan Slider */}
          <div>
            <div className="flex justify-between items-center mb-1 text-xs">
              <span className="text-[var(--text-primary)] font-medium">Pan Balance (L / R)</span>
              <span className="font-mono tabular-nums text-cyan-500 dark:text-cyan-400 font-bold">
                {pan === 0 ? 'Center (0)' : pan < 0 ? `${Math.round(Math.abs(pan) * 100)}% Left` : `${Math.round(pan * 100)}% Right`}
              </span>
            </div>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.05}
              value={pan}
              onChange={e => setPan(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400 my-2"
            />
            <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1">
              <span>100% Left</span>
              <span>Center</span>
              <span>100% Right</span>
            </div>
          </div>

          {/* Width Slider */}
          <div>
            <div className="flex justify-between items-center mb-1 text-xs">
              <span className="text-[var(--text-primary)] font-medium">Stereo Field Width</span>
              <span className="font-mono tabular-nums text-cyan-500 dark:text-cyan-400 font-bold">
                {width === 0 ? '0% (Mono)' : width === 1 ? '100% (Natural)' : `${Math.round(width * 100)}% (Wide)`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={2}
              step={0.05}
              value={width}
              onChange={e => setWidth(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400 my-2"
            />
            <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1">
              <span>0% Mono</span>
              <span>100% Natural</span>
              <span>200% Super-Wide</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => onApplyStereoImage(pan, width)}
            disabled={isProcessing || !audioBuffer}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[var(--text-primary)] text-[var(--bg-canvas)] hover:opacity-90 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-xs font-semibold shadow transition"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Spatial Adjustments</span>
          </button>
        </div>
      </div>
    </div>
  );
};
