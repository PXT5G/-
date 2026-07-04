'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { policeService } from '../services/policeService';
import { GlassCard } from '../components/GlassCard';

export function AdminScreen() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['police', 'admin', 'stats'],
    queryFn: () => policeService.getAdminStats(),
  });

  const { data: auditLogs, isLoading: auditLoading } = useQuery({
    queryKey: ['police', 'admin', 'audit'],
    queryFn: () => policeService.getAdminAudit(50),
  });

  if (statsLoading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" /></div>;
  }

  const statItems = stats ? [
    { label: 'Officers', value: stats.officers, icon: '👮' },
    { label: 'Cases', value: stats.cases, icon: '📁' },
    { label: 'Dispatches', value: stats.dispatches, icon: '📡' },
    { label: 'Reports', value: stats.reports, icon: '📋' },
    { label: 'Audit Logs', value: stats.auditLogCount, icon: '🔍' },
  ] : [];

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-[10px] text-banana-gold uppercase tracking-widest mb-3">Department Admin</p>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {statItems.map((s) => (
            <GlassCard key={s.label} className="text-center">
              <span>{s.icon}</span>
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-[9px] text-white/40">{s.label}</p>
            </GlassCard>
          ))}
        </div>

        <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Recent Audit Trail</p>
        {auditLoading ? (
          <div className="flex justify-center py-6"><div className="w-6 h-6 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="space-y-2">
            {auditLogs?.map((log) => (
              <GlassCard key={log.id}>
                <p className="text-white text-xs font-medium">{log.action}</p>
                {log.query && <p className="text-banana-gold text-[10px]">Query: {log.query}</p>}
                <p className="text-white/30 text-[9px]">{new Date(log.createdAt).toLocaleString()}</p>
              </GlassCard>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
