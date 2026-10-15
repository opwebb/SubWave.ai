import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Play / Pause playback' },
    { key: '← / →', desc: 'Jump backward / forward 5 seconds' },
    { key: 'Ctrl + Z', desc: 'Undo last editing or DSP action' },
    { key: 'Ctrl + Y', desc: 'Redo previously undone action' },
    { key: 'Ctrl + X', desc: 'Cut selection to clipboard' },
    { key: 'Ctrl + C', desc: 'Copy selection' },
    { key: 'Ctrl + V', desc: 'Paste clipboard at playhead' },
    { key: 'Del', desc: 'Delete selected audio region' },
    { key: 'Escape', desc: 'Clear active range selection' },
    { key: 'S', desc: 'Add Split Marker at current playhead' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[var(--card-bg)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-2xl transition-colors">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--btn-hover-bg)] transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-500 dark:text-cyan-400 border border-cyan-500/30">
            <Keyboard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">Keyboard Shortcuts</h3>
            <p className="text-xs text-[var(--text-secondary)]">Streamline your audio editing workflow</p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {shortcuts.map((sc, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--card-secondary)] border border-[var(--border-subtle)] text-xs"
            >
              <span className="text-[var(--text-primary)] font-medium">{sc.desc}</span>
              <kbd className="px-2 py-0.5 rounded bg-[var(--card-bg)] text-cyan-600 dark:text-cyan-300 font-mono text-[11px] font-semibold border border-[var(--border-subtle)] shadow-xs">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="text-center pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[var(--text-primary)] hover:opacity-90 active:scale-95 text-[var(--bg-canvas)] text-xs font-semibold rounded-xl transition shadow"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
