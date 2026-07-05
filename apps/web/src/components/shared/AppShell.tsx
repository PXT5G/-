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
      <header className="px-4 pt-4 pb-2 flex items-start justify-between gap-3 shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {icon && <span className="text-xl" aria-hidden>{icon}</span>}
            <h1 className="text-xl font-bold text-gulf-gold truncate">{title}</h1>
          </div>
          {subtitle && <p className="text-xs text-white/40 mt-0.5 truncate">{subtitle}</p>}
        </div>
        {headerRight && <div className="shrink-0">{headerRight}</div>}
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
        'rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md',
        onClick && 'cursor-pointer active:scale-[0.98] transition-transform',
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
