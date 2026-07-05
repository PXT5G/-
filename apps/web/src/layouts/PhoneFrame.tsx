'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { cn } from '@/utils/cn';

interface PhoneFrameProps {
  children: ReactNode;
  className?: string;
}

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
          : 'bg-[#0a0a0a]',
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
      <div
        className={cn(
          'relative w-full rounded-[3rem] overflow-hidden',
          'border-[3px] border-gray-800 shadow-2xl shadow-black/50',
          'bg-black',
          cinema ? 'w-[900px] h-[1944px] border-gray-700/80 shadow-black/80' : 'max-w-[390px] h-[844px]',
          className,
        )}
        role="application"
        aria-label="GULFOS"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-b-2xl z-[55]" />
        {children}
      </div>
    </div>
  );
}
