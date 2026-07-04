'use client';

import { useSettings, useUpdateSettings } from '@/hooks/useSettings';
import { useTranslation } from '@/stores/i18nStore';
import { SettingsSection } from './SettingsSection';
import { SettingsRow } from './SettingsRow';
import { Toggle } from '@/components/ui/Toggle';
import { useHaptic } from '@/hooks/useSound';

export function AccessibilitySettingsScreen({ onBack }: { onBack: () => void }) {
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
        <h1 className="text-2xl font-bold text-white mb-6">{t('settings.accessibility')}</h1>

        <SettingsSection title={t('settings.accessibility')}>
          <SettingsRow label={t('settings.voiceOver')}>
            <Toggle enabled={settings.voiceOverEnabled} onChange={(v) => patch({ voiceOverEnabled: v })} label={t('settings.voiceOver')} />
          </SettingsRow>
          <SettingsRow label={t('settings.largeText')}>
            <Toggle enabled={settings.largeText} onChange={(v) => patch({ largeText: v })} label={t('settings.largeText')} />
          </SettingsRow>
          <SettingsRow label={t('settings.boldText')}>
            <Toggle enabled={settings.boldText} onChange={(v) => patch({ boldText: v })} label={t('settings.boldText')} />
          </SettingsRow>
          <SettingsRow label={t('settings.reduceMotion')}>
            <Toggle enabled={settings.reduceMotion} onChange={(v) => patch({ reduceMotion: v })} label={t('settings.reduceMotion')} />
          </SettingsRow>
          <SettingsRow label={t('settings.highContrast')}>
            <Toggle enabled={settings.highContrast} onChange={(v) => patch({ highContrast: v })} label={t('settings.highContrast')} />
          </SettingsRow>
          <SettingsRow label={t('settings.colorFilters')}>
            <Toggle enabled={settings.colorFilters} onChange={(v) => patch({ colorFilters: v })} label={t('settings.colorFilters')} />
          </SettingsRow>
          <SettingsRow label={t('settings.monoAudio')}>
            <Toggle enabled={settings.monoAudio} onChange={(v) => patch({ monoAudio: v })} label={t('settings.monoAudio')} />
          </SettingsRow>
          <SettingsRow label={t('settings.touchAssistance')}>
            <Toggle enabled={settings.touchAssistance} onChange={(v) => patch({ touchAssistance: v })} label={t('settings.touchAssistance')} />
          </SettingsRow>
        </SettingsSection>
      </div>
    </div>
  );
}
