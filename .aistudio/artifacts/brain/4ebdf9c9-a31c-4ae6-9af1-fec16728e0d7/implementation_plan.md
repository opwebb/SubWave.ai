# Implementation Plan: Comprehensive Mobile & Responsive Upgrade

Deliver a fully mobile-optimized, touch-first, and ultra-responsive experience for SubwaveStudio across all mobile phones (from 320px+ viewports up to large tablets and desktop screens).

---

## 1. Touch-First Waveform & Timeline Interaction (`WaveformCanvas.tsx`)
- **Native Touch Event Listeners**:
  - Add `onTouchStart`, `onTouchMove`, `onTouchEnd`, and `onTouchCancel` handlers to the waveform canvas.
  - Compute accurate client touch coordinates relative to bounding rect and account for device pixel ratio (`window.devicePixelRatio`).
  - Enable smooth touch scrubbing (tap anywhere to jump playhead) and single-finger or touch drag to select audio ranges.
  - Apply `touch-action: none` to prevent page scrolling/rubber-banding while interacting with the waveform canvas.
- **Mobile-Adaptive Canvas Header & Toolbar**:
  - Responsive layout for the canvas status bar: audio properties (Mono/Stereo, sample rate, duration) wrap neatly without truncation.
  - Compact touch targets (minimum 40px–44px hit areas) for Zoom In/Out, Clear Selection, and Add Split Marker.
  - Responsive canvas height (`h-36 sm:h-48 md:h-56`) ensuring the waveform is tall enough on mobile while leaving room for playback controls and active panels.

---

## 2. Adaptive Mobile Audio Player Controls (`AudioPlayerControls.tsx`)
- **Mobile Ergonomics & Touch Targets**:
  - Reorganize player controls into a clean, mobile-first responsive layout that never overflows or wraps awkwardly on 320px–390px widths.
  - Ensure main transport buttons (Play/Pause, Rewind 5s, Fast-Forward 5s, Stop, Loop) have generous hit targets (44px+) with tactile active press feedback.
  - Compact mobile timecode display (`00:00 / 00:00`) that remains legible alongside transport buttons.
  - Touch-friendly volume and playback speed controls that scale down smoothly on small screens.
  - Position Undo/Redo and Play Selection buttons with mobile-optimized touch sizing.

---

## 3. Responsive Header & Mobile Quick Action Bar (`Header.tsx`)
- **Mobile Navigation & Action Cluster**:
  - On viewports below 640px, ensure the primary actions (Open Audio, Record, Export Master, and Theme Toggle) are all accessible without relying on desktop-only inline styles.
  - Add a dedicated mobile quick-action bar or dropdown drawer so phone users can trigger the Recording Studio and Export Master without screen size restrictions.
  - Ensure theme dropdown menu opens within viewport bounds on narrow screens with backdrop tap-to-dismiss.
  - Wordmark and logo remain sharp and compact on small phone screens.

---

## 4. Mobile Refactor for Processing Panels & Console Rack (`App.tsx` & Tool Panels)
- **Console Rack Buttons (`App.tsx`)**:
  - Adapt the 5 console module cards on phone screens with responsive grid padding (`grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`), compact badge sizing, and clean status typography.
- **Silence Remover Panel (`SilenceRemoverPanel.tsx`)**:
  - Responsive preset buttons (Podcast, Voiceover, Music) that stack or wrap smoothly.
  - Touch-friendly range sliders with clear value indicators.
  - Responsive silence segment list with touch-friendly audition and delete buttons.
- **Multi-Mode Splitter Panel (`SplitterPanel.tsx`)**:
  - Mobile-optimized track cards: track name, duration, and format download buttons wrap gracefully on phone widths.
  - Batch "Download All (ZIP)" button prominently sized for mobile thumb taps.
- **Channel Converter (`ChannelConverterPanel.tsx`) & Noise Remover (`NoiseRemoverPanel.tsx`)**:
  - Touch toggles, balance sliders, and noise reduction controls styled for phone screens with zero horizontal overflow.
- **Editor Tools Panel (`EditorToolsPanel.tsx`)**:
  - Grid of quick edit actions (Cut, Copy, Silence, Fade In, Fade Out, Normalize, Reverse) responsive on 2-column mobile grids.

---

## 5. Mobile-Optimized Modal Dialogs (`AudioRecorderModal.tsx`, `FormatConverterModal.tsx`, `ShortcutsModal.tsx`)
- **Bottom-Sheet & Viewport Constraints**:
  - Update all modal containers to support full mobile usability: `max-h-[92vh] w-full max-w-lg m-2 sm:m-auto flex flex-col rounded-2xl overflow-hidden`.
  - Ensure modal headers stay fixed at top with easy-to-tap close buttons (`X`).
  - Scrollable modal body (`overflow-y-auto overscroll-contain`) so no buttons or inputs are cut off on small phone viewports.
- **Audio Recorder Mobile Experience**:
  - Responsive live recording waveform and VU meter that scale with screen width.
  - Input device selector, noise suppression, and echo cancellation switches formatted for mobile.
  - Big, easy-to-tap Record / Pause / Stop buttons.
- **Format Converter & Master Exporter Mobile Layout**:
  - Format cards (WAV, FLAC, MP3, OGG, AAC) adapt to 2-column or stacked grid on phone screens with clear quality badges.
  - One-tap "Download Master" button anchored at the bottom.

---

## 6. Global Layout, Typography & Viewport Auditing (`App.tsx`, `Footer.tsx`, `index.css`)
- **Zero Horizontal Scroll**:
  - Audit all containers, padding, margins, and flex-wrap properties to guarantee zero horizontal overflow (`overflow-x-hidden`) on mobile viewports (320px–420px).
- **Responsive Footer (`Footer.tsx`)**:
  - Column stacking with generous spacing and touch-friendly navigation links.
  - Quick theme switcher in footer optimized for thumb taps.
- **Compilation & Verification**:
  - Run `compile_applet` and `lint_applet` to ensure pristine code quality with no build or type errors.
