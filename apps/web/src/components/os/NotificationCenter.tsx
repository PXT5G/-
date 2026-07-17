'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useNotificationStore } from '@/stores/notificationStore';
import { usePremiumExperienceStore } from '@/stores/premiumExperienceStore';
import { useNotificationHistory } from '@/hooks/usePremiumExperience';
import { formatRelativeTime } from '@/utils/date';
import { notificationSlide } from '@/animations/transitions';
import { useHaptic } from '@/hooks/useSound';
import { cn } from '@/utils/cn';
import type { OSNotification } from '@/types';

type Tab = 'active' | 'history';

/**
 * Native iOS Notification Center — slides down over the wallpaper
 * with heavy material blur and stacked rounded notification cards.
 */
export function NotificationCenter() {
  const { notifications, isCenterOpen, setCenterOpen, markAsRead, markAllAsRead, removeNotification } =
    useNotificationStore();
  const profile = usePremiumExperienceStore((s) => s.profile);
  const pinnedIds = new Set(profile?.pinnedNotificationIds ?? []);
  const { tap } = useHaptic();
  const [tab, setTab] = useState<Tab>('active');
  const [searchQ, setSearchQ] = useState('');
  const { data: history = [] } = useNotificationHistory();

  if (!isCenterOpen) return null;

  const groupStrategy = profile?.notificationGroupStrategy ?? 'app';
  const filteredNotifications = searchQ.trim()
    ? notifications.filter((n) =>
        n.title.toLowerCase().includes(searchQ.toLowerCase()) ||
        n.body.toLowerCase().includes(searchQ.toLowerCase())
      )
    : notifications;
  const grouped = groupNotifications(filteredNotifications, groupStrategy, pinnedIds);

  return (
    <AnimatePresence>
      <motion.div
        className="absolute inset-0 z-[45] flex flex-col ios-material-thick"
        initial={{ y: '-100%' }}
        animate={{ y: 0 }}
        exit={{ y: '-100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 36 }}
      >
        {/* Header */}
        <div className="pt-[72px] px-6 pb-3">
          <div className="flex items-end justify-between">
            <h2 className="ios-large-title text-white">Notifications</h2>
            <button
              onClick={() => { tap(); setCenterOpen(false); }}
              className="w-[30px] h-[30px] mb-1 rounded-full bg-ios-fill-tertiary flex items-center justify-center text-white/80 active:opacity-50"
              aria-label="Close"
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
                <path d="M1 1l9 9M10 1l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Segmented control */}
          <div className="mt-3 flex p-[2px] rounded-[9px] bg-ios-fill-tertiary w-fit">
            {(['active', 'history'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { tap(); setTab(t); }}
                className={cn(
                  'px-5 py-[5px] rounded-[7px] text-[13px] font-medium capitalize transition-colors',
                  tab === t ? 'bg-[#636366] text-white shadow-sm' : 'text-white/60'
                )}
              >
                {t === 'active' ? 'Active' : 'History'}
              </button>
            ))}
            {notifications.some((n) => !n.read) && tab === 'active' && (
              <button
                onClick={() => { tap(); markAllAsRead(); }}
                className="px-4 text-[13px] font-medium text-gulf-gold"
              >
                Mark all read
              </button>
            )}
          </div>

          <input
            type="search"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search"
            aria-label="Search notifications"
            className="mt-3 w-full px-4 py-[8px] rounded-[12px] bg-ios-fill-tertiary text-white text-[17px] placeholder:text-white/40 outline-none"
          />
        </div>

        {/* Notification stack */}
        <div className="flex-1 overflow-y-auto px-[13px] pb-10 space-y-[9px]">
          {tab === 'active' && (
            <>
              {filteredNotifications.length === 0 ? (
                <p className="text-center text-white/40 py-12 text-[17px]">No Notifications</p>
              ) : (
                grouped.map((group) => (
                  <div key={group.key}>
                    {group.label && (
                      <p className="text-[13px] font-semibold text-white/50 capitalize mb-[6px] px-2">{group.label}</p>
                    )}
                    <div className="space-y-[9px]">
                      {group.items.map((n) => (
                        <NotificationRow
                          key={n.id}
                          notification={n}
                          pinned={pinnedIds.has(n.id)}
                          onRead={() => { tap(); markAsRead(n.id); }}
                          onDismiss={(e) => { e.stopPropagation(); tap(); removeNotification(n.id); }}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {tab === 'history' && (
            <>
              {history.length === 0 ? (
                <p className="text-center text-white/40 py-12 text-[17px]">No History</p>
              ) : (
                history.map((n) => (
                  <div key={n.id} className="ios-material-thin rounded-[24px] px-4 py-[13px] ios-card-shadow">
                    <div className="flex items-center gap-3">
                      <span className="text-[26px] leading-none">{n.icon ?? '🔔'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-semibold text-white truncate leading-tight">{n.title}</p>
                        <p className="text-[15px] text-white/75 truncate leading-tight">{n.body}</p>
                        <span className="text-[12px] text-white/40">{formatRelativeTime(n.deliveredAt)}</span>
                      </div>
                      {n.pinned && <span className="text-[12px]">📌</span>}
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {/* Home indicator — swipe area to close */}
        <button
          className="pb-[9px] pt-2 flex justify-center w-full"
          onClick={() => { tap(); setCenterOpen(false); }}
          aria-label="Dismiss notification center"
        >
          <div className="w-[148px] h-[5px] rounded-full bg-white/90" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

function NotificationRow({
  notification: n,
  pinned,
  onRead,
  onDismiss,
}: {
  notification: OSNotification;
  pinned: boolean;
  onRead: () => void;
  onDismiss: (e: React.MouseEvent) => void;
}) {
  return (
    <motion.div
      {...notificationSlide}
      className={cn(
        'ios-material-thin rounded-[24px] px-4 py-[13px] ios-card-shadow',
        !n.read && 'ring-1 ring-white/20',
        pinned && 'ring-1 ring-gulf-gold/40'
      )}
      onClick={onRead}
    >
      <div className="flex items-center gap-3">
        <span className="text-[26px] leading-none">{n.icon ?? '🔔'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[15px] font-semibold text-white truncate leading-tight">{n.title}</p>
            <span className="text-[12px] text-white/45 shrink-0">{formatRelativeTime(n.timestamp)}</span>
          </div>
          <p className="text-[15px] text-white/75 truncate leading-tight">{n.body}</p>
          {n.priority === 'high' && (
            <span className="text-[12px] text-ios-red font-medium">Time Sensitive</span>
          )}
        </div>
        {pinned && <span className="text-[12px]">📌</span>}
        <button
          onClick={onDismiss}
          className="w-[24px] h-[24px] rounded-full bg-ios-fill-tertiary flex items-center justify-center text-white/60 shrink-0"
          aria-label="Dismiss notification"
        >
          <svg width="9" height="9" viewBox="0 0 11 11" fill="none" aria-hidden>
            <path d="M1 1l9 9M10 1l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}

function groupNotifications(
  notifications: OSNotification[],
  strategy: string,
  pinnedIds: Set<string>
) {
  const pinned = notifications.filter((n) => pinnedIds.has(n.id));
  const rest = notifications.filter((n) => !pinnedIds.has(n.id));

  const groups: { key: string; label?: string; items: OSNotification[] }[] = [];

  if (pinned.length > 0) {
    groups.push({ key: 'pinned', label: 'Pinned', items: pinned });
  }

  if (strategy === 'priority') {
    const high = rest.filter((n) => n.priority === 'high');
    const normal = rest.filter((n) => n.priority !== 'high');
    if (high.length) groups.push({ key: 'high', label: 'Priority', items: high });
    if (normal.length) groups.push({ key: 'normal', label: 'Other', items: normal });
  } else if (strategy === 'app') {
    const byApp = new Map<string, OSNotification[]>();
    for (const n of rest) {
      const key = n.appId ?? 'system';
      if (!byApp.has(key)) byApp.set(key, []);
      byApp.get(key)!.push(n);
    }
    for (const [key, items] of byApp) {
      groups.push({ key, label: key.replace('com.gulfos.', ''), items });
    }
  } else {
    groups.push({ key: 'all', items: rest });
  }

  return groups;
}
