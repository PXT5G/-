'use client';

import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label?: string;
  className?: string;
}

export function Toggle({ enabled, onChange, label, className }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      className={cn(
        'relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors duration-200',
        enabled ? 'bg-gulf-gold' : 'bg-white/20',
        className
      )}
      onClick={() => onChange(!enabled)}
    >
      <motion.span
        className="pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow-md"
        animate={{ x: enabled ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{ marginTop: 2 }}
      />
    </button>
  );
}
