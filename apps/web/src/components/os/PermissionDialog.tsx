'use client';

import { motion } from 'framer-motion';
import { usePermissionStore } from '@/stores/permissionStore';
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
  bank: { title: 'Bank', description: 'Access your banking accounts and transactions' },
  identity: { title: 'Identity', description: 'Access your digital identity and documents' },
  mail: { title: 'Mail', description: 'Access your email accounts' },
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
      className="absolute inset-0 z-[60] flex items-center justify-center bg-black/40 p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Native UIAlertController — 270pt centered alert */}
      <motion.div
        initial={{ scale: 1.15, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 30 }}
        className="w-[280px] ios-material-thick rounded-[14px] overflow-hidden"
      >
        <div className="px-5 pt-5 pb-4 text-center">
          <h3 className="text-[17px] font-semibold text-white leading-snug">
            &ldquo;{pending.appId.replace('com.gulfos.', '')}&rdquo; Would Like to Access Your {info.title}
          </h3>
          <p className="text-[13px] text-white/70 mt-1.5 leading-snug">{info.description}</p>
        </div>
        <div className="grid grid-cols-2 border-t border-[rgba(84,84,88,0.6)] divide-x divide-[rgba(84,84,88,0.6)]">
          <button
            onClick={() => { tap(); denyPermission(); }}
            className="h-[44px] text-[17px] text-gulf-gold active:bg-white/10 transition-colors"
          >
            Don&apos;t Allow
          </button>
          <button
            onClick={() => {
              tap();
              grantPermission(pending.appId, pending.permission);
            }}
            className="h-[44px] text-[17px] font-semibold text-gulf-gold active:bg-white/10 transition-colors"
          >
            Allow
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
