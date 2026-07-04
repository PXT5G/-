'use client';

import { type ReactNode } from 'react';

interface SettingsSectionProps {
  title: string;
  children: ReactNode;
}

export function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <section className="mb-6">
      <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 px-1">
        {title}
      </h2>
      <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden divide-y divide-white/5">
        {children}
      </div>
    </section>
  );
}
