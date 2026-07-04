'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { simService } from '../services/simService';
import { Button } from '@/components/shared/Button';
import { useHaptic } from '@/hooks/useSound';

export function SIMManagementScreen() {
  const { tap, success } = useHaptic();
  const queryClient = useQueryClient();

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['sim', 'profiles'],
    queryFn: () => simService.getProfiles(),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['sim'] });

  const activate = useMutation({ mutationFn: (id: string) => simService.activate(id), onSuccess: () => { success(); invalidate(); } });
  const deactivate = useMutation({ mutationFn: (id: string) => simService.deactivate(id), onSuccess: () => { success(); invalidate(); } });
  const replace = useMutation({ mutationFn: (id: string) => simService.replace(id, 'User requested replacement'), onSuccess: () => { success(); invalidate(); } });

  if (isLoading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <h1 className="text-white font-bold text-lg mb-4">SIM Management</h1>

      {profiles?.map((sim, i) => (
        <motion.div key={sim.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4 mb-3">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-white font-medium">{sim.phoneNumber}</p>
              <p className="text-[10px] text-white/40 capitalize">{sim.slot} · {sim.simType} · {sim.subscriptionPlan}</p>
            </div>
            <span className={`text-[9px] px-2 py-0.5 rounded-full capitalize ${sim.status === 'active' ? 'bg-green-500/20 text-green-400' : sim.status === 'suspended' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{sim.status}</span>
          </div>
          <p className="text-[10px] text-white/30 font-mono mb-3">{sim.simSerial}</p>
          <div className="flex flex-wrap gap-2">
            {sim.status !== 'active' && <Button label="Activate" size="sm" onClick={() => { tap(); activate.mutate(sim.id); }} />}
            {sim.status === 'active' && <Button label="Deactivate" size="sm" variant="secondary" onClick={() => { tap(); deactivate.mutate(sim.id); }} />}
            <Button label="Replace SIM" size="sm" variant="ghost" onClick={() => { tap(); replace.mutate(sim.id); }} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
