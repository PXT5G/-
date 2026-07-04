'use client';

import { motion } from 'framer-motion';
import type { PhoneTab } from '../types';

const TABS: { id: PhoneTab; icon: string; label: string }[] = [
  { id: 'dashboard', icon: '🏠', label: 'Home' },
  { id: 'favorites', icon: '⭐', label: 'Favs' },
  { id: 'recents', icon: '🕐', label: 'Recent' },
  { id: 'dialpad', icon: '⌨️', label: 'Keypad' },
];

interface PhoneTabBarProps {
  active: PhoneTab;
  onChange: (tab: PhoneTab) => void;
  onMore: () => void;
  missedCount?: number;
}

export function PhoneTabBar({ active, onChange, onMore, missedCount = 0 }: PhoneTabBarProps) {
  return (
    <div className="flex items-center justify-around px-2 py-2 border-t border-white/10 bg-black/90 backdrop-blur-xl">
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className="relative flex flex-col items-center gap-0.5 px-3 py-1.5"
          >
            {isActive && (
              <motion.div
                layoutId="phone-tab-indicator"
                className="absolute inset-0 bg-green-400/10 rounded-xl border border-green-400/20"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative text-lg">{tab.icon}</span>
            <span className={`relative text-[9px] ${isActive ? 'text-green-400' : 'text-white/40'}`}>{tab.label}</span>
            {tab.id === 'recents' && missedCount > 0 && (
              <span className="absolute -top-0.5 right-1 w-4 h-4 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center">
                {missedCount > 9 ? '9+' : missedCount}
              </span>
            )}
          </button>
        );
      })}
      <button type="button" onClick={onMore} className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-white/40">
        <span className="text-lg">⋯</span>
        <span className="text-[9px]">More</span>
      </button>
    </div>
  );
}
