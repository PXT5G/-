'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/shared';

interface UninstallConfirmModalProps {
  appName: string;
  appIcon: string;
  storageBytes: number;
  onConfirm: (options: { keepUserData: boolean; keepSettings: boolean; keepSession: boolean }) => void;
  onCancel: () => void;
}

function formatSize(bytes: number) {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

export function UninstallConfirmModal({
  appName,
  appIcon,
  storageBytes,
  onConfirm,
  onCancel,
}: UninstallConfirmModalProps) {
  const [keepUserData, setKeepUserData] = useState(false);
  const [keepSettings, setKeepSettings] = useState(false);
  const [keepSession, setKeepSession] = useState(false);

  return (
    <div className="absolute inset-0 z-[60] flex items-end bg-black/70">
      <motion.div
        className="w-full rounded-t-3xl bg-[#1a1a1a] border-t border-white/10 p-6"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{appIcon}</span>
          <div>
            <h3 className="text-lg font-semibold text-white">Remove {appName}?</h3>
            <p className="text-xs text-white/50">Frees {formatSize(storageBytes)}</p>
          </div>
        </div>

        <p className="text-xs text-white/40 uppercase mb-2">Keep on device</p>
        <div className="space-y-2 mb-4">
          {[
            { key: 'userData', label: 'User Data', state: keepUserData, set: setKeepUserData },
            { key: 'settings', label: 'Settings', state: keepSettings, set: setKeepSettings },
            { key: 'session', label: 'Login Session', state: keepSession, set: setKeepSession },
          ].map((opt) => (
            <label key={opt.key} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <input
                type="checkbox"
                checked={opt.state}
                onChange={(e) => opt.set(e.target.checked)}
                className="accent-banana-gold"
              />
              <span className="text-sm text-white">{opt.label}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-2">
          <Button label="Cancel" variant="ghost" onClick={onCancel} fullWidth />
          <Button
            label="Remove"
            onClick={() => onConfirm({ keepUserData, keepSettings, keepSession })}
            fullWidth
          />
        </div>
      </motion.div>
    </div>
  );
}
