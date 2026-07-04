'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { policeService } from '../services/policeService';
import { GlassCard } from '@/components/shared/GlassCard';
import { Button } from '@/components/shared/Button';
import { usePoliceStore } from '../store/policeStore';

export function VehiclesScreen() {
  const [query, setQuery] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [form, setForm] = useState({ plateNumber: '', make: '', model: '', year: 2024, color: '', ownerName: '' });
  const [submitting, setSubmitting] = useState(false);
  const permissions = usePoliceStore((s) => s.permissions);
  const canRegister = permissions.includes('manage_vehicles');
  const queryClient = useQueryClient();

  const { data: vehicles, isLoading, refetch } = useQuery({
    queryKey: ['police', 'vehicles', query],
    queryFn: () => policeService.searchVehicles(query),
    enabled: query.length >= 2,
  });

  const handleSearch = () => {
    if (query.length >= 2) refetch();
  };

  const handleRegister = async () => {
    if (!form.plateNumber || !form.make || !form.model || !form.ownerName) return;
    setSubmitting(true);
    try {
      await policeService.registerVehicle(form);
      setShowRegister(false);
      setForm({ plateNumber: '', make: '', model: '', year: 2024, color: '', ownerName: '' });
      queryClient.invalidateQueries({ queryKey: ['police', 'vehicles'] });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] text-white/40 uppercase tracking-widest">Vehicle Registry</p>
        {canRegister && <Button label={showRegister ? 'Cancel' : '+ Register'} onClick={() => setShowRegister(!showRegister)} size="sm" />}
      </div>

      <div className="flex gap-2 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search plate or owner..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30"
        />
        <Button label="Search" onClick={handleSearch} size="sm" />
      </div>

      {showRegister && (
        <GlassCard className="mb-4 space-y-2">
          <input value={form.plateNumber} onChange={(e) => setForm({ ...form, plateNumber: e.target.value.toUpperCase() })} placeholder="Plate Number" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <input value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} placeholder="Make" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
            <input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Model" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} placeholder="Year" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
            <input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="Color" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
          </div>
          <input value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} placeholder="Owner Name" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
          <Button label="Register Vehicle" onClick={handleRegister} loading={submitting} size="sm" />
        </GlassCard>
      )}

      {isLoading && <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" /></div>}

      <div className="space-y-2">
        {vehicles?.map((v, i) => (
          <motion.div key={v.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <GlassCard>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-banana-gold font-bold text-lg tracking-wider">{v.plateNumber}</p>
                  <p className="text-white text-sm">{v.year} {v.make} {v.model}</p>
                  <p className="text-white/40 text-[10px]">{v.color} · Owner: {v.ownerName}</p>
                </div>
                {v.status && v.status !== 'active' && (
                  <span className="text-[9px] uppercase text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">{v.status}</span>
                )}
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {query.length >= 2 && !isLoading && vehicles?.length === 0 && (
        <p className="text-white/40 text-sm text-center py-8">No vehicles found</p>
      )}
    </div>
  );
}
