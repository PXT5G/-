'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { policeService } from '../services/policeService';
import { GlassCard } from '../components/GlassCard';
import { Button } from '@/components/shared/Button';
import { usePoliceStore } from '../store/policeStore';
import type { PoliceRank } from '../types';

const RANKS: PoliceRank[] = ['cadet', 'officer', 'sergeant', 'lieutenant', 'captain', 'chief'];

export function RankingsScreen() {
  const [selectedOfficer, setSelectedOfficer] = useState<string | null>(null);
  const [points, setPoints] = useState(10);
  const [reason, setReason] = useState('');
  const [newRank, setNewRank] = useState<PoliceRank>('sergeant');
  const permissions = usePoliceStore((s) => s.permissions);
  const canManage = permissions.includes('manage_rankings');
  const queryClient = useQueryClient();

  const { data: officers } = useQuery({
    queryKey: ['police', 'officers'],
    queryFn: () => policeService.listOfficers(),
  });

  const { data: history } = useQuery({
    queryKey: ['police', 'rank-history', selectedOfficer],
    queryFn: () => policeService.getRankHistory(selectedOfficer!),
    enabled: !!selectedOfficer,
  });

  const handlePoints = async () => {
    if (!selectedOfficer || !reason) return;
    await policeService.addPoints(selectedOfficer, points, reason);
    setReason('');
    queryClient.invalidateQueries({ queryKey: ['police', 'officers'] });
  };

  const handlePromote = async () => {
    if (!selectedOfficer || !reason) return;
    await policeService.promote(selectedOfficer, newRank, reason);
    setReason('');
    queryClient.invalidateQueries({ queryKey: ['police'] });
  };

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <p className="text-[10px] text-white/40 uppercase tracking-widest mb-3">Rankings & Points</p>

      <div className="space-y-2 mb-4">
        {officers?.map((o, i) => (
          <motion.div key={o.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
            <GlassCard onClick={() => setSelectedOfficer(o.id)} className={selectedOfficer === o.id ? 'border-banana-gold/40' : ''}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">{o.fullName}</p>
                  <p className="text-white/40 text-[10px]">Badge {o.badgeNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-banana-gold font-bold">{o.points}</p>
                  <p className="text-white/40 text-[10px] capitalize">{o.rank}</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {selectedOfficer && canManage && (
        <GlassCard className="mb-4 space-y-2">
          <p className="text-banana-gold text-xs mb-2">Manage Officer</p>
          <div className="flex gap-2 items-center">
            <input type="number" value={points} onChange={(e) => setPoints(Number(e.target.value))} className="w-20 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm" />
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm" />
            <Button label="Award" onClick={handlePoints} size="sm" />
          </div>
          <div className="flex gap-2 items-center mt-2">
            <select value={newRank} onChange={(e) => setNewRank(e.target.value as PoliceRank)} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm">
              {RANKS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <Button label="Promote" onClick={handlePromote} size="sm" />
          </div>
        </GlassCard>
      )}

      {history && history.length > 0 && (
        <div>
          <p className="text-[10px] text-white/40 uppercase mb-2">Rank History</p>
          {history.map((h) => (
            <GlassCard key={h.id} className="mb-2">
              <p className="text-white text-xs capitalize">{h.previousRank} → {h.newRank}</p>
              <p className="text-white/40 text-[10px]">{h.reason}</p>
              <p className="text-white/30 text-[9px]">{new Date(h.createdAt).toLocaleDateString()}</p>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
