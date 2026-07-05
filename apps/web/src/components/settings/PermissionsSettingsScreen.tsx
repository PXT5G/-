'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePermissions } from '@/hooks/useSystemServices';
import { systemService } from '@/services/systemService';
import { Toggle } from '@/components/ui/Toggle';
import { useHaptic } from '@/hooks/useSound';
import type { SystemPermissionType } from '@/types';

const PERMISSION_LABELS: Record<string, string> = {
  camera: 'Camera',
  microphone: 'Microphone',
  location: 'Location',
  contacts: 'Contacts',
  photos: 'Photos',
  notifications: 'Notifications',
  storage: 'Storage',
  network: 'Network',
  biometrics: 'Biometrics',
  phone: 'Phone',
  bluetooth: 'Bluetooth',
  sim: 'SIM',
  files: 'Files',
  bank: 'Bank',
  identity: 'Identity',
  mail: 'Mail',
};

export function PermissionsSettingsScreen({ onBack }: { onBack: () => void }) {
  const { tap } = useHaptic();
  const queryClient = useQueryClient();
  const { data: grants, isLoading } = usePermissions();

  const toggleMutation = useMutation({
    mutationFn: async ({ appId, permission, granted }: { appId: string; permission: SystemPermissionType; granted: boolean }) => {
      if (granted) {
        await systemService.revokePermission(appId, permission);
      } else {
        await systemService.grantPermission(appId, permission);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['system', 'permissions'] }),
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-2 border-gulf-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const byApp = (grants ?? []).reduce<Record<string, typeof grants>>((acc, g) => {
    if (!acc[g.appId]) acc[g.appId] = [];
    acc[g.appId]!.push(g);
    return acc;
  }, {});

  return (
    <div className="h-full overflow-y-auto bg-black">
      <div className="p-4 pb-8">
        <button type="button" onClick={() => { tap(); onBack(); }} className="text-gulf-gold text-sm mb-4">‹ Settings</button>
        <h1 className="text-2xl font-bold text-white mb-6">Permissions</h1>

        {Object.keys(byApp).length === 0 ? (
          <p className="text-sm text-white/40 text-center py-8">No permission grants yet</p>
        ) : (
          Object.entries(byApp).map(([appId, appGrants]) => (
            <section key={appId} className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <h2 className="text-xs font-semibold text-white/40 uppercase mb-3">{appId}</h2>
              {(appGrants ?? []).map((g) => (
                <div key={`${g.appId}-${g.permission}`} className="flex items-center justify-between py-2">
                  <span className="text-sm text-white">{PERMISSION_LABELS[g.permission] ?? g.permission}</span>
                  <Toggle
                    enabled={g.granted}
                    onChange={() => toggleMutation.mutate({
                      appId: g.appId,
                      permission: g.permission as SystemPermissionType,
                      granted: g.granted,
                    })}
                    label={g.permission}
                  />
                </div>
              ))}
            </section>
          ))
        )}
      </div>
    </div>
  );
}
