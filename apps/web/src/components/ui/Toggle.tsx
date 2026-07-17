'use client';

import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label?: string;
  className?: string;
}

/** Native UISwitch — 51×31pt, green when on */
export function Toggle({ enabled, onChange, label, className }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      className={cn(
        'relative inline-flex h-[31px] w-[51px] shrink-0 cursor-pointer rounded-full transition-colors duration-200',
        enabled ? 'bg-ios-green' : 'bg-[rgba(120,120,128,0.32)]',
        className
      )}
      onClick={() => onChange(!enabled)}
    >
      <motion.span
        className="pointer-events-none inline-block h-[27px] w-[27px] rounded-full bg-white"
        style={{ marginTop: 2, boxShadow: '0 3px 8px rgba(0,0,0,0.15), 0 1px 1px rgba(0,0,0,0.16)' }}
        animate={{ x: enabled ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
      />
    </button>
  );
}
