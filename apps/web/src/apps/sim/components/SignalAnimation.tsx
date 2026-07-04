'use client';

import { motion } from 'framer-motion';

interface SignalAnimationProps {
  bars: number;
  strength: string;
}

export function SignalAnimation({ bars, strength }: SignalAnimationProps) {
  const colors: Record<string, string> = {
    excellent: 'bg-green-400',
    good: 'bg-green-400',
    fair: 'bg-yellow-400',
    poor: 'bg-red-400',
    none: 'bg-white/20',
  };
  const color = colors[strength] ?? colors.good;

  return (
    <div className="flex items-end gap-1 h-8">
      {[1, 2, 3, 4, 5].map((bar) => (
        <motion.div
          key={bar}
          className={`w-1.5 rounded-sm ${bar <= bars ? color : 'bg-white/15'}`}
          style={{ height: `${bar * 5 + 4}px` }}
          animate={bar <= bars ? { opacity: [0.6, 1, 0.6] } : { opacity: 0.3 }}
          transition={{ duration: 1.5, repeat: Infinity, delay: bar * 0.1 }}
        />
      ))}
    </div>
  );
}
