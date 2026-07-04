'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { phoneService } from '../services/phoneService';
import { GlassCard, LoadingSkeleton } from '@/components/shared';
import { useHaptic } from '@/hooks/useSound';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Toggle } from '@/components/ui/Toggle';
import { toast } from '@/stores/toastStore';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { queueIfOffline } from '../hooks/usePhoneOffline';
import type { PhoneSettings } from '../types';

const TOGGLES: { key: keyof PhoneSettings; label: string; desc: string }[] = [
  { key: 'callerIdEnabled', label: 'Caller ID', desc: 'Show your number to recipients' },
  { key: 'showMyNumber', label: 'Show My Number', desc: 'Display number on outgoing calls' },
  { key: 'callWaiting', label: 'Call Waiting', desc: 'Alert for second incoming call' },
  { key: 'voicemailEnabled', label: 'Voicemail', desc: 'Enable visual voicemail' },
  { key: 'silenceUnknownCallers', label: 'Silence Unknown', desc: 'Send unknown callers to voicemail' },
  { key: 'autoRejectUnknown', label: 'Auto Reject Unknown', desc: 'Reject calls from unknown numbers' },
  { key: 'callForwardingEnabled', label: 'Call Forwarding', desc: 'Forward calls to another number' },
  { key: 'recordCalls', label: 'Record Calls', desc: 'Auto-record when permitted' },
  { key: 'hapticFeedback', label: 'Haptic Feedback', desc: 'Vibration on key actions' },
  { key: 'dynamicIslandEnabled', label: 'Dynamic Island', desc: 'Live call indicator in status bar' },
];

export function SettingsScreen() {
  const queryClient = useQueryClient();
  const { tap } = useHaptic();
  const online = useOnlineStatus();
  const reducedMotion = useReducedMotion();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['phone', 'settings'],
    queryFn: () => phoneService.getSettings(),
  });

  const mutation = useMutation({
    mutationFn: (patch: Partial<PhoneSettings>) => phoneService.updateSettings(patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phone'] });
      toast('Settings saved', 'success');
    },
    onError: () => toast('Failed to save settings', 'error'),
  });

  const toggle = (key: keyof PhoneSettings) => {
    if (!settings) return;
    tap();
    const patch = { [key]: !settings[key] };
    if (queueIfOffline(online, 'updateSettings', patch)) return;
    mutation.mutate(patch);
  };

  if (isLoading || !settings) {
    return <LoadingSkeleton rows={4} height="h-14" />;
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 gap-3">
      {TOGGLES.map((t, i) => (
        <motion.div
          key={t.key}
          initial={reducedMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reducedMotion ? { duration: 0 } : { delay: i * 0.03 }}
        >
          <GlassCard>
            <div className="w-full flex items-center justify-between gap-3">
              <div>
                <p className="text-white text-sm">{t.label}</p>
                <p className="text-white/40 text-[10px]">{t.desc}</p>
              </div>
              <Toggle enabled={!!settings[t.key]} onChange={() => toggle(t.key)} label={t.label} />
            </div>
          </GlassCard>
        </motion.div>
      ))}

      {settings.callForwardingEnabled && (
        <GlassCard>
          <p className="text-white/60 text-xs mb-2">Forwarding Number</p>
          <input
            type="tel"
            defaultValue={settings.callForwardingNumber ?? ''}
            onBlur={(e) => {
              const patch = { callForwardingNumber: e.target.value };
              if (queueIfOffline(online, 'updateSettings', patch)) return;
              mutation.mutate(patch);
            }}
            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
            placeholder="+1..."
            aria-label="Call forwarding number"
          />
        </GlassCard>
      )}
    </div>
  );
}
