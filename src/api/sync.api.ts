import { apiClient } from './client';
import { SyncOperationType, SyncEntityType } from '../db/repositories/sync-outbox.repository';
import { Medicine } from '../types';

export interface SyncPushOperationPayload {
  operationId: string;
  operationType: SyncOperationType;
  entityType: SyncEntityType;
  entityId: string;
  clientId?: string | null;
  payload: any;
}

export interface SyncPushResponse {
  results: {
    operationId: string;
    success: boolean;
    entityId: string;
    clientId?: string;
    serverId?: string;
    record?: any;
    error?: string;
  }[];
}

export interface SyncPullResponse {
  items: Medicine[];
  serverCursor: string;
  hasMore: boolean;
}

export const syncApi = {
  push: async (operations: SyncPushOperationPayload[]): Promise<SyncPushResponse> => {
    const response = await apiClient.post<SyncPushResponse>('/sync/push', { operations });
    return response.data;
  },

  pull: async (cursor?: string | null, limit = 100): Promise<SyncPullResponse> => {
    const params: Record<string, any> = { limit };
    if (cursor) params.cursor = cursor;
    const response = await apiClient.get<SyncPullResponse>('/sync/pull', { params });
    return response.data;
  },
};
