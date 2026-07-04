'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  accent?: boolean;
}

export function GlassCard({ children, className = '', onClick, accent }: GlassCardProps) {
  const Tag = onClick ? motion.button : motion.div;
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      className={`bg-white/5 backdrop-blur-xl rounded-2xl border ${accent ? 'border-banana-gold/30 bg-gradient-to-br from-banana-gold/10 to-transparent' : 'border-white/10'} p-4 ${className}`}
    >
      {children}
    </Tag>
  );
}
