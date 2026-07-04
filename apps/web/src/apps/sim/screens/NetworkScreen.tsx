'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { simService } from '../services/simService';
import { SignalAnimation } from '../components/SignalAnimation';
import { Button } from '@/components/shared/Button';
import { useHaptic } from '@/hooks/useSound';

export function NetworkScreen() {
  const { tap, success } = useHaptic();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState('5G');

  const { data: network, isLoading } = useQuery({
    queryKey: ['sim', 'network'],
    queryFn: () => simService.getNetwork(),
  });

  const update = useMutation({
    mutationFn: (data: Parameters<typeof simService.updateNetwork>[0]) => simService.updateNetwork(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sim'] }),
  });

  const diagnostic = useMutation({
    mutationFn: () => simService.runDiagnostic(),
    onSuccess: () => { success(); queryClient.invalidateQueries({ queryKey: ['sim'] }); },
  });

  if (isLoading || !network) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" /></div>;

  const modes = ['auto', '5G', '4G', 'LTE'];

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <h1 className="text-white font-bold text-lg mb-4">Network</h1>

      <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-4 flex items-center justify-between">
        <div>
          <p className="text-white font-medium">{network.carrier?.name ?? 'Banana Mobile'}</p>
          <p className="text-sm text-banana-gold">{network.networkMode}</p>
          <p className="text-[10px] text-white/40 capitalize mt-1">{network.signalStrength} signal · {network.coverage}</p>
        </div>
        <SignalAnimation bars={network.signalBars} strength={network.signalStrength} />
      </div>

      <p className="text-sm text-white font-medium mb-2">Network Mode</p>
      <div className="flex gap-1 mb-4">
        {modes.map((m) => (
          <button key={m} type="button" onClick={() => { tap(); setMode(m); update.mutate({ networkMode: m as '4G' | '5G' | 'LTE' | 'auto' }); }} className={`flex-1 py-2 rounded-lg text-xs uppercase ${mode === m || network.networkMode === m ? 'bg-banana-gold text-black' : 'bg-white/10 text-white/50'}`}>{m}</button>
        ))}
      </div>

      <div className="space-y-2 mb-4">
        <div className="bg-white/5 rounded-xl p-3 flex justify-between"><span className="text-white/60 text-sm">WiFi Calling</span><button type="button" onClick={() => update.mutate({ wifiCalling: !network.wifiCalling })} className={`text-sm ${network.wifiCalling ? 'text-green-400' : 'text-white/40'}`}>{network.wifiCalling ? 'On' : 'Off'}</button></div>
        <div className="bg-white/5 rounded-xl p-3 flex justify-between"><span className="text-white/60 text-sm">Roaming</span><button type="button" onClick={() => update.mutate({ roaming: !network.roaming })} className={`text-sm ${network.roaming ? 'text-yellow-400' : 'text-white/40'}`}>{network.roaming ? 'On' : 'Off'}</button></div>
        <div className="bg-white/5 rounded-xl p-3 flex justify-between"><span className="text-white/60 text-sm">Internet</span><span className={`text-sm ${network.internetStatus ? 'text-green-400' : 'text-red-400'}`}>{network.internetStatus ? 'Connected' : 'Offline'}</span></div>
      </div>

      <Button label="Run Diagnostics" onClick={() => { tap(); diagnostic.mutate(); }} loading={diagnostic.isPending} fullWidth />
      {network.lastDiagnosticAt && <p className="text-[10px] text-white/30 text-center mt-2">Last diagnostic: {new Date(network.lastDiagnosticAt).toLocaleString()}</p>}
    </div>
  );
}
