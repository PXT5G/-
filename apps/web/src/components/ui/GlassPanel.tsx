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
  low: 'ios-material-ultrathin',
  medium: 'ios-material-thin',
  high: 'ios-material-thick',
};

export function GlassPanel({ children, className, intensity = 'medium', onClick }: GlassPanelProps) {
  return (
    <div
      className={cn(
        'rounded-[22px] ios-card-shadow',
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
