'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { controlPanelService } from '../services/controlPanelService';
import { AdminCard, StatTile, BarChart } from '../components/AdminCard';

export function DashboardScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ['control-panel', 'dashboard'],
    queryFn: () => controlPanelService.getDashboard(),
    refetchInterval: 15000,
  });

  if (isLoading || !data) {
    return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" /></div>;
  }

  const healthColor = data.systemHealth.status === 'healthy' ? 'text-green-400' : 'text-yellow-400';

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <AdminCard accent className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-banana-gold uppercase tracking-widest">System Control</p>
              <p className={`text-lg font-bold capitalize ${healthColor}`}>{data.systemHealth.status}</p>
              <p className="text-white/40 text-[10px]">Uptime {Math.floor(data.systemHealth.uptime / 60)}m · DB {data.systemHealth.database.connected ? 'connected' : 'offline'}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-banana-gold">{data.connectedSockets}</p>
              <p className="text-[9px] text-white/40">live sockets</p>
            </div>
          </div>
        </AdminCard>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <StatTile label="Users" value={data.activeUsers} icon="👤" />
          <StatTile label="Sessions" value={data.activeSessions} icon="🔑" />
          <StatTile label="Platform Sessions" value={data.platformSessions} icon="🌐" />
          <StatTile label="Permissions" value={data.corePermissions} icon="🔐" />
        </div>

        <AdminCard className="mb-4">
          <p className="text-[10px] text-white/40 uppercase tracking-widest mb-3">Event Traffic</p>
          <div className="grid grid-cols-3 gap-2 mb-3 text-center">
            <div><p className="text-white font-bold">{data.eventTraffic.totalRecorded}</p><p className="text-[8px] text-white/40">Total</p></div>
            <div><p className="text-white font-bold">{data.eventTraffic.bufferSize}</p><p className="text-[8px] text-white/40">Buffered</p></div>
            <div><p className="text-white font-bold">{data.eventTraffic.connectedUsers}</p><p className="text-[8px] text-white/40">Connected</p></div>
          </div>
          <BarChart data={data.eventTraffic.byApp.map((a) => ({ label: a.app, value: a.count }))} />
        </AdminCard>

        <AdminCard>
          <p className="text-[10px] text-white/40 uppercase tracking-widest mb-3">Audit by App</p>
          <BarChart data={data.auditByApp.map((a) => ({ label: a.appId.replace('com.bananaos.', ''), value: a.count }))} />
        </AdminCard>
      </motion.div>
    </div>
  );
}
