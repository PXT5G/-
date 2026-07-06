'use client';

import { motion } from 'framer-motion';
import { appIconBounce } from '@/animations/transitions';
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

/** iOS-style icon tile gradients per app */
const ICON_GRADIENTS: Record<string, string> = {
  'com.gulfos.phone': 'linear-gradient(180deg, #67F0A2 0%, #17b558 100%)',
  'com.gulfos.messages': 'linear-gradient(180deg, #6BE07C 0%, #1EAD38 100%)',
  'com.gulfos.chat': 'linear-gradient(180deg, #6BD5FF 0%, #157EFB 100%)',
  'com.gulfos.contacts': 'linear-gradient(180deg, #8E8E93 0%, #48484A 100%)',
  'com.gulfos.mail': 'linear-gradient(180deg, #64B5F6 0%, #1565C0 100%)',
  'com.gulfos.camera': 'linear-gradient(180deg, #4A4A4C 0%, #1C1C1E 100%)',
  'com.gulfos.gallery': 'linear-gradient(180deg, #FFFFFF 0%, #E5E5EA 100%)',
  'com.gulfos.maps': 'linear-gradient(180deg, #7BE3A0 0%, #34A853 100%)',
  'com.gulfos.files': 'linear-gradient(180deg, #5AC8FA 0%, #0A84FF 100%)',
  'com.gulfos.browser': 'linear-gradient(180deg, #EAF6FF 0%, #B9DFF7 100%)',
  'com.gulfos.settings': 'linear-gradient(180deg, #A7A9AE 0%, #63656B 100%)',
  'com.gulfos.store': 'linear-gradient(180deg, #4FC3F7 0%, #0A62C9 100%)',
  'com.gulfos.bank': 'linear-gradient(180deg, #E8D48B 0%, #A67C00 100%)',
  'com.gulfos.identity': 'linear-gradient(180deg, #B0BEC5 0%, #546E7A 100%)',
  'com.gulfos.calendar': 'linear-gradient(180deg, #FFFFFF 0%, #ECECEC 100%)',
  'com.gulfos.clock': 'linear-gradient(180deg, #2C2C2E 0%, #000000 100%)',
  'com.gulfos.calculator': 'linear-gradient(180deg, #4A4A4C 0%, #1C1C1E 100%)',
  'com.gulfos.notes': 'linear-gradient(180deg, #FFF7C2 0%, #FFD60A 100%)',
  'com.gulfos.weather': 'linear-gradient(180deg, #6BC6FF 0%, #1B7FD4 100%)',
  'com.gulfos.recorder': 'linear-gradient(180deg, #FF6B6B 0%, #D32F2F 100%)',
  'com.gulfos.police': 'linear-gradient(180deg, #5C7CFA 0%, #1A3AA8 100%)',
  'com.gulfos.justice': 'linear-gradient(180deg, #B39DDB 0%, #5E35B1 100%)',
  'com.gulfos.ems': 'linear-gradient(180deg, #FF8A80 0%, #C62828 100%)',
  'com.gulfos.poetry': 'linear-gradient(180deg, #E8D48B 0%, #8D6E1E 100%)',
  'com.gulfos.business': 'linear-gradient(180deg, #90A4AE 0%, #37474F 100%)',
  'com.gulfos.exchange': 'linear-gradient(180deg, #69F0AE 0%, #00897B 100%)',
  'com.gulfos.sim': 'linear-gradient(180deg, #FFD54F 0%, #F57F17 100%)',
};

const DEFAULT_GRADIENT = 'linear-gradient(180deg, #3A3A3C 0%, #1C1C1E 100%)';

const sizeMap = {
  sm: { container: 'w-[64px] h-[64px] rounded-[15px]', text: 'text-[32px]', label: 'text-[11px]' },
  md: { container: 'w-[64px] h-[64px] rounded-[15px]', text: 'text-[32px]', label: 'text-[11px]' },
  lg: { container: 'w-[72px] h-[72px] rounded-[17px]', text: 'text-[36px]', label: 'text-[12px]' },
};

export function AppIcon({ name, icon, bundleId, size = 'md', onPress, onLongPress, badge, showLabel = true, className }: AppIconProps) {
  const sizes = sizeMap[size];
  const gradient = (bundleId && ICON_GRADIENTS[bundleId]) ?? DEFAULT_GRADIENT;
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
      <div className="relative">
        <div
          className={cn(sizes.container, 'flex items-center justify-center ios-icon-shadow overflow-hidden')}
          style={{ background: gradient }}
        >
          {/* Top-lit gloss */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/18 to-transparent pointer-events-none" style={{ height: '50%' }} />
          <span className={cn(sizes.text, 'leading-none drop-shadow-sm')}>{icon}</span>
        </div>
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-[6px] -right-[6px] min-w-[22px] h-[22px] px-1.5 bg-ios-red text-white text-[13px] font-semibold rounded-full flex items-center justify-center shadow-md">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      {showLabel && (
        <span
          className={cn(sizes.label, 'text-white font-medium truncate max-w-[76px] leading-tight')}
          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
        >
          {name}
        </span>
      )}
    </motion.button>
  );
}
