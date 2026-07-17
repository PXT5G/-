'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useCallback } from 'react';
import { useControlCenterStore } from '@/stores/controlCenterStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useThemeStore } from '@/stores/themeStore';
import { usePhoneOsStore } from '@/stores/phoneOsStore';
import { controlCenterSlide } from '@/animations/transitions';
import { useHaptic } from '@/hooks/useSound';
import { useCarrier, useSignal } from '@/hooks/useWorldServices';
import { useSetPerformanceMode, useChargingControl } from '@/hooks/usePhoneOs';
import { cn } from '@/utils/cn';

/** Circular connectivity button inside the top-left module (iOS style) */
function ConnBtn({
  active,
  onClick,
  label,
  children,
  activeColor = '#0A84FF',
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  activeColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="w-[56px] h-[56px] rounded-full flex items-center justify-center transition-all active:scale-90"
      style={{ background: active ? activeColor : 'rgba(120,120,128,0.32)' }}
    >
      {children}
    </button>
  );
}

/** Square utility tile (flashlight, camera, etc.) */
function UtilityTile({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      aria-label={label}
      className={cn(
        'w-[68px] h-[68px] rounded-[20px] flex items-center justify-center text-[26px] transition-colors',
        active ? 'bg-white text-black' : 'ios-material-thin text-white',
      )}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {icon}
    </motion.button>
  );
}

/** iOS vertical slider (brightness / volume) */
function VerticalSlider({
  value,
  onChange,
  icon,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  icon: React.ReactNode;
  label: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  const setFromEvent = useCallback((clientY: number) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const pct = Math.round(Math.min(100, Math.max(0, ((rect.bottom - clientY) / rect.height) * 100)));
    onChange(pct);
  }, [onChange]);

  return (
    <div
      ref={trackRef}
      role="slider"
      aria-label={label}
      aria-valuenow={value}
      tabIndex={0}
      className="relative w-[76px] h-[176px] rounded-[24px] ios-material-thin overflow-hidden cursor-pointer select-none"
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        setFromEvent(e.clientY);
      }}
      onPointerMove={(e) => {
        if (e.buttons > 0) setFromEvent(e.clientY);
      }}
    >
      <motion.div
        className="absolute bottom-0 left-0 right-0 bg-white"
        animate={{ height: `${value}%` }}
        transition={{ type: 'spring', stiffness: 300, damping: 32 }}
      />
      <div className="absolute bottom-[14px] left-1/2 -translate-x-1/2 text-black/70 mix-blend-luminosity text-[20px]">
        {icon}
      </div>
    </div>
  );
}

/**
 * Native iOS 18 Control Center — full-height material overlay,
 * connectivity module, media module, sliders, utility tiles.
 */
export function ControlCenter() {
  const { isOpen, close } = useControlCenterStore();
  const settings = useSettingsStore();
  const { mode, setMode } = useThemeStore();
  const { tap } = useHaptic();
  const { data: carrier } = useCarrier();
  const { signalBars, generation, carrier: carrierName } = useSignal();
  const battery = usePhoneOsStore((s) => s.battery);
  const performance = usePhoneOsStore((s) => s.performance);
  const setPerformanceMode = useSetPerformanceMode();
  const { start: startCharging, stop: stopCharging } = useChargingControl();

  const toggle = (key: string, value: boolean) => {
    tap();
    if (key === 'wifiEnabled') settings.updateSettings({ wifiEnabled: value });
    else if (key === 'bluetoothEnabled') settings.updateSettings({ bluetoothEnabled: value });
    else if (key === 'silentMode') settings.updateSettings({ silentMode: value });
    else if (key === 'rotationLock') settings.updateSettings({ rotationLock: value });
    else if (key === 'flashlightEnabled') settings.updateSettings({ flashlightEnabled: value });
    else if (key === 'airplaneMode') settings.updateSettings({ airplaneMode: value });
    else if (key === 'hotspotEnabled') settings.updateSettings({ hotspotEnabled: value });
    else if (key === 'lowPowerMode') {
      settings.updateSettings({ lowPowerMode: value });
      setPerformanceMode.mutate(value ? 'power_saving' : 'normal');
    }
  };

  const toggleTheme = () => {
    tap();
    const newMode = mode === 'dark' ? 'light' : 'dark';
    setMode(newMode);
    settings.updateSettings({ theme: newMode });
  };

  const toggleCharging = () => {
    tap();
    if (battery?.isCharging) stopCharging.mutate();
    else startCharging.mutate('fast');
  };

  const genLabel = generation === '5g' ? '5G' : generation === '4g' ? 'LTE' : generation.toUpperCase();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="absolute inset-0 z-[46] ios-material-thick flex flex-col"
          {...controlCenterSlide}
          onClick={close}
        >
          <div className="px-[26px] pt-[74px]" onClick={(e) => e.stopPropagation()}>
            <div className="grid grid-cols-2 gap-[14px]">
              {/* ── Connectivity module ── */}
              <div className="ios-material-thin rounded-[24px] p-[14px] aspect-square grid grid-cols-2 gap-2 place-items-center">
                <ConnBtn active={settings.airplaneMode} activeColor="#FF9F0A" label="Airplane Mode" onClick={() => toggle('airplaneMode', !settings.airplaneMode)}>
                  <svg width="24" height="24" viewBox="0 0 15 15" fill="white"><path d="M14.2 9.2L8.8 6V2.2C8.8 1.4 8.2 0.5 7.5 0.5S6.2 1.4 6.2 2.2V6L0.8 9.2v1.5l5.4-1.7v3.4L4.6 13.6v1l2.9-.8 2.9.8v-1l-1.6-1.2V9l5.4 1.7V9.2z" /></svg>
                </ConnBtn>
                <ConnBtn active={!settings.airplaneMode} activeColor="#30D158" label="Cellular" onClick={() => toggle('airplaneMode', false)}>
                  <svg width="22" height="22" viewBox="0 0 19 12" fill="white">{[0, 1, 2, 3].map((i) => (<rect key={i} x={i * 5} y={9 - i * 3} width="3.4" height={3 + i * 3} rx="1.2" />))}</svg>
                </ConnBtn>
                <ConnBtn active={settings.wifiEnabled} label="WiFi" onClick={() => toggle('wifiEnabled', !settings.wifiEnabled)}>
                  <svg width="24" height="20" viewBox="0 0 17 12" fill="white"><path d="M8.5 9.6c.9 0 1.63.73 1.63 1.63 0 .9-.73 1.62-1.63 1.62s-1.63-.72-1.63-1.62c0-.9.73-1.63 1.63-1.63z" transform="translate(0 -1.2)" /><path d="M8.5 5.9c1.62 0 3.1.62 4.21 1.63a.5.5 0 01.02.72l-.83.86a.5.5 0 01-.7.02 4.02 4.02 0 00-5.4 0 .5.5 0 01-.7-.02l-.83-.86a.5.5 0 01.02-.72A6.24 6.24 0 018.5 5.9z" transform="translate(0 -1.2)" /><path d="M8.5 2.1c2.65 0 5.07 1 6.9 2.65a.5.5 0 01.02.73l-.82.85a.5.5 0 01-.7.02 8.53 8.53 0 00-10.8 0 .5.5 0 01-.7-.02l-.82-.85a.5.5 0 01.02-.73A10.42 10.42 0 018.5 2.1z" transform="translate(0 -1.2)" /></svg>
                </ConnBtn>
                <ConnBtn active={settings.bluetoothEnabled} label="Bluetooth" onClick={() => toggle('bluetoothEnabled', !settings.bluetoothEnabled)}>
                  <svg width="14" height="22" viewBox="0 0 12 20" fill="white"><path d="M5.2 0v7.8L1.4 4.6 0 6l4.4 4L0 14l1.4 1.4 3.8-3.2V20h1.2l5-4.6-3.6-3.4 3.6-3.4-5-4.6H5.2zm1.6 3.4l2 1.8-2 1.9V3.4zm0 9.5l2 1.9-2 1.8v-3.7z" /></svg>
                </ConnBtn>
              </div>

              {/* ── Media module ── */}
              <div className="ios-material-thin rounded-[24px] p-[18px] aspect-square flex flex-col justify-between">
                <div>
                  <p className="text-[15px] font-semibold text-white">Not Playing</p>
                  <p className="text-[13px] text-white/50 mt-0.5">GULF Music</p>
                </div>
                <div className="flex items-center justify-around text-white">
                  <svg width="26" height="18" viewBox="0 0 26 18" fill="currentColor" opacity="0.85"><path d="M12 9L24 1v16L12 9zM0 9L12 1v16L0 9z" transform="scale(0.9)" /></svg>
                  <svg width="20" height="24" viewBox="0 0 18 22" fill="currentColor"><path d="M0 0l18 11L0 22V0z" /></svg>
                  <svg width="26" height="18" viewBox="0 0 26 18" fill="currentColor" opacity="0.85"><path d="M14 9L2 17V1l12 8zM26 9L14 17V1l12 8z" transform="scale(0.9)" /></svg>
                </div>
              </div>
            </div>

            {/* ── Middle row: small tiles + sliders ── */}
            <div className="mt-[14px] flex gap-[14px]">
              <div className="flex-1 grid grid-cols-2 gap-[14px]">
                <UtilityTile active={settings.rotationLock} label="Rotation Lock" icon="🔒" onClick={() => toggle('rotationLock', !settings.rotationLock)} />
                <UtilityTile active={settings.silentMode} label="Focus" icon="🌙" onClick={() => toggle('silentMode', !settings.silentMode)} />
                <UtilityTile active={mode === 'dark'} label="Dark Mode" icon={mode === 'dark' ? '🌗' : '☀️'} onClick={toggleTheme} />
                <UtilityTile active={settings.lowPowerMode} label="Low Power Mode" icon="🔋" onClick={() => toggle('lowPowerMode', !settings.lowPowerMode)} />
              </div>
              <VerticalSlider
                value={settings.brightness}
                onChange={(v) => settings.updateSettings({ brightness: v })}
                label="Brightness"
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="5" /><g stroke="currentColor" strokeWidth="2" strokeLinecap="round">{[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (<line key={a} x1={12 + 9 * Math.cos((a * Math.PI) / 180)} y1={12 + 9 * Math.sin((a * Math.PI) / 180)} x2={12 + 11 * Math.cos((a * Math.PI) / 180)} y2={12 + 11 * Math.sin((a * Math.PI) / 180)} />)) }</g></svg>}
              />
              <VerticalSlider
                value={settings.volume}
                onChange={(v) => settings.updateSettings({ volume: v })}
                label="Volume"
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3z" /><path d="M16 8a4.5 4.5 0 010 8" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>}
              />
            </div>

            {/* ── Utility row ── */}
            <div className="mt-[14px] flex gap-[14px]">
              <UtilityTile active={settings.flashlightEnabled} label="Flashlight" icon="🔦" onClick={() => toggle('flashlightEnabled', !settings.flashlightEnabled)} />
              <UtilityTile active={false} label="Timer" icon="⏱️" onClick={() => tap()} />
              <UtilityTile active={battery?.isCharging ?? false} label="Charging" icon="⚡" onClick={toggleCharging} />
              <UtilityTile active={performance?.performanceMode === 'performance'} label="Performance" icon="🚀" onClick={() => { tap(); setPerformanceMode.mutate('performance'); }} />
            </div>

            {/* ── Connectivity summary ── */}
            <div className="mt-[14px] ios-material-thin rounded-[20px] px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-[12px] text-white/50">Connectivity</p>
                <p className="text-[15px] font-medium text-white">{carrierName ?? carrier?.name ?? 'Gulf Mobile'}</p>
              </div>
              <p className="text-[15px] font-medium text-white/80">{genLabel} · {signalBars}/5</p>
            </div>
          </div>

          {/* Tap anywhere below to dismiss (root onClick) */}
          <div className="flex-1" aria-hidden />
          <button
            className="pb-[9px] pt-2 flex justify-center w-full"
            onClick={close}
            aria-label="Dismiss Control Center"
          >
            <div className="w-[148px] h-[5px] rounded-full bg-white/90" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
