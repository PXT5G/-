'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { policeService } from '../services/policeService';
import { GlassCard } from '@/components/shared/GlassCard';
import { Button } from '@/components/shared/Button';
import { usePoliceStore } from '../store/policeStore';

const PRIORITY_COLORS: Record<number, string> = {
  1: 'text-red-400 border-red-400/30',
  2: 'text-yellow-400 border-yellow-400/30',
  3: 'text-white/60 border-white/10',
};

export function DispatchScreen() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ type: 'disturbance', description: '', location: '', priority: 2 });
  const [submitting, setSubmitting] = useState(false);
  const permissions = usePoliceStore((s) => s.permissions);
  const canManage = permissions.includes('manage_dispatch');
  const queryClient = useQueryClient();

  const { data: dispatches, isLoading } = useQuery({
    queryKey: ['police', 'dispatch'],
    queryFn: () => policeService.listDispatches(),
    refetchInterval: 10000,
  });

  const { data: officers } = useQuery({
    queryKey: ['police', 'officers'],
    queryFn: () => policeService.listOfficers(),
    enabled: canManage,
  });

  const handleCreate = async () => {
    if (!form.description || !form.location) return;
    setSubmitting(true);
    try {
      await policeService.createDispatch(form);
      setShowCreate(false);
      setForm({ type: 'disturbance', description: '', location: '', priority: 2 });
      queryClient.invalidateQueries({ queryKey: ['police', 'dispatch'] });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssign = async (dispatchId: string) => {
    const onDuty = officers?.filter((o) => o.status === 'on_duty' || o.status === 'en_route').slice(0, 2);
    if (!onDuty?.length) return;
    await policeService.assignDispatch(dispatchId, onDuty.map((o) => o.id));
    queryClient.invalidateQueries({ queryKey: ['police', 'dispatch'] });
  };

  const handleStatus = async (id: string, status: string) => {
    await policeService.updateDispatchStatus(id, status);
    queryClient.invalidateQueries({ queryKey: ['police', 'dispatch'] });
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] text-white/40 uppercase tracking-widest">Dispatch</p>
        {canManage && <Button label={showCreate ? 'Cancel' : '+ New'} onClick={() => setShowCreate(!showCreate)} size="sm" />}
      </div>

      {showCreate && (
        <GlassCard className="mb-4 space-y-2">
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
            <option value="disturbance">Disturbance</option>
            <option value="traffic">Traffic</option>
            <option value="medical">Medical</option>
            <option value="fire">Fire Assist</option>
            <option value="other">Other</option>
          </select>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={2} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm resize-none" />
          <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Location" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
          <Button label="Create Dispatch" onClick={handleCreate} loading={submitting} size="sm" />
        </GlassCard>
      )}

      <div className="space-y-2">
        {dispatches?.map((d, i) => (
          <motion.div key={d.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
            <GlassCard className={`border ${PRIORITY_COLORS[d.priority] ?? ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{d.dispatchNumber}</p>
                  <p className="text-white/50 text-xs capitalize">{d.type}</p>
                  <p className="text-white/60 text-xs mt-1">{d.description}</p>
                  <p className="text-white/30 text-[10px] mt-1">📍 {d.location}</p>
                </div>
                <span className="text-[9px] uppercase text-white/40">{d.status}</span>
              </div>
              {canManage && (
                <div className="flex gap-1 mt-2 pt-2 border-t border-white/5">
                  {d.status === 'pending' && (
                    <button type="button" onClick={() => handleAssign(d.id)} className="flex-1 py-1 rounded-lg bg-banana-gold/20 text-banana-gold text-[10px]">Assign</button>
                  )}
                  {d.status === 'assigned' && (
                    <button type="button" onClick={() => handleStatus(d.id, 'en_route')} className="flex-1 py-1 rounded-lg bg-yellow-500/20 text-yellow-400 text-[10px]">En Route</button>
                  )}
                  {d.status === 'en_route' && (
                    <button type="button" onClick={() => handleStatus(d.id, 'on_scene')} className="flex-1 py-1 rounded-lg bg-red-500/20 text-red-400 text-[10px]">On Scene</button>
                  )}
                  {(d.status === 'on_scene' || d.status === 'en_route') && (
                    <button type="button" onClick={() => handleStatus(d.id, 'resolved')} className="flex-1 py-1 rounded-lg bg-green-500/20 text-green-400 text-[10px]">Resolve</button>
                  )}
                </div>
              )}
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
