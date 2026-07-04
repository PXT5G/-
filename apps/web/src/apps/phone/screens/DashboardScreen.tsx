'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { phoneService } from '../services/phoneService';
import { usePhoneStore } from '../store/phoneStore';
import { GlassCard } from '../components/GlassCard';
import { useHaptic } from '@/hooks/useSound';

export function DashboardScreen() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['phone', 'dashboard'],
    queryFn: () => phoneService.getDashboard(),
  });
  const setTab = usePhoneStore((s) => s.setTab);
  const { tap } = useHaptic();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4 animate-pulse">
        {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-white/5 rounded-2xl" />)}
      </div>
    );
  }

  if (error || !data) {
    return <div className="p-6 text-center text-white/50 text-sm">Unable to load phone dashboard</div>;
  }

  const shortcuts = [
    { tab: 'dialpad' as const, icon: '⌨️', label: 'Keypad', sub: 'Dial a number' },
    { tab: 'favorites' as const, icon: '⭐', label: 'Favorites', sub: `${data.favoritesCount} contacts` },
    { tab: 'recents' as const, icon: '🕐', label: 'Recents', sub: `${data.recentCount} calls` },
    { tab: 'voicemail' as const, icon: '📬', label: 'Voicemail', sub: `${data.unreadVoicemail} unread` },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 gap-4">
      <GlassCard accent className="text-center">
        <p className="text-green-400 text-[10px] tracking-widest uppercase mb-1">Your Number</p>
        <p className="text-white text-xl font-semibold">{data.phoneNumber ?? 'No SIM'}</p>
        <p className="text-white/40 text-xs mt-1">{data.simActive ? 'Banana Mobile • Active' : 'SIM inactive'}</p>
      </GlassCard>

      {data.missedCalls > 0 && (
        <motion.button
          type="button"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => { tap(); setTab('recents'); }}
          className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-400/30 rounded-2xl"
        >
          <span className="text-xl">📵</span>
          <div className="text-left">
            <p className="text-white text-sm font-medium">{data.missedCalls} missed call{data.missedCalls > 1 ? 's' : ''}</p>
            <p className="text-white/40 text-xs">Tap to view</p>
          </div>
        </motion.button>
      )}

      <div className="grid grid-cols-2 gap-3">
        {shortcuts.map((s) => (
          <GlassCard key={s.tab} onClick={() => { tap(); setTab(s.tab); }}>
            <span className="text-2xl">{s.icon}</span>
            <p className="text-white text-sm font-medium mt-2">{s.label}</p>
            <p className="text-white/40 text-[10px]">{s.sub}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard
        onClick={async () => {
          tap();
          await phoneService.emergencyCall();
          setTab('active');
        }}
        className="border-red-400/30 bg-red-500/10"
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">🆘</span>
          <div>
            <p className="text-red-300 font-semibold">Emergency Call</p>
            <p className="text-white/40 text-xs">911 • Banana Emergency Services</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
