'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/utils/cn';

/**
 * Interactive GTA V map — locally bundled Rockstar render tiles
 * (`public/gta-map/render/{z}/{x}/{y}.jpg`, zoom 0–6, full terrain).
 * Pan with drag, zoom with wheel / buttons, tap to set your position.
 * No external map library needed.
 */

const MAX_Z = 6;
const TILE = 256;
/** Tile grid dimensions per zoom (cols × rows) */
const DIMS: Record<number, [number, number]> = {
  0: [1, 1], 1: [1, 2], 2: [2, 3], 3: [4, 6], 4: [8, 12], 5: [16, 24], 6: [32, 48],
};

/** World coordinate space used by the GULFOS world engine (Los Santos) */
export const GTA_BOUNDS = {
  minLat: 33.95, maxLat: 34.15,
  minLng: -118.35, maxLng: -118.12,
};

/** Normalized map position (0..1, origin top-left) → world lat/lng */
export function mapToWorld(nx: number, ny: number) {
  return {
    latitude: GTA_BOUNDS.maxLat - ny * (GTA_BOUNDS.maxLat - GTA_BOUNDS.minLat),
    longitude: GTA_BOUNDS.minLng + nx * (GTA_BOUNDS.maxLng - GTA_BOUNDS.minLng),
  };
}

export function worldToMap(latitude: number, longitude: number) {
  return {
    nx: (longitude - GTA_BOUNDS.minLng) / (GTA_BOUNDS.maxLng - GTA_BOUNDS.minLng),
    ny: (GTA_BOUNDS.maxLat - latitude) / (GTA_BOUNDS.maxLat - GTA_BOUNDS.minLat),
  };
}

interface GtaMapProps {
  /** Current position marker (world coords) */
  marker?: { latitude: number; longitude: number } | null;
  onSelect?: (pos: { latitude: number; longitude: number }) => void;
  className?: string;
}

export function GtaMap({ marker, onSelect, className }: GtaMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(3);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ startX: number; startY: number; panX: number; panY: number; moved: boolean } | null>(null);

  const [cols, rows] = DIMS[zoom];
  const mapW = cols * TILE;
  const mapH = rows * TILE;

  const clampPan = useCallback((x: number, y: number, z = zoom) => {
    const el = containerRef.current;
    if (!el) return { x, y };
    const [c, r] = DIMS[z];
    const w = c * TILE;
    const h = r * TILE;
    const vw = el.clientWidth;
    const vh = el.clientHeight;
    return {
      x: Math.min(Math.max(x, vw - w), 0),
      y: Math.min(Math.max(y, vh - h), 0),
    };
  }, [zoom]);

  // Center on the marker (or map center) when mounting / zoom changes
  const centerOn = useCallback((nx: number, ny: number, z: number) => {
    const el = containerRef.current;
    if (!el) return;
    const [c, r] = DIMS[z];
    setPan(clampPan(el.clientWidth / 2 - nx * c * TILE, el.clientHeight / 2 - ny * r * TILE, z));
  }, [clampPan]);

  useEffect(() => {
    const m = marker ? worldToMap(marker.latitude, marker.longitude) : { nx: 0.5, ny: 0.78 };
    centerOn(m.nx, m.ny, zoom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom]);

  const changeZoom = (dz: number) => {
    const el = containerRef.current;
    const next = Math.min(MAX_Z, Math.max(2, zoom + dz));
    if (next === zoom || !el) return;
    // keep viewport center anchored
    const cx = (el.clientWidth / 2 - pan.x) / mapW;
    const cy = (el.clientHeight / 2 - pan.y) / mapH;
    setZoom(next);
    requestAnimationFrame(() => centerOn(cx, cy, next));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    drag.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y, moved: false };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) + Math.abs(dy) > 6) d.moved = true;
    if (d.moved) setPan(clampPan(d.panX + dx, d.panY + dy));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.moved || !onSelect) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = (e.clientX - rect.left - pan.x) / mapW;
    const ny = (e.clientY - rect.top - pan.y) / mapH;
    if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return;
    onSelect(mapToWorld(nx, ny));
  };

  const onWheel = (e: React.WheelEvent) => {
    changeZoom(e.deltaY < 0 ? 1 : -1);
  };

  const m = marker ? worldToMap(marker.latitude, marker.longitude) : null;

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden touch-none select-none bg-[#0e2436] cursor-grab active:cursor-grabbing', className)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onWheel={onWheel}
      role="application"
      aria-label="GTA V map"
    >
      <div
        className="absolute top-0 left-0"
        style={{ width: mapW, height: mapH, transform: `translate(${pan.x}px, ${pan.y}px)` }}
      >
        {Array.from({ length: cols * rows }, (_, i) => {
          const x = i % cols;
          const y = Math.floor(i / cols);
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${zoom}-${x}-${y}`}
              src={`/gta-map/render/${zoom}/${x}/${y}.jpg`}
              alt=""
              draggable={false}
              className="absolute"
              style={{ left: x * TILE, top: y * TILE, width: TILE, height: TILE }}
              loading="lazy"
            />
          );
        })}

        {/* Current position — iOS blue dot */}
        {m && (
          <div
            data-testid="gta-map-marker"
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: m.nx * mapW, top: m.ny * mapH }}
          >
            <span className="absolute -inset-3 rounded-full bg-ios-blue/25 animate-ping" />
            <span className="relative block w-[18px] h-[18px] rounded-full bg-ios-blue border-[3px] border-white shadow-[0_1px_6px_rgba(0,0,0,0.5)]" />
          </div>
        )}
      </div>

      {/* Zoom controls */}
      <div className="absolute top-3 right-3 flex flex-col rounded-[10px] overflow-hidden ios-material-thin">
        <button
          onClick={(e) => { e.stopPropagation(); changeZoom(1); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="w-[36px] h-[36px] text-white text-[20px] font-medium active:bg-white/20"
          aria-label="Zoom in"
        >
          +
        </button>
        <div className="h-[0.5px] bg-white/25" />
        <button
          onClick={(e) => { e.stopPropagation(); changeZoom(-1); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="w-[36px] h-[36px] text-white text-[22px] font-medium active:bg-white/20"
          aria-label="Zoom out"
        >
          −
        </button>
      </div>
    </div>
  );
}
