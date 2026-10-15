import React from 'react';
import { DenoiseConfig } from '../types/audio';
import { ShieldAlert, Activity, Sparkles } from 'lucide-react';
import { ToggleSwitch } from './ui/ToggleSwitch';

interface NoiseRemoverPanelProps {
  config: DenoiseConfig;
  onChangeConfig: (newConfig: DenoiseConfig) => void;
  onApplyDenoise: () => void;
  isProcessing: boolean;
  audioBuffer: AudioBuffer | null;
}

export const NoiseRemoverPanel: React.FC<NoiseRemoverPanelProps> = ({
  config,
  onChangeConfig,
  onApplyDenoise,
  isProcessing,
  audioBuffer,
}) => {
  const presets = [
    {
      name: 'Podcast Voice Clean',
      cfg: {
        enableHighPass: true,
        highPassFreq: 85,
        enableLowPass: true,
        lowPassFreq: 11000,
        deHumFreq: '60hz' as const,
        noiseGateThresholdDb: -42,
        noiseGateReductionDb: -16,
        voiceClarityBoost: true,
      },
    },
    {
      name: 'AC & Fan Rumble Killer',
      cfg: {
        enableHighPass: true,
        highPassFreq: 110,
        enableLowPass: false,
        lowPassFreq: 12000,
        deHumFreq: 'none' as const,
        noiseGateThresholdDb: -40,
        noiseGateReductionDb: -18,
        voiceClarityBoost: false,
      },
    },
    {
      name: 'Mains Buzz & Hum Notch',
      cfg: {
        enableHighPass: true,
        highPassFreq: 70,
        enableLowPass: true,
        lowPassFreq: 10000,
        deHumFreq: '50hz' as const,
        noiseGateThresholdDb: -45,
        noiseGateReductionDb: -14,
        voiceClarityBoost: false,
      },
    },
    {
      name: 'Subtle Noise Gate Only',
      cfg: {
        enableHighPass: false,
        highPassFreq: 80,
        enableLowPass: false,
        lowPassFreq: 12000,
        deHumFreq: 'none' as const,
        noiseGateThresholdDb: -46,
        noiseGateReductionDb: -12,
        voiceClarityBoost: false,
      },
    },
  ];

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-subtle)] rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-xl transition-colors">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
            <span>Background Noise Remover & Studio Denoise</span>
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Multi-stage DSP filter chain: eliminate HVAC rumble, electrical grounding hum, high-frequency hiss, and unwanted room ambience.
          </p>
        </div>

        <button
          onClick={onApplyDenoise}
          disabled={isProcessing || !audioBuffer}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--text-primary)] text-[var(--bg-canvas)] hover:opacity-90 active:scale-95 font-semibold text-xs shadow transition disabled:opacity-30 disabled:pointer-events-none"
        >
          {isProcessing ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-[var(--bg-canvas)]/30 border-t-[var(--bg-canvas)] rounded-full animate-spin" />
              <span>Filtering Audio...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Apply Noise Reduction</span>
            </>
          )}
        </button>
      </div>

      {/* Presets */}
      <div className="mb-6">
        <label className="text-xs font-semibold text-[var(--text-secondary)] mb-2 block">Denoise Presets</label>
        <div className="flex flex-wrap gap-2">
          {presets.map(p => (
            <button
              key={p.name}
              onClick={() => onChangeConfig(p.cfg)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--card-secondary)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition active:scale-95"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Multi-Filter Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Module 1: High-Pass (Rumble Cut) */}
        <div className="bg-[var(--card-secondary)] p-4 rounded-xl border border-[var(--border-subtle)]">
          <div className="flex items-center justify-between mb-2">
            <ToggleSwitch
              checked={config.enableHighPass}
              onChange={checked => onChangeConfig({ ...config, enableHighPass: checked })}
              label="High-Pass Filter (Rumble & Thumps)"
              size="sm"
            />
            <span className="text-xs font-mono tabular-nums text-cyan-500 dark:text-cyan-400 font-bold">{config.highPassFreq} Hz</span>
          </div>
          <input
            type="range"
            min={40}
            max={200}
            step={5}
            disabled={!config.enableHighPass}
            value={config.highPassFreq}
            onChange={e => onChangeConfig({ ...config, highPassFreq: parseInt(e.target.value) })}
            className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-20 my-2"
          />
          <p className="text-[11px] text-[var(--text-muted)] mt-1">Cuts low air-conditioning, microphone vibrations, and sub-audible room reverberations.</p>
        </div>

        {/* Module 2: Low-Pass (Hiss Cut) */}
        <div className="bg-[var(--card-secondary)] p-4 rounded-xl border border-[var(--border-subtle)]">
          <div className="flex items-center justify-between mb-2">
            <ToggleSwitch
              checked={config.enableLowPass}
              onChange={checked => onChangeConfig({ ...config, enableLowPass: checked })}
              label="Low-Pass Filter (Hiss & Coil Whine)"
              size="sm"
            />
            <span className="text-xs font-mono tabular-nums text-cyan-500 dark:text-cyan-400 font-bold">{config.lowPassFreq} Hz</span>
          </div>
          <input
            type="range"
            min={6000}
            max={18000}
            step={250}
            disabled={!config.enableLowPass}
            value={config.lowPassFreq}
            onChange={e => onChangeConfig({ ...config, lowPassFreq: parseInt(e.target.value) })}
            className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-20 my-2"
          />
          <p className="text-[11px] text-[var(--text-muted)] mt-1">Gently dampens harsh high-end preamp hiss, fan whine, and electrical interference.</p>
        </div>

        {/* Module 3: Electrical Mains De-Hummer */}
        <div className="bg-[var(--card-secondary)] p-4 rounded-xl border border-[var(--border-subtle)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[var(--text-primary)]">Mains Hum Notch Filter</span>
            <span className="text-xs font-mono text-cyan-500 dark:text-cyan-400 capitalize font-semibold">{config.deHumFreq}</span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mb-3">
            Narrow notch filters at electrical power frequencies plus 2nd and 3rd harmonics.
          </p>
          <div className="flex gap-2">
            {[
              { id: 'none', label: 'Off' },
              { id: '50hz', label: '50 Hz (UK / EU / Asia)' },
              { id: '60hz', label: '60 Hz (US / Americas)' },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => onChangeConfig({ ...config, deHumFreq: opt.id as any })}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border transition active:scale-95 ${
                  config.deHumFreq === opt.id
                    ? 'bg-[var(--text-primary)] text-[var(--bg-canvas)] border-[var(--text-primary)] font-semibold shadow-sm'
                    : 'bg-[var(--card-bg)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Module 4: Spectral Noise Gate & Speech Clarity */}
        <div className="bg-[var(--card-secondary)] p-4 rounded-xl border border-[var(--border-subtle)]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-[var(--text-primary)]">Adaptive Spectral Noise Gate</span>
            <span className="text-xs font-mono tabular-nums text-cyan-500 dark:text-cyan-400 font-bold">{config.noiseGateThresholdDb} dB</span>
          </div>
          <input
            type="range"
            min={-70}
            max={-25}
            step={1}
            value={config.noiseGateThresholdDb}
            onChange={e => onChangeConfig({ ...config, noiseGateThresholdDb: parseInt(e.target.value) })}
            className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400 my-2"
          />
          <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-3">
            <span>Off (-70dB)</span>
            <span>Gentle (-45dB)</span>
            <span>Aggressive (-25dB)</span>
          </div>

          {/* Voice Clarity Toggle with ToggleSwitch */}
          <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
            <ToggleSwitch
              checked={config.voiceClarityBoost}
              onChange={checked => onChangeConfig({ ...config, voiceClarityBoost: checked })}
              label="Voice Intelligibility Boost (+3.2dB @ 3.2kHz)"
              size="sm"
            />
            <Activity className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
          </div>
        </div>
      </div>
    </div>
  );
};
