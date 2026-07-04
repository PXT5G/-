'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNetwork } from '@/hooks/useSystemServices';
import { systemService } from '@/services/systemService';
import { Toggle } from '@/components/ui/Toggle';
import { useHaptic } from '@/hooks/useSound';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-white/5 last:border-0">
      <span className="text-sm text-white/60">{label}</span>
      <span className="text-sm text-white">{value}</span>
    </div>
  );
}

export function NetworkSettingsScreen({ onBack }: { onBack: () => void }) {
  const { tap } = useHaptic();
  const queryClient = useQueryClient();
  const { data, isLoading } = useNetwork();

  const updateMutation = useMutation({
    mutationFn: (updates: Parameters<typeof systemService.updateNetwork>[0]) =>
      systemService.updateNetwork(updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['system', 'network'] }),
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
        <h1 className="text-2xl font-bold text-white mb-6">Network</h1>

        <section className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-white">Wi-Fi</span>
            <Toggle
              enabled={data.wifiEnabled}
              onChange={(v) => updateMutation.mutate({ wifiEnabled: v })}
              label="Wi-Fi"
            />
          </div>
          {data.wifiEnabled && data.wifiSsid && (
            <InfoRow label="Network" value={data.wifiSsid} />
          )}
          <div className="flex items-center justify-between mt-4 mb-2">
            <span className="text-sm text-white">Bluetooth</span>
            <Toggle
              enabled={data.bluetoothEnabled}
              onChange={(v) => updateMutation.mutate({ bluetoothEnabled: v })}
              label="Bluetooth"
            />
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-white">VPN</span>
            <Toggle
              enabled={data.vpnEnabled}
              onChange={(v) => updateMutation.mutate({ vpnEnabled: v })}
              label="VPN"
            />
          </div>
        </section>

        <section className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-xs font-semibold text-white/40 uppercase mb-3">Cellular</h2>
          <InfoRow label="Carrier" value={data.carrier} />
          <InfoRow label="Coverage" value={data.coverage} />
          <InfoRow label="Signal" value={`${data.signalStrength}/5`} />
          <InfoRow label="Connection" value={data.connectionState} />
          <InfoRow label="Latency" value={`${data.latencyMs} ms`} />
          <InfoRow label="Bandwidth" value={`${data.bandwidthMbps.toFixed(0)} Mbps`} />
          <InfoRow label="Packet Loss" value={`${data.packetLoss.toFixed(1)}%`} />
          <InfoRow label="Jitter" value={`${data.jitterMs.toFixed(1)} ms`} />
        </section>
      </div>
    </div>
  );
}
