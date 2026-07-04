'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { simService } from '../services/simService';
import { Button } from '@/components/shared/Button';
import { useHaptic } from '@/hooks/useSound';

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5">
      <span className="text-sm text-white">{label}</span>
      <button type="button" onClick={() => onChange(!checked)} className={`w-11 h-6 rounded-full transition-colors ${checked ? 'bg-banana-gold' : 'bg-white/20'}`}>
        <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

export function SMSSettingsScreen() {
  const { tap, success } = useHaptic();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['sim', 'sms-settings'],
    queryFn: () => simService.getSMSSettings(),
  });

  const update = useMutation({
    mutationFn: (data: Parameters<typeof simService.updateSMSSettings>[0]) => simService.updateSMSSettings(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sim', 'sms-settings'] }),
  });

  const backup = useMutation({
    mutationFn: () => simService.backupSMS(),
    onSuccess: () => { success(); queryClient.invalidateQueries({ queryKey: ['sim', 'sms-settings'] }); },
  });

  if (isLoading || !settings) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <h1 className="text-white font-bold text-lg mb-4">SMS Settings</h1>
      <div className="bg-white/5 rounded-xl px-3 border border-white/10 mb-4">
        <p className="text-[10px] text-white/40 py-2">Message Center: {settings.messageCenter}</p>
        <Toggle label="Delivery Reports" checked={settings.deliveryReports} onChange={(v) => { tap(); update.mutate({ deliveryReports: v }); }} />
        <Toggle label="Read Reports" checked={settings.readReports} onChange={(v) => { tap(); update.mutate({ readReports: v }); }} />
        <Toggle label="Spam Filter" checked={settings.spamFilter} onChange={(v) => { tap(); update.mutate({ spamFilter: v }); }} />
        <Toggle label="Auto Backup" checked={settings.backupEnabled} onChange={(v) => { tap(); update.mutate({ backupEnabled: v }); }} />
      </div>
      <Button label="Backup SMS Now" onClick={() => { tap(); backup.mutate(); }} loading={backup.isPending} fullWidth variant="secondary" />
      {settings.lastBackupAt && <p className="text-[10px] text-white/30 text-center mt-2">Last backup: {new Date(settings.lastBackupAt).toLocaleString()}</p>}
    </div>
  );
}
