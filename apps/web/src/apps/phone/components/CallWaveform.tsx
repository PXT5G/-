'use client';

import { motion } from 'framer-motion';

export function CallWaveform({ active = true }: { active?: boolean }) {
  const bars = [0.4, 0.7, 1, 0.6, 0.9, 0.5, 0.8, 0.3, 0.7, 1, 0.5, 0.8];

  return (
    <div className="flex items-center justify-center gap-1 h-12">
      {bars.map((h, i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full bg-green-400/80"
          animate={active ? { height: [8, h * 40, 12, h * 32, 8] } : { height: 4 }}
          transition={{
            duration: 0.8 + (i % 3) * 0.2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.05,
          }}
        />
      ))}
    </div>
  );
}
