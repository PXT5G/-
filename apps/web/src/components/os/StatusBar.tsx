'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { formatTime } from '@/utils/date';
import { useSettingsStore } from '@/stores/settingsStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { usePhoneOsStore } from '@/stores/phoneOsStore';
import { useBattery, useNetwork } from '@/hooks/useSystemServices';
import { useSignal } from '@/hooks/useWorldServices';
import { cn } from '@/utils/cn';

/** iOS cellular glyph — 4 ascending bars */
function CellularBars({ bars, generation }: { bars: number; generation: string }) {
  if (generation === 'none') {
    return <span className="text-[12px] font-semibold text-white/60" aria-label="No service">✕</span>;
  }
  if (generation === 'emergency') {
    return <span className="text-[11px] font-semibold text-white" aria-label="Emergency only">SOS</span>;
  }
  const active = Math.min(4, Math.max(0, Math.round((bars / 5) * 4)));
  return (
    <svg width="19" height="12" viewBox="0 0 19 12" fill="currentColor" aria-label={`Cellular signal ${bars} of 5`}>
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={i * 5}
          y={9 - i * 3}
          width="3.4"
          height={3 + i * 3}
          rx="1.2"
          opacity={i < active ? 1 : 0.3}
        />
      ))}
    </svg>
  );
}

/** iOS WiFi glyph — 3 arcs */
function WifiIcon() {
  return (
    <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor" aria-label="WiFi connected">
      <path d="M8.5 9.6c.9 0 1.63.73 1.63 1.63 0 .9-.73 1.62-1.63 1.62s-1.63-.72-1.63-1.62c0-.9.73-1.63 1.63-1.63z" transform="translate(0 -1.2)" />
      <path d="M8.5 5.9c1.62 0 3.1.62 4.21 1.63a.5.5 0 01.02.72l-.83.86a.5.5 0 01-.7.02 4.02 4.02 0 00-5.4 0 .5.5 0 01-.7-.02l-.83-.86a.5.5 0 01.02-.72A6.24 6.24 0 018.5 5.9z" transform="translate(0 -1.2)" />
      <path d="M8.5 2.1c2.65 0 5.07 1 6.9 2.65a.5.5 0 01.02.73l-.82.85a.5.5 0 01-.7.02 8.53 8.53 0 00-10.8 0 .5.5 0 01-.7-.02l-.82-.85a.5.5 0 01.02-.73A10.42 10.42 0 018.5 2.1z" transform="translate(0 -1.2)" />
    </svg>
  );
}

/** iOS battery glyph — rounded body + cap, filled by level */
function BatteryIcon({ level, isCharging }: { level: number; isCharging: boolean }) {
  const width = Math.max(2, (level / 100) * 21);
  const fill = isCharging ? '#30D158' : level <= 20 ? '#FF453A' : '#FFFFFF';
  return (
    <div className="relative flex items-center" aria-label={`Battery ${level}%${isCharging ? ', charging' : ''}`}>
      <svg width="27.5" height="13" viewBox="0 0 27.5 13" fill="none">
        <rect x="0.5" y="0.5" width="24" height="12" rx="3.8" stroke="white" strokeOpacity="0.4" />
        <rect x="2" y="2" width={width} height="9" rx="2.4" fill={fill} />
        <path d="M26 4.5v4a2.2 2.2 0 000-4z" fill="white" fillOpacity="0.4" />
      </svg>
      {isCharging && (
        <svg width="9" height="12" viewBox="0 0 9 12" className="absolute left-1/2 top-1/2 -translate-x-[60%] -translate-y-1/2" fill="white">
          <path d="M5.2 0L0.8 6.8h2.8L3 12l4.6-7.2H4.8L5.2 0z" stroke="black" strokeWidth="0.5" />
        </svg>
      )}
    </div>
  );
}

/**
 * Native iOS status bar — iPhone 16 Pro Max.
 * Time in left ear, indicators in right ear, Dynamic Island between.
 * Safe-area height: 54pt.
 */
export function StatusBar() {
  const [time, setTime] = useState(new Date());
  const wifiEnabled = useSettingsStore((s) => s.wifiEnabled);
  const airplaneMode = useSettingsStore((s) => s.airplaneMode);
  const lowPowerMode = useSettingsStore((s) => s.lowPowerMode);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const setCenterOpen = useNotificationStore((s) => s.setCenterOpen);
  const battery = usePhoneOsStore((s) => s.battery);
  const statusBarConfig = usePhoneOsStore((s) => s.statusBar);
  const { batteryLevel, isCharging } = useBattery();
  const { signalBars, generation, carrier } = useSignal();
  const { data: network } = useNetwork();

  const level = battery?.level ?? batteryLevel ?? 87;
  const charging = battery?.isCharging ?? isCharging ?? false;
  const vpnEnabled = network?.vpnEnabled ?? false;

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const genLabel =
    generation === '5g' ? '5G' : generation === '4g' ? 'LTE' : generation === 'none' ? '' : generation.toUpperCase();

  return (
    <motion.div
      className="absolute top-0 left-0 right-0 z-50 h-[54px] flex items-end justify-between px-[52px] pb-[9px]"
      role="status"
      aria-label="Status bar"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Left ear — time */}
      {(statusBarConfig?.showClock ?? true) && (
        <button
          type="button"
          onClick={() => setCenterOpen(true)}
          className="text-[17px] font-semibold text-white tabular-nums tracking-[-0.02em] min-w-[64px] text-center font-display"
        >
          {formatTime(time)}
        </button>
      )}

      {/* Right ear — indicators */}
      <div className="flex items-center gap-[7px] text-white">
        {airplaneMode && (
          <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor" aria-label="Airplane mode">
            <path d="M14.2 9.2L8.8 6V2.2C8.8 1.4 8.2 0.5 7.5 0.5S6.2 1.4 6.2 2.2V6L0.8 9.2v1.5l5.4-1.7v3.4L4.6 13.6v1l2.9-.8 2.9.8v-1l-1.6-1.2V9l5.4 1.7V9.2z" />
          </svg>
        )}
        {vpnEnabled && (statusBarConfig?.showVpn ?? true) && (
          <span className="text-[10px] font-bold tracking-tight px-[5px] py-[1px] rounded-[4px] border border-white/50" aria-label="VPN">
            VPN
          </span>
        )}
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => setCenterOpen(true)}
            className="text-[11px] bg-ios-red text-white rounded-full min-w-[17px] h-[17px] px-1 flex items-center justify-center font-semibold"
            aria-label={`${unreadCount} notifications`}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </button>
        )}
        {!airplaneMode && <CellularBars bars={signalBars} generation={generation} />}
        {genLabel && (statusBarConfig?.showCarrier ?? true) && (
          <span className="text-[14px] font-semibold tracking-tight" aria-label={`${carrier} ${genLabel}`}>
            {genLabel}
          </span>
        )}
        {wifiEnabled && !airplaneMode && <WifiIcon />}
        {lowPowerMode && (
          <span className="text-[13px] font-semibold text-ios-yellow" aria-label="Low power mode">▲</span>
        )}
        <BatteryIcon level={level} isCharging={charging} />
      </div>
    </motion.div>
  );
}
