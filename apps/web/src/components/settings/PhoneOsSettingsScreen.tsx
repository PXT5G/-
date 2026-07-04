'use client';

import { usePhoneOsInit, useSetPerformanceMode, useChargingControl } from '@/hooks/usePhoneOs';
import { usePhoneOsStore } from '@/stores/phoneOsStore';
import { phoneOsService } from '@/services/phoneOsService';
import { SettingsSection } from './SettingsSection';
import { SettingsRow } from './SettingsRow';
import { Toggle } from '@/components/ui/Toggle';
import { useHaptic } from '@/hooks/useSound';

interface PhoneOsSettingsScreenProps {
  onBack: () => void;
}

const PERFORMANCE_MODES = [
  { id: 'normal', label: 'Normal' },
  { id: 'balanced', label: 'Balanced' },
  { id: 'performance', label: 'Performance' },
  { id: 'power_saving', label: 'Power Saving' },
  { id: 'ultra_power_saving', label: 'Ultra Power Saving' },
] as const;

export function PhoneOsSettingsScreen({ onBack }: PhoneOsSettingsScreenProps) {
  const { data, isLoading } = usePhoneOsInit();
  const battery = usePhoneOsStore((s) => s.battery);
  const performance = usePhoneOsStore((s) => s.performance);
  const lockScreen = usePhoneOsStore((s) => s.lockScreen);
  const setPerformanceMode = useSetPerformanceMode();
  const { start, stop } = useChargingControl();
  const { tap } = useHaptic();

  const handleLockScreenToggle = async (key: string, value: boolean) => {
    tap();
    try {
      await phoneOsService.updateLockScreen({ [key]: value } as Partial<import('@/types').LockScreenConfigSnapshot>);
    } catch { /* sync on next load */ }
  };

  if (isLoading && !data) {
    return (
      <div className="h-full overflow-y-auto bg-black p-4">
        <button type="button" onClick={onBack} className="text-gulf-gold text-sm mb-4">‹ Back</button>
        <p className="text-white/50">Loading Phone OS settings...</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-black p-4">
      <button type="button" onClick={onBack} className="text-gulf-gold text-sm mb-4">‹ Back</button>
      <h2 className="text-xl font-bold text-white mb-4">Phone OS</h2>

      <SettingsSection title="Battery">
        <SettingsRow label="Level" value={`${Math.round(battery?.level ?? 0)}%`} />
        <SettingsRow label="Health" value={`${Math.round(battery?.health ?? 0)}%`} />
        <SettingsRow label="Charging Cycles" value={String(battery?.chargingCycles ?? 0)} />
        <SettingsRow label="Temperature" value={`${battery?.temperatureCelsius?.toFixed(1) ?? '—'}°C`} />
        <div className="flex items-center justify-between py-3 border-b border-white/10">
          <span className="text-sm text-white">Charging</span>
          <Toggle
            enabled={battery?.isCharging ?? false}
            onChange={(v) => {
              tap();
              if (v) start.mutate('fast');
              else stop.mutate();
            }}
            label="Charging"
          />
        </div>
      </SettingsSection>

      <SettingsSection title="Performance">
        <SettingsRow label="CPU Usage" value={`${performance?.cpuUsagePercent ?? 0}%`} />
        <SettingsRow label="GPU Usage" value={`${performance?.gpuUsagePercent ?? 0}%`} />
        <SettingsRow label="Thermal State" value={performance?.thermalState ?? 'nominal'} />
        <div className="py-2">
          <p className="text-xs text-white/50 mb-2">Performance Mode</p>
          <div className="flex flex-wrap gap-2">
            {PERFORMANCE_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => { tap(); setPerformanceMode.mutate(mode.id); }}
                className={`px-3 py-1.5 rounded-lg text-xs ${
                  performance?.performanceMode === mode.id
                    ? 'bg-gulf-gold text-black'
                    : 'bg-white/10 text-white'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Lock Screen">
        <div className="flex items-center justify-between py-3 border-b border-white/10">
          <span className="text-sm text-white">Face Unlock</span>
          <Toggle
            enabled={lockScreen?.faceUnlockEnabled ?? true}
            onChange={(v) => void handleLockScreenToggle('faceUnlockEnabled', v)}
            label="Face Unlock"
          />
        </div>
        <div className="flex items-center justify-between py-3 border-b border-white/10">
          <span className="text-sm text-white">Fingerprint</span>
          <Toggle
            enabled={lockScreen?.fingerprintEnabled ?? true}
            onChange={(v) => void handleLockScreenToggle('fingerprintEnabled', v)}
            label="Fingerprint"
          />
        </div>
        <div className="flex items-center justify-between py-3 border-b border-white/10">
          <span className="text-sm text-white">Always On Display</span>
          <Toggle
            enabled={lockScreen?.alwaysOnDisplay ?? false}
            onChange={(v) => void handleLockScreenToggle('alwaysOnDisplay', v)}
            label="Always On Display"
          />
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-sm text-white">Raise to Wake</span>
          <Toggle
            enabled={lockScreen?.raiseToWake ?? true}
            onChange={(v) => void handleLockScreenToggle('raiseToWake', v)}
            label="Raise to Wake"
          />
        </div>
      </SettingsSection>
    </div>
  );
}
