'use client';

import { useState } from 'react';
import { usePermissionStore } from '@/stores/permissionStore';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { useHaptic } from '@/hooks/useSound';
import type { PermissionType } from '@/types';

const PERMISSION_LABELS: Record<PermissionType, { title: string; description: string }> = {
  camera: { title: 'Camera', description: 'Access your camera to take photos and videos' },
  microphone: { title: 'Microphone', description: 'Record audio and make voice calls' },
  location: { title: 'Location', description: 'Access your location for maps and services' },
  contacts: { title: 'Contacts', description: 'Access your contacts list' },
  photos: { title: 'Photos', description: 'Access your photo library' },
  notifications: { title: 'Notifications', description: 'Send you notifications' },
  storage: { title: 'Storage', description: 'Read and write files on your device' },
  network: { title: 'Network', description: 'Access the internet' },
  biometrics: { title: 'Biometrics', description: 'Use Face ID or fingerprint for authentication' },
};

export function PermissionDialog() {
  const [pending, setPending] = useState<{
    appId: string;
    permission: PermissionType;
  } | null>(null);
  const { grantPermission } = usePermissionStore();
  const { tap } = useHaptic();

  if (!pending) return null;

  const info = PERMISSION_LABELS[pending.permission];

  return (
    <div className="absolute inset-0 z-[60] flex items-end justify-center bg-black/50 p-4">
      <GlassPanel className="w-full p-6" intensity="high">
        <h3 className="text-lg font-semibold text-white mb-1">
          &quot;{pending.appId}&quot; would like to access {info.title}
        </h3>
        <p className="text-sm text-white/60 mb-6">{info.description}</p>
        <div className="flex gap-3">
          <button
            onClick={() => { tap(); setPending(null); }}
            className="flex-1 py-3 rounded-xl bg-white/10 text-white text-sm font-medium"
          >
            Don&apos;t Allow
          </button>
          <button
            onClick={() => {
              tap();
              grantPermission(pending.appId, pending.permission);
              setPending(null);
            }}
            className="flex-1 py-3 rounded-xl bg-banana-gold text-black text-sm font-medium"
          >
            Allow
          </button>
        </div>
      </GlassPanel>
    </div>
  );
}
