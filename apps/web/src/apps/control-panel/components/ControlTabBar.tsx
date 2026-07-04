'use client';

import { motion } from 'framer-motion';
import type { ControlTab } from '../types';

const TABS: { id: ControlTab; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'System', icon: '📊' },
  { id: 'permissions', label: 'RBAC', icon: '🔐' },
  { id: 'audit', label: 'Audit', icon: '🔍' },
  { id: 'realtime', label: 'Events', icon: '📡' },
  { id: 'sessions', label: 'Sessions', icon: '👥' },
];

interface ControlTabBarProps {
  active: ControlTab;
  onChange: (tab: ControlTab) => void;
}

export function ControlTabBar({ active, onChange }: ControlTabBarProps) {
  return (
    <nav className="flex items-center justify-around px-1 py-2 border-t border-white/10 bg-black/95 backdrop-blur-xl">
      {TABS.map((tab) => (
        <button key={tab.id} type="button" onClick={() => onChange(tab.id)} className="relative flex flex-col items-center gap-0.5 px-1 py-1">
          <motion.span animate={{ scale: active === tab.id ? 1.15 : 1 }} className="text-sm">{tab.icon}</motion.span>
          <span className={`text-[8px] ${active === tab.id ? 'text-banana-gold font-semibold' : 'text-white/40'}`}>{tab.label}</span>
          {active === tab.id && <motion.div layoutId="control-tab" className="absolute -bottom-0.5 w-3 h-0.5 rounded-full bg-banana-gold" />}
        </button>
      ))}
    </nav>
  );
}
