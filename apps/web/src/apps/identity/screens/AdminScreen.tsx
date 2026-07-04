'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { identityService } from '../services/identityService';
import { Button } from '@/components/shared/Button';
import { useHaptic } from '@/hooks/useSound';
import type { IdentityData } from '../types';

export function AdminScreen() {
  const { tap, success } = useHaptic();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const { data: stats } = useQuery({
    queryKey: ['identity', 'admin', 'stats'],
    queryFn: () => identityService.adminStats(),
  });

  const { data: queue, isLoading: queueLoading } = useQuery({
    queryKey: ['identity', 'admin', 'queue'],
    queryFn: () => identityService.adminQueue(),
  });

  const { data: searchResults } = useQuery({
    queryKey: ['identity', 'admin', 'search', search],
    queryFn: () => identityService.adminSearch(search),
    enabled: search.length >= 2,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['identity', 'admin'] });
    queryClient.invalidateQueries({ queryKey: ['identity'] });
  };

  const approve = useMutation({
    mutationFn: (id: string) => identityService.adminApprove(id),
    onSuccess: () => { success(); invalidate(); },
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      identityService.adminReject(id, reason),
    onSuccess: () => { success(); setRejectingId(null); invalidate(); },
  });

  const suspend = useMutation({
    mutationFn: (id: string) => identityService.adminSuspend(id),
    onSuccess: () => { success(); invalidate(); },
  });

  const reactivate = useMutation({
    mutationFn: (id: string) => identityService.adminReactivate(id),
    onSuccess: () => { success(); invalidate(); },
  });

  const renderIdentityActions = (item: IdentityData) => (
    <div key={item.id} className="bg-white/5 rounded-xl p-3 border border-white/10 mb-2">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-white font-medium">{item.fullName}</p>
          <p className="text-xs text-banana-gold">{item.nationalId}</p>
          <p className="text-[10px] text-white/40">@{item.username} · {item.status}</p>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
          item.status === 'verified' ? 'bg-green-500/20 text-green-400' :
          item.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-red-500/20 text-red-400'
        }`}>
          {item.status}
        </span>
      </div>

      <div className="flex flex-wrap gap-1 mt-2">
        {item.status === 'pending' && (
          <>
            <Button label="Approve" size="sm" onClick={() => { tap(); approve.mutate(item.id); }} />
            <Button
              label="Reject"
              size="sm"
              variant="destructive"
              onClick={() => { tap(); setRejectingId(item.id); }}
            />
          </>
        )}
        {item.status === 'verified' && (
          <Button label="Suspend" size="sm" variant="destructive" onClick={() => { tap(); suspend.mutate(item.id); }} />
        )}
        {item.status === 'suspended' && (
          <Button label="Reactivate" size="sm" onClick={() => { tap(); reactivate.mutate(item.id); }} />
        )}
      </div>

      {rejectingId === item.id && (
        <div className="mt-2 flex gap-2">
          <input
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Rejection reason..."
            className="flex-1 bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
          />
          <Button
            label="Confirm"
            size="sm"
            variant="destructive"
            onClick={() => reject.mutate({ id: item.id, reason: rejectReason })}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <h1 className="text-white font-bold text-lg mb-4">Admin Panel</h1>

      {stats && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Total', value: stats.total },
            { label: 'Verified', value: stats.verified },
            { label: 'Pending', value: stats.pending },
            { label: 'Suspended', value: stats.suspended },
            { label: 'Rejected', value: stats.rejected },
            { label: 'Today', value: stats.verificationsToday },
          ].map((s) => (
            <div key={s.label} className="bg-white/5 rounded-lg p-2 text-center border border-white/10">
              <p className="text-banana-gold font-bold">{s.value}</p>
              <p className="text-[9px] text-white/40">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search identities..."
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/20 mb-4 focus:outline-none focus:border-banana-gold/50"
      />

      {search.length >= 2 && searchResults && (
        <div className="mb-4">
          <p className="text-[10px] text-white/40 uppercase mb-2">Search Results</p>
          {searchResults.map(renderIdentityActions)}
        </div>
      )}

      <p className="text-[10px] text-banana-gold uppercase mb-2">Verification Queue</p>
      {queueLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : queue?.length === 0 ? (
        <p className="text-white/40 text-xs text-center py-4">No pending verifications</p>
      ) : (
        queue?.map(renderIdentityActions)
      )}
    </div>
  );
}
