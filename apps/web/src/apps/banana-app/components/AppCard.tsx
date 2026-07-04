'use client';

import { motion } from 'framer-motion';
import { RatingStars } from '@/components/shared';
import type { StoreApp } from '../types';
import { cn } from '@/utils/cn';

interface AppCardProps {
  app: StoreApp;
  onPress: () => void;
  variant?: 'compact' | 'large';
}

export function AppCard({ app, onPress, variant = 'compact' }: AppCardProps) {
  if (variant === 'large') {
    return (
      <motion.button
        type="button"
        onClick={onPress}
        whileTap={{ scale: 0.97 }}
        className="flex-shrink-0 w-72 rounded-2xl bg-white/5 border border-white/10 overflow-hidden text-left"
      >
        <div className="h-32 bg-gradient-to-br from-gulf-gold/20 to-transparent flex items-center justify-center text-5xl">
          {app.screenshots[0] ?? app.icon}
        </div>
        <div className="p-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{app.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate flex items-center gap-1">
                {app.name}
                {app.verified && <span className="text-gulf-gold text-xs">✓</span>}
              </p>
              <p className="text-xs text-white/50 truncate">{app.tagline}</p>
            </div>
          </div>
          <div className="mt-2">
            <RatingStars rating={app.ratingAverage} size="sm" />
          </div>
        </div>
      </motion.button>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onPress}
      whileTap={{ scale: 0.95 }}
      className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-white/5 transition-colors text-left"
    >
      <div className={cn(
        'w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0',
        'bg-white/10 border border-white/10'
      )}>
        {app.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate flex items-center gap-1">
          {app.name}
          {app.verified && <span className="text-gulf-gold text-[10px]">✓</span>}
          {app.premium && <span className="text-[10px] bg-gulf-gold/20 text-gulf-gold px-1.5 rounded">PRO</span>}
        </p>
        <p className="text-xs text-white/50 truncate">{app.tagline}</p>
        <RatingStars rating={app.ratingAverage} size="sm" />
      </div>
      <span className="text-white/30 text-lg">›</span>
    </motion.button>
  );
}
