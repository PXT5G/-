'use client';

import { motion } from 'framer-motion';
import type { IdentityTab } from '../types';

const TABS: { id: IdentityTab; label: string; icon: string }[] = [
  { id: 'home', label: 'Card', icon: '🪪' },
  { id: 'profile', label: 'Profile', icon: '👤' },
  { id: 'security', label: 'Security', icon: '🔒' },
  { id: 'verify', label: 'Verify', icon: '✅' },
  { id: 'documents', label: 'Docs', icon: '📄' },
  { id: 'notifications', label: 'Alerts', icon: '🔔' },
];

interface IdentityTabBarProps {
  active: IdentityTab;
  onChange: (tab: IdentityTab) => void;
  showAdmin?: boolean;
  unreadCount?: number;
}

export function IdentityTabBar({ active, onChange, showAdmin, unreadCount }: IdentityTabBarProps) {
  const tabs = showAdmin ? [...TABS, { id: 'admin' as IdentityTab, label: 'Admin', icon: '⚙️' }] : TABS;

  return (
    <nav className="flex items-center justify-around px-1 py-2 border-t border-white/10 bg-black/80 backdrop-blur-xl">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className="relative flex flex-col items-center gap-0.5 px-2 py-1 min-w-0"
        >
          <motion.span
            animate={{ scale: active === tab.id ? 1.15 : 1 }}
            transition={{ type: 'spring' as const, stiffness: 400, damping: 20 }}
            className="text-base"
          >
            {tab.icon}
          </motion.span>
          <span
            className={`text-[9px] truncate max-w-[48px] ${
              active === tab.id ? 'text-banana-gold font-semibold' : 'text-white/40'
            }`}
          >
            {tab.label}
          </span>
          {tab.id === 'notifications' && unreadCount !== undefined && unreadCount > 0 && (
            <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-banana-gold text-black text-[8px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          {active === tab.id && (
            <motion.div
              layoutId="identity-tab-indicator"
              className="absolute -bottom-0.5 w-4 h-0.5 rounded-full bg-banana-gold"
              transition={{ type: 'spring' as const, stiffness: 500, damping: 30 }}
            />
          )}
        </button>
      ))}
    </nav>
  );
}
