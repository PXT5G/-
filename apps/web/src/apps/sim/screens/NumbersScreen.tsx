'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { simService } from '../services/simService';
import { Button } from '@/components/shared/Button';
import { useHaptic } from '@/hooks/useSound';

export function NumbersScreen() {
  const { tap, success } = useHaptic();
  const queryClient = useQueryClient();
  const [premium, setPremium] = useState(false);

  const { data: numbers, isLoading } = useQuery({
    queryKey: ['sim', 'numbers'],
    queryFn: () => simService.getNumbers(),
  });

  const { data: history } = useQuery({
    queryKey: ['sim', 'number-history'],
    queryFn: () => simService.getNumberHistory(),
  });

  const reserve = useMutation({
    mutationFn: () => simService.reserveNumber(premium),
    onSuccess: () => { success(); queryClient.invalidateQueries({ queryKey: ['sim'] }); },
  });

  if (isLoading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <h1 className="text-white font-bold text-lg mb-4">Phone Numbers</h1>

      <div className="flex gap-2 mb-4">
        <button type="button" onClick={() => setPremium(false)} className={`flex-1 py-2 rounded-xl text-xs ${!premium ? 'bg-banana-gold text-black' : 'bg-white/10 text-white/60'}`}>Standard</button>
        <button type="button" onClick={() => setPremium(true)} className={`flex-1 py-2 rounded-xl text-xs ${premium ? 'bg-banana-gold text-black' : 'bg-white/10 text-white/60'}`}>Premium ✦</button>
      </div>
      <Button label="Reserve Number" onClick={() => { tap(); reserve.mutate(); }} loading={reserve.isPending} fullWidth />

      <p className="text-sm text-white font-medium mt-5 mb-2">Your Numbers</p>
      <div className="space-y-2">
        {numbers?.filter((n) => n.status !== 'available').map((n) => (
          <div key={n.id} className="bg-white/5 rounded-xl p-3 border border-white/10 flex justify-between items-center">
            <div>
              <p className="text-white font-medium">{n.number}</p>
              <p className="text-[10px] text-white/40 capitalize">{n.type} · {n.status} {n.isFavorite && '⭐'}</p>
            </div>
            {n.status === 'reserved' && (
              <button type="button" onClick={() => { tap(); simService.releaseNumber(n.id).then(() => queryClient.invalidateQueries({ queryKey: ['sim'] })); }} className="text-red-400 text-xs">Release</button>
            )}
          </div>
        ))}
      </div>

      {history && (history as { action: string; oldValue?: string; newValue?: string; createdAt: string }[]).length > 0 && (
        <div className="mt-5">
          <p className="text-sm text-white font-medium mb-2">Number History</p>
          {(history as { action: string; oldValue?: string; newValue?: string; createdAt: string }[]).slice(0, 5).map((h, i) => (
            <div key={i} className="py-2 border-b border-white/5 text-xs">
              <span className="text-white capitalize">{h.action.replace(/_/g, ' ')}</span>
              {h.newValue && <span className="text-banana-gold ml-2">{h.newValue}</span>}
              <p className="text-white/30">{new Date(h.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
