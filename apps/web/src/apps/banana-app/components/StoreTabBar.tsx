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

export function StoreTabBar({ active, onChange, updateCount = 0 }: StoreTabBarProps) {
  return (
    <nav
      className="flex items-center justify-around border-t border-white/10 bg-black/90 backdrop-blur-xl py-2 pb-4"
      aria-label="Store navigation"
    >
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors relative',
            active === tab.id ? 'text-gulf-gold' : 'text-white/40'
          )}
          aria-current={active === tab.id ? 'page' : undefined}
        >
          <span className="text-lg">{tab.icon}</span>
          <span className="text-[10px] font-medium">{tab.label}</span>
          {tab.id === 'updates' && updateCount > 0 && (
            <span className="absolute -top-0.5 right-0 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {updateCount > 9 ? '9+' : updateCount}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}
