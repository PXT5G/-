'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { formatBytes } from '@/services/deviceStorageService';
import { deviceStorageService } from '@/services/deviceStorageService';
import { useTaskManager } from '@/hooks/useDeviceHardware';
import { Button } from '@/components/shared';
import { useHaptic } from '@/hooks/useSound';

const STATE_COLORS: Record<string, string> = {
  active: '#D4AF37',
  background: '#6C63FF',
  frozen: '#4ECDC4',
  cached: '#888888',
  stopped: '#444444',
};

export function TaskManagerScreen({ onBack }: { onBack: () => void }) {
  const { tap } = useHaptic();
  const queryClient = useQueryClient();
  const { data, isLoading } = useTaskManager();

  const forceStopMutation = useMutation({
    mutationFn: (bundleId: string) => deviceStorageService.forceStopApp(bundleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device'] });
    },
  });

  if (isLoading || !data) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-2 border-gulf-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tasks = data.tasks ?? data.apps ?? [];
  const pressurePct = Math.round(data.pressure * 100);

  return (
    <div className="h-full overflow-y-auto bg-black">
      <div className="p-4 pb-8">
        <button type="button" onClick={() => { tap(); onBack(); }} className="text-gulf-gold text-sm mb-4">
          ‹ Settings
        </button>
        <h1 className="text-2xl font-bold text-white mb-1">Task Manager</h1>
        <p className="text-xs text-white/50 mb-6">Manage running applications and memory</p>

        <section className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-white">Memory Usage</span>
            <span className={`text-sm font-medium ${data.memoryPressure ? 'text-red-400' : 'text-gulf-gold'}`}>
              {pressurePct}%
            </span>
          </div>
          <div className="h-3 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: data.memoryPressure ? '#FF6B6B' : '#6C63FF' }}
              initial={{ width: 0 }}
              animate={{ width: `${pressurePct}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
          <p className="text-xs text-white/40 mt-2">
            {formatBytes(data.used)} used · {formatBytes(data.free)} free of {formatBytes(data.total)}
          </p>
          {data.memoryPressure && (
            <p className="text-xs text-red-400 mt-2">Memory pressure — background apps may be frozen</p>
          )}
        </section>

        <section>
          <h2 className="text-xs font-semibold text-white/40 uppercase mb-3">
            Running Apps ({tasks.length})
          </h2>
          {tasks.length === 0 ? (
            <p className="text-sm text-white/40 text-center py-8">No apps using memory</p>
          ) : (
            tasks.map((task, i) => (
              <motion.div
                key={task.bundleId}
                className="p-3 rounded-xl bg-white/5 border border-white/10 mb-2"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-white">{task.appName}</p>
                    <p className="text-xs text-white/40">{task.bundleId}</p>
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full capitalize"
                    style={{
                      backgroundColor: `${STATE_COLORS[task.state] ?? '#888'}22`,
                      color: STATE_COLORS[task.state] ?? '#888',
                    }}
                  >
                    {task.state}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-white/50 mb-3">
                  <span>Current: {formatBytes(task.currentRam)}</span>
                  <span>Active: {formatBytes(task.activeRam)}</span>
                  <span>Background: {formatBytes(task.backgroundRam)}</span>
                  <span>Cached: {formatBytes(task.cachedRam)}</span>
                </div>
                <Button
                  label="Force Stop"
                  variant="ghost"
                  onClick={() => forceStopMutation.mutate(task.bundleId)}
                  loading={forceStopMutation.isPending}
                  fullWidth
                />
              </motion.div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
