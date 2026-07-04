'use client';

import { useSettings, useUpdateSettings } from '@/hooks/useSettings';
import { useTranslation } from '@/stores/i18nStore';
import { SettingsSection } from './SettingsSection';
import { SettingsRow } from './SettingsRow';
import { useHaptic } from '@/hooks/useSound';

const REGIONS = ['US', 'GB', 'SA', 'AE', 'FR', 'DE', 'ES', 'JP', 'CN', 'KR', 'IN', 'TR', 'RU', 'BR'];
const TIMEZONES = [
  'America/Los_Angeles', 'America/New_York', 'Europe/London', 'Europe/Paris',
  'Asia/Dubai', 'Asia/Riyadh', 'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Kolkata', 'Australia/Sydney',
];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'SAR', 'AED', 'JPY', 'CNY'];

export function GeneralSettingsScreen({ onBack }: { onBack: () => void }) {
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
        <h1 className="text-2xl font-bold text-white mb-6">{t('settings.general')}</h1>

        <SettingsSection title={t('settings.general')}>
          <SettingsRow label={t('settings.region')} value={settings.region}>
            <select
              value={settings.region}
              onChange={(e) => patch({ region: e.target.value })}
              className="bg-white/10 text-white text-xs rounded-lg px-2 py-1"
            >
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </SettingsRow>
          <SettingsRow label={t('settings.timezone')} value={settings.timezone.split('/').pop()}>
            <select
              value={settings.timezone}
              onChange={(e) => patch({ timezone: e.target.value })}
              className="bg-white/10 text-white text-xs rounded-lg px-2 py-1 max-w-[140px]"
            >
              {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>)}
            </select>
          </SettingsRow>
          <SettingsRow label={t('settings.dateFormat')} value={settings.dateFormat}>
            <select
              value={settings.dateFormat}
              onChange={(e) => patch({ dateFormat: e.target.value as 'mdy' | 'dmy' | 'ymd' })}
              className="bg-white/10 text-white text-xs rounded-lg px-2 py-1"
            >
              <option value="mdy">MM/DD/YYYY</option>
              <option value="dmy">DD/MM/YYYY</option>
              <option value="ymd">YYYY/MM/DD</option>
            </select>
          </SettingsRow>
          <SettingsRow label={t('settings.timeFormat')} value={settings.timeFormat}>
            <select
              value={settings.timeFormat}
              onChange={(e) => patch({ timeFormat: e.target.value as '12h' | '24h' })}
              className="bg-white/10 text-white text-xs rounded-lg px-2 py-1"
            >
              <option value="12h">{t('settings.format12h')}</option>
              <option value="24h">{t('settings.format24h')}</option>
            </select>
          </SettingsRow>
          <SettingsRow label={t('settings.temperatureUnit')} value={settings.temperatureUnit}>
            <select
              value={settings.temperatureUnit}
              onChange={(e) => patch({ temperatureUnit: e.target.value as 'celsius' | 'fahrenheit' })}
              className="bg-white/10 text-white text-xs rounded-lg px-2 py-1"
            >
              <option value="celsius">{t('settings.celsius')}</option>
              <option value="fahrenheit">{t('settings.fahrenheit')}</option>
            </select>
          </SettingsRow>
          <SettingsRow label={t('settings.distanceUnit')} value={settings.distanceUnit}>
            <select
              value={settings.distanceUnit}
              onChange={(e) => patch({ distanceUnit: e.target.value as 'km' | 'mi' })}
              className="bg-white/10 text-white text-xs rounded-lg px-2 py-1"
            >
              <option value="km">{t('settings.kilometers')}</option>
              <option value="mi">{t('settings.miles')}</option>
            </select>
          </SettingsRow>
          <SettingsRow label={t('settings.currency')} value={settings.currency}>
            <select
              value={settings.currency}
              onChange={(e) => patch({ currency: e.target.value })}
              className="bg-white/10 text-white text-xs rounded-lg px-2 py-1"
            >
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </SettingsRow>
          <SettingsRow label={t('settings.keyboardLayout')} value={settings.keyboardLayout}>
            <select
              value={settings.keyboardLayout}
              onChange={(e) => patch({ keyboardLayout: e.target.value as 'qwerty' | 'azerty' | 'qwertz' | 'arabic' })}
              className="bg-white/10 text-white text-xs rounded-lg px-2 py-1 capitalize"
            >
              <option value="qwerty">QWERTY</option>
              <option value="azerty">AZERTY</option>
              <option value="qwertz">QWERTZ</option>
              <option value="arabic">Arabic</option>
            </select>
          </SettingsRow>
        </SettingsSection>
      </div>
    </div>
  );
}
