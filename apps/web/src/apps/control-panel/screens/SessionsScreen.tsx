'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { controlPanelService } from '../services/controlPanelService';
import { AdminCard } from '../components/AdminCard';
import { Button } from '@/components/shared/Button';

export function SessionsScreen() {
  const [userFilter, setUserFilter] = useState('');
  const [revoking, setRevoking] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['control-panel', 'sessions', userFilter],
    queryFn: () => controlPanelService.getSessions(0, userFilter || undefined),
    refetchInterval: 10000,
  });

  const handleRevoke = async (userId: string, sessionId: string) => {
    setRevoking(sessionId);
    try {
      await controlPanelService.revokeSession(userId, sessionId, 'Revoked via Control Panel');
      queryClient.invalidateQueries({ queryKey: ['control-panel', 'sessions'] });
    } finally {
      setRevoking(null);
    }
  };

  const handleRevokeUser = async (userId: string) => {
    setRevoking(userId);
    try {
      await controlPanelService.revokeUser(userId, 'All sessions revoked via Control Panel');
      queryClient.invalidateQueries({ queryKey: ['control-panel', 'sessions'] });
    } finally {
      setRevoking(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <input
        value={userFilter}
        onChange={(e) => setUserFilter(e.target.value)}
        placeholder="Filter by user ID..."
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs mb-3 placeholder:text-white/30"
      />

      {isLoading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          <p className="text-[10px] text-white/40">{data?.total ?? 0} platform sessions</p>
          {data?.sessions.map((s) => (
            <AdminCard key={s.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium">{s.displayName ?? s.username ?? s.userId.slice(0, 12)}</p>
                  <p className="text-white/40 text-[9px]">{s.role} · {s.activeAppId?.replace('com.bananaos.', '') ?? 'no active app'}</p>
                  <p className="text-white/30 text-[9px] mt-1">📱 {s.deviceName ?? s.deviceId ?? 'unknown device'}</p>
                  <p className="text-white/30 text-[9px]">🌐 {s.ipAddress ?? '—'} · {new Date(s.lastActiveAt).toLocaleString()}</p>
                  {s.appContexts.length > 0 && (
                    <p className="text-banana-gold text-[8px] mt-1">{s.appContexts.length} app contexts</p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <Button label="Logout" onClick={() => handleRevoke(s.userId, s.sessionId)} loading={revoking === s.sessionId} size="sm" />
                  <button type="button" onClick={() => handleRevokeUser(s.userId)} className="text-[8px] text-red-400">All sessions</button>
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
}
