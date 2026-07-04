'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from '@/hooks/useSystemServices';
import { systemService } from '@/services/systemService';
import { Toggle } from '@/components/ui/Toggle';
import { useHaptic } from '@/hooks/useSound';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-white/5 last:border-0">
      <span className="text-sm text-white/60">{label}</span>
      <span className="text-sm text-white text-right max-w-[60%]">{value}</span>
    </div>
  );
}

export function LocationSettingsScreen({ onBack }: { onBack: () => void }) {
  const { tap } = useHaptic();
  const queryClient = useQueryClient();
  const { data, isLoading } = useLocation();

  const toggleMutation = useMutation({
    mutationFn: (enabled: boolean) => systemService.setLocationEnabled(enabled),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['system', 'location'] }),
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
        <h1 className="text-2xl font-bold text-white mb-6">Location</h1>

        <section className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Location Services</p>
              <p className="text-xs text-white/40">Allow apps to access your location</p>
            </div>
            <Toggle
              enabled={data.enabled}
              onChange={(v) => toggleMutation.mutate(v)}
              label="Location Services"
            />
          </div>
        </section>

        {data.enabled && (
          <section className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h2 className="text-xs font-semibold text-white/40 uppercase mb-3">Current Position</h2>
            <InfoRow label="Coordinates" value={`${data.latitude.toFixed(5)}, ${data.longitude.toFixed(5)}`} />
            <InfoRow label="Street" value={data.street} />
            <InfoRow label="District" value={data.district} />
            <InfoRow label="Zone" value={data.zone} />
            <InfoRow label="Region" value={data.region} />
            <InfoRow label="Movement" value={data.movementState} />
            <InfoRow label="Speed" value={`${data.speed.toFixed(1)} m/s`} />
            <InfoRow label="Heading" value={`${data.heading.toFixed(0)}°`} />
            <InfoRow label="Accuracy" value={`±${data.accuracy.toFixed(0)} m`} />
            <InfoRow label="Altitude" value={`${data.altitude.toFixed(0)} m`} />
          </section>
        )}
      </div>
    </div>
  );
}
