'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useIdentityStore } from '../store/identityStore';
import { identityService } from '../services/identityService';
import { IdentityCard } from '../components/IdentityCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { useHaptic } from '@/hooks/useSound';

export function HomeScreen() {
  const { identity, cardFlipped, setCardFlipped } = useIdentityStore();
  const { tap } = useHaptic();

  const { data: stats } = useQuery({
    queryKey: ['identity', 'stats'],
    queryFn: () => identityService.getStats(),
    enabled: !!identity,
  });

  if (!identity) {
    return <SkeletonCard />;
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring' as const, stiffness: 300, damping: 25 }}
      >
        <div className="text-center mb-4">
          <h1 className="text-white font-bold text-lg">Your Identity</h1>
          <p className="text-white/40 text-xs">Official BananaOS Digital ID</p>
        </div>

        <IdentityCard
          identity={identity}
          flipped={cardFlipped}
          onFlip={() => { tap(); setCardFlipped(!cardFlipped); }}
        />

        {stats && (
          <div className="grid grid-cols-3 gap-2 mt-5">
            {[
              { label: 'Verifications', value: stats.verifications },
              { label: 'Days Left', value: stats.daysUntilExpiry },
              { label: 'Badges', value: stats.badges },
            ].map((s) => (
              <div key={s.label} className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                <p className="text-banana-gold font-bold text-lg">{s.value}</p>
                <p className="text-[10px] text-white/40">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 p-3 bg-banana-gold/10 border border-banana-gold/20 rounded-xl">
          <p className="text-banana-gold text-xs font-semibold">✓ Verified by BananaOS</p>
          <p className="text-white/50 text-[10px] mt-0.5">
            This is your official digital identity. Other apps use it for authentication and verification.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
