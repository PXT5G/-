'use client';

import { type ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
  onClick?: () => void;
}

const intensityMap = {
  low: 'bg-white/5 backdrop-blur-md border-white/10',
  medium: 'bg-white/10 backdrop-blur-xl border-white/15',
  high: 'bg-white/15 backdrop-blur-2xl border-white/20',
};

export function GlassPanel({ children, className, intensity = 'medium', onClick }: GlassPanelProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border shadow-lg',
        intensityMap[intensity],
        onClick && 'cursor-pointer active:scale-[0.98] transition-transform',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {children}
    </div>
  );
}
