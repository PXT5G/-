'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/utils/cn';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  accent?: boolean;
}

export function GlassCard({ children, className = '', onClick, accent }: GlassCardProps) {
  const reducedMotion = useReducedMotion();
  const Tag = onClick ? motion.button : motion.div;

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={onClick && !reducedMotion ? { scale: 0.98 } : undefined}
      className={cn(
        'bg-white/5 backdrop-blur-xl rounded-2xl border p-4',
        accent
          ? 'border-banana-gold/30 bg-gradient-to-br from-banana-gold/10 to-transparent'
          : 'border-white/10',
        className
      )}
    >
      {children}
    </Tag>
  );
}
