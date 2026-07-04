'use client';

import { type ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface SettingsRowProps {
  label: string;
  value?: string;
  chevron?: boolean;
  onClick?: () => void;
  children?: ReactNode;
}

export function SettingsRow({ label, value, chevron, onClick, children }: SettingsRowProps) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      className={cn(
        'flex items-center justify-between px-4 py-3 w-full text-left',
        onClick && 'hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer'
      )}
      onClick={onClick}
    >
      <span className="text-sm text-white">{label}</span>
      <div className="flex items-center gap-2">
        {children}
        {value && <span className="text-sm text-white/40 capitalize">{value}</span>}
        {chevron && <span className="text-white/30 text-sm">›</span>}
      </div>
    </Component>
  );
}
