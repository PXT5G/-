'use client';

import { useWorldNetwork, useSignal } from '@/hooks/useWorldServices';
import { useHaptic } from '@/hooks/useSound';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-white/5 last:border-0">
      <span className="text-sm text-white/60">{label}</span>
      <span className="text-sm text-white">{value}</span>
    </div>
  );
}

export function SignalSettingsScreen({ onBack }: { onBack: () => void }) {
  const { tap } = useHaptic();
  const { data, isLoading } = useWorldNetwork();
  const signal = useSignal();

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
        <h1 className="text-2xl font-bold text-white mb-6">Signal</h1>

        <section className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`w-2 rounded-sm ${i < signal.signalBars ? 'bg-banana-gold' : 'bg-white/20'}`}
                style={{ height: `${8 + i * 4}px` }}
              />
            ))}
            <span className="text-sm text-white ml-2">{signal.signalBars}/5 · {signal.generation.toUpperCase()}</span>
          </div>
          <InfoRow label="Carrier" value={signal.carrier} />
          <InfoRow label="Signal (dBm)" value={signal.signalDbm !== undefined ? `${signal.signalDbm} dBm` : '—'} />
          <InfoRow label="Connection" value={data.connectionState} />
          <InfoRow label="Type" value={data.connectionType ?? 'cellular'} />
          <InfoRow label="Latency" value={`${data.latencyMs} ms`} />
          <InfoRow label="Ping" value={`${data.pingMs ?? data.latencyMs} ms`} />
          <InfoRow label="Bandwidth" value={`${data.bandwidthMbps.toFixed(1)} Mbps`} />
          <InfoRow label="Packet Loss" value={`${data.packetLoss.toFixed(2)}%`} />
          <InfoRow label="Jitter" value={`${data.jitterMs.toFixed(1)} ms`} />
          {data.congestion !== undefined && <InfoRow label="Congestion" value={`${(data.congestion * 100).toFixed(0)}%`} />}
        </section>
      </div>
    </div>
  );
}
