import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MedicineService } from '../../src/services/medicine.service';
import { Colors, Spacing, Typography, BorderRadius } from '../../src/constants/theme';
import { Header } from '../../src/components/common/Header';
import { Card } from '../../src/components/common/Card';
import { Badge } from '../../src/components/common/Badge';
import { Button } from '../../src/components/common/Button';
import { LoadingSpinner } from '../../src/components/common/LoadingSpinner';
import { formatCurrency, formatQuantity, formatDate } from '../../src/utils/formatters';
import { useCartStore } from '../../src/store/cartStore';
import {
  Edit,
  PackagePlus,
  Calculator,
  ExternalLink,
  Trash2,
  MapPin,
  Barcode,
  Calendar,
  Layers,
  Truck,
  Building,
  FileText,
  AlertTriangle,
} from 'lucide-react-native';

export default function MedicineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const addItemToCart = useCartStore((state) => state.addItem);

  const {
    data: medicine,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['medicine-detail', id],
    queryFn: () => MedicineService.getById(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => MedicineService.deleteMedicine(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      Alert.alert('Medicine Archived', 'The medicine has been safely archived locally and queued for synchronization.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/medicines') },
      ]);
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Could not archive medicine.');
    },
  });

  const handleDelete = () => {
    Alert.alert(
      'Archive Medicine',
      'Are you sure you want to archive this medicine? Its historical stock audit records will remain preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(),
        },
      ],
    );
  };

  const handleOpenPurchaseUrl = async () => {
    if (!medicine?.onlinePurchaseUrl) return;
    try {
      const canOpen = await Linking.canOpenURL(medicine.onlinePurchaseUrl);
      if (canOpen) {
        await Linking.openURL(medicine.onlinePurchaseUrl);
      } else {
        Alert.alert('Invalid URL', `Cannot open: ${medicine.onlinePurchaseUrl}`);
      }
    } catch {
      Alert.alert('Error', 'Unable to launch purchase link.');
    }
  };

  if (isLoading || !medicine) {
    return (
      <View style={styles.container}>
        <Header title="Medicine Details" showBack />
        <LoadingSpinner message="Loading medicine details..." />
      </View>
    );
  }

  const isLowStock =
    medicine.minimumStock !== null && medicine.minimumStock !== undefined
      ? medicine.quantity <= medicine.minimumStock
      : medicine.quantity <= 0;

  return (
    <View style={styles.container}>
      <Header
        title={medicine.name}
        subtitle={medicine.category || 'Medicine Details'}
        showBack
        rightAction={
          <TouchableOpacity
            onPress={() => router.push(`/medicine/edit/${medicine.id}`)}
            style={styles.editHeaderBtn}
          >
            <Edit size={18} color={Colors.primary} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Core Stock & Price Overview Card */}
        <Card style={styles.mainCard}>
          <Text style={styles.medicineTitle}>{medicine.name}</Text>
          {(medicine.genericName || medicine.brandName || medicine.strength) && (
            <Text style={styles.medicineSubtitle}>
              {[medicine.brandName, medicine.genericName, medicine.strength]
                .filter(Boolean)
                .join(' • ')}
            </Text>
          )}

          <View style={styles.tagRow}>
            {medicine.quantity <= 0 ? (
              <Badge label="Out of Stock" variant="danger" />
            ) : isLowStock ? (
              <Badge
                label={`Low Stock (${formatQuantity(medicine.quantity)})`}
                variant="warning"
                icon={<AlertTriangle size={12} color={Colors.warning} />}
              />
            ) : (
              <Badge
                label={`In Stock: ${formatQuantity(medicine.quantity)}`}
                variant="success"
              />
            )}

            {medicine.dosageForm && (
              <Badge label={medicine.dosageForm} variant="info" style={styles.tagMargin} />
            )}

            {medicine.expiryDate && (
              <Badge
                label={`Exp: ${formatDate(medicine.expiryDate)}`}
                variant="neutral"
                icon={<Calendar size={12} color={Colors.textSecondary} />}
                style={styles.tagMargin}
              />
            )}
          </View>

          <View style={styles.priceRow}>
            <View style={styles.priceCol}>
              <Text style={styles.priceLabel}>Selling Price</Text>
              <Text style={styles.sellingPrice}>
                {formatCurrency(medicine.sellingPrice)}
              </Text>
            </View>

            {medicine.purchasePrice !== null && medicine.purchasePrice !== undefined && (
              <View style={styles.priceColRight}>
                <Text style={styles.priceLabel}>Buy / Cost Price</Text>
                <Text style={styles.costPrice}>
                  {formatCurrency(medicine.purchasePrice)}
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* Action Buttons Row */}
        <View style={styles.actionButtonsRow}>
          <Button
            title="+ Stock In / Adjust"
            onPress={() => router.push(`/medicine/adjust-stock/${medicine.id}`)}
            variant="primary"
            icon={<PackagePlus size={16} color="#FFFFFF" />}
            style={styles.flexBtn}
          />

          <Button
            title="Calculator"
            onPress={() => {
              addItemToCart(medicine, 1);
              router.push('/(tabs)/cart');
            }}
            variant="secondary"
            icon={<Calculator size={16} color={Colors.primaryDark} />}
            style={styles.flexBtn}
          />
        </View>

        {/* External Purchase URL Button */}
        {medicine.onlinePurchaseUrl ? (
          <TouchableOpacity
            style={styles.purchaseLinkCard}
            onPress={handleOpenPurchaseUrl}
            activeOpacity={0.7}
          >
            <View style={styles.purchaseLinkLeft}>
              <ExternalLink size={20} color={Colors.accent} />
              <View style={styles.purchaseLinkTextCol}>
                <Text style={styles.purchaseLinkTitle}>Re-order Online</Text>
                <Text style={styles.purchaseLinkUrl} numberOfLines={1}>
                  {medicine.onlinePurchaseUrl}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ) : null}

        {/* Clinical & Inventory Details Card */}
        <Text style={styles.sectionHeading}>Medicine Specifications</Text>
        <Card style={styles.specCard}>
          {medicine.genericName && (
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Generic Name:</Text>
              <Text style={styles.specValue}>{medicine.genericName}</Text>
            </View>
          )}

          {medicine.manufacturer && (
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Manufacturer:</Text>
              <Text style={styles.specValue}>{medicine.manufacturer}</Text>
            </View>
          )}

          {medicine.strength && (
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Strength:</Text>
              <Text style={styles.specValue}>{medicine.strength}</Text>
            </View>
          )}

          {medicine.category && (
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Category:</Text>
              <Text style={styles.specValue}>{medicine.category}</Text>
            </View>
          )}

          {medicine.minimumStock !== null && medicine.minimumStock !== undefined && (
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Min. Stock Threshold:</Text>
              <Text style={styles.specValue}>{formatQuantity(medicine.minimumStock)} units</Text>
            </View>
          )}

          {medicine.rackLocation && (
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Shelf / Rack Location:</Text>
              <Text style={styles.specValue}>{medicine.rackLocation}</Text>
            </View>
          )}

          {medicine.supplierName && (
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Supplier:</Text>
              <Text style={styles.specValue}>{medicine.supplierName}</Text>
            </View>
          )}

          {medicine.barcode && (
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Barcode:</Text>
              <Text style={styles.specValue}>{medicine.barcode}</Text>
            </View>
          )}

          {medicine.batchNumber && (
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Batch Number:</Text>
              <Text style={styles.specValue}>{medicine.batchNumber}</Text>
            </View>
          )}

          {medicine.notes && (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>Notes & Instructions:</Text>
              <Text style={styles.notesText}>{medicine.notes}</Text>
            </View>
          )}
        </Card>

        {/* Batches breakdown if batches exist */}
        {medicine.batches && medicine.batches.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>Batch Breakdown</Text>
            <Card style={styles.batchCard}>
              {medicine.batches.map((batch) => (
                <View key={batch.id} style={styles.batchRow}>
                  <View>
                    <Text style={styles.batchNumber}>Lot: {batch.batchNumber}</Text>
                    {batch.expiryDate && (
                      <Text style={styles.batchExpiry}>
                        Exp: {formatDate(batch.expiryDate)}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.batchQty}>
                    {formatQuantity(batch.quantity)} units
                  </Text>
                </View>
              ))}
            </Card>
          </>
        )}

        {/* Stock Audit History */}
        {medicine.stockHistories && medicine.stockHistories.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>Stock History Log</Text>
            {medicine.stockHistories.map((hist) => (
              <Card key={hist.id} style={styles.histCard}>
                <View style={styles.histRow}>
                  <View style={styles.histLeft}>
                    <Text style={styles.histReason}>
                      {hist.reason || hist.changeType.replace(/_/g, ' ')}
                    </Text>
                    <Text style={styles.histDate}>{formatDate(hist.timestamp)}</Text>
                  </View>
                  <Badge
                    label={`${hist.quantityChanged > 0 ? '+' : ''}${formatQuantity(hist.quantityChanged)}`}
                    variant={hist.quantityChanged > 0 ? 'success' : 'danger'}
                    size="sm"
                  />
                </View>
              </Card>
            ))}
          </>
        )}

        {/* Archive Button */}
        <TouchableOpacity
          style={styles.archiveBtn}
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <Trash2 size={16} color={Colors.danger} />
          <Text style={styles.archiveBtnText}>Archive Medicine</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
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
  editHeaderBtn: {
    padding: Spacing.xs,
  },
  mainCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  medicineTitle: {
    fontSize: Typography.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  medicineSubtitle: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: Spacing.md,
  },
  tagMargin: {
    marginLeft: Spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.md,
    marginTop: Spacing.xs,
  },
  priceCol: {
    flexDirection: 'column',
  },
  priceColRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: Typography.xs - 2,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  sellingPrice: {
    fontSize: Typography.xxl,
    fontWeight: '900',
    color: Colors.primary,
    marginTop: 2,
  },
  costPrice: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  flexBtn: {
    flex: 1,
  },
  purchaseLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.accentLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.accent,
    marginBottom: Spacing.md,
  },
  purchaseLinkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  purchaseLinkTextCol: {
    flex: 1,
  },
  purchaseLinkTitle: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.accent,
  },
  purchaseLinkUrl: {
    fontSize: Typography.xs - 1,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  specCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  specLabel: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  specValue: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  notesBox: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  notesLabel: {
    fontSize: Typography.xs - 1,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  notesText: {
    fontSize: Typography.xs,
    color: Colors.textPrimary,
    marginTop: 2,
    lineHeight: 18,
  },
  batchCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  batchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  batchNumber: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  batchExpiry: {
    fontSize: Typography.xs - 1,
    color: Colors.textMuted,
  },
  batchQty: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.primary,
  },
  histCard: {
    padding: Spacing.md,
    marginBottom: Spacing.xs + 2,
  },
  histRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  histLeft: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  histReason: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  histDate: {
    fontSize: Typography.xs - 2,
    color: Colors.textMuted,
    marginTop: 2,
  },
  archiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    padding: Spacing.md,
    marginTop: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    backgroundColor: Colors.dangerLight,
  },
  archiveBtnText: {
    color: Colors.danger,
    fontSize: Typography.sm,
    fontWeight: '700',
  },
});
