import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSyncStore } from '../store/sync.store';
import { syncService } from '../services/sync.service';

export const SyncStatusBar: React.FC = () => {
  const { isOnline, isSyncing, pendingCount, lastSyncTime, syncError } = useSyncStore();

  const handleSyncPress = () => {
    syncService.syncNow();
  };

  // Format last sync time
  const formatLastSync = (iso: string | null) => {
    if (!iso) return 'Never synced';
    const date = new Date(iso);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[styles.container, !isOnline && styles.containerOffline]}>
      <View style={styles.leftRow}>
        <View style={[styles.dot, isOnline ? styles.dotOnline : styles.dotOffline]} />
        <Text style={styles.statusText}>
          {isOnline ? 'Online' : 'Offline Mode'}
        </Text>
        {pendingCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {pendingCount} pending
            </Text>
          </View>
        )}
      </View>

      <View style={styles.rightRow}>
        <Text style={styles.timeText}>
          Sync: {formatLastSync(lastSyncTime)}
        </Text>
        <TouchableOpacity
          style={[styles.syncButton, (isSyncing || !isOnline) && styles.syncButtonDisabled]}
          onPress={handleSyncPress}
          disabled={isSyncing || !isOnline}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color="#0D9488" />
          ) : (
            <Ionicons name="sync-outline" size={16} color={isOnline ? '#0D9488' : '#9CA3AF'} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#CCFBF1',
  },
  containerOffline: {
    backgroundColor: '#FFFBEB',
    borderBottomColor: '#FEF3C7',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  dotOnline: {
    backgroundColor: '#10B981',
  },
  dotOffline: {
    backgroundColor: '#F59E0B',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  badge: {
    backgroundColor: '#FEF08A',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#854D0E',
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 11,
    color: '#6B7280',
    marginRight: 8,
  },
  syncButton: {
    padding: 4,
    borderRadius: 4,
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
});
