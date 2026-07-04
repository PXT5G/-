'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDiagnostics } from '@/hooks/useSystemServices';
import { systemService } from '@/services/systemService';
import { formatBytes } from '@/services/deviceStorageService';
import { Button } from '@/components/shared';
import { useHaptic } from '@/hooks/useSound';

function HealthBadge({ status }: { status: 'healthy' | 'degraded' | 'down' }) {
  const colors = { healthy: 'text-green-400', degraded: 'text-amber-400', down: 'text-red-400' };
  return <span className={`text-xs capitalize ${colors[status]}`}>{status}</span>;
}

export function DiagnosticsSettingsScreen({ onBack }: { onBack: () => void }) {
  const { tap } = useHaptic();
  const queryClient = useQueryClient();
  const { data, isLoading } = useDiagnostics();

  const collectMutation = useMutation({
    mutationFn: () => systemService.collectDiagnostics(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['system', 'diagnostics'] }),
  });

  if (isLoading || !data) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-2 border-gulf-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-black">
      <div className="p-4 pb-8">
        <button type="button" onClick={() => { tap(); onBack(); }} className="text-gulf-gold text-sm mb-4">‹ Settings</button>
        <h1 className="text-2xl font-bold text-white mb-2">Diagnostics</h1>
        <p className="text-xs text-white/40 mb-6">Collected {new Date(data.collectedAt).toLocaleString()}</p>

        <Button
          label="Collect Now"
          onClick={() => collectMutation.mutate()}
          loading={collectMutation.isPending}
          fullWidth
          className="mb-6"
        />

        {(data.errors.length > 0 || data.warnings.length > 0) && (
          <section className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            {data.errors.map((e) => <p key={e} className="text-xs text-red-300 mb-1">⚠ {e}</p>)}
            {data.warnings.map((w) => <p key={w} className="text-xs text-amber-200 mb-1">! {w}</p>)}
          </section>
        )}

        <section className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-xs font-semibold text-white/40 uppercase mb-3">System</h2>
          <div className="flex justify-between text-sm py-1"><span className="text-white/60">Memory</span><span className="text-white">{formatBytes(data.memory.used)} / {formatBytes(data.memory.total)}</span></div>
          <div className="flex justify-between text-sm py-1"><span className="text-white/60">CPU</span><span className="text-white">{(data.cpu.load * 100).toFixed(0)}%</span></div>
          <div className="flex justify-between text-sm py-1"><span className="text-white/60">GPU</span><span className="text-white">{(data.gpu.load * 100).toFixed(0)}%</span></div>
          <div className="flex justify-between text-sm py-1"><span className="text-white/60">FPS</span><span className="text-white">{data.fps}</span></div>
          <div className="flex justify-between text-sm py-1"><span className="text-white/60">Temperature</span><span className="text-white">{data.temperature}°C</span></div>
        </section>

        <section className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-xs font-semibold text-white/40 uppercase mb-3">Service Health</h2>
          {Object.entries(data.serviceHealth).map(([name, status]) => (
            <div key={name} className="flex justify-between text-sm py-1">
              <span className="text-white/60 capitalize">{name}</span>
              <HealthBadge status={status} />
            </div>
          ))}
        </section>

        <section className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-xs font-semibold text-white/40 uppercase mb-3">Background Jobs</h2>
          <div className="flex justify-between text-sm py-1"><span className="text-white/60">Running</span><span className="text-white">{data.backgroundJobs.running}</span></div>
          <div className="flex justify-between text-sm py-1"><span className="text-white/60">Queued</span><span className="text-white">{data.backgroundJobs.queued}</span></div>
          <div className="flex justify-between text-sm py-1"><span className="text-white/60">Failed</span><span className="text-white">{data.backgroundJobs.failed}</span></div>
        </section>
      </div>
    </div>
  );
}
