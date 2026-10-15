import React from 'react';
import { 
  Sparkles, 
  Split, 
  Layers, 
  Mic, 
  Zap, 
  Lock, 
  HelpCircle, 
  ShieldCheck,
  Cpu,
  WifiOff,
  CheckCircle2
} from 'lucide-react';

export const SeoLandingContent: React.FC = () => {
  const faqs = [
    {
      q: 'How does Subwave Studio remove silence without uploading my files to a server?',
      a: 'Subwave Studio runs entirely on your device using the browser Web Audio API and Float32 digital signal processing. It analyzes audio waveform peaks and RMS energy decibels locally inside your browser window. Zero bytes are ever sent to an external server.'
    },
    {
      q: 'Is my audio private and confidential? Do I need to create an account?',
      a: 'Yes, your privacy is 100% guaranteed. There are no logins, no tracking, and no servers. Your recordings, voice takes, and audio files never leave your device. You can even use the studio completely offline with airplane mode enabled.'
    },
    {
      q: 'How does the automatic audio splitter work?',
      a: 'You can choose between three splitting modes: 1) Silence Gaps (auto-detects natural pauses between sentences/takes), 2) Equal Intervals (e.g., cuts 1-hour recordings into 5-minute segments), or 3) Cue Markers (double-click points on the waveform). You can preview each chunk and download all parts in a single organized ZIP file.'
    },
    {
      q: 'Why convert stereo to mono for voiceovers and podcasts?',
      a: 'Many podcast microphones record voice into only one channel (e.g. Left channel only), leaving the other channel silent or producing an uncomfortable one-ear listening experience. The Stereo-to-Mono converter sums both channels or isolates either the Left or Right channel into a centered, balanced mono track that plays identically in both headphones.'
    },
    {
      q: 'Does it support long audio files like 1-hour or 2-hour podcasts?',
      a: 'Yes! The in-browser audio engine uses standard 32-bit linear PCM buffers. Files up to several hours can be processed smoothly depending on your device’s available RAM. Unlike cloud tools, there are no file upload size restrictions or paywalls.'
    },
    {
      q: 'What audio formats are supported for input and output?',
      a: 'You can import any format supported by your modern browser including MP3, WAV, AAC, M4A, OGG, WebM, and FLAC. You can export pristine, uncompressed WAV files in 16-bit PCM (CD standard), 24-bit PCM (Studio master), or 32-bit floating point.'
    }
  ];

  return (
    <section className="mt-16 sm:mt-20 border-t border-[var(--border-subtle)] pt-12 sm:pt-16 text-[var(--text-secondary)] transition-colors">
      {/* Editorial Feature Showcase */}
      <div id="capabilities" className="mb-16 sm:mb-20">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <span className="text-xs font-semibold tracking-wider text-cyan-500 dark:text-cyan-400 uppercase mb-2 block">
            Capabilities
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Engineered for Creators, Podcasters & Musicians
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-2">
            No cloud queues. No account sign-ups. No file size restrictions. Everything executes instantly on your device.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <div className="p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-subtle)] hover:border-[var(--border-highlight)] transition">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 dark:text-cyan-400 mb-4">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-[11px] font-mono text-cyan-500 dark:text-cyan-400 mb-1">01. Silence Removal</div>
            <h3 className="text-base font-bold text-[var(--text-primary)] mb-2">Dead Air & Pause Trimmer</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Eliminate awkward dead air and hesitations with one click. Configure dB sensitivity, minimum pause length, and boundary padding to preserve natural speech rhythm.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-subtle)] hover:border-[var(--border-highlight)] transition">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400 mb-4">
              <Split className="w-4 h-4" />
            </div>
            <div className="text-[11px] font-mono text-indigo-500 dark:text-indigo-400 mb-1">02. Smart Splitting</div>
            <h3 className="text-base font-bold text-[var(--text-primary)] mb-2">Multi-Mode Track Splitter</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Slice audio files automatically by silence gaps, equal time slices, or marker cues. Batch export all tracks in a single compressed ZIP archive.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-subtle)] hover:border-[var(--border-highlight)] transition">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 dark:text-purple-400 mb-4">
              <Layers className="w-4 h-4" />
            </div>
            <div className="text-[11px] font-mono text-purple-500 dark:text-purple-400 mb-1">03. Spatial Routing</div>
            <h3 className="text-base font-bold text-[var(--text-primary)] mb-2">Stereo to Mono & Panning</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Fix single-ear mic recordings. Sum stereo to mono, extract pure left or right channels, widen spatial stereo width, and invert phase polarities.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-subtle)] hover:border-[var(--border-highlight)] transition">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 dark:text-rose-400 mb-4">
              <Mic className="w-4 h-4" />
            </div>
            <div className="text-[11px] font-mono text-rose-500 dark:text-rose-400 mb-1">04. Audio Capture</div>
            <h3 className="text-base font-bold text-[var(--text-primary)] mb-2">Broadcast Recording Studio</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Capture high-fidelity audio with real-time 32-band FFT spectrum visualizer, peak-hold dB VU meter, input gain staging, and pre-roll countdown.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-subtle)] hover:border-[var(--border-highlight)] transition">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400 mb-4">
              <Zap className="w-4 h-4" />
            </div>
            <div className="text-[11px] font-mono text-emerald-500 dark:text-emerald-400 mb-1">05. Neural Denoise</div>
            <h3 className="text-base font-bold text-[var(--text-primary)] mb-2">Background Noise Cleaner</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Remove air conditioning rumble with high-pass filtering, cut electrical 50/60Hz grounding buzz with harmonic notches, and silence room hiss with adaptive noise gating.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-subtle)] hover:border-[var(--border-highlight)] transition">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 dark:text-amber-400 mb-4">
              <Lock className="w-4 h-4" />
            </div>
            <div className="text-[11px] font-mono text-amber-500 dark:text-amber-400 mb-1">06. Zero Telemetry</div>
            <h3 className="text-base font-bold text-[var(--text-primary)] mb-2">100% Local-First Privacy</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Zero cloud uploads. Your confidential podcasts, voice memos, and recordings never leave your browser sandbox. Works completely offline.
            </p>
          </div>
        </div>
      </div>

      {/* Replaced GitHub Pages Section with Audience Privacy & Instant Processing Banner */}
      <div id="privacy" className="mb-16 sm:mb-20 p-6 sm:p-8 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-subtle)] relative overflow-hidden transition-colors">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-cyan-500 dark:text-cyan-400 text-xs font-semibold mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Local Privacy & Security Guarantee</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mb-3 tracking-tight">
            100% Private, Safe & In-Browser Audio Processing
          </h3>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
            Unlike other audio tools that force you to upload large voice files to remote servers or pay for subscriptions, Subwave Studio runs directly on your computer or phone. Your confidential audio files and voice notes never leave your device.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-4 bg-[var(--card-secondary)] rounded-xl border border-[var(--border-subtle)]">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-[var(--text-primary)]">Zero Server Uploads</h4>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Audio data is processed entirely in your browser’s temporary memory.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-[var(--card-secondary)] rounded-xl border border-[var(--border-subtle)]">
              <WifiOff className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-[var(--text-primary)]">Works Completely Offline</h4>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Cut silence, edit, and export even without an internet connection.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-[var(--card-secondary)] rounded-xl border border-[var(--border-subtle)]">
              <Cpu className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-[var(--text-primary)]">Fast & Uncapped</h4>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  No queue times, no file duration limits, and no accounts required.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div id="faq" className="mb-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center justify-center p-2 rounded-xl bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 mb-3">
            <HelpCircle className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Frequently Asked Questions</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Common questions about local browser audio editing, performance, and privacy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
          {faqs.map((f, i) => (
            <div
              key={i}
              className="p-5 rounded-xl bg-[var(--card-bg)] border border-[var(--border-subtle)] hover:border-[var(--border-highlight)] transition"
            >
              <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] mb-2">
                {f.q}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {f.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
