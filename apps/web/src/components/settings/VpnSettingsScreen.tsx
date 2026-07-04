'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useVpn } from '@/hooks/useWorldServices';
import { worldService } from '@/services/worldService';
import { useHaptic } from '@/hooks/useSound';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-white/5 last:border-0">
      <span className="text-sm text-white/60">{label}</span>
      <span className="text-sm text-white">{value}</span>
    </div>
  );
}

export function VpnSettingsScreen({ onBack }: { onBack: () => void }) {
  const { tap } = useHaptic();
  const queryClient = useQueryClient();
  const { data, isLoading } = useVpn();

  const { data: countries } = useQuery({
    queryKey: ['world', 'vpn-countries'],
    queryFn: () => worldService.getVpnCountries(),
  });

  const connectMutation = useMutation({
    mutationFn: (code: string) => worldService.connectVpn(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['world', 'vpn'] });
      queryClient.invalidateQueries({ queryKey: ['system', 'network'] });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => worldService.disconnectVpn(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['world', 'vpn'] });
      queryClient.invalidateQueries({ queryKey: ['system', 'network'] });
    },
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
        <h1 className="text-2xl font-bold text-white mb-6">VPN</h1>

        <section className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-xs font-semibold text-white/40 uppercase mb-3">Status</h2>
          <InfoRow label="Connected" value={data.active ? 'Yes' : 'No'} />
          {data.active && (
            <>
              <InfoRow label="Country" value={data.countryName ?? data.country ?? '—'} />
              <InfoRow label="Virtual IP" value={data.virtualIp ?? '—'} />
              <InfoRow label="Encryption" value={data.encryption ?? '—'} />
              <InfoRow label="Latency Penalty" value={`+${data.latencyPenaltyMs ?? 0} ms`} />
              <InfoRow label="Bandwidth Penalty" value={`-${data.bandwidthPenaltyMbps ?? 0} Mbps`} />
            </>
          )}
          <div className="mt-4">
            {data.active ? (
              <button
                type="button"
                onClick={() => { tap(); disconnectMutation.mutate(); }}
                className="w-full py-2 rounded-lg bg-red-500/20 text-red-400 text-sm"
              >
                Disconnect VPN
              </button>
            ) : (
              <div className="space-y-2">
                {(countries ?? []).map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => { tap(); connectMutation.mutate(c.code); }}
                    className="w-full py-2 px-3 rounded-lg bg-white/5 text-white text-sm text-left hover:bg-white/10"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
