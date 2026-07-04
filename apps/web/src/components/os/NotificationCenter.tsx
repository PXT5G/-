'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useNotificationStore } from '@/stores/notificationStore';
import { usePremiumExperienceStore } from '@/stores/premiumExperienceStore';
import { useNotificationHistory } from '@/hooks/usePremiumExperience';
import { formatRelativeTime } from '@/utils/date';
import { notificationSlide } from '@/animations/transitions';
import { useHaptic } from '@/hooks/useSound';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { cn } from '@/utils/cn';
import type { OSNotification } from '@/types';

type Tab = 'active' | 'history';

export function NotificationCenter() {
  const { notifications, isCenterOpen, setCenterOpen, markAsRead, markAllAsRead, removeNotification } =
    useNotificationStore();
  const profile = usePremiumExperienceStore((s) => s.profile);
  const pinnedIds = new Set(profile?.pinnedNotificationIds ?? []);
  const { tap } = useHaptic();
  const [tab, setTab] = useState<Tab>('active');
  const { data: history = [] } = useNotificationHistory();

  if (!isCenterOpen) return null;

  const groupStrategy = profile?.notificationGroupStrategy ?? 'app';
  const grouped = groupNotifications(notifications, groupStrategy, pinnedIds);

  return (
    <AnimatePresence>
      <motion.div
        className="absolute inset-0 z-[45] flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setCenterOpen(false)} />

        <motion.div
          className="max-h-[70%] overflow-hidden"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 35 }}
        >
          <GlassPanel className="rounded-t-3xl rounded-b-none p-4" intensity="high">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Notifications</h2>
              <div className="flex gap-2">
                {notifications.some((n) => !n.read) && tab === 'active' && (
                  <button
                    onClick={() => { tap(); markAllAsRead(); }}
                    className="text-xs text-gulf-gold"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => { tap(); setCenterOpen(false); }}
                  className="text-xs text-white/50"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              {(['active', 'history'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { tap(); setTab(t); }}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs capitalize',
                    tab === t ? 'bg-gulf-gold text-black' : 'bg-white/10 text-white/70'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="overflow-y-auto max-h-[50vh] space-y-3">
              {tab === 'active' && (
                <>
                  {notifications.length === 0 ? (
                    <p className="text-center text-white/40 py-8 text-sm">No notifications</p>
                  ) : (
                    grouped.map((group) => (
                      <div key={group.key}>
                        {group.label && (
                          <p className="text-[10px] font-semibold text-white/40 uppercase mb-1">{group.label}</p>
                        )}
                        <div className="space-y-2">
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
                    <p className="text-center text-white/40 py-8 text-sm">No notification history</p>
                  ) : (
                    history.map((n) => (
                      <div
                        key={n.id}
                        className="p-3 rounded-xl bg-white/5 border border-white/5"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-lg">{n.icon ?? '🔔'}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{n.title}</p>
                            <p className="text-xs text-white/60 mt-0.5">{n.body}</p>
                            <span className="text-[10px] text-white/40">
                              {formatRelativeTime(n.deliveredAt)}
                            </span>
                          </div>
                          {n.pinned && <span className="text-[10px] text-gulf-gold">📌</span>}
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          </GlassPanel>
        </motion.div>
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
        'p-3 rounded-xl border transition-colors',
        n.read ? 'bg-white/5 border-white/5' : 'bg-white/10 border-white/15',
        pinned && 'border-gulf-gold/30'
      )}
      onClick={onRead}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg">{n.icon ?? '🔔'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white truncate">{n.title}</p>
            <span className="text-[10px] text-white/40 shrink-0 ml-2">
              {formatRelativeTime(n.timestamp)}
            </span>
          </div>
          <p className="text-xs text-white/60 mt-0.5">{n.body}</p>
          {n.priority === 'high' && (
            <span className="text-[10px] text-red-400 mt-1 inline-block">Priority</span>
          )}
        </div>
        {pinned && <span className="text-[10px] text-gulf-gold">📌</span>}
        <button
          onClick={onDismiss}
          className="text-white/30 hover:text-white/60 text-xs"
          aria-label="Dismiss notification"
        >
          ✕
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
