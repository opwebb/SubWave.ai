import React, { useRef, useState } from 'react';
import { Upload, Mic, Download, HelpCircle, Sun, Moon, Palette, ChevronDown } from 'lucide-react';
import { ThemeMode } from '../types/audio';

interface HeaderProps {
  onLoadFile: (file: File) => void;
  onLoadDemo: () => void;
  onOpenRecorder: () => void;
  onOpenExporter: () => void;
  onOpenShortcuts: () => void;
  hasAudio: boolean;
  theme: ThemeMode;
  onChangeTheme: (theme: ThemeMode) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onLoadFile,
  onLoadDemo,
  onOpenRecorder,
  onOpenExporter,
  onOpenShortcuts,
  hasAudio,
  theme,
  onChangeTheme,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoadFile(file);
      e.target.value = '';
    }
  };

  const themes: { id: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { id: 'obsidian', label: 'Dark Obsidian', icon: <Moon className="w-3.5 h-3.5" /> },
    { id: 'charcoal', label: 'Studio Charcoal', icon: <Palette className="w-3.5 h-3.5" /> },
    { id: 'light', label: 'Crisp Light', icon: <Sun className="w-3.5 h-3.5" /> },
  ];

  const currentThemeObj = themes.find(t => t.id === theme) || themes[0];

  return (
    <header className="sticky top-0 z-40 bg-[var(--header-bg)] backdrop-blur-xl border-b border-[var(--border-subtle)] px-6 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a href="/" className="text-base font-bold tracking-tight text-[var(--text-primary)] whitespace-nowrap shrink-0 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
          <span>Subwave<span className="text-cyan-400 font-medium">Studio</span></span>
        </a>

        {/* Zone 2: Single-line clean text navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-[var(--text-secondary)]">
          <a href="#workstation" className="hover:text-[var(--text-primary)] transition-colors whitespace-nowrap shrink-0">
            Workstation
          </a>
          <button onClick={onLoadDemo} className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0">
            Demo Sample
          </button>
          <a href="#capabilities" className="hover:text-[var(--text-primary)] transition-colors whitespace-nowrap shrink-0">
            Capabilities
          </a>
          <a href="#privacy" className="hover:text-[var(--text-primary)] transition-colors whitespace-nowrap shrink-0">
            Local Privacy
          </a>
          <a href="#faq" className="hover:text-[var(--text-primary)] transition-colors whitespace-nowrap shrink-0">
            FAQ
          </a>
        </nav>

        {/* Zone 3: 1 primary action cluster with Theme Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="audio/*,.mp3,.wav,.ogg,.aac,.m4a,.flac,.webm"
            className="hidden"
          />

          {/* Multi-mode Theme Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(prev => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border-subtle)] transition"
              title="Change theme appearance"
            >
              {currentThemeObj.icon}
              <span className="hidden lg:inline">{currentThemeObj.label}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showThemeMenu && (
              <div 
                className="absolute right-0 mt-1.5 w-40 p-1 rounded-xl bg-[var(--card-bg)] border border-[var(--border-subtle)] shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150"
                onMouseLeave={() => setShowThemeMenu(false)}
              >
                {themes.map(t => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onChangeTheme(t.id);
                      setShowThemeMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition ${
                      theme === t.id
                        ? 'bg-cyan-500/15 text-cyan-400 font-semibold'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--btn-hover-bg)]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {t.icon}
                      <span>{t.label}</span>
                    </span>
                    {theme === t.id && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onOpenShortcuts}
            className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--btn-hover-bg)] transition"
            title="Keyboard Shortcuts"
            aria-label="Keyboard Shortcuts"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenRecorder}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Record</span>
          </button>

          {hasAudio && (
            <button
              onClick={onOpenExporter}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border-subtle)] transition"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export Master</span>
            </button>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-200 rounded-lg shadow-sm transition whitespace-nowrap shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Open Audio</span>
          </button>
        </div>
      </div>
    </header>
  );
};
