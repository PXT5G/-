'use client';

import { useState } from 'react';
import { usePremiumExperienceInit } from '@/hooks/usePremiumExperience';
import { usePremiumExperienceStore } from '@/stores/premiumExperienceStore';
import { premiumExperienceService } from '@/services/premiumExperienceService';
import { SettingsSection } from './SettingsSection';
import { SettingsRow } from './SettingsRow';
import { Toggle } from '@/components/ui/Toggle';
import { useHaptic } from '@/hooks/useSound';

interface PremiumPhoneSettingsScreenProps {
  onBack: () => void;
}

const LOCK_LAYOUTS = ['classic', 'minimal', 'stacked', 'split', 'focus'];
const CLOCK_FONTS = ['system', 'rounded', 'serif', 'mono', 'condensed'];
const CLOCK_COLORS = ['white', 'gold', 'blue', 'green', 'red', 'gradient'];
const MULTITASKING_MODES = ['cards', 'grid', 'horizontal'] as const;

export function PremiumPhoneSettingsScreen({ onBack }: PremiumPhoneSettingsScreenProps) {
  const { isLoading } = usePremiumExperienceInit();
  const profile = usePremiumExperienceStore((s) => s.profile);
  const setProfile = usePremiumExperienceStore((s) => s.setProfile);
  const { tap } = useHaptic();
  const [saving, setSaving] = useState(false);

  const update = async (partial: Record<string, unknown>) => {
    tap();
    setSaving(true);
    try {
      const updated = await premiumExperienceService.updateProfile(partial);
      setProfile(updated);
    } catch { /* sync on next load */ }
    setSaving(false);
  };

  if (isLoading && !profile) {
    return (
      <div className="h-full overflow-y-auto bg-black p-4">
        <button type="button" onClick={onBack} className="text-gulf-gold text-sm mb-4">‹ Back</button>
        <p className="text-white/50">Loading premium settings...</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-black p-4">
      <button type="button" onClick={onBack} className="text-gulf-gold text-sm mb-4">‹ Back</button>
      <h2 className="text-xl font-bold text-white mb-4">Premium Experience</h2>
      {saving && <p className="text-xs text-white/40 mb-2">Saving...</p>}

      <SettingsSection title="Lock Screen">
        <p className="text-xs text-white/50 mb-2">Layout</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {LOCK_LAYOUTS.map((layout) => (
            <button
              key={layout}
              type="button"
              onClick={() => void update({ lockScreenLayout: layout })}
              className={`px-3 py-1.5 rounded-lg text-xs capitalize ${
                profile?.lockScreenLayout === layout ? 'bg-gulf-gold text-black' : 'bg-white/10 text-white'
              }`}
            >
              {layout}
            </button>
          ))}
        </div>
        <p className="text-xs text-white/50 mb-2">Clock Font</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {CLOCK_FONTS.map((font) => (
            <button
              key={font}
              type="button"
              onClick={() => void update({ clockFont: font })}
              className={`px-3 py-1.5 rounded-lg text-xs capitalize ${
                profile?.clockFont === font ? 'bg-gulf-gold text-black' : 'bg-white/10 text-white'
              }`}
            >
              {font}
            </button>
          ))}
        </div>
        <p className="text-xs text-white/50 mb-2">Clock Color</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {CLOCK_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => void update({ clockColor: color })}
              className={`px-3 py-1.5 rounded-lg text-xs capitalize ${
                profile?.clockColor === color ? 'bg-gulf-gold text-black' : 'bg-white/10 text-white'
              }`}
            >
              {color}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between py-3 border-b border-white/10">
          <span className="text-sm text-white">Charging Animation</span>
          <Toggle
            enabled={profile?.chargingAnimation ?? true}
            onChange={(v) => void update({ chargingAnimation: v })}
            label="Charging Animation"
          />
        </div>
        <div className="flex items-center justify-between py-3 border-b border-white/10">
          <span className="text-sm text-white">Live Wallpaper</span>
          <Toggle
            enabled={profile?.liveWallpaper ?? false}
            onChange={(v) => void update({ liveWallpaper: v })}
            label="Live Wallpaper"
          />
        </div>
        <div className="flex items-center justify-between py-3 border-b border-white/10">
          <span className="text-sm text-white">Depth Wallpaper</span>
          <Toggle
            enabled={profile?.depthWallpaper ?? false}
            onChange={(v) => void update({ depthWallpaper: v })}
            label="Depth Wallpaper"
          />
        </div>
      </SettingsSection>

      <SettingsSection title="Home Screen">
        <div className="flex items-center justify-between py-3 border-b border-white/10">
          <span className="text-sm text-white">Smart Folders</span>
          <Toggle
            enabled={profile?.smartFolders ?? true}
            onChange={(v) => void update({ smartFolders: v })}
            label="Smart Folders"
          />
        </div>
        <div className="flex items-center justify-between py-3 border-b border-white/10">
          <span className="text-sm text-white">Unlimited Pages</span>
          <Toggle
            enabled={profile?.unlimitedPages ?? true}
            onChange={(v) => void update({ unlimitedPages: v })}
            label="Unlimited Pages"
          />
        </div>
        <SettingsRow label="Icon Size" value={profile?.iconSize ?? 'medium'} />
        <SettingsRow label="Blur Intensity" value={String(profile?.homeBlurIntensity ?? 0)} />
      </SettingsSection>

      <SettingsSection title="Multitasking">
        <p className="text-xs text-white/50 mb-2">View Mode</p>
        <div className="flex flex-wrap gap-2">
          {MULTITASKING_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => void update({ multitaskingMode: mode })}
              className={`px-3 py-1.5 rounded-lg text-xs capitalize ${
                profile?.multitaskingMode === mode ? 'bg-gulf-gold text-black' : 'bg-white/10 text-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title="Dynamic Island">
        <SettingsRow label="Max Activities" value={String(profile?.dynamicIslandMaxActivities ?? 3)} />
        <div className="flex items-center justify-between py-3 border-b border-white/10">
          <span className="text-sm text-white">Smart Suggestions</span>
          <Toggle
            enabled={profile?.smartSuggestions ?? true}
            onChange={(v) => void update({ smartSuggestions: v })}
            label="Smart Suggestions"
          />
        </div>
      </SettingsSection>

      <SettingsSection title="Notifications">
        <SettingsRow label="Group Strategy" value={profile?.notificationGroupStrategy ?? 'app'} />
        <div className="flex items-center justify-between py-3 border-b border-white/10">
          <span className="text-sm text-white">Notification History</span>
          <Toggle
            enabled={profile?.notificationHistoryEnabled ?? true}
            onChange={(v) => void update({ notificationHistoryEnabled: v })}
            label="Notification History"
          />
        </div>
      </SettingsSection>

      <SettingsSection title="Animations">
        <div className="flex items-center justify-between py-3 border-b border-white/10">
          <span className="text-sm text-white">Parallax</span>
          <Toggle
            enabled={profile?.parallaxEnabled ?? true}
            onChange={(v) => void update({ parallaxEnabled: v })}
            label="Parallax"
          />
        </div>
        <div className="flex items-center justify-between py-3 border-b border-white/10">
          <span className="text-sm text-white">Reduce Motion</span>
          <Toggle
            enabled={profile?.reduceMotionOverride ?? false}
            onChange={(v) => void update({ reduceMotionOverride: v })}
            label="Reduce Motion"
          />
        </div>
        <SettingsRow label="Animation Scale" value={String(profile?.animationScale ?? 1)} />
      </SettingsSection>

      <SettingsSection title="App Library">
        <div className="flex items-center justify-between py-3 border-b border-white/10">
          <span className="text-sm text-white">Suggestions</span>
          <Toggle
            enabled={profile?.appLibrarySuggestions ?? true}
            onChange={(v) => void update({ appLibrarySuggestions: v })}
            label="Suggestions"
          />
        </div>
        <div className="flex items-center justify-between py-3 border-b border-white/10">
          <span className="text-sm text-white">AI Recommendations</span>
          <Toggle
            enabled={profile?.appLibraryAiRecommendations ?? true}
            onChange={(v) => void update({ appLibraryAiRecommendations: v })}
            label="AI Recommendations"
          />
        </div>
      </SettingsSection>
    </div>
  );
}
