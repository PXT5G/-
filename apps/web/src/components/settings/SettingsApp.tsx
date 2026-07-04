'use client';

import { useState } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useThemeStore } from '@/stores/themeStore';
import { SettingsSection } from './SettingsSection';
import { SettingsRow } from './SettingsRow';
import { InstalledAppsSettings } from './InstalledAppsSettings';
import { StorageManagerScreen } from './StorageManagerScreen';
import { HardwareSettingsScreen } from './HardwareSettingsScreen';
import { TaskManagerScreen } from './TaskManagerScreen';
import { Toggle } from '@/components/ui/Toggle';
import { Slider } from '@/components/ui/Slider';
import { useHaptic } from '@/hooks/useSound';

const WALLPAPERS = [
  { id: 'banana-gradient', name: 'Banana Gradient', type: 'animated' as const },
  { id: 'midnight', name: 'Midnight', type: 'gradient' as const, dark: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' },
  { id: 'aurora', name: 'Aurora', type: 'gradient' as const, dark: 'linear-gradient(135deg, #000428, #004e92)' },
  { id: 'gold-luxury', name: 'Gold Luxury', type: 'gradient' as const, dark: 'linear-gradient(135deg, #1a1a1a, #2d2d2d, #D4AF37)' },
];

export function SettingsApp(_props: { appId?: string; appName?: string } = {}) {
  const settings = useSettingsStore();
  const { mode, accentColor, setMode, setAccentColor } = useThemeStore();
  const { tap } = useHaptic();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  if (activeSection === 'storage') {
    return <StorageManagerScreen onBack={() => setActiveSection(null)} />;
  }

  if (activeSection === 'hardware') {
    return <HardwareSettingsScreen onBack={() => setActiveSection(null)} />;
  }

  if (activeSection === 'task-manager') {
    return <TaskManagerScreen onBack={() => setActiveSection(null)} />;
  }

  if (activeSection === 'installed-apps') {
    return <InstalledAppsSettings onBack={() => setActiveSection(null)} />;
  }

  if (activeSection === 'wallpaper') {
    return (
      <div className="h-full overflow-y-auto bg-black p-4">
        <button onClick={() => setActiveSection(null)} className="text-banana-gold text-sm mb-4">‹ Settings</button>
        <h2 className="text-xl font-bold text-white mb-4">Wallpaper</h2>
        <div className="grid grid-cols-2 gap-3">
          {WALLPAPERS.map((wp) => (
            <button
              key={wp.id}
              onClick={() => {
                tap();
                settings.setWallpaper({
                  id: wp.id,
                  type: wp.type,
                  dark: wp.dark,
                  animatedClass: wp.type === 'animated' ? 'wallpaper-banana' : undefined,
                });
              }}
              className={`aspect-[9/16] rounded-2xl overflow-hidden border-2 ${
                settings.wallpaper.id === wp.id ? 'border-banana-gold' : 'border-transparent'
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

  return (
    <div className="h-full overflow-y-auto bg-black">
      <div className="p-4 pb-8">
        <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

        <SettingsSection title="Appearance">
          <SettingsRow label="Theme" value={mode}>
            <div className="flex gap-2">
              {(['light', 'dark', 'system'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { tap(); setMode(t); settings.updateSettings({ theme: t }); }}
                  className={`px-3 py-1 rounded-full text-xs capitalize ${
                    mode === t ? 'bg-banana-gold text-black' : 'bg-white/10 text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </SettingsRow>
          <SettingsRow
            label="Wallpaper"
            chevron
            onClick={() => setActiveSection('wallpaper')}
          />
          <SettingsRow label="Accent Color" value={accentColor}>
            <div className="flex gap-2">
              {(['gold', 'white', 'black'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => { tap(); setAccentColor(c); settings.updateSettings({ accentColor: c }); }}
                  className={`w-6 h-6 rounded-full border-2 ${
                    accentColor === c ? 'border-banana-gold' : 'border-white/20'
                  }`}
                  style={{ background: c === 'gold' ? '#D4AF37' : c === 'white' ? '#fff' : '#1a1a1a' }}
                  aria-label={c}
                />
              ))}
            </div>
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="Display">
          <SettingsRow label="Brightness">
            <Slider
              value={settings.brightness}
              onChange={(v) => settings.updateSettings({ brightness: v })}
              label="Brightness"
              className="w-32"
            />
          </SettingsRow>
          <SettingsRow label="Font Size" value={settings.fontSize}>
            <select
              value={settings.fontSize}
              onChange={(e) => settings.updateSettings({ fontSize: e.target.value as 'small' | 'medium' | 'large' })}
              className="bg-white/10 text-white text-xs rounded-lg px-2 py-1"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="Accessibility">
          <SettingsRow label="Reduce Motion">
            <Toggle
              enabled={settings.reduceMotion}
              onChange={(v) => settings.updateSettings({ reduceMotion: v })}
              label="Reduce Motion"
            />
          </SettingsRow>
          <SettingsRow label="High Contrast">
            <Toggle
              enabled={settings.highContrast}
              onChange={(v) => settings.updateSettings({ highContrast: v })}
              label="High Contrast"
            />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="Sound & Haptics">
          <SettingsRow label="Sounds">
            <Toggle
              enabled={settings.soundsEnabled}
              onChange={(v) => settings.updateSettings({ soundsEnabled: v })}
              label="Sounds"
            />
          </SettingsRow>
          <SettingsRow label="Haptics">
            <Toggle
              enabled={settings.hapticsEnabled}
              onChange={(v) => settings.updateSettings({ hapticsEnabled: v })}
              label="Haptics"
            />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="Device">
          <SettingsRow
            label="Hardware"
            chevron
            onClick={() => setActiveSection('hardware')}
          />
          <SettingsRow
            label="Task Manager"
            chevron
            onClick={() => setActiveSection('task-manager')}
          />
          <SettingsRow
            label="Storage"
            chevron
            onClick={() => setActiveSection('storage')}
          />
        </SettingsSection>

        <SettingsSection title="Apps">
          <SettingsRow
            label="Installed Apps"
            chevron
            onClick={() => setActiveSection('installed-apps')}
          />
        </SettingsSection>

        <SettingsSection title="Privacy & Security">
          <SettingsRow label="Language" value={settings.language} chevron />
          <SettingsRow label="Permissions" chevron />
          <SettingsRow label="Privacy" chevron />
        </SettingsSection>

        <SettingsSection title="About">
          <SettingsRow label="BananaOS Version" value="1.0.0" />
          <SettingsRow label="Build" value="Phase 3.1 — Hardware Simulation" />
        </SettingsSection>
      </div>
    </div>
  );
}
