'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { deviceStorageService, formatBytes, type DeviceStorageBreakdown } from '@/services/deviceStorageService';
import { Button } from '@/components/shared';
import { useHaptic } from '@/hooks/useSound';
import { useDeviceHardware } from '@/hooks/useDeviceHardware';

const CATEGORY_COLORS: Record<string, string> = {
  apps: '#D4AF37',
  photosVideos: '#FF6B6B',
  system: '#6C63FF',
  cache: '#FFB347',
  documents: '#4ECDC4',
  downloads: '#95E1D3',
  messages: '#A8E6CF',
  audio: '#DDA0DD',
  other: '#888888',
  trash: '#FF8C69',
};

const CATEGORY_LABELS: Record<string, string> = {
  apps: 'Apps',
  photosVideos: 'Photos & Videos',
  system: 'System',
  cache: 'Cache',
  documents: 'Documents',
  downloads: 'Downloads',
  messages: 'Messages',
  audio: 'Audio',
  other: 'Other',
  trash: 'Trash',
};

function StorageRing({ used, total }: { used: number; total: number }) {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative w-36 h-36 mx-auto mb-6">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
        <motion.circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="#D4AF37"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{pct.toFixed(0)}%</span>
        <span className="text-[10px] text-white/50">used</span>
      </div>
    </div>
  );
}

function CategoryBar({
  label,
  bytes,
  total,
  color,
  delay,
}: {
  label: string;
  bytes: number;
  total: number;
  color: string;
  delay: number;
}) {
  const pct = total > 0 ? (bytes / total) * 100 : 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-white/70">{label}</span>
        <span className="text-white/50">{formatBytes(bytes)}</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(pct, bytes > 0 ? 1 : 0)}%` }}
          transition={{ duration: 0.8, delay, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function buildCategories(data: DeviceStorageBreakdown) {
  return [
    { key: 'apps', bytes: data.apps },
    { key: 'photosVideos', bytes: data.photosVideos },
    { key: 'system', bytes: data.system },
    { key: 'cache', bytes: data.cache },
    { key: 'trash', bytes: data.trash ?? 0 },
    { key: 'documents', bytes: data.documents },
    { key: 'downloads', bytes: data.downloads },
    { key: 'messages', bytes: data.messages },
    { key: 'audio', bytes: data.audio },
    { key: 'other', bytes: data.other },
  ]
    .filter((c) => c.bytes > 0)
    .sort((a, b) => b.bytes - a.bytes);
}

export function StorageManagerScreen({ onBack }: { onBack: () => void }) {
  const { tap } = useHaptic();
  const queryClient = useQueryClient();
  const [sortBySize, setSortBySize] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ['device', 'storage'],
    queryFn: () => deviceStorageService.getStorage(),
  });

  const { data: largestApps } = useQuery({
    queryKey: ['device', 'largest-apps'],
    queryFn: () => deviceStorageService.getLargestApps(),
  });

  const { data: hardware } = useDeviceHardware();

  const { data: trash } = useQuery({
    queryKey: ['device', 'trash'],
    queryFn: () => deviceStorageService.getTrash(),
  });

  const clearCacheMutation = useMutation({
    mutationFn: () => deviceStorageService.clearAllCache(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device'] });
      queryClient.invalidateQueries({ queryKey: ['store'] });
    },
  });

  const emptyTrashMutation = useMutation({
    mutationFn: () => deviceStorageService.emptyTrash(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device'] });
    },
  });

  if (isLoading || !data) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const categories = buildCategories(data);
  const sortedApps = [...(largestApps ?? [])].sort((a, b) =>
    sortBySize ? b.storageBytes - a.storageBytes : a.name.localeCompare(b.name)
  );

  return (
    <div className="h-full overflow-y-auto bg-black">
      <div className="p-4 pb-8">
        <button type="button" onClick={() => { tap(); onBack(); }} className="text-banana-gold text-sm mb-4">
          ‹ Settings
        </button>
        <h1 className="text-2xl font-bold text-white mb-1">Storage</h1>
        <p className="text-xs text-white/50 mb-2">
          {data.deviceName ?? 'Banana Phone'} · {data.capacityTier ?? formatBytes(data.total)}
        </p>

        {(data.lowStorageLevel === 'warning' || data.lowStorageLevel === 'low' || data.lowStorageLevel === 'critical' || data.lowStorageLevel === 'emergency') && (
          <div className={`mb-4 p-3 rounded-xl border text-xs ${
            data.lowStorageLevel === 'emergency' || data.lowStorageLevel === 'critical'
              ? 'bg-red-500/10 border-red-500/30 text-red-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
          }`}>
            {data.lowStorageLevel === 'emergency' && 'Emergency Mode — only critical system writes allowed.'}
            {data.lowStorageLevel === 'critical' && 'Storage critically low. Installs and video recording disabled.'}
            {data.lowStorageLevel === 'low' && 'Low Storage Mode enabled. Cache cleanup suggested.'}
            {data.lowStorageLevel === 'warning' && 'Storage is getting low. Consider freeing space.'}
          </div>
        )}

        <StorageRing used={data.used} total={data.total} />

        <div className="text-center mb-6">
          <p className="text-sm text-white">
            <span className="text-banana-gold font-semibold">{formatBytes(data.used)}</span>
            <span className="text-white/50"> of {formatBytes(data.total)} used</span>
          </p>
          <p className="text-xs text-white/40 mt-1">{formatBytes(data.free)} available</p>
        </div>

        <section className="mb-6">
          <h2 className="text-xs font-semibold text-white/40 uppercase mb-3">Categories</h2>
          {categories.map((cat, i) => (
            <CategoryBar
              key={cat.key}
              label={CATEGORY_LABELS[cat.key] ?? cat.key}
              bytes={cat.bytes}
              total={data.used}
              color={CATEGORY_COLORS[cat.key] ?? '#888'}
              delay={i * 0.05}
            />
          ))}
        </section>

        {data.systemBreakdown && (
          <section className="mb-6 p-3 rounded-xl bg-white/5 border border-white/10">
            <h2 className="text-xs font-semibold text-white/40 uppercase mb-3">System Storage</h2>
            {[
              { label: 'Operating System', value: data.systemBreakdown.operatingSystem },
              { label: 'System Files', value: data.systemBreakdown.systemFiles },
              { label: 'Logs', value: data.systemBreakdown.logs },
              { label: 'Updates', value: data.systemBreakdown.updates },
              { label: 'Recovery', value: data.systemBreakdown.recovery },
              { label: 'Reserved', value: data.systemBreakdown.reservedSpace },
            ].map((row) => (
              <div key={row.label} className="flex justify-between text-xs py-1">
                <span className="text-white/60">{row.label}</span>
                <span className="text-white">{formatBytes(row.value)}</span>
              </div>
            ))}
          </section>
        )}

        {hardware?.storageWear && (
          <section className="mb-6 p-3 rounded-xl bg-white/5 border border-white/10">
            <h2 className="text-xs font-semibold text-white/40 uppercase mb-3">Storage Health</h2>
            <div className="flex justify-between text-xs py-1">
              <span className="text-white/60">Health</span>
              <span className="text-white">{hardware.storageWear.healthPercent}%</span>
            </div>
            <div className="flex justify-between text-xs py-1">
              <span className="text-white/60">Est. Remaining Life</span>
              <span className="text-white">{hardware.storageWear.estimatedRemainingLifeYears} years</span>
            </div>
            <div className="flex justify-between text-xs py-1">
              <span className="text-white/60">Lifetime Writes</span>
              <span className="text-white">{formatBytes(hardware.storageWear.lifetimeWrites)}</span>
            </div>
          </section>
        )}

        {(trash?.count ?? 0) > 0 && (
          <section className="mb-6 p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-semibold text-white/40 uppercase">Trash</h2>
              <span className="text-xs text-white/50">{trash!.count} items · {formatBytes(trash!.totalSize)}</span>
            </div>
            <p className="text-xs text-white/40 mb-3">Items auto-delete after 30 days</p>
            <Button
              label="Empty Trash"
              variant="ghost"
              onClick={() => emptyTrashMutation.mutate()}
              loading={emptyTrashMutation.isPending}
              fullWidth
            />
          </section>
        )}

        <div className="flex gap-2 mb-6">
          <Button
            label="Clear Cache"
            variant="ghost"
            onClick={() => clearCacheMutation.mutate()}
            loading={clearCacheMutation.isPending}
            fullWidth
          />
        </div>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-white/40 uppercase">Apps</h2>
            <button
              type="button"
              onClick={() => setSortBySize(!sortBySize)}
              className="text-xs text-banana-gold"
            >
              {sortBySize ? 'Sort A–Z' : 'Sort by Size'}
            </button>
          </div>
          {sortedApps.length === 0 ? (
            <p className="text-sm text-white/40 text-center py-4">No apps installed</p>
          ) : (
            sortedApps.map((app, i) => (
              <motion.div
                key={app.bundleId}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 mb-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <span className="text-2xl">{app.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{app.name}</p>
                  <p className="text-xs text-white/50">v{app.installedVersion}</p>
                </div>
                <span className="text-sm text-banana-gold font-medium">{formatBytes(app.storageBytes)}</span>
              </motion.div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
