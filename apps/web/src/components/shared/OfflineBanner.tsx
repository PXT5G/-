'use client';

import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useOfflineQueueStore } from '@/stores/offlineQueueStore';

export function OfflineBanner() {
  const online = useOnlineStatus();
  const pending = useOfflineQueueStore((s) => s.queue.length);

  if (online && pending === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="px-4 py-2 bg-banana-gold/15 border-b border-banana-gold/30 text-center"
    >
      <p className="text-banana-gold text-[10px] font-medium tracking-wide uppercase">
        {!online
          ? `Offline${pending > 0 ? ` · ${pending} action${pending > 1 ? 's' : ''} queued` : ''}`
          : `Reconnecting · syncing ${pending} action${pending > 1 ? 's' : ''}…`}
      </p>
    </div>
  );
}
