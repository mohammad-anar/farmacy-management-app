import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useCartStore } from '../../src/store/cartStore';
import { MedicineService } from '../../src/services/medicine.service';
import { SyncStatusBar } from '../../src/components/SyncStatusBar';
import { Medicine } from '../../src/types';
import { Colors, Spacing, Typography, BorderRadius } from '../../src/constants/theme';
import { CartItemCard } from '../../src/components/cart/CartItemCard';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import { EmptyState } from '../../src/components/common/EmptyState';
import { formatCurrency, formatQuantity } from '../../src/utils/formatters';
import { useDebounce } from '../../src/hooks/useDebounce';
import {
  Calculator,
  Plus,
  Trash2,
  Info,
  Search,
  X,
  Pill,
} from 'lucide-react-native';

export default function CartCalculatorScreen() {
  const { items, clearCart, getSubtotal, getItemCount, addItem, refreshPrices } = useCartStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const debouncedPickerSearch = useDebounce(pickerSearch, 300);

  const { data: searchResults, isLoading: isSearchLoading } = useQuery({
    queryKey: ['cart-picker-search', debouncedPickerSearch],
    queryFn: () => MedicineService.search({ query: debouncedPickerSearch, limit: 30 }),
    enabled: modalVisible,
  });

  const grandTotal = getSubtotal();
  const totalItemCount = getItemCount();

  const handleSelectMedicine = (med: Medicine) => {
    addItem(med, 1);
    setModalVisible(false);
    setPickerSearch('');
  };

  const handleRefreshPrices = async () => {
    try {
      const catalog = await MedicineService.search({ limit: 200 });
      refreshPrices(catalog.items);
    } catch {
      // Ignore failures
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Price Calculator</Text>
          <Text style={styles.headerSubtitle}>
            Temporary price estimator for customer inquiries
          </Text>
        </View>

        {items.length > 0 && (
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <TouchableOpacity
              onPress={handleRefreshPrices}
              style={styles.refreshPricesBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.refreshPricesText}>Sync Prices</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={clearCart}
              style={styles.clearBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Trash2 size={16} color={Colors.danger} />
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <SyncStatusBar />

      {/* Isolation Notice Banner */}
      <View style={styles.noticeBanner}>
        <Info size={16} color={Colors.accent} style={styles.noticeIcon} />
        <Text style={styles.noticeText}>
          Temporary Calculator Only: Does not record sales, take payments, or deduct stock.
        </Text>
      </View>

      {/* Cart Items List */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.medicine.id}
        renderItem={({ item }) => <CartItemCard item={item} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            title="Calculator is Empty"
            description="Add medicines to calculate unit subtotals and estimated grand totals."
            actionTitle="+ Add Medicine"
            onAction={() => setModalVisible(true)}
          />
        }
      />

      {/* Floating Add Item Bar & Grand Total Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.itemCountLabel}>
              {totalItemCount} {totalItemCount === 1 ? 'Unit' : 'Units'} Selected
            </Text>
            <Text style={styles.grandTotalLabel}>Estimated Total</Text>
          </View>
          <Text style={styles.grandTotalValue}>{formatCurrency(grandTotal)}</Text>
        </View>

        <Button
          title="+ Add Medicine to Calculator"
          onPress={() => setModalVisible(true)}
          variant="primary"
          style={styles.addMoreBtn}
        />
      </View>

      {/* Medicine Picker Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Medicine</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
              <X size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalSearch}>
            <Input
              placeholder="Search medicine to add..."
              value={pickerSearch}
              onChangeText={setPickerSearch}
              leftIcon={<Search size={18} color={Colors.textMuted} />}
              autoFocus
            />
          </View>

          <ScrollView contentContainerStyle={styles.modalList}>
            {searchResults?.items && searchResults.items.length > 0 ? (
              searchResults.items.map((med) => (
                <TouchableOpacity
                  key={med.id}
                  style={styles.pickerItem}
                  onPress={() => handleSelectMedicine(med)}
                  activeOpacity={0.7}
                >
                  <View style={styles.pickerItemIcon}>
                    <Pill size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.pickerItemInfo}>
                    <Text style={styles.pickerItemName} numberOfLines={1}>
                      {med.name}
                    </Text>
                    <Text style={styles.pickerItemSubtitle} numberOfLines={1}>
                      {[med.brandName, med.genericName, med.strength].filter(Boolean).join(' • ')}
                    </Text>
                  </View>
                  <Text style={styles.pickerItemPrice}>{formatCurrency(med.sellingPrice)}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <EmptyState
                title="No medicines found"
                description="Type a name, generic term, or brand to search."
              />
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  headerSubtitle: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearBtnText: {
    fontSize: Typography.xs,
    color: Colors.danger,
    fontWeight: '700',
  },
  refreshPricesBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  refreshPricesText: {
    fontSize: Typography.xs - 1,
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  noticeIcon: {
    marginRight: Spacing.sm,
  },
  noticeText: {
    flex: 1,
    fontSize: Typography.xs - 1,
    color: Colors.accent,
    fontWeight: '600',
    lineHeight: 16,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 160,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  itemCountLabel: {
    fontSize: Typography.xs - 1,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  grandTotalLabel: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  grandTotalValue: {
    fontSize: Typography.xxl,
    fontWeight: '900',
    color: Colors.primary,
  },
  addMoreBtn: {
    width: '100%',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  modalSearch: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
  },
  modalList: {
    padding: Spacing.md,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs + 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  pickerItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  pickerItemInfo: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  pickerItemName: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  pickerItemSubtitle: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  pickerItemPrice: {
    fontSize: Typography.md,
    fontWeight: '800',
    color: Colors.primary,
  },
});
