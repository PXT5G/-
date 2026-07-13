'use client';

import { motion } from 'framer-motion';
import { useWidgetData } from '@/hooks/usePremiumExperience';
import { formatTime, formatShortDate } from '@/utils/date';
import { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';

interface WidgetContentProps {
  type: string;
  size?: 'small' | 'medium' | 'large';
  interactive?: boolean;
}

export function WidgetContent({ type, size = 'medium', interactive = false }: WidgetContentProps) {
  const { data, isLoading } = useWidgetData(type);

  // Clock and weather render locally so home/lock widgets never show skeletons
  const selfSufficient = type === 'clock' || type === 'weather';

  if ((isLoading || !data) && !selfSufficient) {
    return <WidgetSkeleton size={size} />;
  }

  return (
    <motion.div
      className={cn('h-full', interactive && 'cursor-pointer')}
      initial={{ opacity: 0.6 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <WidgetBody type={type} data={data ?? {}} size={size} />
    </motion.div>
  );
}

function WidgetSkeleton({ size }: { size: string }) {
  return (
    <div className={cn('animate-pulse space-y-2', size === 'small' ? 'p-2' : 'p-3')}>
      <div className="h-3 bg-white/10 rounded w-1/2" />
      <div className="h-5 bg-white/10 rounded w-3/4" />
    </div>
  );
}

function WidgetBody({
  type,
  data,
  size,
}: {
  type: string;
  data: Record<string, unknown>;
  size: string;
}) {
  switch (type) {
    case 'weather':
      return <WeatherWidget size={size} fallback={data} />;
    case 'calendar':
      return (
        <div>
          <p className="text-xs text-white/50">Calendar</p>
          <p className="text-sm font-medium text-white mt-1">
            {Array.isArray(data.events) && data.events.length > 0
              ? String((data.events as { title: string }[])[0]?.title)
              : 'No upcoming events'}
          </p>
          {Array.isArray(data.events) && data.events.length > 1 && (
            <p className="text-[10px] text-white/40 mt-1">
              +{(data.events as unknown[]).length - 1} more
            </p>
          )}
        </div>
      );
    case 'battery':
      return (
        <div>
          <p className="text-xs text-white/50">Battery</p>
          <p className="text-2xl font-light text-white">{Math.round(Number(data.level ?? 0))}%</p>
          <p className="text-[10px] text-white/40">
            {data.isCharging ? 'Charging' : 'Discharging'} · Health {Math.round(Number(data.health ?? 0))}%
          </p>
        </div>
      );
    case 'stocks':
    case 'exchange':
      return (
        <div>
          <p className="text-xs text-white/50">{type === 'exchange' ? 'Portfolio' : 'Stocks'}</p>
          <p className="text-xl font-semibold text-white">
            ${Number(data.portfolioValue ?? data.totalValue ?? 0).toLocaleString()}
          </p>
          {Array.isArray(data.watchlist) && (
            <p className="text-[10px] text-white/40 mt-1">
              {(data.watchlist as { ticker: string; change: number }[])
                .slice(0, 3)
                .map((s) => `${s.ticker} ${s.change >= 0 ? '+' : ''}${s.change}%`)
                .join(' · ')}
            </p>
          )}
        </div>
      );
    case 'clock':
      return <ClockWidget size={size} />;
    case 'business':
      return (
        <div>
          <p className="text-xs text-white/50">Business</p>
          <p className="text-lg font-semibold text-white">
            ${Number(data.revenue ?? 0).toLocaleString()}
          </p>
          <p className="text-[10px] text-white/40">{String(data.period ?? 'This month')}</p>
        </div>
      );
    case 'ems':
      return (
        <div>
          <p className="text-xs text-white/50">EMS</p>
          <p className="text-sm font-medium text-white">{String(data.activeCount ?? 0)} active</p>
          {Array.isArray(data.dispatches) && (data.dispatches as { title: string }[])[0] && (
            <p className="text-[10px] text-white/40 truncate">
              {(data.dispatches as { title: string }[])[0].title}
            </p>
          )}
        </div>
      );
    case 'police':
      return (
        <div>
          <p className="text-xs text-white/50">Police</p>
          <p className="text-sm font-medium text-white">{String(data.activeCases ?? 0)} cases</p>
        </div>
      );
    case 'justice':
      return (
        <div>
          <p className="text-xs text-white/50">Justice</p>
          <p className="text-sm font-medium text-white">{String(data.upcomingHearings ?? 0)} hearings</p>
        </div>
      );
    case 'notes':
      return (
        <div>
          <p className="text-xs text-white/50">Notes</p>
          {Array.isArray(data.notes) && (data.notes as { title: string }[]).length > 0 ? (
            (data.notes as { title: string }[]).slice(0, 2).map((n, i) => (
              <p key={i} className="text-xs text-white/80 truncate">{n.title}</p>
            ))
          ) : (
            <p className="text-xs text-white/40">No pinned notes</p>
          )}
        </div>
      );
    case 'files':
      return (
        <div>
          <p className="text-xs text-white/50">Files</p>
          {Array.isArray(data.recent) && (data.recent as { name: string }[]).length > 0 ? (
            (data.recent as { name: string }[]).slice(0, 2).map((f, i) => (
              <p key={i} className="text-xs text-white/80 truncate">{f.name}</p>
            ))
          ) : (
            <p className="text-xs text-white/40">No recent files</p>
          )}
        </div>
      );
    case 'photos':
      return (
        <div>
          <p className="text-xs text-white/50">Photos</p>
          <p className="text-sm text-white">{String(data.count ?? 0)} recent</p>
        </div>
      );
    case 'browser':
      return (
        <div>
          <p className="text-xs text-white/50">Browser</p>
          {Array.isArray(data.tabs) && (data.tabs as { title: string }[])[0] ? (
            <p className="text-xs text-white/80 truncate">{(data.tabs as { title: string }[])[0].title}</p>
          ) : (
            <p className="text-xs text-white/40">No tabs</p>
          )}
        </div>
      );
    case 'phone':
      return (
        <div>
          <p className="text-xs text-white/50">Phone</p>
          <p className="text-sm text-white">{String(data.missed ?? 0)} missed</p>
        </div>
      );
    case 'contacts':
      return (
        <div>
          <p className="text-xs text-white/50">Contacts</p>
          {Array.isArray(data.favorites) && (data.favorites as { name: string }[]).slice(0, 2).map((c, i) => (
            <p key={i} className="text-xs text-white/80 truncate">{c.name}</p>
          ))}
        </div>
      );
    case 'messages':
      return (
        <div>
          <p className="text-xs text-white/50">Messages</p>
          {Array.isArray(data.conversations) && (data.conversations as { title: string }[])[0] ? (
            <p className="text-xs text-white/80 truncate">{(data.conversations as { title: string }[])[0].title}</p>
          ) : (
            <p className="text-xs text-white/40">No messages</p>
          )}
        </div>
      );
    case 'mail':
      return (
        <div>
          <p className="text-xs text-white/50">Mail</p>
          <p className="text-lg font-semibold text-white">{String(data.unread ?? 0)} unread</p>
        </div>
      );
    case 'bank':
      return (
        <div>
          <p className="text-xs text-white/50">Bank</p>
          <p className="text-lg font-semibold text-white">
            {Number(data.totalBalance ?? data.balance ?? 0).toLocaleString()} {String(data.currency ?? 'GULF')}
          </p>
          <p className="text-[10px] text-white/40">{String(data.accountName ?? 'Primary')}</p>
        </div>
      );
    case 'music':
      return (
        <div>
          <p className="text-xs text-white/50">Now Playing</p>
          <p className="text-sm font-medium text-white truncate">{String(data.title ?? 'Not playing')}</p>
          <p className="text-[10px] text-white/40 truncate">{String(data.artist ?? '')}</p>
        </div>
      );
    case 'maps':
      return (
        <div>
          <p className="text-xs text-white/50">Maps</p>
          <p className="text-sm text-white">{String(data.location ?? 'Current location')}</p>
        </div>
      );
    default:
      return (
        <div>
          <p className="text-xs text-white/50 capitalize">{type}</p>
          <p className="text-sm text-white">{String(data.title ?? data.subtitle ?? '—')}</p>
        </div>
      );
  }
}

/** iOS weather widget — conditions at your position on the Los Santos map */
function WeatherWidget({ size, fallback }: { size: string; fallback: Record<string, unknown> }) {
  const temp = (fallback.temperature as number | undefined) ?? 24;
  const label = (fallback.label as string | undefined) ?? 'Mostly Sunny';
  const district = fallback.district as string | undefined;
  const humidity = fallback.humidity as number | undefined;
  const wind = fallback.windKph as number | undefined;

  return (
    <div className="h-full flex flex-col justify-between">
      <div>
        <p className="text-[13px] font-semibold text-white/90 truncate">{district ?? 'Weather'}</p>
        <p className={cn('font-display font-light text-white leading-tight', size === 'small' ? 'text-[42px]' : 'text-[48px]')}>
          {temp}°
        </p>
      </div>
      <div>
        <p className="text-[15px] font-medium text-white/90">{label}</p>
        {size !== 'small' && (
          <p className="text-[12px] text-white/60 mt-0.5">
            Humidity {humidity ?? '—'}% · Wind {wind ?? '—'} km/h
          </p>
        )}
      </div>
    </div>
  );
}

function ClockWidget({ size }: { size: string }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col justify-between">
      <p className="text-[13px] font-semibold text-white/90">Clock</p>
      <div>
        <p className={cn('font-display font-light text-white tabular-nums leading-none', size === 'small' ? 'text-[40px]' : 'text-[46px]')}>
          {formatTime(time)}
        </p>
        <p className="text-[13px] font-medium text-white/70 mt-1.5">{formatShortDate(time)}</p>
      </div>
    </div>
  );
}
