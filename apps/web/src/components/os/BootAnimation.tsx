'use client';

import { motion } from 'framer-motion';
import { BananaLogo } from '@/assets/BananaLogo';
import { useOSStore } from '@/stores/osStore';

export function BootAnimation() {
  const bootProgress = useOSStore((s) => s.bootProgress);

  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <BananaLogo size={64} />
      </motion.div>

      <div className="mt-12 w-48">
        <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-banana-gold"
            initial={{ width: '0%' }}
            animate={{ width: `${bootProgress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <p className="mt-3 text-center text-xs text-white/40">
          {bootProgress < 100 ? 'Starting BananaOS...' : 'Welcome'}
        </p>
      </div>
    </motion.div>
  );
}
