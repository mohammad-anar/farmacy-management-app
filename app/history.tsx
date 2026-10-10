import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { inventoryApi } from '../src/api/inventory.api';
import { syncService } from '../src/services/sync.service';
import { SyncStatusBar } from '../src/components/SyncStatusBar';
import { Colors, Spacing, Typography, BorderRadius } from '../src/constants/theme';
import { Header } from '../src/components/common/Header';
import { Card } from '../src/components/common/Card';
import { Badge } from '../src/components/common/Badge';
import { EmptyState } from '../src/components/common/EmptyState';
import { LoadingSpinner } from '../src/components/common/LoadingSpinner';
import { formatDate, formatQuantity, formatCurrency } from '../src/utils/formatters';
import { History, ArrowRight, User } from 'lucide-react-native';

export default function HistoryScreen() {
  const router = useRouter();

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['system-inventory-history'],
    queryFn: () => inventoryApi.getHistory(1, 50),
  });

  const handleRefresh = async () => {
    await syncService.syncNow();
    await refetch();
  };

  const historyItems = data?.items || [];

  return (
    <View style={styles.container}>
      <Header
        title="Stock Audit Log"
        subtitle="Chronological record of all inventory changes"
        showBack
      />

      <SyncStatusBar />

      {isLoading ? (
        <LoadingSpinner message="Loading audit records..." />
      ) : (
        <FlatList
          data={historyItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
            />
          }
          renderItem={({ item }) => {
            const isPositive = item.quantityChanged > 0;

            return (
              <Card
                style={styles.card}
                onPress={() =>
                  item.medicineId ? router.push(`/medicine/${item.medicineId}`) : undefined
                }
              >
                <View style={styles.cardHeader}>
                  <View style={styles.titleCol}>
                    <Text style={styles.medName} numberOfLines={1}>
                      {item.medicine?.name || 'Archived Medicine'}
                    </Text>
                    <Text style={styles.reasonText} numberOfLines={1}>
                      {item.reason || item.changeType.replace(/_/g, ' ')}
                    </Text>
                  </View>

                  <Badge
                    label={`${isPositive ? '+' : ''}${formatQuantity(item.quantityChanged)}`}
                    variant={isPositive ? 'success' : 'danger'}
                    size="sm"
                  />
                </View>

                {/* Stock Movement Progression */}
                <View style={styles.progressionRow}>
                  <Text style={styles.prevQty}>
                    Prev: {formatQuantity(item.quantityBefore)}
                  </Text>
                  <ArrowRight size={14} color={Colors.textMuted} />
                  <Text style={styles.newQty}>
                    New: {formatQuantity(item.quantityAfter)}
                  </Text>
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.authorItem}>
                    <User size={12} color={Colors.textMuted} />
                    <Text style={styles.authorText}>
                      {item.user?.name || 'Owner'}
                    </Text>
                  </View>

                  <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
                </View>
              </Card>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              title="No History Recorded"
              description="No stock adjustments or receipts have been recorded yet."
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  card: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleCol: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  medName: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  reasonText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  progressionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.borderLight,
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginVertical: Spacing.xs + 2,
    alignSelf: 'flex-start',
  },
  prevQty: {
    fontSize: Typography.xs - 1,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  newQty: {
    fontSize: Typography.xs - 1,
    color: Colors.primaryDark,
    fontWeight: '800',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  authorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorText: {
    fontSize: Typography.xs - 2,
    color: Colors.textMuted,
  },
  dateText: {
    fontSize: Typography.xs - 2,
    color: Colors.textMuted,
  },
});
