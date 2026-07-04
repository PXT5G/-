'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { PhoneTab } from '../types';
import { HomeIcon, StarIcon, ClockIcon, KeypadIcon, MoreIcon } from '@/components/shared/PhoneIcons';

const TABS: { id: PhoneTab; Icon: typeof HomeIcon; label: string }[] = [
  { id: 'dashboard', Icon: HomeIcon, label: 'Home' },
  { id: 'favorites', Icon: StarIcon, label: 'Favs' },
  { id: 'recents', Icon: ClockIcon, label: 'Recent' },
  { id: 'dialpad', Icon: KeypadIcon, label: 'Keypad' },
];

interface PhoneTabBarProps {
  active: PhoneTab;
  onChange: (tab: PhoneTab) => void;
  onMore: () => void;
  missedCount?: number;
}

export const PhoneTabBar = memo(function PhoneTabBar({ active, onChange, onMore, missedCount = 0 }: PhoneTabBarProps) {
  const reducedMotion = useReducedMotion();

  return (
    <nav aria-label="Phone navigation" className="flex items-center justify-around px-2 py-2 border-t border-white/10 bg-black/90 backdrop-blur-xl">
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        const Icon = tab.Icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
            className="relative flex flex-col items-center gap-0.5 px-3 py-2 min-w-[44px] min-h-[44px]"
          >
            {isActive && (
              <motion.div
                layoutId={reducedMotion ? undefined : 'phone-tab-indicator'}
                className="absolute inset-0 bg-banana-gold/10 rounded-xl border border-banana-gold/20"
                transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <Icon className="relative w-5 h-5 text-white/80" label={tab.label} />
            <span className={`relative text-[9px] ${isActive ? 'text-banana-gold' : 'text-white/40'}`}>{tab.label}</span>
            {tab.id === 'recents' && missedCount > 0 && (
              <span className="absolute top-0 right-0 min-w-[16px] h-4 px-1 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center" aria-label={`${missedCount} missed calls`}>
                {missedCount > 9 ? '9+' : missedCount}
              </span>
            )}
          </button>
        );
      })}
      <button
        type="button"
        onClick={onMore}
        aria-label="More options"
        className="flex flex-col items-center gap-0.5 px-3 py-2 min-w-[44px] min-h-[44px] text-white/40"
      >
        <MoreIcon className="w-5 h-5" label="More" />
        <span className="text-[9px]">More</span>
      </button>
    </nav>
  );
});
