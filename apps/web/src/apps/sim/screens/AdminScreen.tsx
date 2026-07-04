'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { simService } from '../services/simService';
import { Button } from '@/components/shared/Button';
import { useHaptic } from '@/hooks/useSound';
import type { SIMProfile } from '../types';

export function AdminScreen() {
  const { tap, success } = useHaptic();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: stats } = useQuery({ queryKey: ['sim', 'admin', 'stats'], queryFn: () => simService.adminStats() });
  const { data: sims } = useQuery({ queryKey: ['sim', 'admin', 'sims', search], queryFn: () => simService.adminSearchSims(search) });
  const { data: audit } = useQuery({ queryKey: ['sim', 'admin', 'audit'], queryFn: () => simService.adminAuditLogs() });

  const suspend = useMutation({ mutationFn: ({ id, reason }: { id: string; reason?: string }) => simService.adminSuspend(id, reason), onSuccess: () => { success(); queryClient.invalidateQueries({ queryKey: ['sim', 'admin'] }); } });
  const activate = useMutation({ mutationFn: (id: string) => simService.adminActivate(id), onSuccess: () => { success(); queryClient.invalidateQueries({ queryKey: ['sim', 'admin'] }); } });

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <h1 className="text-white font-bold text-lg mb-4">SIM Admin</h1>

      {stats && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { l: 'Total SIMs', v: stats.totalSims },
            { l: 'Active', v: stats.activeSims },
            { l: 'Suspended', v: stats.suspendedSims },
            { l: 'Numbers', v: stats.totalNumbers },
            { l: 'Assigned', v: stats.assignedNumbers },
            { l: 'Available', v: stats.availableNumbers },
          ].map((s) => (
            <div key={s.l} className="bg-white/5 rounded-lg p-2 text-center border border-white/10">
              <p className="text-banana-gold font-bold text-sm">{s.v}</p>
              <p className="text-[8px] text-white/40">{s.l}</p>
            </div>
          ))}
        </div>
      )}

      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search SIMs or numbers..." className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white mb-4" />

      {sims?.map((sim: SIMProfile) => (
        <div key={sim.id} className="bg-white/5 rounded-xl p-3 border border-white/10 mb-2">
          <p className="text-sm text-white">{sim.phoneNumber}</p>
          <p className="text-[10px] text-white/40 capitalize">{sim.status} · {sim.simSerial.slice(0, 12)}...</p>
          <div className="flex gap-2 mt-2">
            {sim.status !== 'active' && <Button label="Activate" size="sm" onClick={() => { tap(); activate.mutate(sim.id); }} />}
            {sim.status === 'active' && <Button label="Suspend" size="sm" variant="destructive" onClick={() => { tap(); suspend.mutate({ id: sim.id }); }} />}
          </div>
        </div>
      ))}

      <p className="text-[10px] text-banana-gold uppercase mt-4 mb-2">Audit Logs</p>
      {(audit as { action: string; newValue?: string; ipAddress?: string; createdAt: string }[])?.slice(0, 10).map((log, i) => (
        <div key={i} className="py-2 border-b border-white/5 text-xs">
          <span className="text-white capitalize">{log.action.replace(/_/g, ' ')}</span>
          {log.newValue && <span className="text-banana-gold ml-1">{log.newValue}</span>}
          <p className="text-white/30">{log.ipAddress} · {new Date(log.createdAt).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
