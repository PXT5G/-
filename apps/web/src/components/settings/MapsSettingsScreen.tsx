'use client';

import { useWorld } from '@/hooks/useWorldServices';
import { useHaptic } from '@/hooks/useSound';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-white/5 last:border-0">
      <span className="text-sm text-white/60">{label}</span>
      <span className="text-sm text-white text-right max-w-[60%]">{value}</span>
    </div>
  );
}

export function MapsSettingsScreen({ onBack }: { onBack: () => void }) {
  const { tap } = useHaptic();
  const { data, isLoading } = useWorld();

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
        <h1 className="text-2xl font-bold text-white mb-2">Maps</h1>
        <p className="text-xs text-white/40 mb-6">World engine location data (infrastructure layer)</p>

        <section className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-xs font-semibold text-white/40 uppercase mb-3">World State</h2>
          <InfoRow label="Coordinates" value={`${data.latitude.toFixed(5)}, ${data.longitude.toFixed(5)}`} />
          <InfoRow label="Street" value={data.street} />
          <InfoRow label="District" value={data.district} />
          <InfoRow label="Zone" value={data.zone} />
          <InfoRow label="Region" value={data.region} />
          <InfoRow label="Vehicle" value={data.vehicleState.replace(/_/g, ' ')} />
          <InfoRow label="Weather" value={data.weather} />
          <InfoRow label="Time" value={`${data.timeOfDay} (${data.gameHour}:00)`} />
          <InfoRow label="Interior" value={data.interior ? 'Yes' : 'No'} />
          <InfoRow label="Safe Zone" value={data.safeZone ? 'Yes' : 'No'} />
          <InfoRow label="Restricted" value={data.restrictedZone ? 'Yes' : 'No'} />
          {data.nearestLocationId && <InfoRow label="Nearest" value={data.nearestLocationId} />}
        </section>
      </div>
    </div>
  );
}
