'use client';

import { useQuery } from '@tanstack/react-query';
import { systemService } from '@/services/systemService';
import { worldService } from '@/services/worldService';
import { deviceEcosystemService } from '@/services/deviceEcosystemService';
import { useHaptic } from '@/hooks/useSound';

export function DeveloperSettingsScreen({ onBack }: { onBack: () => void }) {
  const { tap } = useHaptic();

  const { data: tasks } = useQuery({
    queryKey: ['system', 'background-tasks'],
    queryFn: () => systemService.getBackgroundTasks(),
  });

  const { data: events } = useQuery({
    queryKey: ['system', 'events'],
    queryFn: () => systemService.replayEvents({ namespace: 'world', limit: 10 }),
  });

  const { data: world } = useQuery({
    queryKey: ['world', 'state'],
    queryFn: () => worldService.getWorldState(),
  });

  const { data: devDashboard } = useQuery({
    queryKey: ['device-ecosystem', 'developer'],
    queryFn: () => deviceEcosystemService.getDeveloperDashboard(),
  });

  const logs = (devDashboard?.logs as Array<{ level: string; message: string; at: string }>) ?? [];
  const permissions = devDashboard?.permissions as { total?: number; granted?: number } | undefined;
  const apiEvents = (devDashboard?.api as { recentApiEvents?: Array<{ namespace: string; event: string; at: string }> })?.recentApiEvents ?? [];

  return (
    <div className="h-full overflow-y-auto bg-black">
      <div className="p-4 pb-8">
        <button type="button" onClick={() => { tap(); onBack(); }} className="text-banana-gold text-sm mb-4">‹ Settings</button>
        <h1 className="text-2xl font-bold text-white mb-6">Developer Mode</h1>

        <section className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-xs font-semibold text-white/40 uppercase mb-3">Device Ecosystem</h2>
          <p className="text-xs text-white/60">Permissions: {permissions?.granted ?? 0}/{permissions?.total ?? 0} granted</p>
          {logs.slice(0, 5).map((l, i) => (
            <p key={i} className="text-[10px] text-white/50 font-mono py-0.5">[{l.level}] {l.message}</p>
          ))}
        </section>

        <section className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-xs font-semibold text-white/40 uppercase mb-3">API Inspector</h2>
          {apiEvents.length === 0 ? (
            <p className="text-xs text-white/40">No API events</p>
          ) : (
            apiEvents.slice(0, 5).map((e, i) => (
              <p key={i} className="text-[10px] text-banana-gold font-mono py-0.5">{e.namespace}:{e.event}</p>
            ))
          )}
        </section>

        <section className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-xs font-semibold text-white/40 uppercase mb-3">World Engine</h2>
          {world ? (
            <>
              <p className="text-xs text-white/70 font-mono">{world.district} · {world.street}</p>
              <p className="text-xs text-white/50 font-mono">{world.latitude.toFixed(5)}, {world.longitude.toFixed(5)}</p>
              <p className="text-xs text-white/50">Tower: {world.connectedTowerUuid?.slice(0, 8) ?? '—'}…</p>
            </>
          ) : (
            <p className="text-xs text-white/40">Loading world state…</p>
          )}
        </section>

        <section className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-xs font-semibold text-white/40 uppercase mb-3">Background Scheduler</h2>
          {(tasks ?? []).map((t) => (
            <p key={t} className="text-xs text-white/70 py-1 font-mono">{t}</p>
          ))}
        </section>

        <section className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-xs font-semibold text-white/40 uppercase mb-3">Recent Events</h2>
          {(events ?? []).length === 0 ? (
            <p className="text-xs text-white/40">No events</p>
          ) : (
            (events ?? []).map((e) => (
              <div key={e.id} className="py-2 border-b border-white/5 last:border-0">
                <p className="text-xs text-banana-gold font-mono">{e.namespace}:{e.event}</p>
                <p className="text-[10px] text-white/40">{new Date(e.createdAt).toLocaleString()} · {e.source}</p>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
