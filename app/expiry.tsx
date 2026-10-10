import React, { useState } from 'react';
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
import { MedicineService } from '../src/services/medicine.service';
import { syncService } from '../src/services/sync.service';
import { SyncStatusBar } from '../src/components/SyncStatusBar';
import { ExpiringItem } from '../src/types';
import { Colors, Spacing, Typography, BorderRadius } from '../src/constants/theme';
import { Header } from '../src/components/common/Header';
import { Card } from '../src/components/common/Card';
import { Badge } from '../src/components/common/Badge';
import { EmptyState } from '../src/components/common/EmptyState';
import { LoadingSpinner } from '../src/components/common/LoadingSpinner';
import { formatDate, formatQuantity } from '../src/utils/formatters';
import { Calendar, AlertOctagon, Clock, Layers } from 'lucide-react-native';

export default function ExpiryScreen() {
  const router = useRouter();
  const [windowDays, setWindowDays] = useState<number>(30);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['expiring-medicines', windowDays],
    queryFn: () => MedicineService.getExpiring(windowDays),
  });

  const handleRefresh = async () => {
    await syncService.syncNow();
    await refetch();
  };

  const expiredList = data?.expired || [];
  const expiringSoonList = data?.expiringSoon || [];
  const allItems: ExpiringItem[] = [...expiredList, ...expiringSoonList];

  return (
    <View style={styles.container}>
      <Header
        title="Expiry Tracking"
        subtitle={`Monitoring expired & approaching expiry within ${windowDays} days`}
        showBack
      />

      <SyncStatusBar />

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterBtn, windowDays === 15 && styles.filterBtnActive]}
          onPress={() => setWindowDays(15)}
        >
          <Text style={[styles.filterText, windowDays === 15 && styles.filterTextActive]}>
            15 Days
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterBtn, windowDays === 30 && styles.filterBtnActive]}
          onPress={() => setWindowDays(30)}
        >
          <Text style={[styles.filterText, windowDays === 30 && styles.filterTextActive]}>
            30 Days
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterBtn, windowDays === 60 && styles.filterBtnActive]}
          onPress={() => setWindowDays(60)}
        >
          <Text style={[styles.filterText, windowDays === 60 && styles.filterTextActive]}>
            60 Days
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterBtn, windowDays === 90 && styles.filterBtnActive]}
          onPress={() => setWindowDays(90)}
        >
          <Text style={[styles.filterText, windowDays === 90 && styles.filterTextActive]}>
            90 Days
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary Counts Banner */}
      <View style={styles.summaryBanner}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Expired Items</Text>
          <Text style={styles.expiredCount}>{expiredList.length}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Expiring Soon</Text>
          <Text style={styles.expiringCount}>{expiringSoonList.length}</Text>
        </View>
      </View>

      {isLoading ? (
        <LoadingSpinner message="Evaluating shelf life & batch expiries..." />
      ) : (
        <FlatList
          data={allItems}
          keyExtractor={(item, index) => `${item.medicineId}-${item.batchId || index}`}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
            />
          }
          renderItem={({ item }) => {
            const isExpired = item.status === 'EXPIRED';

            return (
              <Card
                style={styles.card}
                onPress={() => router.push(`/medicine/${item.medicineId}`)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.nameCol}>
                    <Text style={styles.medName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {item.genericName && (
                      <Text style={styles.genericName} numberOfLines={1}>
                        {item.genericName}
                      </Text>
                    )}
                  </View>

                  <Badge
                    label={
                      isExpired
                        ? 'Expired'
                        : `${item.daysRemaining} days left`
                    }
                    variant={isExpired ? 'danger' : 'warning'}
                    size="sm"
                    icon={
                      isExpired ? (
                        <AlertOctagon size={12} color={Colors.danger} />
                      ) : (
                        <Clock size={12} color={Colors.warning} />
                      )
                    }
                  />
                </View>

                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <Calendar size={13} color={Colors.textMuted} />
                    <Text style={styles.detailText}>
                      Expiry: {formatDate(item.expiryDate)}
                    </Text>
                  </View>

                  {item.batchNumber ? (
                    <View style={styles.detailItem}>
                      <Layers size={13} color={Colors.textMuted} />
                      <Text style={styles.detailText}>
                        Batch: {item.batchNumber}
                      </Text>
                    </View>
                  ) : null}

                  <Text style={styles.qtyText}>
                    Stock: {formatQuantity(item.quantity || item.totalQuantity)}
                  </Text>
                </View>
              </Card>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              title="No Expiry Alerts"
              description={`No medicines or active batches are expired or expiring within ${windowDays} days.`}
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
  filterRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.borderLight,
  },
  filterBtnActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: Typography.xs - 1,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  summaryBanner: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  summaryLabel: {
    fontSize: Typography.xs - 1,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  expiredCount: {
    fontSize: Typography.xl,
    fontWeight: '800',
    color: Colors.danger,
    marginTop: 2,
  },
  expiringCount: {
    fontSize: Typography.xl,
    fontWeight: '800',
    color: Colors.warning,
    marginTop: 2,
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
    marginBottom: Spacing.xs + 2,
  },
  nameCol: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  medName: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  genericName: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: Typography.xs - 1,
    color: Colors.textSecondary,
  },
  qtyText: {
    fontSize: Typography.xs - 1,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});
