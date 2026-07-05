'use client';

import { usePersonalizationInit, usePerformanceSnapshot, usePersonalizationSocketSync } from '@/hooks/usePersonalization';
import { cn } from '@/utils/cn';

function Glass({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md', className)}>{children}</div>;
}

export function PerformanceApp() {
  usePersonalizationInit();
  usePersonalizationSocketSync();
  const { data, isLoading } = usePerformanceSnapshot();

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#0a1628] to-[#1a1a2e] text-white">
      <header className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-gulf-gold">Performance Center</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-4">
        {isLoading && <p className="text-center text-white/40">Measuring performance...</p>}
        {data && (
          <Glass className="p-4">
            <pre className="text-[10px] text-white/50 overflow-auto max-h-[70vh]">{JSON.stringify(data, null, 2)}</pre>
          </Glass>
        )}
      </main>
    </div>
  );
}
