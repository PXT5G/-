'use client';

import { useSimInit, useSimCards, useUpdateSim } from '@/hooks/useSim';
import { Toggle } from '@/components/ui/Toggle';
import { useHaptic } from '@/hooks/useSound';

export function SimApp() {
  const { tap } = useHaptic();
  useSimInit();
  const { data: sims } = useSimCards();
  const updateSim = useUpdateSim();

  return (
    <div className="h-full flex flex-col bg-black text-white p-4 overflow-y-auto">
      <h1 className="text-xl font-bold mb-6">SIM Manager</h1>

      {(sims ?? []).map((sim) => (
        <div key={sim.simId} className="mb-4 p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold uppercase">{sim.slot}</p>
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">{sim.networkGeneration.toUpperCase()}</span>
          </div>
          <p className="text-sm text-white/70">{sim.carrier}</p>
          <p className="text-lg font-light mb-3">{sim.phoneNumber}</p>

          <div className="flex gap-1 mb-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`h-3 w-2 rounded-sm ${i < sim.signalStrength ? 'bg-green-400' : 'bg-white/10'}`} />
            ))}
            <span className="text-xs text-white/40 ml-2">{sim.signalStrength}/5</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Voice SIM</span>
              <Toggle enabled={sim.isPreferredVoice} onChange={(v) => { tap(); void updateSim.mutateAsync({ simId: sim.simId, body: { isPreferredVoice: v } }); }} label="Voice" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Data SIM</span>
              <Toggle enabled={sim.isPreferredData} onChange={(v) => { tap(); void updateSim.mutateAsync({ simId: sim.simId, body: { isPreferredData: v } }); }} label="Data" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Roaming</span>
              <Toggle enabled={sim.roaming} onChange={(v) => { tap(); void updateSim.mutateAsync({ simId: sim.simId, body: { roaming: v } }); }} label="Roaming" />
            </div>
          </div>

          <p className="text-[10px] text-white/30 mt-3">APN: {sim.apn}</p>
        </div>
      ))}
    </div>
  );
}

export default SimApp;
