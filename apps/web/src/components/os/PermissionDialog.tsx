'use client';

import { motion } from 'framer-motion';
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
  videos: { title: 'Videos', description: 'Access your video library' },
  notifications: { title: 'Notifications', description: 'Send you notifications' },
  storage: { title: 'Storage', description: 'Read and write files on your device' },
  network: { title: 'Network', description: 'Access the internet' },
  biometrics: { title: 'Biometrics', description: 'Use Face ID or fingerprint for authentication' },
  phone: { title: 'Phone', description: 'Make and receive phone calls' },
  bluetooth: { title: 'Bluetooth', description: 'Connect to Bluetooth devices' },
  sim: { title: 'SIM', description: 'Access SIM card information' },
  files: { title: 'Files', description: 'Access files and documents' },
  calendar: { title: 'Calendar', description: 'Access your calendar events' },
  sms: { title: 'SMS', description: 'Send and receive text messages' },
  background_refresh: { title: 'Background Refresh', description: 'Refresh content in the background' },
  motion: { title: 'Motion', description: 'Access motion and fitness data' },
  clipboard: { title: 'Clipboard', description: 'Read clipboard contents' },
  nearby_devices: { title: 'Nearby Devices', description: 'Discover and connect to nearby devices' },
  media_library: { title: 'Media Library', description: 'Access your media library' },
  vpn: { title: 'VPN', description: 'Configure VPN connections' },
  health: { title: 'Health', description: 'Access health and fitness data' },
};

export function PermissionDialog() {
  const pending = usePermissionStore((s) => s.pending);
  const grantPermission = usePermissionStore((s) => s.grantPermission);
  const denyPermission = usePermissionStore((s) => s.denyPermission);
  const { tap } = useHaptic();

  if (!pending) return null;

  const info = PERMISSION_LABELS[pending.permission];

  return (
    <motion.div
      className="absolute inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        className="w-full"
      >
        <GlassPanel className="w-full p-6" intensity="high">
          <h3 className="text-lg font-semibold text-white mb-1">
            &quot;{pending.appId}&quot; would like to access {info.title}
          </h3>
          <p className="text-sm text-white/60 mb-6">{info.description}</p>
          <div className="flex gap-3">
            <button
              onClick={() => { tap(); denyPermission(); }}
              className="flex-1 py-3 rounded-xl bg-white/10 text-white text-sm font-medium"
            >
              Don&apos;t Allow
            </button>
            <button
              onClick={() => {
                tap();
                grantPermission(pending.appId, pending.permission);
              }}
              className="flex-1 py-3 rounded-xl bg-gulf-gold text-black text-sm font-medium"
            >
              Allow
            </button>
          </div>
        </GlassPanel>
      </motion.div>
    </motion.div>
  );
}
