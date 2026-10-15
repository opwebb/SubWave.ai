import React from 'react';
import { 
  AudioWaveform, 
  ShieldCheck, 
  Sparkles, 
  Split, 
  Layers, 
  Mic, 
  Zap, 
  FileAudio, 
  Keyboard, 
  ArrowUp,
  Cpu,
  WifiOff,
  Sun,
  Moon,
  Palette
} from 'lucide-react';
import { ActiveToolTab, ThemeMode } from '../types/audio';

interface FooterProps {
  onSelectTab: (tab: ActiveToolTab) => void;
  onOpenShortcuts: () => void;
  onOpenRecorder: () => void;
  onOpenExporter: () => void;
  theme: ThemeMode;
  onChangeTheme: (theme: ThemeMode) => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectTab,
  onOpenShortcuts,
  onOpenRecorder,
  onOpenExporter,
  theme,
  onChangeTheme,
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="mt-20 border-t border-[var(--border-subtle)] bg-[var(--card-bg)] text-[var(--text-secondary)] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 mb-12">
          {/* Column 1: Brand & Privacy Posture */}
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="text-base font-bold text-[var(--text-primary)] tracking-tight">
                Subwave<span className="text-cyan-500 dark:text-cyan-400 font-medium">Studio</span>
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              The private in-browser audio workstation. 100% client-side digital signal processing for silence removal, stem splitting, and channel routing.
            </p>

            <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg w-fit">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Zero server uploads · 100% Private</span>
            </div>

            {/* Quick Theme Switcher in Footer */}
            <div className="pt-2">
              <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                Active Theme
              </div>
              <div className="inline-flex p-1 bg-[var(--card-secondary)] rounded-xl border border-[var(--border-subtle)]">
                {[
                  { id: 'obsidian', label: 'Obsidian', icon: <Moon className="w-3 h-3" /> },
                  { id: 'charcoal', label: 'Charcoal', icon: <Palette className="w-3 h-3" /> },
                  { id: 'light', label: 'Light', icon: <Sun className="w-3 h-3" /> },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => onChangeTheme(t.id as ThemeMode)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                      theme === t.id
                        ? 'bg-[var(--text-primary)] text-[var(--bg-canvas)] shadow-xs font-semibold'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--btn-hover-bg)]'
                    }`}
                  >
                    {t.icon}
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Studio Processing Tools */}
          <div>
            <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4">
              Processing Tools
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  onClick={() => {
                    onSelectTab('silence-remover');
                    scrollToSection('workstation');
                  }}
                  className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-cyan-500 dark:hover:text-cyan-400 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
                  <span>AI Silence Remover</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onSelectTab('splitter');
                    scrollToSection('workstation');
                  }}
                  className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-cyan-500 dark:hover:text-cyan-400 transition"
                >
                  <Split className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                  <span>Multi-Mode Track Splitter</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onSelectTab('stereo-mono');
                    scrollToSection('workstation');
                  }}
                  className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-cyan-500 dark:hover:text-cyan-400 transition"
                >
                  <Layers className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
                  <span>Stereo to Mono Converter</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onSelectTab('noise-remover');
                    scrollToSection('workstation');
                  }}
                  className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-cyan-500 dark:hover:text-cyan-400 transition"
                >
                  <Zap className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                  <span>Background Noise Remover</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onSelectTab('editor-tools');
                    scrollToSection('workstation');
                  }}
                  className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-cyan-500 dark:hover:text-cyan-400 transition"
                >
                  <AudioWaveform className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  <span>Direct Waveform DAW</span>
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenRecorder}
                  className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-rose-500 dark:hover:text-rose-400 transition"
                >
                  <Mic className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                  <span>Broadcast Voice Studio</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Audio Formats Supported */}
          <div>
            <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4">
              Export Formats & Codecs
            </h4>
            <ul className="space-y-2.5 text-xs text-[var(--text-secondary)]">
              <li className="flex items-center justify-between">
                <span>Lossless WAV (16-bit PCM)</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--card-secondary)] text-emerald-500 font-semibold border border-[var(--border-subtle)]">Lossless</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Studio Master (24-bit PCM)</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--card-secondary)] text-emerald-500 font-semibold border border-[var(--border-subtle)]">Pro HD</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Universal MP3 (128 / 192 / 320k)</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--card-secondary)] text-cyan-500 font-semibold border border-[var(--border-subtle)]">Universal</span>
              </li>
              <li className="flex items-center justify-between">
                <span>WebM Opus Stream</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--card-secondary)] text-purple-500 font-semibold border border-[var(--border-subtle)]">Web 48k</span>
              </li>
              <li className="pt-2 border-t border-[var(--border-subtle)]">
                <button
                  onClick={onOpenExporter}
                  className="flex items-center gap-1.5 text-xs font-semibold text-cyan-500 dark:text-cyan-400 hover:underline"
                >
                  <FileAudio className="w-3.5 h-3.5" />
                  <span>Open Master Export Modal →</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Technology & Offline Guarantee */}
          <div>
            <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4">
              Local Architecture
            </h4>
            <div className="space-y-3 text-xs text-[var(--text-secondary)]">
              <div className="flex items-start gap-2.5">
                <Cpu className="w-4 h-4 text-cyan-500 dark:text-cyan-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Web Audio API & Float32 linear PCM memory execution on your local CPU.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <WifiOff className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Zero network dependency. Runs 100% offline with zero external bandwidth.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={onOpenShortcuts}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--card-secondary)] hover:bg-[var(--btn-hover-bg)] text-[var(--text-primary)] text-xs font-medium border border-[var(--border-subtle)] transition w-full justify-center"
                >
                  <Keyboard className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
                  <span>Keyboard Shortcuts (Ctrl+/)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span>© 2026 Subwave Studio</span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span>100% Client-Side In-Browser Audio Engine</span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span>No Telemetry · Private & Secure</span>
          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--card-secondary)] hover:bg-[var(--btn-hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition active:scale-95"
            title="Back to Top"
            aria-label="Back to Top"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};
