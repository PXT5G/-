'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { policeService } from '../services/policeService';
import { usePoliceStore } from '../store/policeStore';
import { GlassCard } from '@/components/shared/GlassCard';

const STATUS_COLORS: Record<string, string> = {
  on_duty: 'text-green-400',
  off_duty: 'text-white/40',
  en_route: 'text-yellow-400',
  on_scene: 'text-red-400',
  break: 'text-blue-400',
};

export function DashboardScreen() {
  const { setDashboard, setTab } = usePoliceStore();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['police', 'dashboard'],
    queryFn: async () => {
      const d = await policeService.getDashboard();
      setDashboard(d);
      return d;
    },
    refetchInterval: 30000,
  });

  if (isLoading || !dashboard) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" /></div>;
  }

  const stats = [
    { label: 'Online', value: dashboard.officersOnline, icon: '👮', tab: 'officers' as const },
    { label: 'Cases', value: dashboard.activeCases, icon: '📁', tab: 'cases' as const },
    { label: 'Dispatch', value: dashboard.activeDispatches, icon: '📡', tab: 'dispatch' as const },
    { label: 'Reports', value: dashboard.pendingReports, icon: '📋', tab: 'reports' as const },
  ];

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        {dashboard.officer && (
          <GlassCard accent className="mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-banana-gold uppercase tracking-widest">Officer Profile</p>
                <p className="text-xl font-bold text-white mt-1">{dashboard.officer.fullName}</p>
                <p className="text-sm text-white/50">Badge {dashboard.officer.badgeNumber} · {dashboard.officer.rank}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium capitalize ${STATUS_COLORS[dashboard.officer.status] ?? 'text-white/60'}`}>
                  {dashboard.officer.status.replace('_', ' ')}
                </p>
                <p className="text-banana-gold text-lg font-bold">{dashboard.officer.points} pts</p>
              </div>
            </div>
          </GlassCard>
        )}

        <div className="grid grid-cols-2 gap-2 mb-4">
          {stats.map((s) => (
            <GlassCard key={s.label} onClick={() => setTab(s.tab)} className="text-center">
              <span className="text-lg">{s.icon}</span>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-[9px] text-white/40 uppercase">{s.label}</p>
            </GlassCard>
          ))}
        </div>

        {dashboard.priorityAlerts.length > 0 && (
          <div>
            <p className="text-[10px] text-red-400 uppercase tracking-widest mb-2">Priority Alerts</p>
            <div className="space-y-2">
              {dashboard.priorityAlerts.map((alert) => (
                <GlassCard key={alert.id} onClick={() => setTab('dispatch')} className="border-red-400/20">
                  <div className="flex items-start gap-2">
                    <span className="text-red-400">🚨</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">{alert.dispatchNumber}</p>
                      <p className="text-white/50 text-xs truncate">{alert.description}</p>
                      <p className="text-white/30 text-[10px] mt-1">{alert.location}</p>
                    </div>
                    <span className="text-[9px] text-red-400 uppercase">{alert.status}</span>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
