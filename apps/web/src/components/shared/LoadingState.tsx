'use client';

import { motion } from 'framer-motion';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { cn } from '@/utils/cn';

interface LoadingStateProps {
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_MAP = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };

export function LoadingState({ label = 'Loading...', className, size = 'md' }: LoadingStateProps) {
  const { shouldReduceMotion } = useMotionPreference();

  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-6', className)} role="status" aria-live="polite">
      <motion.div
        animate={shouldReduceMotion ? {} : { rotate: 360 }}
        transition={shouldReduceMotion ? {} : { repeat: Infinity, duration: 1, ease: 'linear' }}
        className={cn('border-2 border-gulf-gold border-t-transparent rounded-full', SIZE_MAP[size])}
        aria-hidden
      />
      {label && <p className="mt-3 text-sm text-white/50">{label}</p>}
    </div>
  );
}
