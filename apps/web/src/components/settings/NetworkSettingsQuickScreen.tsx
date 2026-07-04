'use client';

import { useSettings, useUpdateSettings } from '@/hooks/useSettings';
import { useTranslation } from '@/stores/i18nStore';
import { SettingsSection } from './SettingsSection';
import { SettingsRow } from './SettingsRow';
import { Toggle } from '@/components/ui/Toggle';
import { useHaptic } from '@/hooks/useSound';

export function NetworkSettingsQuickScreen({ onBack, onAdvanced }: { onBack: () => void; onAdvanced: () => void }) {
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
        <button type="button" onClick={() => { tap(); onBack(); }} className="text-banana-gold text-sm mb-4">‹ {t('common.settings')}</button>
        <h1 className="text-2xl font-bold text-white mb-6">{t('settings.network')}</h1>

        <SettingsSection title={t('settings.network')}>
          <SettingsRow label={t('settings.wifi')}>
            <Toggle enabled={settings.wifiEnabled} onChange={(v) => patch({ wifiEnabled: v })} label={t('settings.wifi')} />
          </SettingsRow>
          <SettingsRow label={t('settings.mobileData')}>
            <Toggle enabled={settings.mobileDataEnabled} onChange={(v) => patch({ mobileDataEnabled: v })} label={t('settings.mobileData')} />
          </SettingsRow>
          <SettingsRow label={t('settings.bluetooth')}>
            <Toggle enabled={settings.bluetoothEnabled} onChange={(v) => patch({ bluetoothEnabled: v })} label={t('settings.bluetooth')} />
          </SettingsRow>
          <SettingsRow label={t('settings.airplaneMode')}>
            <Toggle enabled={settings.airplaneMode} onChange={(v) => patch({ airplaneMode: v })} label={t('settings.airplaneMode')} />
          </SettingsRow>
          <SettingsRow label={t('settings.hotspot')}>
            <Toggle enabled={settings.hotspotEnabled} onChange={(v) => patch({ hotspotEnabled: v })} label={t('settings.hotspot')} />
          </SettingsRow>
          <SettingsRow label={t('settings.vpn')} chevron onClick={onAdvanced} />
        </SettingsSection>
      </div>
    </div>
  );
}
