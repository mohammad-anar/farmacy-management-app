import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { inventoryApi } from '../../src/api/inventory.api';
import { MedicineService } from '../../src/services/medicine.service';
import { syncService } from '../../src/services/sync.service';
import { SyncStatusBar } from '../../src/components/SyncStatusBar';
import { useAuthStore } from '../../src/store/authStore';
import { Colors, Spacing, Typography, BorderRadius } from '../../src/constants/theme';
import { StatCard } from '../../src/components/dashboard/StatCard';
import { Input } from '../../src/components/common/Input';
import { Badge } from '../../src/components/common/Badge';
import { Card } from '../../src/components/common/Card';
import { formatCurrency, formatQuantity, formatDate } from '../../src/utils/formatters';
import {
  Pill,
  AlertTriangle,
  Calendar,
  Search,
  PlusCircle,
  Calculator,
  History,
  TrendingUp,
  PackagePlus,
  Clock,
} from 'lucide-react-native';

export default function DashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: summary,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => MedicineService.getDashboardSummary(),
  });

  const {
    data: recentHistory,
    isLoading: isHistoryLoading,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ['recent-history'],
    queryFn: async () => {
      try {
        return await inventoryApi.getHistory(1, 5);
      } catch {
        return { items: [], meta: { total: 0, page: 1, limit: 5, totalPages: 0 } };
      }
    },
  });

  const onRefresh = async () => {
    await syncService.syncNow();
    await Promise.all([refetchSummary(), refetchHistory()]);
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      router.push({
        pathname: '/(tabs)/medicines',
        params: { initialSearch: searchQuery.trim() },
      });
    } else {
      router.push('/(tabs)/medicines');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.greetingText}>
            {user?.pharmacyName || 'Pharmacy Dashboard'}
          </Text>
          <Text style={styles.ownerName}>
            Welcome, {user?.name || 'Owner'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addIconButton}
          onPress={() => router.push('/medicine/new')}
          activeOpacity={0.7}
        >
          <PlusCircle size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <SyncStatusBar />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isSummaryLoading || isHistoryLoading}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Prominent Search Bar */}
        <Input
          placeholder="Search name, generic, brand, barcode..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearchSubmit}
          returnKeyType="search"
          leftIcon={<Search size={18} color={Colors.textMuted} />}
          containerStyle={styles.searchContainer}
        />

        {/* Quick Actions Grid */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={styles.actionChip}
            onPress={() => router.push('/medicine/new')}
            activeOpacity={0.7}
          >
            <PlusCircle size={18} color={Colors.primary} />
            <Text style={styles.actionChipText}>+ New Medicine</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionChip}
            onPress={() => router.push('/(tabs)/cart')}
            activeOpacity={0.7}
          >
            <Calculator size={18} color={Colors.accent} />
            <Text style={styles.actionChipText}>Price Calculator</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionChip}
            onPress={() => router.push('/expiry')}
            activeOpacity={0.7}
          >
            <Calendar size={18} color={Colors.warning} />
            <Text style={styles.actionChipText}>Expiry Alerts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionChip}
            onPress={() => router.push('/history')}
            activeOpacity={0.7}
          >
            <History size={18} color={Colors.textSecondary} />
            <Text style={styles.actionChipText}>Stock History</Text>
          </TouchableOpacity>
        </View>

        {/* Core Metrics 2x2 Grid */}
        <Text style={styles.sectionTitle}>Inventory Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Medicines"
            value={summary?.totalMedicines ?? '—'}
            subtitle={`${formatQuantity(summary?.totalStockUnits)} units in stock`}
            icon={<Pill size={20} color={Colors.primary} />}
            variant="primary"
            onPress={() => router.push('/(tabs)/medicines')}
          />

          <StatCard
            title="Low Stock Alerts"
            value={summary?.lowStockCount ?? '—'}
            subtitle="Needs re-ordering"
            icon={<AlertTriangle size={20} color={Colors.warning} />}
            variant="warning"
            onPress={() => router.push('/(tabs)/low-stock')}
          />

          <StatCard
            title="Expiring Soon"
            value={summary?.expiringSoonCount ?? '—'}
            subtitle="Within 30 days"
            icon={<Clock size={20} color={Colors.warning} />}
            variant="warning"
            onPress={() => router.push('/expiry')}
          />

          <StatCard
            title="Expired Items"
            value={summary?.expiredCount ?? '—'}
            subtitle="Immediate write-off"
            icon={<Calendar size={20} color={Colors.danger} />}
            variant="danger"
            onPress={() => router.push('/expiry')}
          />
        </View>

        {/* Valuation Card */}
        {summary && (
          <Card style={styles.valuationCard}>
            <View style={styles.valuationRow}>
              <View style={styles.valuationCol}>
                <Text style={styles.valuationLabel}>Estimated Retail Value</Text>
                <Text style={styles.valuationAmount}>
                  {formatCurrency(summary.totalSellingValue)}
                </Text>
              </View>

              <View style={styles.valuationColRight}>
                <Text style={styles.valuationLabel}>Total Purchase Cost</Text>
                <Text style={styles.valuationCost}>
                  {formatCurrency(summary.totalCostValue)}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Recent Stock Activity */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Stock Activity</Text>
          <TouchableOpacity onPress={() => router.push('/history')}>
            <Text style={styles.viewAllText}>View Log</Text>
          </TouchableOpacity>
        </View>

        {recentHistory?.items && recentHistory.items.length > 0 ? (
          recentHistory.items.map((item) => (
            <Card key={item.id} style={styles.historyCard}>
              <View style={styles.historyRow}>
                <View style={styles.historyLeft}>
                  <Text style={styles.historyMedName} numberOfLines={1}>
                    {item.medicine?.name || 'Medicine'}
                  </Text>
                  <Text style={styles.historyReason} numberOfLines={1}>
                    {item.reason || item.changeType.replace(/_/g, ' ')}
                  </Text>
                </View>

                <View style={styles.historyRight}>
                  <Badge
                    label={`${item.quantityChanged > 0 ? '+' : ''}${formatQuantity(item.quantityChanged)}`}
                    variant={item.quantityChanged > 0 ? 'success' : 'danger'}
                    size="sm"
                  />
                  <Text style={styles.historyDate}>{formatDate(item.timestamp)}</Text>
                </View>
              </View>
            </Card>
          ))
        ) : (
          <Card style={styles.emptyHistoryCard}>
            <Text style={styles.emptyHistoryText}>No recent stock movements recorded.</Text>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl + 10,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  greetingText: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.primary,
  },
  ownerName: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addIconButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  searchContainer: {
    marginBottom: Spacing.md,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionChipText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginLeft: Spacing.xs + 2,
  },
  sectionTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  viewAllText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  valuationCard: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryBorder,
    marginBottom: Spacing.md,
  },
  valuationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  valuationCol: {
    flex: 1,
  },
  valuationColRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  valuationLabel: {
    fontSize: Typography.xs - 1,
    fontWeight: '600',
    color: Colors.primaryDark,
    textTransform: 'uppercase',
  },
  valuationAmount: {
    fontSize: Typography.xl,
    fontWeight: '800',
    color: Colors.primaryDark,
    marginTop: 2,
  },
  valuationCost: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: 4,
  },
  historyCard: {
    padding: Spacing.md,
    marginBottom: Spacing.xs + 2,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyLeft: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  historyMedName: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  historyReason: {
    fontSize: Typography.xs - 1,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyDate: {
    fontSize: Typography.xs - 2,
    color: Colors.textMuted,
    marginTop: 4,
  },
  emptyHistoryCard: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  emptyHistoryText: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
});
