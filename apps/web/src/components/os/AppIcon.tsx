'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { appIconBounce } from '@/animations/transitions';
import { IOSIconArt } from './IOSIconArt';
import { cn } from '@/utils/cn';

interface AppIconProps {
  name: string;
  icon: string;
  bundleId?: string;
  size?: 'sm' | 'md' | 'lg';
  onPress?: () => void;
  onLongPress?: () => void;
  badge?: number;
  showLabel?: boolean;
  className?: string;
}

/** Apple iOS 18 stock icon artwork (public/icons/*.png) per bundle */
const STOCK_ICONS: Record<string, string> = {
  'com.gulfos.phone': 'phone',
  'com.gulfos.messages': 'messages',
  'com.gulfos.chat': 'facetime',
  'com.gulfos.mail': 'mail',
  'com.gulfos.camera': 'camera',
  'com.gulfos.gallery': 'photos',
  'com.gulfos.maps': 'maps',
  'com.gulfos.files': 'files',
  'com.gulfos.browser': 'safari',
  'com.gulfos.clock': 'clock',
  'com.gulfos.calculator': 'calculator',
  'com.gulfos.notes': 'notes',
  'com.gulfos.weather': 'weather',
  'com.gulfos.calendar': 'calendar',
  'com.gulfos.bank': 'wallet',
  'com.gulfos.ems': 'health',
  'com.gulfos.find-my': 'compass',
  'com.gulfos.music': 'music',
};

const sizeMap = {
  sm: { px: 64, label: 'text-[11px]' },
  md: { px: 64, label: 'text-[11px]' },
  lg: { px: 72, label: 'text-[12px]' },
};

/**
 * iOS home-screen icon. Apple iOS 18 icon artwork where available,
 * Apple-Settings-style squircles for GULF-specific apps.
 * Memoized: a home page renders up to 20 instances.
 */
export const AppIcon = memo(function AppIcon({ name, icon, bundleId, size = 'md', onPress, onLongPress, badge, showLabel = true, className }: AppIconProps) {
  const { px, label } = sizeMap[size];
  const stock = bundleId ? STOCK_ICONS[bundleId] : undefined;
  let longPressTimer: ReturnType<typeof setTimeout>;

  return (
    <motion.button
      className={cn('flex flex-col items-center gap-[5px]', className)}
      onClick={onPress}
      onTouchStart={() => {
        if (onLongPress) {
          longPressTimer = setTimeout(onLongPress, 500);
        }
      }}
      onTouchEnd={() => clearTimeout(longPressTimer)}
      {...appIconBounce}
      aria-label={name}
    >
      <div className="relative" style={{ filter: 'drop-shadow(0 3px 7px rgba(0,0,0,0.28))' }}>
        {stock ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/icons/${stock}.png`}
            alt=""
            width={px}
            height={px}
            draggable={false}
            className="rounded-[15px]"
            style={{ width: px, height: px }}
          />
        ) : (
          <IOSIconArt bundleId={bundleId} emoji={icon} size={px} />
        )}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-[6px] -right-[6px] min-w-[22px] h-[22px] px-1.5 bg-ios-red text-white text-[13px] font-semibold rounded-full flex items-center justify-center shadow-md">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      {showLabel && (
        <span
          className={cn(label, 'text-white font-medium truncate max-w-[76px] leading-tight')}
          style={{ textShadow: '0 1px 4px rgba(0,0,0,0.65), 0 0px 1px rgba(0,0,0,0.5)' }}
        >
          {name}
        </span>
      )}
    </motion.button>
  );
});
