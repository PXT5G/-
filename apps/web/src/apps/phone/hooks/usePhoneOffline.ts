'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useOfflineQueueStore, type OfflineActionType } from '@/stores/offlineQueueStore';
import { toast } from '@/stores/toastStore';
import { phoneService } from '../services/phoneService';
import type { PhoneSettings } from '../types';

async function executeAction(
  type: string,
  payload: Record<string, unknown>
): Promise<void> {
  switch (type) {
    case 'addFavorite':
      await phoneService.addFavorite(payload as { phoneNumber: string; label: string; contactId?: string });
      break;
    case 'removeFavorite':
      await phoneService.removeFavorite(payload.id as string);
      break;
    case 'blockNumber':
      await phoneService.blockNumber(payload as { phoneNumber: string; label?: string; reason?: string });
      break;
    case 'unblockNumber':
      await phoneService.unblockNumber(payload.id as string);
      break;
    case 'updateSettings':
      await phoneService.updateSettings(payload as Partial<PhoneSettings>);
      break;
    case 'markVoicemailRead':
      await phoneService.markVoicemailRead(payload.id as string);
      break;
    case 'deleteVoicemail':
      await phoneService.deleteVoicemail(payload.id as string);
      break;
    default:
      break;
  }
}

export function usePhoneOfflineSync() {
  const online = useOnlineStatus();
  const queue = useOfflineQueueStore((s) => s.queue);
  const dequeue = useOfflineQueueStore((s) => s.dequeue);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!online || queue.length === 0) return;

    let cancelled = false;

    (async () => {
      const pending = [...queue];
      let synced = 0;
      for (const action of pending) {
        if (cancelled) return;
        try {
          await executeAction(action.type, action.payload);
          dequeue(action.id);
          synced++;
        } catch {
          break;
        }
      }
      if (synced > 0) {
        queryClient.invalidateQueries({ queryKey: ['phone'] });
        toast(`Synced ${synced} offline action${synced > 1 ? 's' : ''}`, 'success');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [online, queue, dequeue, queryClient]);
}

export function queueIfOffline(
  online: boolean,
  type: OfflineActionType,
  payload: Record<string, unknown>
): boolean {
  if (online) return false;
  useOfflineQueueStore.getState().enqueue(type, payload);
  toast('Saved offline — will sync when connected', 'info');
  return true;
}
