'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { formatTime } from '@/utils/date';
import { useSettingsStore } from '@/stores/settingsStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { usePhoneOsStore } from '@/stores/phoneOsStore';
import { useDeviceStorage } from '@/hooks/useDeviceStorage';
import { useBattery, useNetwork } from '@/hooks/useSystemServices';
import { useSignal } from '@/hooks/useWorldServices';
import { useSystemStore } from '@/stores/systemStore';
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

function BatteryIcon({ level, isCharging }: { level: number; isCharging: boolean }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Battery ${level}%${isCharging ? ', charging' : ''}`}>
      {isCharging && <span className="text-[9px] text-green-400">⚡</span>}
      <div className="w-6 h-3 border border-white/80 rounded-sm relative overflow-hidden">
        <motion.div
          className={cn('absolute inset-0.5 rounded-[1px]', level > 20 ? 'bg-white' : 'bg-red-500')}
          animate={{ width: `${level}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      </div>
      <div className="w-0.5 h-1.5 bg-white/80 rounded-r-sm" />
    </div>
  );
}

export function StatusBar() {
  const [time, setTime] = useState(new Date());
  const silentMode = useSettingsStore((s) => s.silentMode);
  const wifiEnabled = useSettingsStore((s) => s.wifiEnabled);
  const bluetoothEnabled = useSettingsStore((s) => s.bluetoothEnabled);
  const airplaneMode = useSettingsStore((s) => s.airplaneMode);
  const hotspotEnabled = useSettingsStore((s) => s.hotspotEnabled);
  const lowPowerMode = useSettingsStore((s) => s.lowPowerMode);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const setCenterOpen = useNotificationStore((s) => s.setCenterOpen);
  const battery = usePhoneOsStore((s) => s.battery);
  const statusBarConfig = usePhoneOsStore((s) => s.statusBar);
  const performance = usePhoneOsStore((s) => s.performance);
  const { data: storage } = useDeviceStorage();
  const { batteryLevel, isCharging } = useBattery();
  const deviceState = useSystemStore((s) => s.deviceState);
  const { signalBars, generation, carrier } = useSignal();
  const { data: network } = useNetwork();

  const level = battery?.level ?? batteryLevel ?? 87;
  const charging = battery?.isCharging ?? isCharging ?? false;
  const showPercent = statusBarConfig?.showBatteryPercent ?? true;
  const memoryPressure = (performance?.memoryPressure ?? 0) > 0.7;
  const lowStorage = storage?.lowStorageLevel === 'warning' || storage?.lowStorageLevel === 'low';
  const criticalStorage = storage?.lowStorageLevel === 'critical' || storage?.lowStorageLevel === 'emergency';
  const vpnEnabled = network?.vpnEnabled ?? false;

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const genLabel = generation === '5g' ? '5G' : generation === '4g' ? 'LTE' : generation === 'none' ? '' : generation.toUpperCase();

  return (
    <motion.div
      className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 pt-3 pb-1 backdrop-blur-[2px]"
      role="status"
      aria-label="Status bar"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
    >
      {(statusBarConfig?.showClock ?? true) && (
        <button
          type="button"
          onClick={() => setCenterOpen(true)}
          className="text-xs font-semibold text-white tabular-nums w-16 text-left"
        >
          {formatTime(time)}
        </button>
      )}

      <div className="flex-1 flex justify-center gap-1">
        {memoryPressure && (
          <span className="text-[9px] text-red-400 bg-red-500/20 px-1.5 py-0.5 rounded backdrop-blur-sm" title="Memory pressure">
            RAM
          </span>
        )}
        {criticalStorage && (
          <span className="text-[9px] text-red-400 bg-red-500/20 px-1.5 py-0.5 rounded backdrop-blur-sm" title="Storage critical">
            !
          </span>
        )}
        {lowStorage && !criticalStorage && (
          <span className="text-[9px] text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded backdrop-blur-sm" title="Low storage">
            💾
          </span>
        )}
        {lowPowerMode && (
          <span className="text-[9px] text-yellow-300 bg-yellow-500/20 px-1.5 py-0.5 rounded" title="Low power mode">
            🔋
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-white">
        {airplaneMode && <span className="text-[10px]" aria-label="Airplane mode">✈️</span>}
        {vpnEnabled && (statusBarConfig?.showVpn ?? true) && (
          <span className="text-[9px] font-bold text-blue-300" aria-label="VPN">VPN</span>
        )}
        {hotspotEnabled && (statusBarConfig?.showHotspot ?? true) && (
          <span className="text-[10px]" aria-label="Hotspot">📡</span>
        )}
        {genLabel && (statusBarConfig?.showCarrier ?? true) && (
          <span className="text-[9px] font-semibold text-white/80" aria-label={`${carrier} ${genLabel}`}>
            {genLabel}
          </span>
        )}
        {silentMode && <span className="text-[10px]" aria-label="Silent mode">🔇</span>}
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => setCenterOpen(true)}
            className="text-[10px] bg-gulf-gold text-black rounded-full w-4 h-4 flex items-center justify-center font-bold"
            aria-label={`${unreadCount} notifications`}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </button>
        )}
        {bluetoothEnabled && (
          <span className="text-[10px]" aria-label="Bluetooth">🔵</span>
        )}
        {wifiEnabled && !airplaneMode && (
          <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor" aria-label="WiFi connected">
            <path d="M8 9.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM3.5 5.5a7 7 0 019 0l-1 1.2a5.5 5.5 0 00-7 0L3.5 5.5zM1 3a11 11 0 0114 0l-1.2 1.4a9.5 9.5 0 00-11.6 0L1 3z" />
          </svg>
        )}
        {!airplaneMode && <CellularBars bars={signalBars} generation={generation} />}
        {showPercent && (
          <span className="text-[9px] tabular-nums text-white/80 w-7 text-right">{Math.round(level)}</span>
        )}
        <BatteryIcon level={level} isCharging={charging} />
        {deviceState?.lockState === 'locked' && (
          <span className="text-[10px]" aria-label="Locked">🔒</span>
        )}
      </div>
    </motion.div>
  );
}
