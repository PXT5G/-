'use client';

import { useState, useEffect } from 'react';
import { formatTime } from '@/utils/date';
import { useSettingsStore } from '@/stores/settingsStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useDeviceStorage } from '@/hooks/useDeviceStorage';
import { useBattery } from '@/hooks/useSystemServices';
import { useSignal } from '@/hooks/useWorldServices';
import { cn } from '@/utils/cn';

function CellularBars({ bars, generation }: { bars: number; generation: string }) {
  if (generation === 'none') {
    return <span className="text-[10px] text-white/60" aria-label="No service">✕</span>;
  }
  if (generation === 'emergency') {
    return <span className="text-[10px] text-amber-400" aria-label="Emergency only">SOS</span>;
  }
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor" aria-label={`Cellular signal ${bars} of 5`}>
      {[0, 4, 8, 12].map((x, i) => (
        <rect
          key={x}
          x={x}
          y={8 - i * 2.5}
          width="3"
          height={4 + i * 2.5}
          rx="0.5"
          opacity={i < bars ? 1 : 0.25}
        />
      ))}
    </svg>
  );
}

export function StatusBar() {
  const [time, setTime] = useState(new Date());
  const silentMode = useSettingsStore((s) => s.silentMode);
  const wifiEnabled = useSettingsStore((s) => s.wifiEnabled);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const { data: storage } = useDeviceStorage();
  const { batteryLevel } = useBattery();
  const { signalBars, generation, carrier } = useSignal();

  const battery = batteryLevel ?? 87;
  const lowStorage = storage?.lowStorageLevel === 'warning' || storage?.lowStorageLevel === 'low';
  const criticalStorage = storage?.lowStorageLevel === 'critical' || storage?.lowStorageLevel === 'emergency';
  const memoryPressure = false;

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 10000);
    return () => clearInterval(interval);
  }, []);

  const genLabel = generation === '5g' ? '5G' : generation === '4g' ? 'LTE' : generation === 'none' ? '' : generation.toUpperCase();

  return (
    <div
      className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 pt-3 pb-1"
      role="status"
      aria-label="Status bar"
    >
      <span className="text-xs font-semibold text-white tabular-nums w-16">
        {formatTime(time)}
      </span>

      <div className="flex-1 flex justify-center gap-1">
        {memoryPressure && (
          <span className="text-[9px] text-red-400 bg-red-500/20 px-1.5 py-0.5 rounded" title="Memory pressure">
            RAM
          </span>
        )}
        {criticalStorage && (
          <span className="text-[9px] text-red-400 bg-red-500/20 px-1.5 py-0.5 rounded" title="Storage critical">
            !
          </span>
        )}
        {lowStorage && !criticalStorage && (
          <span className="text-[9px] text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded" title="Low storage">
            💾
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-white">
        {genLabel && (
          <span className="text-[9px] font-semibold text-white/80" aria-label={`${carrier} ${genLabel}`}>
            {genLabel}
          </span>
        )}
        {silentMode && <span className="text-[10px]" aria-label="Silent mode">🔇</span>}
        {unreadCount > 0 && (
          <span className="text-[10px] bg-gulf-gold text-black rounded-full w-4 h-4 flex items-center justify-center font-bold" aria-label={`${unreadCount} notifications`}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {wifiEnabled && (
          <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor" aria-label="WiFi connected">
            <path d="M8 9.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM3.5 5.5a7 7 0 019 0l-1 1.2a5.5 5.5 0 00-7 0L3.5 5.5zM1 3a11 11 0 0114 0l-1.2 1.4a9.5 9.5 0 00-11.6 0L1 3z" />
          </svg>
        )}
        <CellularBars bars={signalBars} generation={generation} />
        <div className="flex items-center gap-0.5" aria-label={`Battery ${battery}%`}>
          <div className="w-6 h-3 border border-white/80 rounded-sm relative">
            <div
              className={cn(
                'absolute inset-0.5 rounded-[1px]',
                battery > 20 ? 'bg-white' : 'bg-red-500'
              )}
              style={{ width: `${battery}%` }}
            />
          </div>
          <div className="w-0.5 h-1.5 bg-white/80 rounded-r-sm" />
        </div>
      </div>
    </div>
  );
}
