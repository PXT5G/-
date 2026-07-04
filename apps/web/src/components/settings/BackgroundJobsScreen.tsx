'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useJobs } from '@/hooks/useSystemServices';
import { systemService } from '@/services/systemService';
import { Button } from '@/components/shared';
import { useHaptic } from '@/hooks/useSound';

const STATUS_COLORS: Record<string, string> = {
  queued: '#6C63FF',
  running: '#D4AF37',
  retry: '#FFB347',
  completed: '#4ECDC4',
  failed: '#FF6B6B',
  cancelled: '#888888',
};

export function BackgroundJobsScreen({ onBack }: { onBack: () => void }) {
  const { tap } = useHaptic();
  const queryClient = useQueryClient();
  const { data: jobs, isLoading } = useJobs();

  const cancelMutation = useMutation({
    mutationFn: (id: string) => systemService.cancelJob(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['system', 'jobs'] }),
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-black">
      <div className="p-4 pb-8">
        <button type="button" onClick={() => { tap(); onBack(); }} className="text-banana-gold text-sm mb-4">‹ Settings</button>
        <h1 className="text-2xl font-bold text-white mb-1">Background Jobs</h1>
        <p className="text-xs text-white/50 mb-6">System scheduler tasks</p>

        {(jobs ?? []).length === 0 ? (
          <p className="text-sm text-white/40 text-center py-8">No background jobs</p>
        ) : (
          (jobs ?? []).map((job, i) => (
            <motion.div
              key={job.id}
              className="p-3 rounded-xl bg-white/5 border border-white/10 mb-2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-white">{job.name}</p>
                <span
                  className="text-xs px-2 py-0.5 rounded-full capitalize"
                  style={{ backgroundColor: `${STATUS_COLORS[job.status] ?? '#888'}22`, color: STATUS_COLORS[job.status] }}
                >
                  {job.status}
                </span>
              </div>
              <p className="text-xs text-white/40 mb-2">{job.type} · {job.priority}</p>
              {job.status === 'running' && (
                <div className="h-1.5 rounded-full bg-white/5 mb-2">
                  <div className="h-full rounded-full bg-banana-gold" style={{ width: `${job.progress}%` }} />
                </div>
              )}
              {job.error && <p className="text-xs text-red-400 mb-2">{job.error}</p>}
              {['queued', 'running', 'retry'].includes(job.status) && (
                <Button label="Cancel" variant="ghost" onClick={() => cancelMutation.mutate(job.id)} fullWidth />
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
