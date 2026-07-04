'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { policeService } from '../services/policeService';
import { GlassCard } from '../components/GlassCard';
import { Button } from '@/components/shared/Button';
import { usePoliceStore } from '../store/policeStore';

const STATUS_COLORS: Record<string, string> = {
  submitted: 'text-yellow-400',
  under_review: 'text-blue-400',
  approved: 'text-green-400',
  rejected: 'text-red-400',
};

export function ReportsScreen() {
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage] = useState(0);
  const [form, setForm] = useState({ title: '', description: '', location: '', type: 'incident' });
  const [submitting, setSubmitting] = useState(false);
  const permissions = usePoliceStore((s) => s.permissions);
  const queryClient = useQueryClient();
  const canApprove = permissions.includes('approve_report');

  const { data: reports, isLoading } = useQuery({
    queryKey: ['police', 'reports', page],
    queryFn: () => policeService.listReports(page),
  });

  const handleCreate = async () => {
    if (!form.title || !form.description || !form.location) return;
    setSubmitting(true);
    try {
      await policeService.createReport(form);
      setShowCreate(false);
      setForm({ title: '', description: '', location: '', type: 'incident' });
      queryClient.invalidateQueries({ queryKey: ['police', 'reports'] });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (id: string, approve: boolean) => {
    await policeService.reviewReport(id, approve);
    queryClient.invalidateQueries({ queryKey: ['police', 'reports'] });
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] text-white/40 uppercase tracking-widest">Reports</p>
        <Button label={showCreate ? 'Cancel' : '+ New'} onClick={() => setShowCreate(!showCreate)} size="sm" />
      </div>

      {showCreate && (
        <GlassCard className="mb-4 space-y-2">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={3} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm resize-none" />
          <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Location" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
          <Button label="Submit Report" onClick={handleCreate} loading={submitting} size="sm" />
        </GlassCard>
      )}

      <div className="space-y-2">
        {reports?.map((r, i) => (
          <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <GlassCard>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{r.title}</p>
                  <p className="text-white/40 text-[10px]">{r.reportNumber} · {r.type}</p>
                  <p className="text-white/50 text-xs mt-1 line-clamp-2">{r.description}</p>
                  <p className="text-white/30 text-[10px] mt-1">📍 {r.location}</p>
                </div>
                <span className={`text-[9px] uppercase font-medium ${STATUS_COLORS[r.status] ?? 'text-white/40'}`}>{r.status}</span>
              </div>
              {canApprove && (r.status === 'submitted' || r.status === 'under_review') && (
                <div className="flex gap-2 mt-3 pt-2 border-t border-white/5">
                  <button type="button" onClick={() => handleReview(r.id, true)} className="flex-1 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-xs">Approve</button>
                  <button type="button" onClick={() => handleReview(r.id, false)} className="flex-1 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs">Reject</button>
                </div>
              )}
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-center gap-3 mt-4">
        <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="text-banana-gold text-xs disabled:opacity-30">← Prev</button>
        <span className="text-white/30 text-xs">Page {page + 1}</span>
        <button type="button" disabled={(reports?.length ?? 0) < 20} onClick={() => setPage((p) => p + 1)} className="text-banana-gold text-xs disabled:opacity-30">Next →</button>
      </div>
    </div>
  );
}
