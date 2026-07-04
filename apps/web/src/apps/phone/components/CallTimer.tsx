'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface CallTimerProps {
  startedAt?: string;
  connectedAt?: string;
  running?: boolean;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function CallTimer({ startedAt, connectedAt, running = true }: CallTimerProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!running) return;
    const base = connectedAt ? new Date(connectedAt).getTime() : startedAt ? new Date(startedAt).getTime() : Date.now();
    const tick = () => setSeconds(Math.floor((Date.now() - base) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt, connectedAt, running]);

  return (
    <motion.p
      key={seconds}
      initial={{ opacity: 0.6 }}
      animate={{ opacity: 1 }}
      className="text-green-400 text-sm font-mono tracking-widest"
    >
      {formatDuration(seconds)}
    </motion.p>
  );
}
