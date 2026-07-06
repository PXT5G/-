'use client';

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { APP_GRADIENT } from '@/design/tokens';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { cn } from '@/utils/cn';

interface AppShellProps {
  title: string;
  subtitle?: string;
  icon?: string;
  headerRight?: ReactNode;
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
}

export function AppShell({ title, subtitle, icon, headerRight, children, className, footer }: AppShellProps) {
  const { spring } = useMotionPreference();

  return (
    <motion.div
      className={cn('flex flex-col h-full text-white', APP_GRADIENT, className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={spring}
    >
      {/* iOS large-title header */}
      <header className="px-5 pt-4 pb-2 flex items-end justify-between gap-3 shrink-0">
        <div className="min-w-0">
          <h1 className="ios-large-title text-white truncate">{title}</h1>
          {subtitle && <p className="text-[15px] text-ios-label-secondary mt-0.5 truncate">{subtitle}</p>}
        </div>
        {headerRight && <div className="shrink-0 pb-1">{headerRight}</div>}
      </header>
      <main className="flex-1 overflow-y-auto min-h-0">{children}</main>
      {footer && <footer className="shrink-0">{footer}</footer>}
    </motion.div>
  );
}

export function AppGlassCard({ children, className, onClick }: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn(
        'rounded-[16px] bg-[#1C1C1E]',
        onClick && 'cursor-pointer active:bg-[#2C2C2E] transition-colors',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {children}
    </div>
  );
}
