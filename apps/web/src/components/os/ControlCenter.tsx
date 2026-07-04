'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useControlCenterStore } from '@/stores/controlCenterStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useThemeStore } from '@/stores/themeStore';
import { Toggle } from '@/components/ui/Toggle';
import { Slider } from '@/components/ui/Slider';
import { controlCenterSlide } from '@/animations/transitions';
import { useHaptic } from '@/hooks/useSound';
import { GlassPanel } from '@/components/ui/GlassPanel';

export function ControlCenter() {
  const { isOpen, close } = useControlCenterStore();
  const settings = useSettingsStore();
  const { mode, setMode } = useThemeStore();
  const { tap } = useHaptic();

  const toggle = (key: keyof typeof settings, value: boolean) => {
    tap();
  if (key === 'wifiEnabled') settings.updateSettings({ wifiEnabled: value });
    else if (key === 'bluetoothEnabled') settings.updateSettings({ bluetoothEnabled: value });
    else if (key === 'silentMode') settings.updateSettings({ silentMode: value });
    else if (key === 'rotationLock') settings.updateSettings({ rotationLock: value });
    else if (key === 'flashlightEnabled') settings.updateSettings({ flashlightEnabled: value });
  };

  const toggleTheme = () => {
    tap();
    const newMode = mode === 'dark' ? 'light' : 'dark';
    setMode(newMode);
    settings.updateSettings({ theme: newMode });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="absolute inset-0 z-[45] bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.div
            className="absolute top-0 left-0 right-0 z-[46] p-4 pt-14"
            {...controlCenterSlide}
          >
            <GlassPanel className="p-4" intensity="high">
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
              </div>

              <div className="space-y-4">
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
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${
        active ? 'bg-banana-gold/30 border border-banana-gold/50' : 'bg-white/5 border border-white/10'
      }`}
      aria-label={label}
      aria-pressed={active}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-[10px] text-white/70">{label}</span>
    </button>
  );
}
