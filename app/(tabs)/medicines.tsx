import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MedicineService } from '../../src/services/medicine.service';
import { syncService } from '../../src/services/sync.service';
import { SyncStatusBar } from '../../src/components/SyncStatusBar';
import { Medicine } from '../../src/types';
import { Colors, Spacing, Typography, BorderRadius } from '../../src/constants/theme';
import { MedicineCard } from '../../src/components/medicine/MedicineCard';
import { Input } from '../../src/components/common/Input';
import { EmptyState } from '../../src/components/common/EmptyState';
import { useDebounce } from '../../src/hooks/useDebounce';
import { Search, Plus, Filter, X } from 'lucide-react-native';

type FilterType = 'ALL' | 'LOW_STOCK' | 'EXPIRING' | 'EXPIRED';

export default function MedicinesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ initialSearch?: string }>();
  const [searchTerm, setSearchTerm] = useState(params.initialSearch || '');
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
  const debouncedSearch = useDebounce(searchTerm, 350);

  useEffect(() => {
    if (params.initialSearch) {
      setSearchTerm(params.initialSearch);
    }
  }, [params.initialSearch]);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['medicines-list', debouncedSearch, activeFilter],
    queryFn: () =>
      MedicineService.search({
        query: debouncedSearch || undefined,
        isLowStock: activeFilter === 'LOW_STOCK' ? true : undefined,
        limit: 100,
      }),
  });

  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleRefresh = async () => {
    await syncService.syncNow();
    await refetch();
  };

  const medicines = data?.items || [];

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Medicine Catalog</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/medicine/new')}
          activeOpacity={0.8}
        >
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add New</Text>
        </TouchableOpacity>
      </View>

      <SyncStatusBar />

      {/* Search Input Bar */}
      <View style={styles.searchSection}>
        <Input
          placeholder="Search by name, generic, brand, barcode..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          leftIcon={<Search size={18} color={Colors.textMuted} />}
          rightIcon={
            searchTerm.length > 0 ? (
              <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            ) : undefined
          }
          containerStyle={styles.searchInput}
        />

        {/* Filter Chips Row */}
        <View style={styles.filterChipsRow}>
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'ALL' && styles.filterChipActive]}
            onPress={() => setActiveFilter('ALL')}
          >
            <Text style={[styles.filterChipText, activeFilter === 'ALL' && styles.filterChipTextActive]}>
              All ({medicines.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'LOW_STOCK' && styles.filterChipActiveWarning]}
            onPress={() => setActiveFilter('LOW_STOCK')}
          >
            <Text style={[styles.filterChipText, activeFilter === 'LOW_STOCK' && styles.filterChipTextActiveWarning]}>
              Low Stock
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'EXPIRING' && styles.filterChipActiveWarning]}
            onPress={() => setActiveFilter('EXPIRING')}
          >
            <Text style={[styles.filterChipText, activeFilter === 'EXPIRING' && styles.filterChipTextActiveWarning]}>
              Expiring Soon
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'EXPIRED' && styles.filterChipActiveDanger]}
            onPress={() => setActiveFilter('EXPIRED')}
          >
            <Text style={[styles.filterChipText, activeFilter === 'EXPIRED' && styles.filterChipTextActiveDanger]}>
              Expired
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Medicine List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Fetching medicines...</Text>
        </View>
      ) : (
        <FlatList
          data={medicines}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MedicineCard medicine={item} />}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title={searchTerm ? 'No matches found' : 'No medicines in catalog'}
              description={
                searchTerm
                  ? `No medicines matched "${searchTerm}". Try a different name, generic keyword, or barcode.`
                  : 'Start adding medicines to manage your stock, track expiry, and calculate prices.'
              }
              actionTitle={searchTerm ? 'Clear Search' : '+ Add First Medicine'}
              onAction={searchTerm ? clearSearch : () => router.push('/medicine/new')}
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
    paddingTop: Spacing.xl + 10,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  headerTitle: {
    fontSize: Typography.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  addButtonText: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  searchSection: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInput: {
    marginBottom: Spacing.xs,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: Spacing.xs + 2,
    paddingVertical: Spacing.xs,
  },
  filterChip: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.borderLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  filterChipActiveWarning: {
    backgroundColor: Colors.warningLight,
    borderColor: Colors.warning,
  },
  filterChipActiveDanger: {
    backgroundColor: Colors.dangerLight,
    borderColor: Colors.danger,
  },
  filterChipText: {
    fontSize: Typography.xs - 1,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.primaryDark,
  },
  filterChipTextActiveWarning: {
    color: Colors.warning,
  },
  filterChipTextActiveDanger: {
    color: Colors.danger,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: Spacing.sm,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
});
