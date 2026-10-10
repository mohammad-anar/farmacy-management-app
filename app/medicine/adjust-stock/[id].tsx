import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MedicineService } from '../../../src/services/medicine.service';
import { Colors, Spacing, Typography, BorderRadius } from '../../../src/constants/theme';
import { Header } from '../../../src/components/common/Header';
import { Input } from '../../../src/components/common/Input';
import { Button } from '../../../src/components/common/Button';
import { Card } from '../../../src/components/common/Card';
import { LoadingSpinner } from '../../../src/components/common/LoadingSpinner';
import { formatQuantity } from '../../../src/utils/formatters';
import { PackagePlus, RefreshCw, AlertTriangle } from 'lucide-react-native';

export default function AdjustStockModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<'RECEIPT' | 'ADJUSTMENT'>('RECEIPT');
  const [quantityInput, setQuantityInput] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [notes, setNotes] = useState('');
  const [changeType, setChangeType] = useState<'STOCK_ADJUSTMENT' | 'DAMAGED_EXPIRED' | 'STOCK_CORRECTION'>('STOCK_ADJUSTMENT');

  const { data: medicine, isLoading } = useQuery({
    queryKey: ['medicine-detail', id],
    queryFn: () => MedicineService.getById(id!),
    enabled: !!id,
  });

  const parsedQty = parseFloat(quantityInput) || 0;
  const currentQty = medicine?.quantity || 0;
  const resultingQty =
    mode === 'RECEIPT' ? currentQty + parsedQty : currentQty + parsedQty;

  const receiptMutation = useMutation({
    mutationFn: () =>
      MedicineService.receiveStock(id!, parsedQty, {
        purchasePrice: unitCost.trim() ? parseFloat(unitCost) : undefined,
        batchNumber: batchNumber.trim() || undefined,
        expiryDate: expiryDate.trim() || undefined,
        supplierName: supplierName.trim() || undefined,
        reason: notes.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicine-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['medicines-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-list'] });
      Alert.alert('Stock Inward Recorded', `Added ${parsedQty} units locally and queued for synchronization.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Could not record stock receipt.');
    },
  });

  const adjustmentMutation = useMutation({
    mutationFn: () =>
      MedicineService.adjustStock(id!, parsedQty, notes.trim() || undefined, changeType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicine-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['medicines-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-list'] });
      Alert.alert('Adjustment Recorded', 'Inventory adjustment committed locally and queued for synchronization.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Adjustment failed.');
    },
  });

  const handleSubmit = () => {
    if (parsedQty === 0) {
      Alert.alert('Invalid Quantity', 'Please enter a non-zero quantity change.');
      return;
    }

    if (resultingQty < 0) {
      Alert.alert('Insufficient Stock', `Stock cannot fall below 0. Current stock is ${currentQty}.`);
      return;
    }

    if (mode === 'RECEIPT') {
      receiptMutation.mutate();
    } else {
      adjustmentMutation.mutate();
    }
  };

  if (isLoading || !medicine) {
    return (
      <View style={styles.container}>
        <Header title="Stock Adjustment" showBack />
        <LoadingSpinner message="Loading..." />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header
        title={mode === 'RECEIPT' ? 'Inward Stock Receipt' : 'Inventory Adjustment'}
        subtitle={medicine.name}
        showBack
      />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Mode Selector */}
        <View style={styles.modeTabs}>
          <TouchableOpacity
            style={[styles.modeTab, mode === 'RECEIPT' && styles.modeTabActive]}
            onPress={() => {
              setMode('RECEIPT');
              setQuantityInput('');
            }}
          >
            <PackagePlus size={16} color={mode === 'RECEIPT' ? '#FFFFFF' : Colors.textSecondary} />
            <Text style={[styles.modeTabText, mode === 'RECEIPT' && styles.modeTabTextActive]}>
              Receive Stock
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, mode === 'ADJUSTMENT' && styles.modeTabActive]}
            onPress={() => {
              setMode('ADJUSTMENT');
              setQuantityInput('');
            }}
          >
            <RefreshCw size={16} color={mode === 'ADJUSTMENT' ? '#FFFFFF' : Colors.textSecondary} />
            <Text style={[styles.modeTabText, mode === 'ADJUSTMENT' && styles.modeTabTextActive]}>
              Manual Adjustment
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stock Level Preview Card */}
        <Card style={styles.previewCard}>
          <View style={styles.previewRow}>
            <View style={styles.previewCol}>
              <Text style={styles.previewLabel}>Current Stock</Text>
              <Text style={styles.currentQtyText}>{formatQuantity(currentQty)}</Text>
            </View>

            <View style={styles.previewDivider} />

            <View style={styles.previewCol}>
              <Text style={styles.previewLabel}>Resulting Stock</Text>
              <Text
                style={[
                  styles.resultingQtyText,
                  resultingQty < 0 ? styles.errorQtyText : null,
                ]}
              >
                {formatQuantity(resultingQty)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Form Inputs */}
        <Card style={styles.formCard}>
          <Input
            label={mode === 'RECEIPT' ? 'Received Quantity (Units)' : 'Quantity Change (+/-)'}
            required
            placeholder={mode === 'RECEIPT' ? 'e.g., 50' : 'e.g., 10 or -5'}
            keyboardType="numeric"
            value={quantityInput}
            onChangeText={setQuantityInput}
          />

          {mode === 'ADJUSTMENT' && (
            <View style={styles.reasonSelector}>
              <Text style={styles.inputLabel}>Adjustment Reason</Text>
              <View style={styles.reasonChips}>
                <TouchableOpacity
                  style={[styles.chip, changeType === 'STOCK_ADJUSTMENT' && styles.chipActive]}
                  onPress={() => setChangeType('STOCK_ADJUSTMENT')}
                >
                  <Text style={[styles.chipText, changeType === 'STOCK_ADJUSTMENT' && styles.chipTextActive]}>
                    Reconciliation
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.chip, changeType === 'DAMAGED_EXPIRED' && styles.chipActive]}
                  onPress={() => setChangeType('DAMAGED_EXPIRED')}
                >
                  <Text style={[styles.chipText, changeType === 'DAMAGED_EXPIRED' && styles.chipTextActive]}>
                    Damaged / Expired
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.chip, changeType === 'STOCK_CORRECTION' && styles.chipActive]}
                  onPress={() => setChangeType('STOCK_CORRECTION')}
                >
                  <Text style={[styles.chipText, changeType === 'STOCK_CORRECTION' && styles.chipTextActive]}>
                    Correction
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {mode === 'RECEIPT' && (
            <>
              <Input
                label="Unit Buy / Cost Price ($)"
                optional
                placeholder="e.g., 12.50"
                keyboardType="numeric"
                value={unitCost}
                onChangeText={setUnitCost}
              />

              <Input
                label="Distributor / Supplier"
                optional
                placeholder="e.g., Square Distribution"
                value={supplierName}
                onChangeText={setSupplierName}
              />
            </>
          )}

          <View style={styles.twoColumnRow}>
            <View style={styles.halfCol}>
              <Input
                label="Batch / Lot Number"
                optional
                placeholder="e.g., B-2026"
                value={batchNumber}
                onChangeText={setBatchNumber}
              />
            </View>

            {mode === 'RECEIPT' && (
              <View style={styles.halfCol}>
                <Input
                  label="Batch Expiry Date"
                  optional
                  placeholder="YYYY-MM-DD"
                  value={expiryDate}
                  onChangeText={setExpiryDate}
                />
              </View>
            )}
          </View>

          <Input
            label="Notes / Invoice Number"
            optional
            placeholder="e.g., Invoice #INV-8921"
            value={notes}
            onChangeText={setNotes}
          />
        </Card>

        <Button
          title={mode === 'RECEIPT' ? 'Record Stock Delivery' : 'Commit Adjustment'}
          onPress={handleSubmit}
          loading={receiptMutation.isPending || adjustmentMutation.isPending}
          variant="primary"
          style={styles.submitBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.lg,
    padding: 4,
    marginBottom: Spacing.md,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  modeTabActive: {
    backgroundColor: Colors.primary,
  },
  modeTabText: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  modeTabTextActive: {
    color: '#FFFFFF',
  },
  previewCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewCol: {
    flex: 1,
    alignItems: 'center',
  },
  previewDivider: {
    width: 1,
    height: 35,
    backgroundColor: Colors.border,
  },
  previewLabel: {
    fontSize: Typography.xs - 2,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  currentQtyText: {
    fontSize: Typography.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  resultingQtyText: {
    fontSize: Typography.xl,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: 2,
  },
  errorQtyText: {
    color: Colors.danger,
  },
  formCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfCol: {
    flex: 1,
  },
  inputLabel: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs + 2,
  },
  reasonSelector: {
    marginBottom: Spacing.md,
  },
  reasonChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.borderLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: Typography.xs - 1,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: Colors.primaryDark,
  },
  submitBtn: {
    marginTop: Spacing.xs,
  },
});
