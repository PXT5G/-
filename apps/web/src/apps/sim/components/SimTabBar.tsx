'use client';

import { motion } from 'framer-motion';
import type { SimTab } from '../types';

const TABS: { id: SimTab; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: '📶' },
  { id: 'numbers', label: 'Numbers', icon: '🔢' },
  { id: 'sim', label: 'SIM', icon: '💳' },
  { id: 'call', label: 'Calls', icon: '📞' },
  { id: 'network', label: 'Network', icon: '🌐' },
];

interface SimTabBarProps {
  active: SimTab;
  onChange: (tab: SimTab) => void;
  onMore: () => void;
  unreadCount?: number;
}

export function SimTabBar({ active, onChange, onMore, unreadCount }: SimTabBarProps) {
  return (
    <nav className="flex items-center justify-around px-1 py-2 border-t border-white/10 bg-black/90 backdrop-blur-xl">
      {TABS.map((tab) => (
        <button key={tab.id} type="button" onClick={() => onChange(tab.id)} className="relative flex flex-col items-center gap-0.5 px-1.5 py-1">
          <motion.span animate={{ scale: active === tab.id ? 1.15 : 1 }} transition={{ type: 'spring' as const, stiffness: 400, damping: 20 }} className="text-sm">{tab.icon}</motion.span>
          <span className={`text-[8px] ${active === tab.id ? 'text-banana-gold font-semibold' : 'text-white/40'}`}>{tab.label}</span>
          {active === tab.id && <motion.div layoutId="sim-tab" className="absolute -bottom-0.5 w-3 h-0.5 rounded-full bg-banana-gold" transition={{ type: 'spring' as const, stiffness: 500, damping: 30 }} />}
        </button>
      ))}
      <button type="button" onClick={onMore} className="relative flex flex-col items-center gap-0.5 px-1.5 py-1">
        <span className="text-sm">⋯</span>
        <span className="text-[8px] text-white/40">More</span>
        {unreadCount !== undefined && unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-banana-gold text-black text-[7px] font-bold flex items-center justify-center">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>
    </nav>
  );
}
