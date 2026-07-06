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
        'flex items-center justify-between px-4 min-h-[44px] py-[10px] w-full text-left',
        onClick && 'active:bg-[#2C2C2E] transition-colors cursor-pointer'
      )}
      onClick={onClick}
    >
      <span className="text-[17px] text-white leading-tight">{label}</span>
      <div className="flex items-center gap-[10px]">
        {children}
        {value && <span className="text-[17px] text-ios-label-secondary capitalize">{value}</span>}
        {chevron && (
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none" className="text-[rgba(235,235,245,0.3)]" aria-hidden>
            <path d="M1 1l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </Component>
  );
}
