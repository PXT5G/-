'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { cn } from '@/utils/cn';

interface PhoneFrameProps {
  children: ReactNode;
  className?: string;
}

/**
 * iPhone 16 Pro Max device chrome.
 * Logical viewport: 440 × 956 pt. Display corner radius ≈ 55 pt.
 * Titanium band + Dynamic Island cutout (126 × 37 pt).
 */
export function PhoneFrame({ children, className }: PhoneFrameProps) {
  const [cinema, setCinema] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCinema(params.get('cinema') === '1' || params.get('showcase') === '1');
  }, []);

  return (
    <div
      className={cn(
        'min-h-screen flex items-center justify-center p-4',
        cinema
          ? 'bg-gradient-to-br from-[#030308] via-[#0a0a14] to-[#0d1b2a]'
          : 'bg-[#050505]',
      )}
      data-showcase={cinema ? 'true' : undefined}
    >
      {cinema && (
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 50% 45%, rgba(212,175,55,0.08) 0%, transparent 70%)',
          }}
          aria-hidden
        />
      )}
      {/* Titanium band */}
      <div
        className={cn(
          'relative p-[3px] rounded-[71px]',
          'bg-gradient-to-b from-[#4a4a4c] via-[#2e2e30] to-[#48484a]',
          'shadow-[0_30px_80px_rgba(0,0,0,0.7),0_8px_24px_rgba(0,0,0,0.5)]',
          cinema && 'rounded-[145px] p-[6px]',
        )}
      >
        <div
          className={cn(
            'relative overflow-hidden bg-black',
            'rounded-[68px] border-[6px] border-black',
            cinema
              ? 'w-[900px] h-[1955px] rounded-[139px] border-[12px]'
              : 'w-[440px] h-[956px]',
            className,
          )}
          role="application"
          aria-label="GULFOS"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
