'use client';

import { useRunMaintenance, useDeviceMaintenance } from '@/hooks/useDeviceEcosystem';
import { useHaptic } from '@/hooks/useSound';

const ACTIONS = [
  { id: 'optimize_storage', label: 'Optimize Storage' },
  { id: 'clear_cache', label: 'Clear Cache' },
  { id: 'repair_database', label: 'Repair Database' },
  { id: 'rebuild_search_index', label: 'Rebuild Search Index' },
  { id: 'reset_network', label: 'Reset Network' },
  { id: 'reset_settings', label: 'Reset Settings' },
  { id: 'duplicate_detection', label: 'Detect Duplicates' },
] as const;

export function DeviceMaintenanceSettingsScreen({ onBack }: { onBack: () => void }) {
  const { tap } = useHaptic();
  const { data: history, isLoading } = useDeviceMaintenance();
  const runMaintenance = useRunMaintenance();

  if (isLoading) {
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
        <h1 className="text-2xl font-bold text-white mb-6">Device Maintenance</h1>

        <section className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-xs font-semibold text-white/40 uppercase mb-3">Actions</h2>
          {ACTIONS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => { tap(); runMaintenance.mutate(a.id); }}
              disabled={runMaintenance.isPending}
              className="w-full text-left py-2.5 border-b border-white/5 last:border-0 text-sm text-white hover:text-banana-gold disabled:opacity-50"
            >
              {a.label}
            </button>
          ))}
        </section>

        <section className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-xs font-semibold text-white/40 uppercase mb-3">History</h2>
          {(history ?? []).length === 0 ? (
            <p className="text-sm text-white/40">No maintenance runs yet</p>
          ) : (
            (history ?? []).slice(0, 10).map((r, i) => (
              <div key={`${r.action}-${i}`} className="py-2 border-b border-white/5 last:border-0">
                <p className="text-sm text-white capitalize">{r.action.replace(/_/g, ' ')}</p>
                <p className="text-xs text-white/40">{r.status} · {r.durationMs ?? 0}ms · {new Date(r.createdAt).toLocaleString()}</p>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
