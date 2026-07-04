'use client';

import { useSettings, useUpdateSettings } from '@/hooks/useSettings';
import { useTranslation } from '@/stores/i18nStore';
import { SettingsSection } from './SettingsSection';
import { SettingsRow } from './SettingsRow';
import { Toggle } from '@/components/ui/Toggle';
import { Slider } from '@/components/ui/Slider';
import { useHaptic } from '@/hooks/useSound';

export function SoundSettingsScreen({ onBack }: { onBack: () => void }) {
  const { tap } = useHaptic();
  const { t } = useTranslation();
  const settings = useSettings();
  const update = useUpdateSettings();

  const patch = (partial: Parameters<typeof update.mutate>[0]) => {
    tap();
    update.mutate(partial);
  };

  return (
    <div className="h-full overflow-y-auto bg-black">
      <div className="p-4 pb-8">
        <button type="button" onClick={() => { tap(); onBack(); }} className="text-gulf-gold text-sm mb-4">‹ {t('common.settings')}</button>
        <h1 className="text-2xl font-bold text-white mb-6">{t('settings.soundHaptics')}</h1>

        <SettingsSection title={t('settings.sound')}>
          <SettingsRow label={t('settings.sounds')}>
            <Toggle enabled={settings.soundsEnabled} onChange={(v) => patch({ soundsEnabled: v })} label={t('settings.sounds')} />
          </SettingsRow>
          <SettingsRow label={t('settings.mediaVolume')}>
            <Slider value={settings.mediaVolume} onChange={(v) => patch({ mediaVolume: v, volume: v })} label={t('settings.mediaVolume')} className="w-32" />
          </SettingsRow>
          <SettingsRow label={t('settings.callVolume')}>
            <Slider value={settings.callVolume} onChange={(v) => patch({ callVolume: v })} label={t('settings.callVolume')} className="w-32" />
          </SettingsRow>
          <SettingsRow label={t('settings.notificationVolume')}>
            <Slider value={settings.notificationVolume} onChange={(v) => patch({ notificationVolume: v })} label={t('settings.notificationVolume')} className="w-32" />
          </SettingsRow>
          <SettingsRow label={t('settings.alarmVolume')}>
            <Slider value={settings.alarmVolume} onChange={(v) => patch({ alarmVolume: v })} label={t('settings.alarmVolume')} className="w-32" />
          </SettingsRow>
          <SettingsRow label={t('settings.ringtone')} value={settings.ringtone} />
          <SettingsRow label={t('settings.notificationSound')} value={settings.notificationSound} />
          <SettingsRow label={t('settings.keyboardSound')}>
            <Toggle enabled={settings.keyboardSound} onChange={(v) => patch({ keyboardSound: v })} label={t('settings.keyboardSound')} />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title={t('settings.haptics')}>
          <SettingsRow label={t('settings.haptics')}>
            <Toggle enabled={settings.hapticsEnabled} onChange={(v) => patch({ hapticsEnabled: v })} label={t('settings.haptics')} />
          </SettingsRow>
          <SettingsRow label={t('settings.vibration')}>
            <Toggle enabled={settings.vibrationEnabled} onChange={(v) => patch({ vibrationEnabled: v })} label={t('settings.vibration')} />
          </SettingsRow>
        </SettingsSection>
      </div>
    </div>
  );
}
