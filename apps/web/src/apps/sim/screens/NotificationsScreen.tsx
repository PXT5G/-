'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { simService } from '../services/simService';
import { EmptyState } from '@/components/shared/EmptyState';

export function NotificationsScreen() {
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['sim', 'notifications'],
    queryFn: () => simService.getNotifications(),
    refetchInterval: 30000,
  });

  if (isLoading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" /></div>;
  if (!notifications?.length) return <EmptyState icon="🔔" title="No Notifications" description="SIM alerts, carrier updates, and emergency notifications appear here." />;

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <h1 className="text-white font-bold text-lg mb-4">Notifications</h1>
      <div className="space-y-2">
        {notifications.map((n, i) => (
          <motion.div key={n.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className={`rounded-xl p-3 border border-white/10 ${!n.read ? 'bg-white/5' : ''}`}>
            <div className="flex gap-2">
              <span>📶</span>
              <div>
                <p className={`text-sm ${!n.read ? 'text-white font-medium' : 'text-white/70'}`}>{n.title}</p>
                <p className="text-xs text-white/50">{n.body}</p>
                <p className="text-[10px] text-white/30 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
