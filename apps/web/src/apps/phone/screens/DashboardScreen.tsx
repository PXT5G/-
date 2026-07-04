'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { phoneService } from '../services/phoneService';
import { usePhoneStore } from '../store/phoneStore';
import { GlassCard, LoadingSkeleton } from '@/components/shared';
import { EmptyState } from '@/components/shared/EmptyState';
import { useHaptic } from '@/hooks/useSound';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export function DashboardScreen() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['phone', 'dashboard'],
    queryFn: () => phoneService.getDashboard(),
  });
  const setTab = usePhoneStore((s) => s.setTab);
  const setActiveCall = usePhoneStore((s) => s.setActiveCall);
  const { tap } = useHaptic();
  const reducedMotion = useReducedMotion();
  const [emergencyError, setEmergencyError] = useState<string | null>(null);

  if (isLoading) return <LoadingSkeleton rows={3} height="h-20" />;
  if (error || !data) {
    return <EmptyState icon="📞" title="Dashboard Unavailable" description="Unable to load phone dashboard. Check your connection." />;
  }

  const shortcuts = [
    { tab: 'dialpad' as const, label: 'Keypad', sub: 'Dial a number' },
    { tab: 'favorites' as const, label: 'Favorites', sub: `${data.favoritesCount} contacts` },
    { tab: 'recents' as const, label: 'Recents', sub: `${data.recentCount} calls` },
    { tab: 'voicemail' as const, label: 'Voicemail', sub: `${data.unreadVoicemail} unread` },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 gap-4">
      <GlassCard accent className="text-center">
        <p className="text-banana-gold text-[10px] tracking-widest uppercase mb-1">Your Number</p>
        <p className="text-white text-xl font-semibold">{data.phoneNumber ?? 'No SIM'}</p>
        <p className="text-white/40 text-xs mt-1">{data.simActive ? 'Banana Mobile • Active' : 'SIM inactive'}</p>
      </GlassCard>

      {data.missedCalls > 0 && (
        <motion.button
          type="button"
          initial={reducedMotion ? false : { opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => { tap(); setTab('recents'); }}
          className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-400/30 rounded-2xl min-h-[44px]"
          aria-label={`${data.missedCalls} missed calls, view recents`}
        >
          <span className="text-xl" aria-hidden="true">📵</span>
          <div className="text-left">
            <p className="text-white text-sm font-medium">{data.missedCalls} missed call{data.missedCalls > 1 ? 's' : ''}</p>
            <p className="text-white/40 text-xs">Tap to view</p>
          </div>
        </motion.button>
      )}

      <div className="grid grid-cols-2 gap-3">
        {shortcuts.map((s) => (
          <GlassCard key={s.tab} onClick={() => { tap(); setTab(s.tab); }}>
            <p className="text-white text-sm font-medium">{s.label}</p>
            <p className="text-white/40 text-[10px] mt-1">{s.sub}</p>
          </GlassCard>
        ))}
      </div>

      {emergencyError && (
        <p className="text-red-400 text-xs text-center px-2" role="alert">{emergencyError}</p>
      )}

      <GlassCard
        onClick={async () => {
          tap();
          setEmergencyError(null);
          try {
            const result = await phoneService.emergencyCall();
            if (result?.activeCall) setActiveCall(result.activeCall);
            setTab('active');
          } catch (err) {
            setEmergencyError(err instanceof Error ? err.message : 'Emergency call failed');
          }
        }}
        className="border-red-400/30 bg-red-500/10"
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl" aria-hidden="true">🆘</span>
          <div>
            <p className="text-red-300 font-semibold">Emergency Call</p>
            <p className="text-white/40 text-xs">911 • Banana Emergency Services</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
