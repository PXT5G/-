'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '@/stores/notificationStore';
import { formatRelativeTime } from '@/utils/date';
import { notificationSlide } from '@/animations/transitions';
import { useHaptic } from '@/hooks/useSound';
import { GlassPanel } from '@/components/ui/GlassPanel';

export function NotificationCenter() {
  const { notifications, isCenterOpen, setCenterOpen, markAsRead, markAllAsRead, removeNotification } =
    useNotificationStore();
  const { tap } = useHaptic();

  if (!isCenterOpen) return null;

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
                {notifications.some((n) => !n.read) && (
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

            <div className="overflow-y-auto max-h-[50vh] space-y-2">
              {notifications.length === 0 ? (
                <p className="text-center text-white/40 py-8 text-sm">No notifications</p>
              ) : (
                notifications.map((n) => (
                  <motion.div
                    key={n.id}
                    {...notificationSlide}
                    className={`p-3 rounded-xl border transition-colors ${
                      n.read ? 'bg-white/5 border-white/5' : 'bg-white/10 border-white/15'
                    }`}
                    onClick={() => { tap(); markAsRead(n.id); }}
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
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); tap(); removeNotification(n.id); }}
                        className="text-white/30 hover:text-white/60 text-xs"
                        aria-label="Dismiss notification"
                      >
                        ✕
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </GlassPanel>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
