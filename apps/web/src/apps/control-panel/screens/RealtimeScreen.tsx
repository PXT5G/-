'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { controlPanelService } from '../services/controlPanelService';
import { useControlStore } from '../store/controlStore';
import { AdminCard, BarChart } from '../components/AdminCard';

export function RealtimeScreen() {
  const liveEvents = useControlStore((s) => s.liveEvents);
  const setLiveEvents = useControlStore((s) => s.setLiveEvents);

  const { data } = useQuery({
    queryKey: ['control-panel', 'realtime'],
    queryFn: () => controlPanelService.getRealtime(100),
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (data?.events.length && liveEvents.length === 0) {
      setLiveEvents(data.events);
    }
  }, [data, liveEvents.length, setLiveEvents]);

  const events = liveEvents.length > 0 ? liveEvents : (data?.events ?? []);
  const stats = data?.stats;

  return (
    <div className="h-full flex flex-col">
      {stats && (
        <div className="px-4 pt-3 pb-2 border-b border-white/5">
          <AdminCard className="py-2 px-3">
            <div className="grid grid-cols-3 gap-2 text-center mb-2">
              <div><p className="text-white font-bold text-sm">{stats.totalRecorded}</p><p className="text-[8px] text-white/40">Events</p></div>
              <div><p className="text-white font-bold text-sm">{stats.connectedUsers}</p><p className="text-[8px] text-white/40">Connected</p></div>
              <div><p className="text-white font-bold text-sm">{data?.connectedUserIds.length ?? 0}</p><p className="text-[8px] text-white/40">User IDs</p></div>
            </div>
            <BarChart data={stats.byType.slice(0, 6).map((t) => ({ label: t.event.split(':').slice(-1)[0], value: t.count }))} maxBars={6} />
          </AdminCard>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
        <p className="text-[10px] text-banana-gold uppercase tracking-widest mb-1">Live Event Stream</p>
        <AnimatePresence initial={false}>
          {events.map((evt) => (
            <motion.div key={evt.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <AdminCard className="py-2 px-3">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${evt.direction === 'broadcast' ? 'bg-purple-400' : 'bg-green-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-[11px] font-mono truncate">{evt.event}</p>
                    <p className="text-white/30 text-[9px]">{evt.userId ? `user:${evt.userId.slice(0, 8)}` : 'broadcast'} · {new Date(evt.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              </AdminCard>
            </motion.div>
          ))}
        </AnimatePresence>
        {events.length === 0 && <p className="text-white/40 text-sm text-center py-8">Waiting for events...</p>}
      </div>
    </div>
  );
}
