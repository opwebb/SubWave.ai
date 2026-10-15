import React, { useRef, useState } from 'react';
import { Upload, Mic, Download, HelpCircle, Sun, Moon, Palette, ChevronDown, Menu, X, Sparkles, FileAudio } from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoadFile(file);
      e.target.value = '';
      setMobileMenuOpen(false);
    }
  };

  const themes: { id: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { id: 'obsidian', label: 'Dark Obsidian', icon: <Moon className="w-3.5 h-3.5" /> },
    { id: 'charcoal', label: 'Studio Charcoal', icon: <Palette className="w-3.5 h-3.5" /> },
    { id: 'light', label: 'Crisp Light', icon: <Sun className="w-3.5 h-3.5" /> },
  ];

  const currentThemeObj = themes.find(t => t.id === theme) || themes[0];

  return (
    <header className="sticky top-0 z-40 bg-[var(--header-bg)] backdrop-blur-xl border-b border-[var(--border-subtle)] px-3 sm:px-6 py-2.5 sm:py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-6">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="audio/*,.mp3,.wav,.ogg,.aac,.m4a,.flac,.webm"
          className="hidden"
        />

        {/* Zone 1: Single text element wordmark */}
        <a href="/" className="text-sm sm:text-base font-bold tracking-tight text-[var(--text-primary)] whitespace-nowrap shrink-0 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
          <span>Subwave<span className="text-cyan-400 font-medium">Studio</span></span>
        </a>

        {/* Zone 2: Single-line clean text navigation links (desktop) */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-xs font-medium text-[var(--text-secondary)]">
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

        {/* Zone 3: Action cluster */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Multi-mode Theme Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(prev => !prev)}
              className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border-subtle)] transition"
              title="Change theme appearance"
              aria-label="Theme menu"
            >
              {currentThemeObj.icon}
              <span className="hidden xl:inline">{currentThemeObj.label}</span>
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

          {/* Quick Record Button on desktop and mobile */}
          <button
            onClick={onOpenRecorder}
            className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition active:scale-95"
            title="Record Microphone Audio"
            aria-label="Record Microphone Audio"
          >
            <Mic className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Record</span>
          </button>

          {/* Export Master Button (when audio loaded) */}
          {hasAudio && (
            <button
              onClick={onOpenExporter}
              className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border-subtle)] transition active:scale-95"
              title="Export Master Audio"
              aria-label="Export Master Audio"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Export Master</span>
            </button>
          )}

          {/* Shortcuts Help (Desktop) */}
          <button
            onClick={onOpenShortcuts}
            className="hidden md:inline-flex p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--btn-hover-bg)] transition"
            title="Keyboard Shortcuts"
            aria-label="Keyboard Shortcuts"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Open Audio Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-200 rounded-lg shadow-sm transition whitespace-nowrap shrink-0 active:scale-95"
            title="Open Audio File"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Open Audio</span>
            <span className="xs:hidden">Open</span>
          </button>

          {/* Mobile Menu Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className="lg:hidden p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border-subtle)] transition"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-3 pt-3 border-t border-[var(--border-subtle)] animate-in slide-in-from-top-2 duration-150">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={() => {
                onLoadDemo();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--card-secondary)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-primary)] transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Load Demo Track</span>
            </button>

            <button
              onClick={() => {
                onOpenShortcuts();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--card-secondary)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-primary)] transition"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Shortcuts</span>
            </button>
          </div>

          <nav className="flex flex-col space-y-1 text-xs font-medium text-[var(--text-secondary)]">
            <a
              href="#workstation"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-lg hover:bg-[var(--btn-hover-bg)] hover:text-[var(--text-primary)] transition flex items-center justify-between"
            >
              <span>Audio Workstation</span>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">Active</span>
            </a>
            <a
              href="#capabilities"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-lg hover:bg-[var(--btn-hover-bg)] hover:text-[var(--text-primary)] transition"
            >
              DSP Capabilities & Algorithms
            </a>
            <a
              href="#privacy"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-lg hover:bg-[var(--btn-hover-bg)] hover:text-[var(--text-primary)] transition"
            >
              Local Privacy Architecture
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-lg hover:bg-[var(--btn-hover-bg)] hover:text-[var(--text-primary)] transition"
            >
              Frequently Asked Questions
            </a>
          </nav>

          {hasAudio && (
            <div className="pt-2 mt-2 border-t border-[var(--border-subtle)]">
              <button
                onClick={() => {
                  onOpenExporter();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 border border-cyan-500/30 text-xs font-semibold transition"
              >
                <Download className="w-4 h-4" />
                <span>Export Master (WAV / MP3 / WebM)</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
