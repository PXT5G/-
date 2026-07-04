'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useControlCenterStore } from '@/stores/controlCenterStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useThemeStore } from '@/stores/themeStore';
import { usePhoneOsStore } from '@/stores/phoneOsStore';
import { Toggle } from '@/components/ui/Toggle';
import { Slider } from '@/components/ui/Slider';
import { controlCenterSlide } from '@/animations/transitions';
import { useHaptic } from '@/hooks/useSound';
import { useCarrier, useSignal } from '@/hooks/useWorldServices';
import { useSetPerformanceMode, useChargingControl } from '@/hooks/usePhoneOs';
import { GlassPanel } from '@/components/ui/GlassPanel';

export function ControlCenter() {
  const { isOpen, close } = useControlCenterStore();
  const settings = useSettingsStore();
  const { mode, setMode } = useThemeStore();
  const { tap } = useHaptic();
  const { data: carrier } = useCarrier();
  const { signalBars, generation, carrier: carrierName } = useSignal();
  const battery = usePhoneOsStore((s) => s.battery);
  const controlCenter = usePhoneOsStore((s) => s.controlCenter);
  const performance = usePhoneOsStore((s) => s.performance);
  const setPerformanceMode = useSetPerformanceMode();
  const { start: startCharging, stop: stopCharging } = useChargingControl();

  const toggle = (key: keyof typeof settings, value: boolean) => {
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
    if (battery?.isCharging) {
      stopCharging.mutate();
    } else {
      startCharging.mutate('fast');
    }
  };

  const genLabel = generation === '5g' ? '5G' : generation === '4g' ? 'LTE' : generation.toUpperCase();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="absolute inset-0 z-[45] bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.div
            className="absolute top-0 left-0 right-0 z-[46] p-4 pt-14"
            {...controlCenterSlide}
          >
            <GlassPanel className="p-4 backdrop-blur-2xl" intensity="high">
              <div className="grid grid-cols-4 gap-3 mb-4">
                <ControlTile
                  icon="📶"
                  label="WiFi"
                  active={settings.wifiEnabled}
                  onClick={() => toggle('wifiEnabled', !settings.wifiEnabled)}
                />
                <ControlTile
                  icon="🔵"
                  label="Bluetooth"
                  active={settings.bluetoothEnabled}
                  onClick={() => toggle('bluetoothEnabled', !settings.bluetoothEnabled)}
                />
                <ControlTile
                  icon="✈️"
                  label="Airplane"
                  active={settings.airplaneMode}
                  onClick={() => toggle('airplaneMode', !settings.airplaneMode)}
                />
                <ControlTile
                  icon={mode === 'dark' ? '🌙' : '☀️'}
                  label="Theme"
                  active={mode === 'dark'}
                  onClick={toggleTheme}
                />
                <ControlTile
                  icon="🔇"
                  label="Silent"
                  active={settings.silentMode}
                  onClick={() => toggle('silentMode', !settings.silentMode)}
                />
                <ControlTile
                  icon="🔦"
                  label="Flash"
                  active={settings.flashlightEnabled}
                  onClick={() => toggle('flashlightEnabled', !settings.flashlightEnabled)}
                />
                <ControlTile
                  icon="🔒"
                  label="Rotation"
                  active={settings.rotationLock}
                  onClick={() => toggle('rotationLock', !settings.rotationLock)}
                />
                <ControlTile
                  icon="🔋"
                  label="Low Power"
                  active={settings.lowPowerMode}
                  onClick={() => toggle('lowPowerMode', !settings.lowPowerMode)}
                />
                <ControlTile
                  icon="📡"
                  label="Hotspot"
                  active={settings.hotspotEnabled}
                  onClick={() => toggle('hotspotEnabled', !settings.hotspotEnabled)}
                />
                <ControlTile
                  icon={battery?.isCharging ? '⚡' : '🔌'}
                  label={battery?.isCharging ? 'Charging' : 'Charge'}
                  active={battery?.isCharging ?? false}
                  onClick={toggleCharging}
                />
              </div>

              {(controlCenter?.brightnessEnabled ?? true) && (
                <div className="space-y-4 mb-4">
                  <Slider
                    value={settings.brightness}
                    onChange={(v) => settings.updateSettings({ brightness: v })}
                    label="Brightness"
                    icon={<span>☀️</span>}
                  />
                  <Slider
                    value={settings.volume}
                    onChange={(v) => settings.updateSettings({ volume: v })}
                    label="Volume"
                    icon={<span>🔊</span>}
                  />
                </div>
              )}

              {(controlCenter?.showBatteryWidget ?? true) && battery && (
                <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-white/50">Battery</p>
                      <p className="text-lg font-semibold text-white">{Math.round(battery.level)}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-white/50">
                        {battery.isCharging ? `${battery.chargingType} charging` : 'Discharging'}
                      </p>
                      <p className="text-xs text-white/40">
                        Health {Math.round(battery.health)}% · {battery.chargingCycles} cycles
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gulf-gold rounded-full"
                      animate={{ width: `${battery.level}%` }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  </div>
                </div>
              )}

              {(controlCenter?.showNetworkDetails ?? true) && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-white/50">Carrier</p>
                      <p className="text-sm font-medium text-white">{carrierName ?? carrier?.name ?? 'Gulf Mobile'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-white/50">Signal</p>
                      <p className="text-sm font-medium text-white">{genLabel} · {signalBars}/5</p>
                    </div>
                  </div>
                </div>
              )}

              {performance && (
                <div className="mt-3 flex items-center justify-between text-xs text-white/50">
                  <span>CPU {performance.cpuUsagePercent}%</span>
                  <span>GPU {performance.gpuUsagePercent}%</span>
                  <span className="capitalize">{performance.thermalState}</span>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-white/70">Do Not Disturb</span>
                <Toggle
                  enabled={settings.silentMode}
                  onChange={(v) => toggle('silentMode', v)}
                  label="Do Not Disturb"
                />
              </div>
            </GlassPanel>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ControlTile({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-colors backdrop-blur-sm ${
        active ? 'bg-white/25 border border-white/30' : 'bg-white/10 border border-white/10'
      }`}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <span className="text-xl mb-1">{icon}</span>
      <span className="text-[10px] text-white/80 font-medium">{label}</span>
    </motion.button>
  );
}
