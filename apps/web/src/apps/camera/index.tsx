'use client';

import { useState } from 'react';
import { useCapturePhoto } from '@/hooks/useSystemApps';
import { useQuery } from '@tanstack/react-query';
import { systemAppsService } from '@/services/systemAppsService';
import { useHaptic } from '@/hooks/useSound';

const MODES = ['photo', 'portrait', 'video', 'slow_motion', 'time_lapse', 'night'] as const;
const FLASH = ['off', 'on', 'auto'] as const;

export function CameraApp() {
  const { tap, success } = useHaptic();
  const [mode, setMode] = useState<string>('photo');
  const [flash, setFlash] = useState<string>('auto');
  const [zoom, setZoom] = useState(1);
  const [hdr, setHdr] = useState(false);
  const [grid, setGrid] = useState(false);
  const [timer, setTimer] = useState(0);
  const capture = useCapturePhoto();

  const { data: settings } = useQuery({
    queryKey: ['camera', 'settings'],
    queryFn: () => systemAppsService.getCameraSettings(),
  });

  const { data: roll } = useQuery({
    queryKey: ['system-apps', 'camera', 'roll'],
    queryFn: () => systemAppsService.getCameraRoll(),
  });

  const handleCapture = async () => {
    tap();
    try {
      if (mode === 'video' || mode === 'slow_motion' || mode === 'time_lapse') {
        await systemAppsService.captureVideo({ mode, flash, zoom, durationSeconds: mode === 'time_lapse' ? 10 : 15, fps: mode === 'slow_motion' ? 120 : 30 });
      } else {
        await capture.mutateAsync({ mode, flash, hdr, zoom, timer, grid, megapixels: mode === 'night' ? 8 : mode === 'portrait' ? 12 : 24 });
      }
      success();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="h-full flex flex-col bg-black relative">
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-gray-900">
          {grid && (
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="border border-white/10" />
              ))}
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 rounded-full border-2 border-white/20 flex items-center justify-center">
              <span className="text-6xl">📷</span>
            </div>
          </div>
        </div>

        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
          <div className="flex gap-2">
            <button type="button" onClick={() => setFlash(FLASH[(FLASH.indexOf(flash as never) + 1) % FLASH.length])} className="px-3 py-1 rounded-full bg-black/50 text-white text-xs">
              ⚡ {flash}
            </button>
            <button type="button" onClick={() => setHdr(!hdr)} className={`px-3 py-1 rounded-full text-xs ${hdr ? 'bg-banana-gold text-black' : 'bg-black/50 text-white'}`}>HDR</button>
            <button type="button" onClick={() => setGrid(!grid)} className={`px-3 py-1 rounded-full text-xs ${grid ? 'bg-banana-gold text-black' : 'bg-black/50 text-white'}`}>Grid</button>
          </div>
          <span className="text-white/60 text-xs">{zoom.toFixed(1)}x</span>
        </div>

        <div className="absolute bottom-32 left-0 right-0 flex justify-center gap-4 overflow-x-auto px-4">
          {MODES.map((m) => (
            <button key={m} type="button" onClick={() => { tap(); setMode(m); }} className={`text-xs capitalize whitespace-nowrap px-2 py-1 ${mode === m ? 'text-banana-gold' : 'text-white/50'}`}>
              {m.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 flex items-center justify-between bg-black/80">
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/10">
          {roll?.[0] ? <span className="text-2xl flex items-center justify-center h-full">🖼️</span> : null}
        </div>
        <button
          type="button"
          onClick={handleCapture}
          disabled={capture.isPending}
          className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center disabled:opacity-50"
        >
          <div className={`w-12 h-12 rounded-full ${mode.includes('video') || mode === 'slow_motion' || mode === 'time_lapse' ? 'bg-red-500' : 'bg-white'}`} />
        </button>
        <input type="range" min={1} max={Number((settings as { maxZoom?: number })?.maxZoom ?? 10)} step={0.5} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-12" aria-label="Zoom" />
      </div>
    </div>
  );
}
