'use client';

import { motion } from 'framer-motion';
import { appIconBounce } from '@/animations/transitions';
import { cn } from '@/utils/cn';

interface AppIconProps {
  name: string;
  icon: string;
  size?: 'sm' | 'md' | 'lg';
  onPress?: () => void;
  onLongPress?: () => void;
  badge?: number;
  className?: string;
}

const sizeMap = {
  sm: { container: 'w-12 h-12', text: 'text-xl', label: 'text-[10px]' },
  md: { container: 'w-14 h-14', text: 'text-2xl', label: 'text-xs' },
  lg: { container: 'w-16 h-16', text: 'text-3xl', label: 'text-xs' },
};

export function AppIcon({ name, icon, size = 'md', onPress, onLongPress, badge, className }: AppIconProps) {
  const sizes = sizeMap[size];
  let longPressTimer: ReturnType<typeof setTimeout>;

  return (
    <motion.button
      className={cn('flex flex-col items-center gap-1', className)}
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
          className={cn(
            sizes.container,
            'rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10',
            'flex items-center justify-center shadow-lg'
          )}
        >
          <span className={sizes.text}>{icon}</span>
        </div>
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span className={cn(sizes.label, 'text-white/80 font-medium truncate max-w-[72px]')}>
        {name}
      </span>
    </motion.button>
  );
}
