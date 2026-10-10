import NetInfo from '@react-native-community/netinfo';
import { AppState, AppStateStatus } from 'react-native';
import { syncApi } from '../api/sync.api';
import { MedicineRepository } from '../db/repositories/medicine.repository';
import { SyncMetadataRepository } from '../db/repositories/sync-metadata.repository';
import { SyncOutboxRepository } from '../db/repositories/sync-outbox.repository';
import { useSyncStore } from '../store/sync.store';
import { useAuthStore } from '../store/authStore';

class SyncService {
  private isSyncInProgress = false;
  private syncDebounceTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;

  /**
   * Initialize network listener, app state listener, and recover interrupted syncs
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // 1. Reset any outbox entries left in 'syncing' status on app restart
    await SyncOutboxRepository.resetInFlightOperations();

    // 2. Load sync store initial state
    await useSyncStore.getState().loadInitialState();

    // 3. Network listener
    NetInfo.addEventListener((state) => {
      const isOnline = !!(state.isConnected && state.isInternetReachable !== false);
      useSyncStore.getState().setOnline(isOnline);

      if (isOnline) {
        this.triggerSyncIfOnline();
      }
    });

    // 4. App State foreground listener
    AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        this.triggerSyncIfOnline();
      }
    });

    // Initial sync trigger
    this.triggerSyncIfOnline();
  }

  /**
   * Trigger sync with debounce if user is authenticated and device is online
   */
  triggerSyncIfOnline(): void {
    const { isOnline } = useSyncStore.getState();
    const { isAuthenticated } = useAuthStore.getState();

    if (!isOnline || !isAuthenticated) return;

    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
    }

    this.syncDebounceTimer = setTimeout(() => {
      this.syncNow().catch((err) => {
        console.warn('[SyncService] Auto-sync encountered error:', err.message);
      });
    }, 1000);
  }

  /**
   * Main synchronization routine: Push pending outbox mutations -> Pull server changes
   */
  async syncNow(): Promise<{ success: boolean; pushed: number; pulled: number; error?: string }> {
    if (this.isSyncInProgress) {
      return { success: true, pushed: 0, pulled: 0 };
    }

    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      return { success: false, pushed: 0, pulled: 0, error: 'User is not authenticated' };
    }

    this.isSyncInProgress = true;
    useSyncStore.getState().setSyncing(true);
    useSyncStore.getState().setSyncError(null);

    let pushedCount = 0;
    let pulledCount = 0;

    try {
      // ==========================================
      // 1. PUSH PHASE: Send pending outbox entries
      // ==========================================
      const pendingEntries = await SyncOutboxRepository.getPending(50);
      if (pendingEntries.length > 0) {
        const entryIds = pendingEntries.map((e) => e.id);
        await SyncOutboxRepository.markSyncing(entryIds);

        const pushPayload = pendingEntries.map((e) => ({
          operationId: e.id,
          operationType: e.operationType,
          entityType: e.entityType,
          entityId: e.entityId,
          clientId: e.clientId,
          payload: e.payload,
        }));

        try {
          const pushResponse = await syncApi.push(pushPayload);
          const syncedIds: string[] = [];

          for (const result of pushResponse.results) {
            if (result.success) {
              syncedIds.push(result.operationId);
              // Reconcile client_id with server_id if applicable
              if (result.clientId && result.serverId) {
                await MedicineRepository.reconcileServerId(result.clientId, result.serverId);
              }
            } else {
              await SyncOutboxRepository.markFailed(
                result.operationId,
                result.error || 'Server rejected operation',
              );
            }
          }

          if (syncedIds.length > 0) {
            await SyncOutboxRepository.markSynced(syncedIds);
            pushedCount = syncedIds.length;
          }
        } catch (pushErr: any) {
          console.warn('[SyncService Push Error]:', pushErr.message);
          // Mark in-flight operations as failed for retry
          for (const entry of pendingEntries) {
            await SyncOutboxRepository.markFailed(entry.id, pushErr.message || 'Network error during push');
          }
        }
      }

      // ==========================================
      // 2. PULL PHASE: Download incremental updates
      // ==========================================
      try {
        const cursor = await SyncMetadataRepository.getServerCursor();
        const pullResponse = await syncApi.pull(cursor, 100);

        if (pullResponse.items && pullResponse.items.length > 0) {
          await MedicineRepository.upsertMany(pullResponse.items, 'synced');
          pulledCount = pullResponse.items.length;
        }

        if (pullResponse.serverCursor) {
          await SyncMetadataRepository.setServerCursor(pullResponse.serverCursor);
        }

        const now = new Date().toISOString();
        await SyncMetadataRepository.setLastSyncTime(now);
        useSyncStore.getState().setLastSyncTime(now);
      } catch (pullErr: any) {
        console.warn('[SyncService Pull Error]:', pullErr.message);
      }

      // Refresh store state
      const remainingPending = await SyncOutboxRepository.getPendingCount();
      useSyncStore.getState().setPendingCount(remainingPending);

      return { success: true, pushed: pushedCount, pulled: pulledCount };
    } catch (error: any) {
      const msg = error.message || 'Synchronization failed';
      useSyncStore.getState().setSyncError(msg);
      return { success: false, pushed: pushedCount, pulled: pulledCount, error: msg };
    } finally {
      this.isSyncInProgress = false;
      useSyncStore.getState().setSyncing(false);
    }
  }
}

export const syncService = new SyncService();
