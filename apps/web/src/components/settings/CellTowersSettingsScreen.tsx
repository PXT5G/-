'use client';

import { useTowers } from '@/hooks/useWorldServices';
import { useHaptic } from '@/hooks/useSound';

export function CellTowersSettingsScreen({ onBack }: { onBack: () => void }) {
  const { tap } = useHaptic();
  const { data, isLoading } = useTowers();

  if (isLoading) {
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
        <h1 className="text-2xl font-bold text-white mb-2">Cell Towers</h1>
        <p className="text-xs text-white/40 mb-6">GULF Mobile infrastructure near your position</p>

        <div className="space-y-3">
          {(data ?? []).length === 0 ? (
            <p className="text-sm text-white/40">No towers in range</p>
          ) : (
            (data ?? []).map((tower) => (
              <section key={tower.towerUuid} className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-semibold text-white">{tower.towerName}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    tower.status === 'online' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {tower.status}
                  </span>
                </div>
                <p className="text-xs text-white/50 mb-2">{tower.district} · {tower.frequencyBand}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-white/40">Coverage: <span className="text-white">{(tower.coverageRadiusM / 1000).toFixed(1)} km</span></span>
                  <span className="text-white/40">Health: <span className="text-white">{tower.towerHealth}%</span></span>
                  <span className="text-white/40">Users: <span className="text-white">{tower.currentUsers}/{tower.maxUsers}</span></span>
                  {tower.distanceM !== undefined && (
                    <span className="text-white/40">Distance: <span className="text-white">{(tower.distanceM / 1000).toFixed(2)} km</span></span>
                  )}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
