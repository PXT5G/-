'use client';

import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface AnimatedBalanceProps {
  value: number;
  currency?: string;
  className?: string;
}

export function AnimatedBalance({ value, currency = 'BNA', className }: AnimatedBalanceProps) {
  const spring = useSpring(0, { stiffness: 80, damping: 20 });
  const display = useTransform(spring, (v) => v.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  const [text, setText] = useState('0.00');

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    const unsub = display.on('change', (v) => setText(v));
    return unsub;
  }, [display]);

  return (
    <div className={className}>
      <motion.span className="text-3xl font-bold text-white tracking-tight">{text}</motion.span>
      <span className="text-banana-gold text-sm ml-1">{currency}</span>
    </div>
  );
}
