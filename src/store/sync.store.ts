import { create } from 'zustand';
import { SyncMetadataRepository } from '../db/repositories/sync-metadata.repository';
import { SyncOutboxRepository } from '../db/repositories/sync-outbox.repository';

export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: string | null;
  syncError: string | null;
  setOnline: (online: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setPendingCount: (count: number) => void;
  setLastSyncTime: (time: string | null) => void;
  setSyncError: (error: string | null) => void;
  loadInitialState: () => Promise<void>;
}

export const useSyncStore = create<SyncState>((set) => ({
  isOnline: true,
  isSyncing: false,
  pendingCount: 0,
  lastSyncTime: null,
  syncError: null,

  setOnline: (isOnline) => set({ isOnline }),
  setSyncing: (isSyncing) => set({ isSyncing }),
  setPendingCount: (pendingCount) => set({ pendingCount }),
  setLastSyncTime: (lastSyncTime) => set({ lastSyncTime }),
  setSyncError: (syncError) => set({ syncError }),

  loadInitialState: async () => {
    try {
      const [pendingCount, lastSyncTime] = await Promise.all([
        SyncOutboxRepository.getPendingCount(),
        SyncMetadataRepository.getLastSyncTime(),
      ]);
      set({ pendingCount, lastSyncTime });
    } catch (err) {
      console.warn('[SyncStore] Failed to load initial sync metadata:', err);
    }
  },
}));
