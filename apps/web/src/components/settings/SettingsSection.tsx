'use client';

import { type ReactNode } from 'react';

interface SettingsSectionProps {
  title: string;
  children: ReactNode;
}

/** iOS grouped inset section */
export function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <section className="mb-[26px]">
      <h2 className="text-[13px] font-normal text-ios-label-secondary uppercase mb-[7px] px-4">
        {title}
      </h2>
      <div className="rounded-[12px] bg-[#1C1C1E] overflow-hidden divide-y divide-[rgba(84,84,88,0.4)]">
        {children}
      </div>
    </section>
  );
}
