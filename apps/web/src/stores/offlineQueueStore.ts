import { create } from 'zustand';

export type OfflineActionType =
  | 'addFavorite'
  | 'removeFavorite'
  | 'blockNumber'
  | 'unblockNumber'
  | 'updateSettings'
  | 'markVoicemailRead'
  | 'deleteVoicemail';

export interface OfflineAction {
  id: string;
  type: OfflineActionType;
  payload: Record<string, unknown>;
  createdAt: number;
}

interface OfflineQueueState {
  queue: OfflineAction[];
  enqueue: (type: OfflineActionType, payload: Record<string, unknown>) => void;
  dequeue: (id: string) => void;
  clear: () => void;
}

let actionCounter = 0;

export const useOfflineQueueStore = create<OfflineQueueState>((set) => ({
  queue: [],
  enqueue: (type, payload) => {
    const id = `offline-${++actionCounter}-${Date.now()}`;
    set((s) => ({ queue: [...s.queue, { id, type, payload, createdAt: Date.now() }] }));
  },
  dequeue: (id) => set((s) => ({ queue: s.queue.filter((a) => a.id !== id) })),
  clear: () => set({ queue: [] }),
}));
