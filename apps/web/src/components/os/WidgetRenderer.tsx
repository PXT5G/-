'use client';

import { useMemo } from 'react';
import { useWidgetStore } from '@/stores/widgetStore';
import { usePremiumExperienceStore } from '@/stores/premiumExperienceStore';
import { WidgetContent } from '@/components/widgets/WidgetContent';
import { cn } from '@/utils/cn';

interface WidgetRendererProps {
  pageIndex: number;
}

const DEFAULT_WIDGETS = [
  { type: 'clock', size: 'small' as const },
  { type: 'weather', size: 'small' as const },
];

export function WidgetRenderer({ pageIndex }: WidgetRendererProps) {
  const allInstances = useWidgetStore((s) => s.instances);
  const instances = useMemo(() => allInstances.filter((i) => i.pageIndex === pageIndex), [allInstances, pageIndex]);
  const profile = usePremiumExperienceStore((s) => s.profile);

  if (instances.length === 0 && pageIndex === 0) {
    return (
      <div className="px-[22px] pb-[22px] grid grid-cols-2 gap-[16px]">
        {DEFAULT_WIDGETS.map((w) => (
          <div key={w.type} className="ios-material-widget rounded-[24px] p-[16px] aspect-square ios-card-shadow">
            <WidgetContent type={w.type} size={w.size} interactive />
          </div>
        ))}
      </div>
    );
  }

  if (instances.length === 0) return null;

  return (
    <div
      className="px-[22px] pb-[22px] grid grid-cols-2 gap-[16px]"
      style={{ filter: profile?.homeBlurIntensity ? `blur(${profile.homeBlurIntensity * 0.1}px)` : undefined }}
    >
      {instances.map((instance) => {
        const definitions = useWidgetStore.getState().definitions;
        const widget = definitions.find((d) => d.id === instance.widgetId);
        const type = widget?.appId?.replace('com.gulfos.', '') ?? instance.widgetId.replace('widget.', '');

        return (
          <div
            key={instance.id}
            className={cn(
              'ios-material-widget rounded-[24px] p-[16px] ios-card-shadow',
              instance.size === 'large' ? 'col-span-2' : 'aspect-square',
            )}
          >
            <WidgetContent
              type={type}
              size={instance.size as 'small' | 'medium' | 'large'}
              interactive
            />
          </div>
        );
      })}
    </div>
  );
}
