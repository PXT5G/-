'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { identityService } from '../services/identityService';
import { Button } from '@/components/shared/Button';
import { useHaptic } from '@/hooks/useSound';

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5">
      <div className="flex-1 pr-3">
        <p className="text-sm text-white">{label}</p>
        <p className="text-[10px] text-white/40">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full transition-colors ${checked ? 'bg-banana-gold' : 'bg-white/20'}`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}

export function SecurityScreen() {
  const { tap, success } = useHaptic();
  const queryClient = useQueryClient();
  const [pin, setPin] = useState('');
  const [showPinForm, setShowPinForm] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['identity', 'settings'],
    queryFn: () => identityService.getSettings(),
  });

  const { data: sessions } = useQuery({
    queryKey: ['identity', 'sessions'],
    queryFn: () => identityService.getSessions(),
  });

  const { data: devices } = useQuery({
    queryKey: ['identity', 'devices'],
    queryFn: () => identityService.getDevices(),
  });

  const { data: securityLogs } = useQuery({
    queryKey: ['identity', 'security-logs'],
    queryFn: () => identityService.getSecurityLogs(),
  });

  const updateSettings = useMutation({
    mutationFn: (data: Parameters<typeof identityService.updateSettings>[0]) =>
      identityService.updateSettings(data),
    onSuccess: () => {
      success();
      queryClient.invalidateQueries({ queryKey: ['identity', 'settings'] });
    },
  });

  const revokeSession = useMutation({
    mutationFn: (id: string) => identityService.revokeSession(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['identity', 'sessions'] }),
  });

  const removeDevice = useMutation({
    mutationFn: (id: string) => identityService.removeDevice(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['identity', 'devices'] }),
  });

  const handleSetPin = async () => {
    if (!/^\d{4,6}$/.test(pin)) return;
    tap();
    await identityService.setPin(pin);
    setPin('');
    setShowPinForm(false);
    success();
    queryClient.invalidateQueries({ queryKey: ['identity', 'settings'] });
  };

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <h1 className="text-white font-bold text-lg mb-4">Security</h1>

      <section className="mb-5">
        <p className="text-[10px] text-banana-gold uppercase mb-2">Authentication</p>
        <div className="bg-white/5 rounded-xl px-3 border border-white/10">
          <Toggle
            label="Fingerprint Login"
            description="Use fingerprint to unlock identity"
            checked={settings.fingerprintEnabled}
            onChange={(v) => { tap(); updateSettings.mutate({ fingerprintEnabled: v }); }}
          />
          <Toggle
            label="Face Unlock"
            description="Use face recognition to unlock"
            checked={settings.faceUnlockEnabled}
            onChange={(v) => { tap(); updateSettings.mutate({ faceUnlockEnabled: v }); }}
          />
          <Toggle
            label="Two-Factor Authentication"
            description="Extra security for verification"
            checked={settings.twoFactorEnabled}
            onChange={(v) => { tap(); updateSettings.mutate({ twoFactorEnabled: v }); }}
          />
        </div>

        <div className="mt-3 bg-white/5 rounded-xl p-3 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">PIN Lock</p>
              <p className="text-[10px] text-white/40">
                {settings.pinEnabled ? 'PIN is enabled' : 'Set a 4-6 digit PIN'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => { tap(); setShowPinForm(!showPinForm); }}
              className="text-banana-gold text-xs"
            >
              {settings.pinEnabled ? 'Change' : 'Set PIN'}
            </button>
          </div>
          {showPinForm && (
            <div className="mt-3 flex gap-2">
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="4-6 digit PIN"
                className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              />
              <Button label="Save" onClick={handleSetPin} size="sm" />
            </div>
          )}
        </div>
      </section>

      <section className="mb-5">
        <p className="text-[10px] text-banana-gold uppercase mb-2">Notifications</p>
        <div className="bg-white/5 rounded-xl px-3 border border-white/10">
          <Toggle
            label="Verification Alerts"
            description="When your ID is verified"
            checked={settings.notifyVerification}
            onChange={(v) => updateSettings.mutate({ notifyVerification: v })}
          />
          <Toggle
            label="Expiry Alerts"
            description="Before identity expires"
            checked={settings.notifyExpiry}
            onChange={(v) => updateSettings.mutate({ notifyExpiry: v })}
          />
          <Toggle
            label="Security Alerts"
            description="Suspicious activity"
            checked={settings.notifySecurity}
            onChange={(v) => updateSettings.mutate({ notifySecurity: v })}
          />
        </div>
      </section>

      <section className="mb-5">
        <p className="text-[10px] text-banana-gold uppercase mb-2">Active Sessions</p>
        <div className="space-y-2">
          {sessions?.map((s) => (
            <div key={s.id} className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-sm text-white">{s.deviceName}</p>
                <p className="text-[10px] text-white/40">
                  {s.current ? 'Current session' : new Date(s.lastActiveAt).toLocaleString()}
                </p>
              </div>
              {!s.current && (
                <button
                  type="button"
                  onClick={() => { tap(); revokeSession.mutate(s.id); }}
                  className="text-red-400 text-xs"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mb-5">
        <p className="text-[10px] text-banana-gold uppercase mb-2">Trusted Devices</p>
        <div className="space-y-2">
          {devices?.length === 0 && (
            <p className="text-white/40 text-xs text-center py-4">No trusted devices</p>
          )}
          {devices?.map((d) => (
            <div key={d.id} className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-sm text-white">{d.deviceName}</p>
                <p className="text-[10px] text-white/40">{d.deviceType} · {new Date(d.lastUsedAt).toLocaleDateString()}</p>
              </div>
              <button
                type="button"
                onClick={() => { tap(); removeDevice.mutate(d.id); }}
                className="text-red-400 text-xs"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <p className="text-[10px] text-banana-gold uppercase mb-2">Security Logs</p>
        <div className="space-y-1">
          {securityLogs?.slice(0, 10).map((log, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-white/5">
              <div>
                <p className="text-xs text-white capitalize">{log.action}</p>
                <p className="text-[10px] text-white/40">{log.detail}</p>
              </div>
              <p className="text-[10px] text-white/30">{new Date(log.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
