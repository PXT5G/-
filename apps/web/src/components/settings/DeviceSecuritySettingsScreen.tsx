'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDeviceSecurity } from '@/hooks/useDeviceEcosystem';
import { deviceEcosystemService } from '@/services/deviceEcosystemService';
import { Toggle } from '@/components/ui/Toggle';
import { useHaptic } from '@/hooks/useSound';

export function DeviceSecuritySettingsScreen({ onBack }: { onBack: () => void }) {
  const { tap } = useHaptic();
  const queryClient = useQueryClient();
  const { data: security, isLoading } = useDeviceSecurity();

  const updateMutation = useMutation({
    mutationFn: (updates: Parameters<typeof deviceEcosystemService.updateSecurity>[0]) =>
      deviceEcosystemService.updateSecurity(updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['device-ecosystem', 'security'] }),
  });

  if (isLoading || !security) {
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
        <h1 className="text-2xl font-bold text-white mb-6">Device Security</h1>

        <section className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-xs font-semibold text-white/40 uppercase mb-3">Unlock Methods</h2>
          {([
            ['faceUnlockEnabled', 'Face Unlock'],
            ['fingerprintEnabled', 'Fingerprint'],
            ['pinEnabled', 'PIN'],
            ['passwordEnabled', 'Password'],
          ] as const).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between py-2">
              <span className="text-sm text-white">{label}</span>
              <Toggle
                enabled={security[key]}
                onChange={(v) => updateMutation.mutate({ [key]: v })}
                label={label}
              />
            </div>
          ))}
        </section>

        <section className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-xs font-semibold text-white/40 uppercase mb-3">Status</h2>
          <p className="text-sm text-white/70">Failed attempts: {security.failedAttempts}</p>
          {security.tempLocked && <p className="text-sm text-amber-400 mt-1">Temporarily locked</p>}
          {security.remoteLocked && <p className="text-sm text-red-400 mt-1">Remotely locked</p>}
          {security.remoteWipeRequested && <p className="text-sm text-red-400 mt-1">Remote wipe requested</p>}
        </section>

        {security.trustedDevices.length > 0 && (
          <section className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h2 className="text-xs font-semibold text-white/40 uppercase mb-3">Trusted Devices</h2>
            {security.trustedDevices.map((d) => (
              <div key={d.deviceId} className="py-2 border-b border-white/5 last:border-0">
                <p className="text-sm text-white">{d.deviceName}</p>
                <p className="text-xs text-white/40 font-mono">{d.deviceId.slice(0, 12)}…</p>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
