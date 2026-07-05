'use client';

import { useCarrier } from '@/hooks/useWorldServices';
import { useHaptic } from '@/hooks/useSound';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-white/5 last:border-0">
      <span className="text-sm text-white/60">{label}</span>
      <span className="text-sm text-white">{value}</span>
    </div>
  );
}

const GENERATION_LABELS: Record<string, string> = {
  none: 'No Service',
  emergency: 'Emergency Only',
  '2g': '2G',
  '3g': '3G',
  '4g': '4G LTE',
  '5g': '5G',
};

export function CarrierSettingsScreen({ onBack }: { onBack: () => void }) {
  const { tap } = useHaptic();
  const { data, isLoading } = useCarrier();

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
        <h1 className="text-2xl font-bold text-white mb-6">Carrier</h1>

        <section className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🏬</span>
            <div>
              <p className="text-lg font-semibold text-white">{data.name}</p>
              <p className="text-sm text-gulf-gold">{GENERATION_LABELS[data.generation] ?? data.generation}</p>
            </div>
          </div>
          <InfoRow label="Network" value={GENERATION_LABELS[data.generation] ?? data.generation} />
          {data.connectedTowerUuid && (
            <InfoRow label="Tower" value={data.connectedTowerUuid.slice(0, 8) + '…'} />
          )}
        </section>
      </div>
    </div>
  );
}
