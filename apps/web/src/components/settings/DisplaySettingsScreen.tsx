'use client';

import { useSettings, useUpdateSettings } from '@/hooks/useSettings';
import { useTranslation } from '@/stores/i18nStore';
import { SettingsSection } from './SettingsSection';
import { SettingsRow } from './SettingsRow';
import { Toggle } from '@/components/ui/Toggle';
import { Slider } from '@/components/ui/Slider';
import { useHaptic } from '@/hooks/useSound';
import { useThemeStore } from '@/stores/themeStore';

export function DisplaySettingsScreen({ onBack }: { onBack: () => void }) {
  const { tap } = useHaptic();
  const { t } = useTranslation();
  const settings = useSettings();
  const update = useUpdateSettings();
  const { mode, accentColor, setMode, setAccentColor } = useThemeStore();

  const patch = (partial: Parameters<typeof update.mutate>[0]) => {
    tap();
    update.mutate(partial);
  };

  return (
    <div className="h-full overflow-y-auto bg-black">
      <div className="p-4 pb-8">
        <button type="button" onClick={() => { tap(); onBack(); }} className="text-banana-gold text-sm mb-4">‹ {t('common.settings')}</button>
        <h1 className="text-2xl font-bold text-white mb-6">{t('settings.display')}</h1>

        <SettingsSection title={t('settings.appearance')}>
          <SettingsRow label={t('settings.theme')} value={mode}>
            <div className="flex gap-2">
              {(['light', 'dark', 'system'] as const).map((th) => (
                <button
                  key={th}
                  type="button"
                  onClick={() => { setMode(th); patch({ theme: th }); }}
                  className={`px-3 py-1 rounded-full text-xs capitalize ${mode === th ? 'bg-banana-gold text-black' : 'bg-white/10 text-white'}`}
                >
                  {th === 'system' ? t('settings.systemTheme') : th === 'light' ? t('settings.light') : t('settings.dark')}
                </button>
              ))}
            </div>
          </SettingsRow>
          <SettingsRow label={t('settings.autoTheme')}>
            <Toggle enabled={settings.autoTheme} onChange={(v) => patch({ autoTheme: v })} label={t('settings.autoTheme')} />
          </SettingsRow>
          <SettingsRow label={t('settings.accentColor')} value={accentColor}>
            <div className="flex gap-2">
              {(['gold', 'white', 'black'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { setAccentColor(c); patch({ accentColor: c }); }}
                  className={`w-6 h-6 rounded-full border-2 ${accentColor === c ? 'border-banana-gold' : 'border-white/20'}`}
                  style={{ background: c === 'gold' ? '#D4AF37' : c === 'white' ? '#fff' : '#1a1a1a' }}
                  aria-label={c}
                />
              ))}
            </div>
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title={t('settings.display')}>
          <SettingsRow label={t('settings.brightness')}>
            <Slider value={settings.brightness} onChange={(v) => patch({ brightness: v })} label={t('settings.brightness')} className="w-32" />
          </SettingsRow>
          <SettingsRow label={t('settings.autoBrightness')}>
            <Toggle enabled={settings.autoBrightness} onChange={(v) => patch({ autoBrightness: v })} label={t('settings.autoBrightness')} />
          </SettingsRow>
          <SettingsRow label={t('settings.fontSize')} value={settings.fontSize}>
            <select
              value={settings.fontSize}
              onChange={(e) => patch({ fontSize: e.target.value as 'small' | 'medium' | 'large' })}
              className="bg-white/10 text-white text-xs rounded-lg px-2 py-1"
            >
              <option value="small">{t('settings.small')}</option>
              <option value="medium">{t('settings.medium')}</option>
              <option value="large">{t('settings.large')}</option>
            </select>
          </SettingsRow>
          <SettingsRow label={t('settings.displayZoom')} value={settings.displayZoom}>
            <select
              value={settings.displayZoom}
              onChange={(e) => patch({ displayZoom: e.target.value as 'default' | 'large' | 'larger' })}
              className="bg-white/10 text-white text-xs rounded-lg px-2 py-1 capitalize"
            >
              <option value="default">{t('settings.medium')}</option>
              <option value="large">{t('settings.large')}</option>
              <option value="larger">Larger</option>
            </select>
          </SettingsRow>
          <SettingsRow label={t('settings.animations')}>
            <Toggle enabled={settings.animationsEnabled} onChange={(v) => patch({ animationsEnabled: v })} label={t('settings.animations')} />
          </SettingsRow>
          <SettingsRow label={t('settings.refreshRate')} value={`${settings.refreshRate}Hz`}>
            <select
              value={settings.refreshRate}
              onChange={(e) => patch({ refreshRate: Number(e.target.value) as 60 | 90 | 120 })}
              className="bg-white/10 text-white text-xs rounded-lg px-2 py-1"
            >
              <option value={60}>60 Hz</option>
              <option value={90}>90 Hz</option>
              <option value={120}>120 Hz</option>
            </select>
          </SettingsRow>
          <SettingsRow label={t('settings.screenTimeout')} value={`${settings.screenTimeout}s`}>
            <select
              value={settings.screenTimeout}
              onChange={(e) => patch({ screenTimeout: Number(e.target.value) })}
              className="bg-white/10 text-white text-xs rounded-lg px-2 py-1"
            >
              <option value={30}>30 {t('settings.seconds')}</option>
              <option value={60}>1 {t('settings.minutes')}</option>
              <option value={120}>2 {t('settings.minutes')}</option>
              <option value={300}>5 {t('settings.minutes')}</option>
              <option value={600}>10 {t('settings.minutes')}</option>
            </select>
          </SettingsRow>
          <SettingsRow label={t('settings.alwaysOnDisplay')}>
            <Toggle enabled={settings.alwaysOnDisplay} onChange={(v) => patch({ alwaysOnDisplay: v })} label={t('settings.alwaysOnDisplay')} />
          </SettingsRow>
        </SettingsSection>
      </div>
    </div>
  );
}
