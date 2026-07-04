'use client';

import { motion } from 'framer-motion';
import { GulfLogo } from '@/assets/GulfLogo';
import { fadeIn } from '@/animations/transitions';

export function SplashScreen() {
  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black"
      {...fadeIn}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <GulfLogo size={80} />
      </motion.div>
      <motion.h1
        className="mt-6 text-2xl font-semibold tracking-wider text-white"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        GULF<span className="text-gulf-gold">OS</span>
      </motion.h1>
      <motion.p
        className="mt-2 text-sm text-white/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        Premium Mobile Experience
      </motion.p>
    </motion.div>
  );
}
