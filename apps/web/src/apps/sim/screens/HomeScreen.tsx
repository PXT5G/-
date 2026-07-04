'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { simService } from '../services/simService';
import { useSimStore } from '../store/simStore';
import { SignalAnimation } from '../components/SignalAnimation';

export function HomeScreen() {
  const { setDashboard } = useSimStore();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['sim', 'dashboard'],
    queryFn: async () => {
      const d = await simService.getDashboard();
      setDashboard(d);
      return d;
    },
    refetchInterval: 15000,
  });

  if (isLoading || !dashboard) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" /></div>;
  }

  const statusColor = dashboard.simStatus === 'active' ? 'text-green-400' : dashboard.simStatus === 'suspended' ? 'text-red-400' : 'text-yellow-400';

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <div className="bg-gradient-to-br from-banana-gold/15 via-black/70 to-black/90 backdrop-blur-2xl rounded-2xl border border-banana-gold/20 p-5 mb-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[10px] text-banana-gold uppercase tracking-widest">Your Number</p>
              <p className="text-2xl font-bold text-white mt-1">{dashboard.phoneNumber}</p>
              <p className="text-sm text-white/50">{dashboard.carrier?.name ?? 'Banana Mobile'}</p>
            </div>
            <SignalAnimation bars={dashboard.signalBars} strength={dashboard.signalStrength} />
          </div>
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10">
            <div><p className="text-[9px] text-white/40">SIM Status</p><p className={`text-sm font-medium capitalize ${statusColor}`}>{dashboard.simStatus}</p></div>
            <div><p className="text-[9px] text-white/40">Network</p><p className="text-sm text-white font-medium">{dashboard.networkMode}</p></div>
            <div><p className="text-[9px] text-white/40">Plan</p><p className="text-sm text-banana-gold font-medium capitalize">{dashboard.subscription}</p></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-[9px] text-white/40">Coverage</p>
            <p className="text-white text-sm">{dashboard.coverage}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-[9px] text-white/40">Internet</p>
            <p className={`text-sm ${dashboard.internetStatus ? 'text-green-400' : 'text-red-400'}`}>{dashboard.internetStatus ? 'Connected' : 'Offline'}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-[9px] text-white/40">WiFi Calling</p>
            <p className="text-white text-sm">{dashboard.wifiCalling ? 'On' : 'Off'}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-[9px] text-white/40">Roaming</p>
            <p className="text-white text-sm">{dashboard.roaming ? 'Active' : 'Off'}</p>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-3 border border-white/10">
          <p className="text-[9px] text-white/40 uppercase mb-1">SIM Serial (ICCID)</p>
          <p className="text-xs text-white/70 font-mono">{dashboard.simSerial}</p>
          <p className="text-[9px] text-white/30 mt-1 capitalize">{dashboard.simType} · {dashboard.simType === 'esim' ? 'eSIM' : 'Physical SIM'}</p>
        </div>
      </motion.div>
    </div>
  );
}
