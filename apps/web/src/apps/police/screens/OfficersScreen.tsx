'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { policeService } from '../services/policeService';
import { GlassCard } from '../components/GlassCard';
import type { OfficerStatus } from '../types';

const STATUS_OPTIONS: OfficerStatus[] = ['on_duty', 'off_duty', 'break', 'en_route', 'on_scene'];

const STATUS_DOT: Record<OfficerStatus, string> = {
  on_duty: 'bg-green-400',
  off_duty: 'bg-white/30',
  break: 'bg-blue-400',
  en_route: 'bg-yellow-400',
  on_scene: 'bg-red-400',
};

export function OfficersScreen() {
  const queryClient = useQueryClient();

  const { data: officers, isLoading } = useQuery({
    queryKey: ['police', 'officers'],
    queryFn: () => policeService.listOfficers(),
    refetchInterval: 15000,
  });

  const handleStatus = async (id: string, status: OfficerStatus) => {
    await policeService.updateStatus(id, status);
    queryClient.invalidateQueries({ queryKey: ['police'] });
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <p className="text-[10px] text-white/40 uppercase tracking-widest mb-3">Officers</p>
      <div className="space-y-2">
        {officers?.map((o, i) => (
          <motion.div key={o.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <GlassCard>
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${o.isOnline ? STATUS_DOT[o.status] : 'bg-white/20'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{o.fullName}</p>
                  <p className="text-white/40 text-[10px]">{o.badgeNumber} · {o.unit} · {o.rank}</p>
                </div>
                <div className="text-right">
                  <p className="text-banana-gold text-sm font-medium">{o.points}</p>
                  <p className="text-white/30 text-[9px] capitalize">{o.status.replace('_', ' ')}</p>
                </div>
              </div>
              <div className="flex gap-1 mt-2 pt-2 border-t border-white/5 overflow-x-auto">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleStatus(o.id, s)}
                    className={`px-2 py-0.5 rounded-full text-[8px] whitespace-nowrap ${o.status === s ? 'bg-banana-gold/20 text-banana-gold' : 'bg-white/5 text-white/40'}`}
                  >
                    {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
