'use client';

import { useMemo } from 'react';
import { useWidgetStore } from '@/stores/widgetStore';
import { usePremiumExperienceStore } from '@/stores/premiumExperienceStore';
import { WidgetContent } from '@/components/widgets/WidgetContent';
import { GlassPanel } from '@/components/ui/GlassPanel';
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
      <div className="px-6 pb-4 grid grid-cols-2 gap-3">
        {DEFAULT_WIDGETS.map((w) => (
          <GlassPanel key={w.type} className="col-span-1 p-4" intensity="low">
            <WidgetContent type={w.type} size={w.size} interactive />
          </GlassPanel>
        ))}
      </div>
    );
  }

  if (instances.length === 0) return null;

  return (
    <div
      className="px-6 pb-4 grid grid-cols-2 gap-3"
      style={{ filter: profile?.homeBlurIntensity ? `blur(${profile.homeBlurIntensity * 0.1}px)` : undefined }}
    >
      {instances.map((instance) => {
        const definitions = useWidgetStore.getState().definitions;
        const widget = definitions.find((d) => d.id === instance.widgetId);
        const type = widget?.appId?.replace('com.gulfos.', '') ?? instance.widgetId.replace('widget.', '');

        return (
          <GlassPanel
            key={instance.id}
            className={cn('p-4', instance.size === 'large' && 'col-span-2')}
            intensity="low"
          >
            <WidgetContent
              type={type}
              size={instance.size as 'small' | 'medium' | 'large'}
              interactive
            />
          </GlassPanel>
        );
      })}
    </div>
  );
}
