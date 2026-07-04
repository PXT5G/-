'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ProgressBar } from '@/components/shared';
import type { ActiveInstall } from '../types';

interface InstallOverlayProps {
  install: ActiveInstall | null;
  onComplete: () => void;
}

export function InstallOverlay({ install, onComplete }: InstallOverlayProps) {
  if (!install) return null;

  const isInstalling = install.status === 'installing';

  return (
    <AnimatePresence>
      <motion.div
        className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="flex flex-col items-center px-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          <motion.div
            className="w-24 h-24 rounded-3xl bg-white/10 border border-white/15 flex items-center justify-center text-5xl mb-6 shadow-lg shadow-banana-gold/20"
            animate={isInstalling ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          >
            {install.appIcon}
          </motion.div>

          <h2 className="text-lg font-semibold text-white mb-1">{install.appName}</h2>
          <p className="text-sm text-white/50 mb-6">
            {install.type === 'update' ? 'Updating' : 'Installing'}
            {isInstalling ? '...' : ` — ${install.progress}%`}
          </p>

          <div className="w-48">
            <ProgressBar value={isInstalling ? 100 : install.progress} showLabel />
          </div>

          {install.status === 'completed' && (
            <motion.button
              type="button"
              onClick={onComplete}
              className="mt-6 px-6 py-2 rounded-xl bg-banana-gold text-black text-sm font-semibold"
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
