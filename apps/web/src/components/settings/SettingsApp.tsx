'use client';

import { useState, type ReactNode } from 'react';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';
import { useTranslation } from '@/stores/i18nStore';
import { SettingsSection } from './SettingsSection';
import { SettingsRow } from './SettingsRow';
import { GeneralSettingsScreen } from './GeneralSettingsScreen';
import { LanguageSettingsScreen } from './LanguageSettingsScreen';
import { DisplaySettingsScreen } from './DisplaySettingsScreen';
import { SoundSettingsScreen } from './SoundSettingsScreen';
import { AccessibilitySettingsScreen } from './AccessibilitySettingsScreen';
import { AboutDeviceScreen } from './AboutDeviceScreen';
import { NetworkSettingsQuickScreen } from './NetworkSettingsQuickScreen';
import { InstalledAppsSettings } from './InstalledAppsSettings';
import { StorageManagerScreen } from './StorageManagerScreen';
import { HardwareSettingsScreen } from './HardwareSettingsScreen';
import { TaskManagerScreen } from './TaskManagerScreen';
import { NetworkSettingsScreen } from './NetworkSettingsScreen';
import { LocationSettingsScreen } from './LocationSettingsScreen';
import { DiagnosticsSettingsScreen } from './DiagnosticsSettingsScreen';
import { BackgroundJobsScreen } from './BackgroundJobsScreen';
import { PermissionsSettingsScreen } from './PermissionsSettingsScreen';
import { BatterySettingsScreen } from './BatterySettingsScreen';
import { DeveloperSettingsScreen } from './DeveloperSettingsScreen';
import { EconomyAdminScreen } from './EconomyAdminScreen';
import { DeviceSecuritySettingsScreen } from './DeviceSecuritySettingsScreen';
import { DeviceBackupSettingsScreen } from './DeviceBackupSettingsScreen';
import { DeviceSyncSettingsScreen } from './DeviceSyncSettingsScreen';
import { DeviceMaintenanceSettingsScreen } from './DeviceMaintenanceSettingsScreen';
import { DeviceRecoverySettingsScreen } from './DeviceRecoverySettingsScreen';
import { MapsSettingsScreen } from './MapsSettingsScreen';
import { CarrierSettingsScreen } from './CarrierSettingsScreen';
import { VpnSettingsScreen } from './VpnSettingsScreen';
import { SignalSettingsScreen } from './SignalSettingsScreen';
import { CellTowersSettingsScreen } from './CellTowersSettingsScreen';
import { Toggle } from '@/components/ui/Toggle';
import { useHaptic } from '@/hooks/useSound';
import { useAuthStore } from '@/stores/authStore';

const WALLPAPERS = [
  { id: 'gulf-gradient', name: 'Gulf Gradient', type: 'animated' as const },
  { id: 'midnight', name: 'Midnight', type: 'gradient' as const, dark: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' },
  { id: 'aurora', name: 'Aurora', type: 'gradient' as const, dark: 'linear-gradient(135deg, #000428, #004e92)' },
  { id: 'gold-luxury', name: 'Gold Luxury', type: 'gradient' as const, dark: 'linear-gradient(135deg, #1a1a1a, #2d2d2d, #D4AF37)' },
];

export function SettingsApp(_props: { appId?: string; appName?: string } = {}) {
  const settings = useSettings();
  const update = useUpdateSettings();
  const { t } = useTranslation();
  const { tap } = useHaptic();
  const user = useAuthStore((s) => s.user);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const patch = (partial: Parameters<typeof update.mutate>[0]) => {
    tap();
    update.mutate(partial);
  };

  const sectionScreens: Record<string, ReactNode> = {
    general: <GeneralSettingsScreen onBack={() => setActiveSection(null)} />,
    language: <LanguageSettingsScreen onBack={() => setActiveSection(null)} />,
    display: <DisplaySettingsScreen onBack={() => setActiveSection(null)} />,
    sound: <SoundSettingsScreen onBack={() => setActiveSection(null)} />,
    accessibility: <AccessibilitySettingsScreen onBack={() => setActiveSection(null)} />,
    about: <AboutDeviceScreen onBack={() => setActiveSection(null)} />,
    'network-quick': <NetworkSettingsQuickScreen onBack={() => setActiveSection(null)} onAdvanced={() => setActiveSection('vpn')} />,
    storage: <StorageManagerScreen onBack={() => setActiveSection(null)} />,
    hardware: <HardwareSettingsScreen onBack={() => setActiveSection(null)} />,
    'task-manager': <TaskManagerScreen onBack={() => setActiveSection(null)} />,
    network: <NetworkSettingsScreen onBack={() => setActiveSection(null)} />,
    location: <LocationSettingsScreen onBack={() => setActiveSection(null)} />,
    diagnostics: <DiagnosticsSettingsScreen onBack={() => setActiveSection(null)} />,
    'background-jobs': <BackgroundJobsScreen onBack={() => setActiveSection(null)} />,
    permissions: <PermissionsSettingsScreen onBack={() => setActiveSection(null)} />,
    battery: <BatterySettingsScreen onBack={() => setActiveSection(null)} />,
    developer: <DeveloperSettingsScreen onBack={() => setActiveSection(null)} />,
    economy: <EconomyAdminScreen onBack={() => setActiveSection(null)} />,
    'device-security': <DeviceSecuritySettingsScreen onBack={() => setActiveSection(null)} />,
    'device-backup': <DeviceBackupSettingsScreen onBack={() => setActiveSection(null)} />,
    'device-sync': <DeviceSyncSettingsScreen onBack={() => setActiveSection(null)} />,
    'device-maintenance': <DeviceMaintenanceSettingsScreen onBack={() => setActiveSection(null)} />,
    'device-recovery': <DeviceRecoverySettingsScreen onBack={() => setActiveSection(null)} />,
    maps: <MapsSettingsScreen onBack={() => setActiveSection(null)} />,
    carrier: <CarrierSettingsScreen onBack={() => setActiveSection(null)} />,
    vpn: <VpnSettingsScreen onBack={() => setActiveSection(null)} />,
    signal: <SignalSettingsScreen onBack={() => setActiveSection(null)} />,
    'cell-towers': <CellTowersSettingsScreen onBack={() => setActiveSection(null)} />,
    'installed-apps': <InstalledAppsSettings onBack={() => setActiveSection(null)} />,
  };

  if (activeSection === 'wallpaper') {
    return (
      <div className="h-full overflow-y-auto bg-black p-4">
        <button type="button" onClick={() => setActiveSection(null)} className="text-gulf-gold text-sm mb-4">‹ {t('common.settings')}</button>
        <h2 className="text-xl font-bold text-white mb-4">{t('settings.wallpaper')}</h2>
        <div className="grid grid-cols-2 gap-3">
          {WALLPAPERS.map((wp) => (
            <button
              key={wp.id}
              type="button"
              onClick={() => patch({
                wallpaper: {
                  id: wp.id,
                  type: wp.type,
                  dark: wp.dark,
                  animatedClass: wp.type === 'animated' ? 'wallpaper-gulf' : undefined,
                },
              })}
              className={`aspect-[9/16] rounded-2xl overflow-hidden border-2 ${
                settings.wallpaper.id === wp.id ? 'border-gulf-gold' : 'border-transparent'
              }`}
              style={{ background: wp.dark ?? 'linear-gradient(135deg, #0a0a0a, #1a1a2e)' }}
            >
              <span className="text-xs text-white/80 p-2 block">{wp.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (activeSection && sectionScreens[activeSection]) {
    return sectionScreens[activeSection];
  }

  const langLabel = settings.language.toUpperCase();

  return (
    <div className="h-full overflow-y-auto bg-black">
      <div className="p-4 pb-8">
        <h1 className="text-2xl font-bold text-white mb-6">{t('settings.title')}</h1>

        <SettingsSection title={t('settings.general')}>
          <SettingsRow label={t('settings.language')} value={langLabel} chevron onClick={() => setActiveSection('language')} />
          <SettingsRow label={t('settings.general')} chevron onClick={() => setActiveSection('general')} />
        </SettingsSection>

        <SettingsSection title={t('settings.appearance')}>
          <SettingsRow label={t('settings.display')} chevron onClick={() => setActiveSection('display')} />
          <SettingsRow label={t('settings.wallpaper')} chevron onClick={() => setActiveSection('wallpaper')} />
        </SettingsSection>

        <SettingsSection title={t('settings.soundHaptics')}>
          <SettingsRow label={t('settings.soundHaptics')} chevron onClick={() => setActiveSection('sound')} />
          <SettingsRow label="Silent Mode">
            <Toggle enabled={settings.silentMode} onChange={(v) => patch({ silentMode: v })} label="Silent Mode" />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title={t('settings.network')}>
          <SettingsRow label={t('settings.network')} chevron onClick={() => setActiveSection('network-quick')} />
          <SettingsRow label={t('settings.wifi')}>
            <Toggle enabled={settings.wifiEnabled} onChange={(v) => patch({ wifiEnabled: v })} label={t('settings.wifi')} />
          </SettingsRow>
          <SettingsRow label={t('settings.bluetooth')}>
            <Toggle enabled={settings.bluetoothEnabled} onChange={(v) => patch({ bluetoothEnabled: v })} label={t('settings.bluetooth')} />
          </SettingsRow>
          <SettingsRow label={t('settings.airplaneMode')}>
            <Toggle enabled={settings.airplaneMode} onChange={(v) => patch({ airplaneMode: v })} label={t('settings.airplaneMode')} />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title={t('settings.privacySecurity')}>
          <SettingsRow label={t('settings.permissions')} chevron onClick={() => setActiveSection('permissions')} />
        </SettingsSection>

        <SettingsSection title={t('settings.accessibility')}>
          <SettingsRow label={t('settings.accessibility')} chevron onClick={() => setActiveSection('accessibility')} />
        </SettingsSection>

        <SettingsSection title={t('settings.device')}>
          <SettingsRow label={t('settings.battery')} chevron onClick={() => setActiveSection('battery')} />
          <SettingsRow label={t('settings.security')} chevron onClick={() => setActiveSection('device-security')} />
          <SettingsRow label="Backup" chevron onClick={() => setActiveSection('device-backup')} />
          <SettingsRow label="Sync" chevron onClick={() => setActiveSection('device-sync')} />
          <SettingsRow label="Maintenance" chevron onClick={() => setActiveSection('device-maintenance')} />
          <SettingsRow label="Recovery" chevron onClick={() => setActiveSection('device-recovery')} />
          <SettingsRow label="Location" chevron onClick={() => setActiveSection('location')} />
          <SettingsRow label="Maps" chevron onClick={() => setActiveSection('maps')} />
          <SettingsRow label="Carrier" chevron onClick={() => setActiveSection('carrier')} />
          <SettingsRow label={t('settings.vpn')} chevron onClick={() => setActiveSection('vpn')} />
          <SettingsRow label="Signal" chevron onClick={() => setActiveSection('signal')} />
          <SettingsRow label="Cell Towers" chevron onClick={() => setActiveSection('cell-towers')} />
          <SettingsRow label="Hardware" chevron onClick={() => setActiveSection('hardware')} />
          <SettingsRow label="Task Manager" chevron onClick={() => setActiveSection('task-manager')} />
          <SettingsRow label={t('settings.storage')} chevron onClick={() => setActiveSection('storage')} />
          <SettingsRow label={t('settings.powerSaving')}>
            <Toggle enabled={settings.powerSavingMode} onChange={(v) => patch({ powerSavingMode: v, lowPowerMode: v })} label={t('settings.powerSaving')} />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title={t('settings.system')}>
          {user?.role === 'admin' && (
            <SettingsRow label="Economy Engine" chevron onClick={() => setActiveSection('economy')} />
          )}
          <SettingsRow label="Background Jobs" chevron onClick={() => setActiveSection('background-jobs')} />
          <SettingsRow label="Diagnostics" chevron onClick={() => setActiveSection('diagnostics')} />
          <SettingsRow label={t('settings.developer')} chevron onClick={() => setActiveSection('developer')} />
        </SettingsSection>

        <SettingsSection title={t('settings.apps')}>
          <SettingsRow label={t('settings.installedApps')} chevron onClick={() => setActiveSection('installed-apps')} />
        </SettingsSection>

        <SettingsSection title={t('settings.about')}>
          <SettingsRow label={t('settings.aboutDevice')} chevron onClick={() => setActiveSection('about')} />
          <SettingsRow label={t('settings.version')} value="1.0.0" />
          <SettingsRow label={t('settings.buildNumber')} value="3.7.0" />
        </SettingsSection>
      </div>
    </div>
  );
}
