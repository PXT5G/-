'use client';

import { useBattery } from '@/hooks/useSystemServices';
import { useDevicePower } from '@/hooks/useDeviceEcosystem';
import { useHaptic } from '@/hooks/useSound';
import { formatBytes } from '@/services/deviceStorageService';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-white/5 last:border-0">
      <span className="text-sm text-white/60">{label}</span>
      <span className="text-sm text-white">{value}</span>
    </div>
  );
}

export function BatterySettingsScreen({ onBack }: { onBack: () => void }) {
  const { tap } = useHaptic();
  const { data, isLoading, batteryLevel, batteryHealth, isCharging, temperature, lowPowerMode } = useBattery();
  const { data: power } = useDevicePower();

  if (isLoading || !data) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-black">
      <div className="p-4 pb-8">
        <button type="button" onClick={() => { tap(); onBack(); }} className="text-banana-gold text-sm mb-4">‹ Settings</button>
        <h1 className="text-2xl font-bold text-white mb-6">Battery</h1>

        <div className="text-center mb-6">
          <p className="text-5xl font-bold text-banana-gold">{batteryLevel}%</p>
          <p className="text-sm text-white/50 mt-1">
            {isCharging ? 'Charging' : lowPowerMode ? 'Low Power Mode' : 'Discharging'}
          </p>
        </div>

        <section className="p-4 rounded-xl bg-white/5 border border-white/10">
          <InfoRow label="Battery Health" value={`${batteryHealth}%`} />
          {power && (
            <>
              <InfoRow label="Charging Cycles" value={String(power.chargingCycles)} />
              <InfoRow label="Power Mode" value={power.powerMode.replace(/_/g, ' ')} />
              <InfoRow label="Charging Type" value={power.chargingType} />
              <InfoRow label="Fast Charging" value={power.fastChargingEnabled ? 'Enabled' : 'Disabled'} />
              <InfoRow label="Wireless Charging" value={power.wirelessChargingEnabled ? 'Enabled' : 'Disabled'} />
            </>
          )}
          <InfoRow label="Temperature" value={`${temperature}°C`} />
          <InfoRow label="RAM Used" value={formatBytes(data.ramUsed)} />
          <InfoRow label="Storage Used" value={formatBytes(data.storageUsed)} />
          <InfoRow label="CPU Load" value={`${(data.cpuLoad * 100).toFixed(0)}%`} />
          <InfoRow label="Device Health" value={`${data.deviceHealth}%`} />
          {data.emergencyMode && <p className="text-xs text-red-400 mt-2">Emergency mode active</p>}
          {data.criticalMode && <p className="text-xs text-amber-400 mt-1">Critical storage mode</p>}
        </section>
      </div>
    </div>
  );
}
