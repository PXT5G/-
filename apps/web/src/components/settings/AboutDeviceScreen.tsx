'use client';

import { useDeviceAbout } from '@/hooks/useSettings';
import { useTranslation } from '@/stores/i18nStore';
import { useHaptic } from '@/hooks/useSound';
import { formatBytes } from '@/services/deviceStorageService';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-white/5 last:border-0">
      <span className="text-sm text-white/60">{label}</span>
      <span className="text-sm text-white text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}

export function AboutDeviceScreen({ onBack }: { onBack: () => void }) {
  const { tap } = useHaptic();
  const { t } = useTranslation();
  const { data, isLoading } = useDeviceAbout();

  if (isLoading || !data) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-2 border-gulf-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-black">
      <div className="p-4 pb-8">
        <button type="button" onClick={() => { tap(); onBack(); }} className="text-gulf-gold text-sm mb-4">‹ {t('common.settings')}</button>
        <h1 className="text-2xl font-bold text-white mb-2">{t('settings.aboutDevice')}</h1>
        <p className="text-gulf-gold text-lg font-semibold mb-6">{data.deviceName}</p>

        <section className="p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
          <InfoRow label={t('settings.model')} value={data.model} />
          <InfoRow label={t('settings.developerName')} value={data.developer} />
          <InfoRow label={t('settings.manufacturer')} value={data.manufacturer} />
          <InfoRow label={t('settings.operatingSystem')} value={`${data.operatingSystem} ${data.osVersion}`} />
          <InfoRow label={t('settings.kernel')} value={data.kernel} />
          <InfoRow label={t('settings.buildNumber')} value={data.buildNumber} />
        </section>

        <section className="p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
          <InfoRow label={t('settings.storageLabel')} value={`${formatBytes(data.storage.used)} / ${formatBytes(data.storage.total)}`} />
          <InfoRow label={t('settings.ram')} value={`${formatBytes(data.ram.used)} / ${formatBytes(data.ram.total)}`} />
          <InfoRow label={t('settings.cpu')} value={data.cpu} />
          <InfoRow label={t('settings.gpu')} value={data.gpu} />
          <InfoRow label={t('settings.batteryHealth')} value={`${data.batteryHealth}%`} />
        </section>

        <section className="p-4 rounded-xl bg-white/5 border border-white/10">
          <InfoRow label={t('settings.serialNumber')} value={data.serialNumber} />
          <InfoRow label={t('settings.deviceUuid')} value={data.deviceUuid} />
          {data.imei && <InfoRow label={t('settings.imei')} value={data.imei} />}
        </section>
      </div>
    </div>
  );
}
