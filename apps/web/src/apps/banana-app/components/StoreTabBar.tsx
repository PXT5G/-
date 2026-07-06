'use client';

import { cn } from '@/utils/cn';
import type { StoreTab } from '../types';

const TABS: Array<{ id: StoreTab; label: string; icon: string }> = [
  { id: 'today', label: 'Today', icon: '📰' },
  { id: 'apps', label: 'Apps', icon: '📱' },
  { id: 'search', label: 'Search', icon: '🔍' },
  { id: 'updates', label: 'Updates', icon: '⬆️' },
  { id: 'library', label: 'Library', icon: '📚' },
];

interface StoreTabBarProps {
  active: StoreTab;
  onChange: (tab: StoreTab) => void;
  updateCount?: number;
}

/** Native UITabBar — 49pt bar + home-indicator safe area, chrome material */
export function StoreTabBar({ active, onChange, updateCount = 0 }: StoreTabBarProps) {
  return (
    <nav
      className="ios-material-chrome border-t border-[rgba(84,84,88,0.35)] flex items-start justify-around pt-[7px] pb-[24px]"
      aria-label="Store navigation"
    >
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex flex-col items-center gap-[3px] px-3 transition-colors relative min-w-[64px]',
            active === tab.id ? 'text-gulf-gold' : 'text-[rgba(235,235,245,0.6)]'
          )}
          aria-current={active === tab.id ? 'page' : undefined}
        >
          <span className="text-[24px] leading-none">{tab.icon}</span>
          <span className="text-[10px] font-medium tracking-tight">{tab.label}</span>
          {tab.id === 'updates' && updateCount > 0 && (
            <span className="absolute -top-1 right-2 min-w-[17px] h-[17px] px-1 bg-ios-red text-white text-[11px] font-semibold rounded-full flex items-center justify-center">
              {updateCount > 9 ? '9+' : updateCount}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}
