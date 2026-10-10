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
    const response: any = await apiClient.post('/sync/push', { operations });
    if (response?.results) return response;
    if (response?.data?.results) return response.data;
    return { results: [] };
  },

  pull: async (cursor?: string | null, limit = 100): Promise<SyncPullResponse> => {
    const params: Record<string, any> = { limit };
    if (cursor) params.cursor = cursor;
    const response: any = await apiClient.get('/sync/pull', { params });
    if (response?.items !== undefined) return response;
    if (response?.data?.items !== undefined) return response.data;
    return { items: [], serverCursor: cursor || '', hasMore: false };
  },
};
