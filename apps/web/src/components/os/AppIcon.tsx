'use client';

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

const sizeMap = {
  sm: { px: 64, label: 'text-[11px]' },
  md: { px: 64, label: 'text-[11px]' },
  lg: { px: 72, label: 'text-[12px]' },
};

/**
 * iOS home-screen icon: squircle SVG artwork with authentic
 * gradients/glyphs, iOS drop shadow and label contrast shadow.
 */
export function AppIcon({ name, icon, bundleId, size = 'md', onPress, onLongPress, badge, showLabel = true, className }: AppIconProps) {
  const { px, label } = sizeMap[size];
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
        <IOSIconArt bundleId={bundleId} emoji={icon} size={px} />
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
}
