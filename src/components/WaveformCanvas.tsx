import React, { useRef, useEffect, useState, useCallback } from 'react';
import { AudioSegment, SplitMarker, ThemeMode } from '../types/audio';
import { formatTime } from '../utils/audioCore';
import { ZoomIn, ZoomOut, Maximize2, MapPin, X } from 'lucide-react';

interface WaveformCanvasProps {
  audioBuffer: AudioBuffer | null;
  currentTime: number;
  onSeek: (time: number) => void;
  selection: { start: number; end: number } | null;
  onSelectRange: (range: { start: number; end: number } | null) => void;
  silenceSegments?: AudioSegment[];
  speechSegments?: AudioSegment[];
  markers?: SplitMarker[];
  onAddMarker?: (time: number) => void;
  onRemoveMarker?: (id: string) => void;
  highlightSilence?: boolean;
  theme?: ThemeMode;
}

export const WaveformCanvas: React.FC<WaveformCanvasProps> = ({
  audioBuffer,
  currentTime,
  onSeek,
  selection,
  onSelectRange,
  silenceSegments = [],
  speechSegments = [],
  markers = [],
  onAddMarker,
  onRemoveMarker,
  highlightSilence = false,
  theme = 'obsidian',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [scrollOffset, setScrollOffset] = useState<number>(0);
  const [isDraggingSelection, setIsDraggingSelection] = useState<boolean>(false);
  const [dragAnchor, setDragAnchor] = useState<number | null>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);

  const duration = audioBuffer ? audioBuffer.duration : 0;
  const isLight = theme === 'light';
  const isCharcoal = theme === 'charcoal';

  // Zoom handlers
  const handleZoomIn = () => setZoom(z => Math.min(10, z * 1.4));
  const handleZoomOut = () => {
    setZoom(z => {
      const next = Math.max(1, z / 1.4);
      if (next === 1) setScrollOffset(0);
      return next;
    });
  };
  const handleResetZoom = () => {
    setZoom(1);
    setScrollOffset(0);
  };

  // Convert pixel coordinate X to audio time (seconds)
  const pixelToTime = useCallback(
    (pixelX: number, width: number): number => {
      if (!duration || width <= 0) return 0;
      const visibleDuration = duration / zoom;
      const startTime = scrollOffset * (duration - visibleDuration);
      const time = startTime + (pixelX / width) * visibleDuration;
      return Math.max(0, Math.min(duration, time));
    },
    [duration, zoom, scrollOffset]
  );

  // Convert audio time (seconds) to pixel coordinate X
  const timeToPixel = useCallback(
    (time: number, width: number): number => {
      if (!duration || width <= 0) return 0;
      const visibleDuration = duration / zoom;
      const startTime = scrollOffset * (duration - visibleDuration);
      return ((time - startTime) / visibleDuration) * width;
    },
    [duration, zoom, scrollOffset]
  );

  // Draw Waveform and Overlays dynamically based on theme
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Theme-driven canvas background
    ctx.fillStyle = isLight ? '#ffffff' : isCharcoal ? '#13151f' : '#090a0f';
    ctx.fillRect(0, 0, width, height);

    // Subtle horizontal gridlines
    ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridY = [height * 0.25, height * 0.5, height * 0.75];
    gridY.forEach(y => {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    });

    if (!audioBuffer || duration <= 0) {
      ctx.fillStyle = isLight ? '#94a3b8' : '#64748b';
      ctx.font = '13px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Drop an audio file or record to begin editing', width / 2, height / 2);
      ctx.restore();
      return;
    }

    const visibleDuration = duration / zoom;
    const startTime = scrollOffset * (duration - visibleDuration);
    const endTime = startTime + visibleDuration;

    // Time Ruler (Top 22px)
    const rulerHeight = 22;
    ctx.fillStyle = isLight ? '#f1f5f9' : isCharcoal ? '#181b24' : '#0b0d14';
    ctx.fillRect(0, 0, width, rulerHeight);

    ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.06)';
    ctx.beginPath();
    ctx.moveTo(0, rulerHeight);
    ctx.lineTo(width, rulerHeight);
    ctx.stroke();

    // Ruler ticks
    const tickInterval = visibleDuration < 5 ? 0.5 : visibleDuration < 15 ? 1 : visibleDuration < 60 ? 5 : 10;
    const firstTick = Math.ceil(startTime / tickInterval) * tickInterval;

    ctx.fillStyle = isLight ? '#475569' : '#64748b';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';

    for (let t = firstTick; t <= endTime; t += tickInterval) {
      const x = timeToPixel(t, width);
      if (x >= 0 && x <= width) {
        ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.12)';
        ctx.beginPath();
        ctx.moveTo(x, rulerHeight - 6);
        ctx.lineTo(x, rulerHeight);
        ctx.stroke();
        ctx.fillText(formatTime(t), x, rulerHeight - 8);
      }
    }

    // 1. Draw Silence and Speech Overlay Highlights
    if (highlightSilence) {
      silenceSegments.forEach(seg => {
        if (seg.end >= startTime && seg.start <= endTime) {
          const x1 = Math.max(0, timeToPixel(seg.start, width));
          const x2 = Math.min(width, timeToPixel(seg.end, width));
          const segWidth = Math.max(2, x2 - x1);

          ctx.fillStyle = isLight ? 'rgba(239, 68, 68, 0.16)' : 'rgba(239, 68, 68, 0.12)';
          ctx.fillRect(x1, rulerHeight, segWidth, height - rulerHeight);

          ctx.strokeStyle = isLight ? 'rgba(239, 68, 68, 0.5)' : 'rgba(239, 68, 68, 0.35)';
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.strokeRect(x1, rulerHeight, segWidth, height - rulerHeight);
          ctx.setLineDash([]);
        }
      });

      speechSegments.forEach(seg => {
        if (seg.end >= startTime && seg.start <= endTime) {
          const x1 = Math.max(0, timeToPixel(seg.start, width));
          const x2 = Math.min(width, timeToPixel(seg.end, width));
          ctx.fillStyle = isLight ? 'rgba(2, 132, 199, 0.08)' : 'rgba(6, 182, 212, 0.04)';
          ctx.fillRect(x1, rulerHeight, x2 - x1, height - rulerHeight);
        }
      });
    }

    // 2. Draw Waveform Peaks
    const waveformTop = rulerHeight + 8;
    const waveformHeight = height - waveformTop - 8;
    const midY = waveformTop + waveformHeight / 2;
    const halfHeight = waveformHeight / 2;

    const sampleRate = audioBuffer.sampleRate;
    const startSample = Math.floor(startTime * sampleRate);
    const endSample = Math.min(audioBuffer.length, Math.floor(endTime * sampleRate));
    const samplesPerPixel = Math.max(1, Math.floor((endSample - startSample) / width));

    const leftData = audioBuffer.getChannelData(0);
    const rightData = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : leftData;

    // Waveform gradient (Theme adaptive)
    const waveGrad = ctx.createLinearGradient(0, waveformTop, 0, waveformTop + waveformHeight);
    if (isLight) {
      waveGrad.addColorStop(0, '#0284c7');   // Crisp deep sky blue
      waveGrad.addColorStop(0.5, '#4f46e5'); // Rich indigo
      waveGrad.addColorStop(1, '#0284c7');
    } else if (isCharcoal) {
      waveGrad.addColorStop(0, '#38bdf8');
      waveGrad.addColorStop(0.5, '#6366f1');
      waveGrad.addColorStop(1, '#38bdf8');
    } else {
      waveGrad.addColorStop(0, '#22d3ee');   // Luminous cyan
      waveGrad.addColorStop(0.5, '#6366f1'); // Violet
      waveGrad.addColorStop(1, '#22d3ee');
    }

    ctx.fillStyle = waveGrad;

    for (let x = 0; x < width; x++) {
      const segStart = startSample + x * samplesPerPixel;
      const segEnd = Math.min(endSample, segStart + samplesPerPixel);

      let min = 1.0;
      let max = -1.0;

      for (let i = segStart; i < segEnd; i += 2) {
        const valL = leftData[i] || 0;
        const valR = rightData[i] || 0;
        const val = (valL + valR) * 0.5;
        if (val < min) min = val;
        if (val > max) max = val;
      }

      if (min > max) {
        min = 0;
        max = 0;
      }

      const y1 = midY - max * halfHeight;
      const y2 = midY - min * halfHeight;
      const barHeight = Math.max(1.5, y2 - y1);

      ctx.fillRect(x, y1, 1, barHeight);
    }

    // 3. Center line
    ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(width, midY);
    ctx.stroke();

    // 4. Selection Range Highlight
    if (selection) {
      const selStartX = timeToPixel(selection.start, width);
      const selEndX = timeToPixel(selection.end, width);
      const leftX = Math.min(selStartX, selEndX);
      const selWidth = Math.abs(selEndX - selStartX);

      ctx.fillStyle = isLight ? 'rgba(2, 132, 199, 0.18)' : 'rgba(6, 182, 212, 0.16)';
      ctx.fillRect(leftX, rulerHeight, selWidth, height - rulerHeight);

      ctx.strokeStyle = isLight ? '#0284c7' : '#22d3ee';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(leftX, rulerHeight);
      ctx.lineTo(leftX, height);
      ctx.moveTo(leftX + selWidth, rulerHeight);
      ctx.lineTo(leftX + selWidth, height);
      ctx.stroke();

      ctx.fillStyle = isLight ? '#0284c7' : '#22d3ee';
      ctx.fillRect(leftX - 3, rulerHeight, 6, 12);
      ctx.fillRect(leftX + selWidth - 3, rulerHeight, 6, 12);

      const selDuration = Math.abs(selection.end - selection.start);
      ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(7, 8, 11, 0.9)';
      const badgeW = 75;
      const badgeX = Math.max(4, Math.min(width - badgeW - 4, leftX + selWidth / 2 - badgeW / 2));
      ctx.fillRect(badgeX, rulerHeight + 5, badgeW, 18);
      ctx.strokeStyle = isLight ? 'rgba(2, 132, 199, 0.4)' : 'rgba(34, 211, 238, 0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(badgeX, rulerHeight + 5, badgeW, 18);
      ctx.fillStyle = isLight ? '#0f172a' : '#e2e8f0';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(formatTime(selDuration), badgeX + badgeW / 2, rulerHeight + 17);
    }

    // 5. Split Markers
    markers.forEach(m => {
      if (m.time >= startTime && m.time <= endTime) {
        const mx = timeToPixel(m.time, width);
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(mx, rulerHeight);
        ctx.lineTo(mx, height);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.roundRect(mx - 20, rulerHeight + 2, 40, 15, 3);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(m.label, mx, rulerHeight + 13);
      }
    });

    // 6. Playhead Scrubber
    if (currentTime >= startTime && currentTime <= endTime) {
      const px = timeToPixel(currentTime, width);

      ctx.strokeStyle = 'rgba(225, 29, 72, 0.25)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, height);
      ctx.stroke();

      ctx.strokeStyle = '#e11d48';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, height);
      ctx.stroke();

      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.moveTo(px - 5, 0);
      ctx.lineTo(px + 5, 0);
      ctx.lineTo(px, 8);
      ctx.closePath();
      ctx.fill();
    }

    // 7. Hover cursor guideline
    if (hoverTime !== null && hoverTime >= startTime && hoverTime <= endTime) {
      const hx = timeToPixel(hoverTime, width);
      ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(hx, rulerHeight);
      ctx.lineTo(hx, height);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }, [
    audioBuffer,
    currentTime,
    selection,
    silenceSegments,
    speechSegments,
    markers,
    highlightSilence,
    zoom,
    scrollOffset,
    hoverTime,
    timeToPixel,
    duration,
    theme,
    isLight,
    isCharcoal,
  ]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!audioBuffer) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickedTime = pixelToTime(x, rect.width);

    if (e.button === 0) {
      setIsDraggingSelection(true);
      setDragAnchor(clickedTime);
      onSelectRange({ start: clickedTime, end: clickedTime });
      onSeek(clickedTime);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !audioBuffer) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = pixelToTime(x, rect.width);
    setHoverTime(time);

    if (isDraggingSelection && dragAnchor !== null) {
      const start = Math.min(dragAnchor, time);
      const end = Math.max(dragAnchor, time);
      if (end - start > 0.05) {
        onSelectRange({ start, end });
      } else {
        onSelectRange(null);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDraggingSelection(false);
    setDragAnchor(null);
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!audioBuffer) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = pixelToTime(x, rect.width);

    if (onAddMarker) {
      onAddMarker(time);
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!audioBuffer) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const touch = e.touches[0];
    if (!touch) return;

    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const clickedTime = pixelToTime(x, rect.width);

    setIsDraggingSelection(true);
    setDragAnchor(clickedTime);
    onSelectRange({ start: clickedTime, end: clickedTime });
    onSeek(clickedTime);
    setHoverTime(clickedTime);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !audioBuffer) return;
    const touch = e.touches[0];
    if (!touch) return;

    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const time = pixelToTime(x, rect.width);
    setHoverTime(time);

    if (isDraggingSelection && dragAnchor !== null) {
      const start = Math.min(dragAnchor, time);
      const end = Math.max(dragAnchor, time);
      if (end - start > 0.05) {
        onSelectRange({ start, end });
      } else {
        onSelectRange(null);
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDraggingSelection(false);
    setDragAnchor(null);
    setHoverTime(null);
  };

  return (
    <div className="relative bg-[var(--card-bg)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden shadow-2xl transition-colors">
      {/* Top Waveform Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-[var(--card-secondary)] border-b border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[var(--text-primary)] font-medium">Interactive Canvas</span>
          <span aria-hidden="true" className="text-slate-400">·</span>
          {audioBuffer ? (
            <span className="font-mono tabular-nums text-[var(--text-muted)] truncate max-w-[260px] sm:max-w-none">
              {audioBuffer.numberOfChannels === 1 ? 'Mono' : 'Stereo'} · {audioBuffer.sampleRate} Hz · {formatTime(audioBuffer.duration)}
            </span>
          ) : (
            <span>No audio loaded</span>
          )}
        </div>

        {/* Zoom & Marker Controls */}
        <div className="flex items-center gap-2">
          {selection && (
            <button
              onClick={() => onSelectRange(null)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[var(--card-bg)] hover:bg-[var(--btn-hover-bg)] text-[var(--text-primary)] text-xs border border-[var(--border-subtle)] transition"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5 text-slate-400" />
              <span>Clear</span>
            </button>
          )}

          {audioBuffer && onAddMarker && (
            <button
              onClick={() => onAddMarker(currentTime)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 dark:text-amber-300 border border-amber-500/30 text-xs transition font-medium"
              title="Add Split Marker at current playhead"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Add Marker</span>
            </button>
          )}

          <div className="flex items-center gap-1 bg-[var(--card-bg)] p-0.5 rounded-lg border border-[var(--border-subtle)]">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              className="p-1.5 rounded hover:bg-[var(--btn-hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-25 disabled:pointer-events-none transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-[11px] font-mono tabular-nums text-[var(--text-secondary)] min-w-8 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 10}
              className="p-1.5 rounded hover:bg-[var(--btn-hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-25 disabled:pointer-events-none transition"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            {zoom > 1 && (
              <button
                onClick={handleResetZoom}
                className="p-1.5 rounded hover:bg-[var(--btn-hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
                title="Fit to Screen"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div ref={containerRef} className="relative w-full h-40 sm:h-56 select-none touch-none">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            handleMouseUp();
            setHoverTime(null);
          }}
          onDoubleClick={handleDoubleClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          className="w-full h-full cursor-crosshair block touch-none"
        />

        {hoverTime !== null && (
          <div className="pointer-events-none absolute bottom-2 left-4 px-2.5 py-0.5 rounded-md bg-[var(--card-bg)] text-[11px] font-mono tabular-nums text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-md backdrop-blur-md">
            {formatTime(hoverTime)}
          </div>
        )}
      </div>

      {/* Horizontal Pan Scroller if Zoomed In */}
      {zoom > 1 && (
        <div className="px-4 py-2 bg-[var(--card-secondary)] border-t border-[var(--border-subtle)] flex items-center gap-3">
          <span className="text-[10px] text-[var(--text-muted)] font-medium">Pan Timeline</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={scrollOffset}
            onChange={e => setScrollOffset(parseFloat(e.target.value))}
            className="flex-1 h-1 bg-slate-300 dark:bg-slate-800 rounded-lg appearance-none cursor-ew-resize accent-cyan-400"
          />
        </div>
      )}

      {/* Markers bar if markers exist */}
      {markers.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 bg-[var(--card-secondary)] border-t border-[var(--border-subtle)] overflow-x-auto text-xs">
          <span className="text-amber-500 dark:text-amber-400 font-medium text-[11px] whitespace-nowrap">
            Markers ({markers.length}):
          </span>
          {markers.map(m => (
            <div
              key={m.id}
              onClick={() => onSeek(m.time)}
              className="flex items-center gap-1.5 px-2.5 py-0.5 bg-[var(--card-bg)] hover:bg-[var(--btn-hover-bg)] text-[var(--text-primary)] rounded-md border border-[var(--border-subtle)] cursor-pointer transition text-[11px] whitespace-nowrap"
            >
              <span className="font-semibold text-amber-500 dark:text-amber-300">{m.label}</span>
              <span className="font-mono tabular-nums text-[var(--text-muted)]">{formatTime(m.time)}</span>
              {onRemoveMarker && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onRemoveMarker(m.id);
                  }}
                  className="hover:text-rose-500 text-[var(--text-muted)] p-0.5 ml-1"
                  title="Remove marker"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
