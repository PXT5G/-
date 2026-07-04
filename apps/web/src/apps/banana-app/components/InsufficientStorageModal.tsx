'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/shared';
import type { DeviceStorageBreakdown } from '@/services/deviceStorageService';
import { formatBytes } from '@/services/deviceStorageService';

interface InsufficientStorageModalProps {
  required: number;
  free: number;
  breakdown?: DeviceStorageBreakdown;
  onClearCache: () => void;
  onOpenStorageManager: () => void;
  onCancel: () => void;
}

export function InsufficientStorageModal({
  required,
  free,
  onClearCache,
  onOpenStorageManager,
  onCancel,
}: InsufficientStorageModalProps) {
  const shortfall = required - free;

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-xl p-6">
      <motion.div
        className="w-full max-w-sm rounded-3xl bg-[#1a1a1a] border border-white/10 p-6"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="text-4xl text-center mb-3">💾</div>
        <h3 className="text-lg font-semibold text-white text-center mb-1">Not enough storage.</h3>
        <p className="text-sm text-white/50 text-center mb-4">
          Need {formatBytes(required)} · {formatBytes(shortfall)} more required
        </p>

        <div className="p-3 rounded-xl bg-white/5 border border-white/10 mb-4 text-xs space-y-1">
          <div className="flex justify-between text-white/60">
            <span>Available</span>
            <span className="text-white">{formatBytes(free)}</span>
          </div>
          <div className="flex justify-between text-white/60">
            <span>Required</span>
            <span className="text-red-400">{formatBytes(required)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Button label="Clear Cache" onClick={onClearCache} fullWidth variant="ghost" />
          <Button label="Open Storage Manager" onClick={onOpenStorageManager} fullWidth />
          <Button label="Cancel" onClick={onCancel} fullWidth variant="ghost" />
        </div>
      </motion.div>
    </div>
  );
}
