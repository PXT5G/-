'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bankService } from '../services/bankService';
import { Button } from '@/components/shared/Button';
import { useHaptic } from '@/hooks/useSound';

interface PendingTransfer {
  id: string;
  reference: string;
  amount: number;
  fromUserId: string;
  toUserId: string;
  reason?: string;
  createdAt: string;
}

export function AdminScreen() {
  const { tap, success } = useHaptic();
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['bank', 'admin', 'stats'],
    queryFn: () => bankService.adminStats(),
  });

  const { data: pending } = useQuery({
    queryKey: ['bank', 'admin', 'pending'],
    queryFn: () => bankService.adminPendingTransfers() as Promise<PendingTransfer[]>,
  });

  const { data: audit } = useQuery({
    queryKey: ['bank', 'admin', 'audit'],
    queryFn: () => bankService.adminAuditLogs() as Promise<{ id: string; action: string; details?: string; amount?: number; createdAt: string }[]>,
  });

  const approve = useMutation({
    mutationFn: (id: string) => bankService.adminApproveTransfer(id),
    onSuccess: () => { success(); queryClient.invalidateQueries({ queryKey: ['bank', 'admin'] }); },
  });

  const reject = useMutation({
    mutationFn: (id: string) => bankService.adminRejectTransfer(id),
    onSuccess: () => { success(); queryClient.invalidateQueries({ queryKey: ['bank', 'admin'] }); },
  });

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <h1 className="text-white font-bold text-lg mb-4">Bank Admin</h1>

      {stats && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { label: 'Accounts', value: stats.totalAccounts },
            { label: 'Total Balance', value: `${stats.totalBalance.toFixed(0)} BNA` },
            { label: 'Pending', value: stats.pendingTransfers },
            { label: 'Today Volume', value: `${stats.todayVolume.toFixed(0)} BNA` },
          ].map((s) => (
            <div key={s.label} className="bg-white/5 rounded-lg p-2 text-center border border-white/10">
              <p className="text-banana-gold font-bold text-sm">{s.value}</p>
              <p className="text-[9px] text-white/40">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-banana-gold uppercase mb-2">Pending Transfers</p>
      {pending?.length === 0 ? (
        <p className="text-white/40 text-xs text-center py-4 mb-4">No pending transfers</p>
      ) : (
        pending?.map((t) => (
          <div key={t.id} className="bg-white/5 rounded-xl p-3 border border-white/10 mb-2">
            <p className="text-sm text-white">{t.amount} BNA</p>
            <p className="text-[10px] text-white/40">{t.reference} · {t.reason}</p>
            <div className="flex gap-2 mt-2">
              <Button label="Approve" size="sm" onClick={() => { tap(); approve.mutate(t.id); }} />
              <Button label="Reject" size="sm" variant="destructive" onClick={() => { tap(); reject.mutate(t.id); }} />
            </div>
          </div>
        ))
      )}

      <p className="text-[10px] text-banana-gold uppercase mb-2 mt-4">Audit Logs</p>
      {audit?.slice(0, 15).map((log) => (
        <div key={log.id} className="flex justify-between py-2 border-b border-white/5">
          <div>
            <p className="text-xs text-white capitalize">{log.action.replace(/_/g, ' ')}</p>
            <p className="text-[10px] text-white/40">{log.details}</p>
          </div>
          <p className="text-[10px] text-white/30">{new Date(log.createdAt).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
}
