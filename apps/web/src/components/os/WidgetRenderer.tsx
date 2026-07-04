'use client';

import { useWidgetStore } from '@/stores/widgetStore';
import { formatTime, formatShortDate } from '@/utils/date';
import { useState, useEffect, useMemo } from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { cn } from '@/utils/cn';

interface WidgetRendererProps {
  pageIndex: number;
}

export function WidgetRenderer({ pageIndex }: WidgetRendererProps) {
  const getInstancesForPage = useWidgetStore((s) => s.getInstancesForPage);
  const instances = useMemo(() => getInstancesForPage(pageIndex), [getInstancesForPage, pageIndex]);

  if (instances.length === 0) {
    return <DefaultWidgets />;
  }

  return (
    <div className="px-6 pb-4 grid grid-cols-2 gap-3">
      {instances.map((instance) => (
        <WidgetCard key={instance.id} widgetId={instance.widgetId} size={instance.size} />
      ))}
    </div>
  );
}

function DefaultWidgets() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="px-6 pb-4 grid grid-cols-2 gap-3">
      <GlassPanel className="col-span-1 p-4" intensity="low">
        <p className="text-3xl font-extralight text-white tabular-nums">{formatTime(time)}</p>
        <p className="text-xs text-white/50 mt-1">{formatShortDate(time)}</p>
      </GlassPanel>
      <GlassPanel className="col-span-1 p-4" intensity="low">
        <p className="text-xs text-white/50">Weather</p>
        <p className="text-2xl font-light text-white mt-1">24°</p>
        <p className="text-xs text-white/60">Sunny</p>
      </GlassPanel>
    </div>
  );
}

function WidgetCard({ widgetId, size }: { widgetId: string; size: string }) {
  const definitions = useWidgetStore((s) => s.definitions);
  const widget = definitions.find((d) => d.id === widgetId);

  return (
    <GlassPanel
      className={cn('p-4', size === 'large' && 'col-span-2')}
      intensity="low"
    >
      <p className="text-sm font-medium text-white">{widget?.name ?? 'Widget'}</p>
      <p className="text-xs text-white/50 mt-2">Widget content</p>
    </GlassPanel>
  );
}
