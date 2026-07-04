'use client';

import { type ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface PhoneFrameProps {
  children: ReactNode;
  className?: string;
}

export function PhoneFrame({ children, className }: PhoneFrameProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
      <div
        className={cn(
          'relative w-full max-w-[390px] h-[844px] rounded-[3rem] overflow-hidden',
          'border-[3px] border-gray-800 shadow-2xl shadow-black/50',
          'bg-black',
          className
        )}
        role="application"
        aria-label="BananaOS"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-b-2xl z-[55]" />
        {children}
      </div>
    </div>
  );
}
