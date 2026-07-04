'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ProgressBar, Button } from '@/components/shared';
import type { ActiveInstall } from '../types';

interface InstallOverlayProps {
  install: ActiveInstall | null;
  onComplete: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
}

function formatSpeed(bytesPerSec?: number): string {
  if (!bytesPerSec || bytesPerSec <= 0) return '—';
  if (bytesPerSec < 1_000_000) return `${(bytesPerSec / 1000).toFixed(0)} KB/s`;
  return `${(bytesPerSec / 1_000_000).toFixed(1)} MB/s`;
}

function formatEta(seconds?: number): string {
  if (!seconds || seconds <= 0) return '—';
  if (seconds < 60) return `${seconds}s remaining`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s remaining`;
}

function statusLabel(install: ActiveInstall): string {
  switch (install.status) {
    case 'queued':
      return 'Queued';
    case 'downloading':
      return 'Downloading';
    case 'paused':
      return 'Paused';
    case 'installing':
      return install.installStep ?? 'Installing';
    case 'completed':
      return 'Ready';
    case 'failed':
      return 'Failed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return install.status;
  }
}

export function InstallOverlay({
  install,
  onComplete,
  onPause,
  onResume,
  onCancel,
  onRetry,
}: InstallOverlayProps) {
  if (!install) return null;

  const isActive = ['queued', 'downloading', 'paused', 'installing'].includes(install.status);
  const showControls = isActive || install.status === 'failed';

  return (
    <AnimatePresence>
      <motion.div
        className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="flex flex-col items-center px-8 w-full max-w-sm"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          <div className="w-24 h-24 rounded-3xl bg-white/10 border border-white/15 flex items-center justify-center text-5xl mb-6">
            {install.appIcon}
          </div>

          <h2 className="text-lg font-semibold text-white mb-1">{install.appName}</h2>
          <p className="text-sm text-white/50 mb-1 capitalize">{statusLabel(install)}</p>
          <p className="text-xs text-white/40 mb-4">
            {install.type === 'update' ? 'Updating' : 'Installing'} — {install.progress}%
          </p>

          <div className="w-full mb-3">
            <ProgressBar value={install.progress} showLabel />
          </div>

          {install.status === 'downloading' && (
            <div className="w-full flex justify-between text-xs text-white/40 mb-4">
              <span>{formatSpeed(install.downloadSpeed)}</span>
              <span>{formatEta(install.etaSeconds)}</span>
            </div>
          )}

          {install.status === 'installing' && install.installStep && (
            <p className="text-xs text-banana-gold mb-4 text-center">{install.installStep}</p>
          )}

          {install.status === 'failed' && (
            <p className="text-xs text-red-400 mb-4 text-center">Installation failed. You can retry.</p>
          )}

          {showControls && (
            <div className="flex gap-2 w-full">
              {install.status === 'downloading' && onPause && (
                <Button label="Pause" variant="ghost" size="sm" onClick={onPause} fullWidth />
              )}
              {install.status === 'paused' && onResume && (
                <Button label="Resume" size="sm" onClick={onResume} fullWidth />
              )}
              {install.status === 'failed' && onRetry && (
                <Button label="Retry" size="sm" onClick={onRetry} fullWidth />
              )}
              {isActive && onCancel && (
                <Button label="Cancel" variant="ghost" size="sm" onClick={onCancel} fullWidth />
              )}
            </div>
          )}

          {install.status === 'completed' && (
            <motion.button
              type="button"
              onClick={onComplete}
              className="mt-4 px-6 py-2 rounded-xl bg-banana-gold text-black text-sm font-semibold w-full"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Open
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
