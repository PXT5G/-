'use client';

import { useSettingsStore } from '@/stores/settingsStore';
import { useThemeStore } from '@/stores/themeStore';
import { cn } from '@/utils/cn';

export function Wallpaper() {
  const wallpaper = useSettingsStore((s) => s.wallpaper);
  const resolvedMode = useThemeStore((s) => s.resolvedMode);
  const brightness = useSettingsStore((s) => s.brightness);

  const background =
    resolvedMode === 'dark'
      ? wallpaper.dark ?? 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)'
      : wallpaper.light ?? 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 50%, #d4d4d4 100%)';

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {wallpaper.type === 'image' && wallpaper.url ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${wallpaper.url})`,
            filter: `brightness(${brightness}%)`,
          }}
        />
      ) : (
        <div
          className={cn(
            'absolute inset-0',
            wallpaper.type === 'animated' && wallpaper.animatedClass
          )}
          style={{
            background,
            filter: `brightness(${brightness}%)`,
          }}
        />
      )}
      <div className="absolute inset-0 bg-black/10" />
    </div>
  );
}
