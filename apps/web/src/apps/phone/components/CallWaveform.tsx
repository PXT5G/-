'use client';

import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export function CallWaveform({ active = true }: { active?: boolean }) {
  const reducedMotion = useReducedMotion();
  const bars = [0.4, 0.7, 1, 0.6, 0.9, 0.5, 0.8, 0.3, 0.7, 1, 0.5, 0.8];

  return (
    <div className="flex items-center justify-center gap-1 h-12" aria-hidden="true">
      {bars.map((h, i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full bg-banana-gold/80"
          animate={active && !reducedMotion ? { height: [8, h * 40, 12, h * 32, 8] } : { height: active ? 16 : 4 }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { duration: 0.8 + (i % 3) * 0.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.05 }
          }
        />
      ))}
    </div>
  );
}
