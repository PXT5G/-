'use client';

import { useQuery } from '@tanstack/react-query';
import { systemService } from '@/services/systemService';
import { useHaptic } from '@/hooks/useSound';

export function DeveloperSettingsScreen({ onBack }: { onBack: () => void }) {
  const { tap } = useHaptic();

  const { data: tasks } = useQuery({
    queryKey: ['system', 'background-tasks'],
    queryFn: () => systemService.getBackgroundTasks(),
  });

  const { data: events } = useQuery({
    queryKey: ['system', 'events'],
    queryFn: () => systemService.replayEvents({ limit: 10 }),
  });

  return (
    <div className="h-full overflow-y-auto bg-black">
      <div className="p-4 pb-8">
        <button type="button" onClick={() => { tap(); onBack(); }} className="text-banana-gold text-sm mb-4">‹ Settings</button>
        <h1 className="text-2xl font-bold text-white mb-6">Developer</h1>

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
