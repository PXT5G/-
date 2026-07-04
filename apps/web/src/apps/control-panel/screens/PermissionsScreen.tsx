'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BANANAOS_APP_IDS } from '@bananaos/shared';
import { controlPanelService } from '../services/controlPanelService';
import { AdminCard } from '../components/AdminCard';
import { Button } from '@/components/shared/Button';

const APPS = Object.values(BANANAOS_APP_IDS).filter((id) => !id.includes('settings') && !id.includes('store') && !id.includes('control'));

export function PermissionsScreen() {
  const [appId, setAppId] = useState<string>(APPS[0]);
  const [userId, setUserId] = useState('');
  const [newPerms, setNewPerms] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [syncing, setSyncing] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['control-panel', 'permissions', appId, userId],
    queryFn: () => controlPanelService.getPermissions({ appId, userId: userId || undefined }),
  });

  const handleSync = async () => {
    setSyncing(true);
    try {
      await controlPanelService.syncPermissions(appId);
      queryClient.invalidateQueries({ queryKey: ['control-panel', 'permissions'] });
    } finally {
      setSyncing(false);
    }
  };

  const handleGrant = async (override = false) => {
    if (!targetUserId || !newPerms.trim()) return;
    await controlPanelService.grantPermissions({
      appId,
      userId: targetUserId,
      permissions: newPerms.split(',').map((p) => p.trim()).filter(Boolean),
      override,
      reason: override ? 'Admin override via Control Panel' : undefined,
    });
    setNewPerms('');
    queryClient.invalidateQueries({ queryKey: ['control-panel', 'permissions'] });
  };

  return (
    <div className="h-full overflow-y-auto px-4 py-4 space-y-3">
      <div className="flex gap-2 flex-wrap">
        <select value={appId} onChange={(e) => setAppId(e.target.value)} className="flex-1 min-w-[140px] bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs">
          {APPS.map((id) => <option key={id} value={id}>{id.replace('com.bananaos.', '')}</option>)}
        </select>
        <Button label="Sync Legacy" onClick={handleSync} loading={syncing} size="sm" />
      </div>

      <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="Filter by user ID..." className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder:text-white/30" />

      <AdminCard accent>
        <p className="text-banana-gold text-[10px] uppercase mb-2">Override Access</p>
        <input value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)} placeholder="Target user ID" className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-xs mb-2" />
        <input value={newPerms} onChange={(e) => setNewPerms(e.target.value)} placeholder="permissions, comma-separated" className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-xs mb-2" />
        <div className="flex gap-2">
          <Button label="Grant" onClick={() => handleGrant(false)} size="sm" />
          <Button label="Override" onClick={() => handleGrant(true)} size="sm" />
        </div>
      </AdminCard>

      {isLoading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          <p className="text-[10px] text-white/40">{data?.total ?? 0} CorePermission records</p>
          {data?.permissions.map((p) => (
            <AdminCard key={p.id} className="py-2 px-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-white text-xs font-medium truncate">{p.permission}</p>
                  <p className="text-white/40 text-[9px] truncate">User {p.userId.slice(0, 8)}… · {p.appId.replace('com.bananaos.', '')}</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await controlPanelService.revokePermission(p.appId, p.userId, p.permission);
                    queryClient.invalidateQueries({ queryKey: ['control-panel', 'permissions'] });
                  }}
                  className="text-[9px] text-red-400 px-2 py-1 rounded-lg bg-red-400/10"
                >
                  Revoke
                </button>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
}
