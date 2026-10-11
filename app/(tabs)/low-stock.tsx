import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { MedicineService } from '../../src/services/medicine.service';
import { syncService } from '../../src/services/sync.service';
import { SyncStatusBar } from '../../src/components/SyncStatusBar';
import { LowStockItem } from '../../src/types';
import { Colors, Spacing, Typography, BorderRadius } from '../../src/constants/theme';
import { Card } from '../../src/components/common/Card';
import { Badge } from '../../src/components/common/Badge';
import { EmptyState } from '../../src/components/common/EmptyState';
import { LoadingSpinner } from '../../src/components/common/LoadingSpinner';
import { formatQuantity } from '../../src/utils/formatters';
import {
  AlertTriangle,
  ExternalLink,
  PackagePlus,
  MapPin,
  Truck,
  CheckCircle,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LowStockScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: lowStockItems, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['low-stock-list'],
    queryFn: () => MedicineService.getLowStock(),
  });

  const handleRefresh = async () => {
    await syncService.syncNow();
    await refetch();
  };

  const handleOpenPurchaseUrl = async (url: string | null | undefined, name: string) => {
    if (!url) {
      Alert.alert('No Link', `No external purchase URL configured for ${name}.`);
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Invalid URL', `Cannot open URL: ${url}`);
      }
    } catch {
      Alert.alert('Error', `Could not open purchase link.`);
    }
  };

  const items = lowStockItems || [];

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top, 12) + Spacing.xs },
        ]}
      >
        <View>
          <Text style={styles.headerTitle}>Low Stock Monitoring</Text>
          <Text style={styles.headerSubtitle}>
            Medicines at or below configured minimum thresholds
          </Text>
        </View>

        <Badge
          label={`${items.length} Alerts`}
          variant={items.length > 0 ? 'warning' : 'success'}
          size="md"
          icon={
            items.length > 0 ? (
              <AlertTriangle size={14} color={Colors.warning} />
            ) : (
              <CheckCircle size={14} color={Colors.success} />
            )
          }
        />
      </View>

      <SyncStatusBar />

      {isLoading ? (
        <LoadingSpinner message="Checking stock thresholds..." />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
            />
          }
          renderItem={({ item }) => (
            <Card
              style={styles.card}
              onPress={() => router.push(`/medicine/${item.id}`)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.titleCol}>
                  <Text style={styles.medName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {(item.genericName || item.brandName) && (
                    <Text style={styles.genericText} numberOfLines={1}>
                      {item.brandName || item.genericName}
                    </Text>
                  )}
                </View>

                <Badge
                  label={`Short by ${formatQuantity(item.shortage)}`}
                  variant="danger"
                  size="sm"
                />
              </View>

              {/* Stock Comparison Meter */}
              <View style={styles.meterContainer}>
                <View style={styles.meterRow}>
                  <View style={styles.meterBox}>
                    <Text style={styles.meterLabel}>Current Stock</Text>
                    <Text
                      style={[
                        styles.meterValue,
                        item.currentQuantity <= 0 ? styles.outOfStockText : styles.lowStockText,
                      ]}
                    >
                      {formatQuantity(item.currentQuantity)}
                    </Text>
                  </View>

                  <View style={styles.meterDivider} />

                  <View style={styles.meterBox}>
                    <Text style={styles.meterLabel}>Min. Threshold</Text>
                    <Text style={styles.meterValue}>
                      {formatQuantity(item.minimumStock)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Location & Supplier metadata */}
              <View style={styles.metaRow}>
                {item.rackLocation ? (
                  <View style={styles.metaItem}>
                    <MapPin size={12} color={Colors.textMuted} />
                    <Text style={styles.metaText}>{item.rackLocation}</Text>
                  </View>
                ) : null}

                {item.supplierName ? (
                  <View style={styles.metaItem}>
                    <Truck size={12} color={Colors.textMuted} />
                    <Text style={styles.metaText}>{item.supplierName}</Text>
                  </View>
                ) : null}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.stockInBtn}
                  onPress={() => router.push(`/medicine/adjust-stock/${item.id}`)}
                  activeOpacity={0.7}
                >
                  <PackagePlus size={14} color="#FFFFFF" />
                  <Text style={styles.stockInBtnText}>+ Stock In</Text>
                </TouchableOpacity>

                {item.onlinePurchaseUrl ? (
                  <TouchableOpacity
                    style={styles.reorderBtn}
                    onPress={() => handleOpenPurchaseUrl(item.onlinePurchaseUrl, item.name)}
                    activeOpacity={0.7}
                  >
                    <ExternalLink size={14} color={Colors.accent} />
                    <Text style={styles.reorderBtnText}>Re-order Online</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </Card>
          )}
          ListEmptyComponent={
            <EmptyState
              title="Healthy Inventory"
              description="No medicines are currently below their minimum threshold. Stock levels look optimal!"
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: Typography.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  card: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
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
  genericText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  meterContainer: {
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  meterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meterBox: {
    flex: 1,
    alignItems: 'center',
  },
  meterDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  meterLabel: {
    fontSize: Typography.xs - 2,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  meterValue: {
    fontSize: Typography.md,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  lowStockText: {
    color: Colors.warning,
  },
  outOfStockText: {
    color: Colors.danger,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xs + 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: Typography.xs - 1,
    color: Colors.textSecondary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  stockInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  stockInBtnText: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentLight,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  reorderBtnText: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.accent,
    marginLeft: 4,
  },
});
