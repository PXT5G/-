'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { deviceStorageService, formatBytes, formatUptime } from '@/services/deviceStorageService';
import { useHaptic } from '@/hooks/useSound';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-white/5 last:border-0">
      <span className="text-sm text-white/60">{label}</span>
      <span className="text-sm text-white text-right max-w-[55%] truncate">{value}</span>
    </div>
  );
}

function UsageBar({ used, total, color }: { used: number; total: number; color: string }) {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  return (
    <div className="h-2 rounded-full bg-white/5 overflow-hidden mb-1">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8 }}
      />
    </div>
  );
}

export function HardwareSettingsScreen({ onBack }: { onBack: () => void }) {
  const { tap } = useHaptic();

  const { data, isLoading } = useQuery({
    queryKey: ['device', 'hardware'],
    queryFn: () => deviceStorageService.getHardware(),
    refetchInterval: 20_000,
  });

  if (isLoading || !data) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const ramUsed = data.ram?.used ?? 0;
  const ramTotal = data.ramTotal;
  const storageUsed = data.storage?.used ?? 0;
  const storageTotal = data.internalStorage;

  return (
    <div className="h-full overflow-y-auto bg-black">
      <div className="p-4 pb-8">
        <button type="button" onClick={() => { tap(); onBack(); }} className="text-banana-gold text-sm mb-4">
          ‹ Settings
        </button>

        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-banana-gold/30 to-banana-gold/5 flex items-center justify-center text-4xl">
            📱
          </div>
          <h1 className="text-xl font-bold text-white">{data.deviceName}</h1>
          <p className="text-sm text-white/50">{data.deviceModel} · {data.deviceColor}</p>
        </div>

        <section className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-xs font-semibold text-white/40 uppercase mb-3">Memory (RAM)</h2>
          <UsageBar used={ramUsed} total={ramTotal} color="#6C63FF" />
          <p className="text-xs text-white/50 mb-3">
            {formatBytes(ramUsed)} of {formatBytes(ramTotal)} used
            {data.ram?.memoryPressure && (
              <span className="text-red-400 ml-2">· Memory pressure</span>
            )}
          </p>
          <InfoRow label="Active Apps" value={`${data.ram?.apps?.length ?? 0}`} />
        </section>

        <section className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-xs font-semibold text-white/40 uppercase mb-3">Processor</h2>
          <InfoRow label="CPU" value={data.cpu} />
          <InfoRow label="GPU" value={data.gpu} />
        </section>

        <section className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-xs font-semibold text-white/40 uppercase mb-3">Storage</h2>
          <UsageBar used={storageUsed} total={storageTotal} color="#D4AF37" />
          <p className="text-xs text-white/50 mb-3">
            {formatBytes(storageUsed)} of {formatBytes(storageTotal)} used
          </p>
          <InfoRow label="Health" value={`${data.storageWear.healthPercent}%`} />
          <InfoRow label="Est. Remaining Life" value={`${data.storageWear.estimatedRemainingLifeYears} years`} />
          <InfoRow label="Lifetime Writes" value={formatBytes(data.storageWear.lifetimeWrites)} />
          <InfoRow label="Lifetime Reads" value={formatBytes(data.storageWear.lifetimeReads)} />
          {data.lowStorageMode && (
            <p className="text-xs text-amber-400 mt-2">Low Storage Mode active</p>
          )}
          {data.emergencyMode && (
            <p className="text-xs text-red-400 mt-1">Emergency Mode — critical writes only</p>
          )}
        </section>

        <section className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-xs font-semibold text-white/40 uppercase mb-3">Battery</h2>
          <UsageBar used={data.batteryCapacity * (1 - data.batteryLevel / 100)} total={data.batteryCapacity} color="#4ECDC4" />
          <p className="text-xs text-white/50 mb-3">{data.batteryLevel}% · {data.batteryHealth}% health</p>
          <InfoRow label="Capacity" value={`${data.batteryCapacity} mAh`} />
        </section>

        <section className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-xs font-semibold text-white/40 uppercase mb-3">Device Info</h2>
          <InfoRow label="Display" value={data.displayResolution} />
          <InfoRow label="Temperature" value={`${data.temperature}°C`} />
          <InfoRow label="Uptime" value={formatUptime(data.uptimeMs)} />
          <InfoRow label="Serial" value={data.serialNumber} />
          <InfoRow label="OS Version" value={`${data.osVersion} (${data.buildNumber})`} />
        </section>
      </div>
    </div>
  );
}
