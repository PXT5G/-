'use client';

import { useSettingsStore } from '@/stores/settingsStore';
import { useThemeStore } from '@/stores/themeStore';
import { cn } from '@/utils/cn';

export function Wallpaper() {
  const wallpaper = useSettingsStore((s) => s.wallpaper);
  const resolvedMode = useThemeStore((s) => s.resolvedMode);
  const brightness = useSettingsStore((s) => s.brightness);

  const DEFAULT_DARK = 'radial-gradient(120% 90% at 80% -10%, #3d2f0e 0%, transparent 50%), radial-gradient(120% 100% at 15% 110%, #14233f 0%, transparent 55%), linear-gradient(160deg, #000000 0%, #0b0f1d 35%, #1a2340 62%, #2c2410 100%)';
  const DEFAULT_LIGHT = 'radial-gradient(110% 80% at 85% -5%, #f6dfa4 0%, transparent 55%), radial-gradient(120% 100% at 10% 110%, #a8c4ec 0%, transparent 60%), linear-gradient(160deg, #dfe8f4 0%, #cdd8ec 40%, #e8d9b0 100%)';

  // The default wallpaper always uses the current gradients, even if an older
  // variant was persisted server-side.
  const isDefault = wallpaper.id === 'gulf-gradient';
  const background =
    resolvedMode === 'dark'
      ? (isDefault ? DEFAULT_DARK : wallpaper.dark ?? DEFAULT_DARK)
      : (isDefault ? DEFAULT_LIGHT : wallpaper.light ?? DEFAULT_LIGHT);

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
