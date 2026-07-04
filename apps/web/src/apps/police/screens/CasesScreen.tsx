'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { policeService } from '../services/policeService';
import { GlassCard } from '../components/GlassCard';
import { Button } from '@/components/shared/Button';
import { usePoliceStore } from '../store/policeStore';

export function CasesScreen() {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', location: '' });
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const permissions = usePoliceStore((s) => s.permissions);
  const canManage = permissions.includes('manage_cases');
  const queryClient = useQueryClient();

  const { data: cases, isLoading } = useQuery({
    queryKey: ['police', 'cases'],
    queryFn: () => policeService.listCases(),
  });

  const { data: evidence } = useQuery({
    queryKey: ['police', 'evidence', selectedCase],
    queryFn: () => policeService.getCaseEvidence(selectedCase!),
    enabled: !!selectedCase,
  });

  const handleCreate = async () => {
    if (!form.title || !form.description) return;
    setSubmitting(true);
    try {
      await policeService.createCase(form);
      setShowCreate(false);
      setForm({ title: '', description: '', location: '' });
      queryClient.invalidateQueries({ queryKey: ['police', 'cases'] });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddEvidence = async () => {
    if (!selectedCase || !evidenceTitle) return;
    await policeService.addEvidence({ title: evidenceTitle, caseId: selectedCase, type: 'document' });
    setEvidenceTitle('');
    queryClient.invalidateQueries({ queryKey: ['police', 'evidence', selectedCase] });
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] text-white/40 uppercase tracking-widest">Cases</p>
        {canManage && <Button label={showCreate ? 'Cancel' : '+ New'} onClick={() => setShowCreate(!showCreate)} size="sm" />}
      </div>

      {showCreate && (
        <GlassCard className="mb-4 space-y-2">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Case title" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={3} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm resize-none" />
          <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Location (optional)" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
          <Button label="Open Case" onClick={handleCreate} loading={submitting} size="sm" />
        </GlassCard>
      )}

      <div className="space-y-2">
        {cases?.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <GlassCard onClick={() => setSelectedCase(selectedCase === c.id ? null : c.id)} className={selectedCase === c.id ? 'border-banana-gold/40' : ''}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{c.title}</p>
                  <p className="text-white/40 text-[10px]">{c.caseNumber}</p>
                  <p className="text-white/50 text-xs mt-1 line-clamp-2">{c.description}</p>
                </div>
                <span className="text-[9px] uppercase text-white/40">{c.status}</span>
              </div>

              {selectedCase === c.id && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <p className="text-[10px] text-white/40 uppercase mb-2">Evidence</p>
                  {evidence?.map((e) => (
                    <div key={e.id} className="flex items-center gap-2 py-1">
                      <span className="text-xs">📎</span>
                      <span className="text-white/70 text-xs">{e.title}</span>
                      <span className="text-white/30 text-[9px]">{e.type}</span>
                    </div>
                  ))}
                  {canManage && (
                    <div className="flex gap-2 mt-2">
                      <input value={evidenceTitle} onChange={(ev) => setEvidenceTitle(ev.target.value)} placeholder="Evidence title" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-xs" />
                      <Button label="Add" onClick={handleAddEvidence} size="sm" />
                    </div>
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
