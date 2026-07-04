'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { identityService } from '../services/identityService';
import { EmptyState } from '@/components/shared/EmptyState';

const priorityColors: Record<string, string> = {
  low: 'border-white/10',
  normal: 'border-white/15',
  high: 'border-banana-gold/30',
  critical: 'border-red-500/30 bg-red-500/5',
};

export function NotificationsScreen() {
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['identity', 'notifications'],
    queryFn: () => identityService.getNotifications(),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!notifications?.length) {
    return (
      <EmptyState
        icon="🔔"
        title="No Notifications"
        description="Verification requests, identity updates, and security alerts will appear here."
      />
    );
  }

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-white font-bold text-lg">Notifications</h1>
        {unread > 0 && (
          <span className="text-xs text-banana-gold">{unread} unread</span>
        )}
      </div>

      <div className="space-y-2">
        {notifications.map((n, i) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-xl p-3 border ${priorityColors[n.priority] ?? priorityColors.normal} ${
              !n.read ? 'bg-white/5' : 'bg-transparent'
            }`}
          >
            <div className="flex items-start gap-2">
              <span className="text-lg">{n.icon ?? '🪪'}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!n.read ? 'text-white font-medium' : 'text-white/70'}`}>
                  {n.title}
                </p>
                <p className="text-xs text-white/50 mt-0.5">{n.body}</p>
                <p className="text-[10px] text-white/30 mt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
              {!n.read && <div className="w-2 h-2 rounded-full bg-banana-gold mt-1" />}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
