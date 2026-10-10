import React, { useEffect, useState } from 'react';
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
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MedicineService } from '../../../src/services/medicine.service';
import { medicineFormSchema, MedicineFormData } from '../../../src/validation/medicineSchema';
import { Colors, Spacing, Typography, BorderRadius } from '../../../src/constants/theme';
import { Header } from '../../../src/components/common/Header';
import { Input } from '../../../src/components/common/Input';
import { Button } from '../../../src/components/common/Button';
import { Card } from '../../../src/components/common/Card';
import { LoadingSpinner } from '../../../src/components/common/LoadingSpinner';
import { ChevronDown, ChevronUp } from 'lucide-react-native';

export default function EditMedicineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [showClinicalSection, setShowClinicalSection] = useState(true);
  const [showInventorySection, setShowInventorySection] = useState(true);
  const [showExpirySection, setShowExpirySection] = useState(true);

  const { data: medicine, isLoading } = useQuery({
    queryKey: ['medicine-detail', id],
    queryFn: () => MedicineService.getById(id!),
    enabled: !!id,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MedicineFormData>({
    resolver: zodResolver(medicineFormSchema),
  });

  useEffect(() => {
    if (medicine) {
      reset({
        name: medicine.name || '',
        sellingPrice: medicine.sellingPrice?.toString() || '',
        quantity: medicine.quantity?.toString() || '',
        genericName: medicine.genericName || '',
        brandName: medicine.brandName || '',
        manufacturer: medicine.manufacturer || '',
        strength: medicine.strength || '',
        dosageForm: medicine.dosageForm || '',
        category: medicine.category || '',
        barcode: medicine.barcode || '',
        purchasePrice: medicine.purchasePrice ? medicine.purchasePrice.toString() : '',
        minimumStock: medicine.minimumStock !== null && medicine.minimumStock !== undefined ? medicine.minimumStock.toString() : '',
        rackLocation: medicine.rackLocation || '',
        supplierName: medicine.supplierName || '',
        batchNumber: medicine.batchNumber || '',
        expiryDate: medicine.expiryDate ? medicine.expiryDate.split('T')[0] : '',
        notes: medicine.notes || '',
        onlinePurchaseUrl: medicine.onlinePurchaseUrl || '',
      });
    }
  }, [medicine]);

  const updateMutation = useMutation({
    mutationFn: (data: MedicineFormData) => {
      const payload: any = {
        name: data.name.trim(),
        sellingPrice: parseFloat(data.sellingPrice),
        quantity: parseFloat(data.quantity),
        genericName: data.genericName?.trim() || null,
        brandName: data.brandName?.trim() || null,
        manufacturer: data.manufacturer?.trim() || null,
        strength: data.strength?.trim() || null,
        dosageForm: data.dosageForm?.trim() || null,
        category: data.category?.trim() || null,
        barcode: data.barcode?.trim() || null,
        purchasePrice: data.purchasePrice?.trim() ? parseFloat(data.purchasePrice) : null,
        minimumStock: data.minimumStock?.trim() ? parseFloat(data.minimumStock) : null,
        rackLocation: data.rackLocation?.trim() || null,
        supplierName: data.supplierName?.trim() || null,
        batchNumber: data.batchNumber?.trim() || null,
        expiryDate: data.expiryDate?.trim() || null,
        notes: data.notes?.trim() || null,
        onlinePurchaseUrl: data.onlinePurchaseUrl?.trim() || null,
      };

      return MedicineService.updateMedicine(id!, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicine-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['medicines-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-list'] });
      Alert.alert('Success', 'Medicine record updated locally and queued for synchronization!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (err: any) => {
      const message =
        err.response?.data?.message || err.message || 'Failed to update medicine';
      Alert.alert('Error', typeof message === 'string' ? message : JSON.stringify(message));
    },
  });

  if (isLoading || !medicine) {
    return (
      <View style={styles.container}>
        <Header title="Edit Medicine" showBack />
        <LoadingSpinner message="Loading medicine details..." />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header title="Edit Medicine" subtitle={medicine.name} showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Core Required Fields */}
        <Card style={styles.card}>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Medicine Name"
                required
                value={value}
                onChangeText={onChange}
                error={errors.name?.message}
              />
            )}
          />

          <View style={styles.twoColumnRow}>
            <View style={styles.halfCol}>
              <Controller
                control={control}
                name="sellingPrice"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Selling Price ($)"
                    required
                    keyboardType="numeric"
                    value={value}
                    onChangeText={onChange}
                    error={errors.sellingPrice?.message}
                  />
                )}
              />
            </View>

            <View style={styles.halfCol}>
              <Controller
                control={control}
                name="quantity"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Current Stock"
                    required
                    keyboardType="numeric"
                    value={value}
                    onChangeText={onChange}
                    error={errors.quantity?.message}
                  />
                )}
              />
            </View>
          </View>
        </Card>

        {/* Clinical details */}
        <Card style={styles.accordionCard}>
          <TouchableOpacity
            style={styles.accordionHeader}
            onPress={() => setShowClinicalSection(!showClinicalSection)}
          >
            <Text style={styles.accordionTitle}>Clinical & Brand Details</Text>
            {showClinicalSection ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </TouchableOpacity>

          {showClinicalSection && (
            <View style={styles.accordionBody}>
              <Controller
                control={control}
                name="genericName"
                render={({ field: { onChange, value } }) => (
                  <Input label="Generic Name" optional value={value} onChangeText={onChange} />
                )}
              />

              <Controller
                control={control}
                name="brandName"
                render={({ field: { onChange, value } }) => (
                  <Input label="Brand Name" optional value={value} onChangeText={onChange} />
                )}
              />

              <Controller
                control={control}
                name="manufacturer"
                render={({ field: { onChange, value } }) => (
                  <Input label="Manufacturer" optional value={value} onChangeText={onChange} />
                )}
              />

              <View style={styles.twoColumnRow}>
                <View style={styles.halfCol}>
                  <Controller
                    control={control}
                    name="strength"
                    render={({ field: { onChange, value } }) => (
                      <Input label="Strength" optional value={value} onChangeText={onChange} />
                    )}
                  />
                </View>

                <View style={styles.halfCol}>
                  <Controller
                    control={control}
                    name="dosageForm"
                    render={({ field: { onChange, value } }) => (
                      <Input label="Dosage Form" optional value={value} onChangeText={onChange} />
                    )}
                  />
                </View>
              </View>

              <Controller
                control={control}
                name="category"
                render={({ field: { onChange, value } }) => (
                  <Input label="Category" optional value={value} onChangeText={onChange} />
                )}
              />
            </View>
          )}
        </Card>

        {/* Pricing & Location */}
        <Card style={styles.accordionCard}>
          <TouchableOpacity
            style={styles.accordionHeader}
            onPress={() => setShowInventorySection(!showInventorySection)}
          >
            <Text style={styles.accordionTitle}>Pricing & Storage Details</Text>
            {showInventorySection ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </TouchableOpacity>

          {showInventorySection && (
            <View style={styles.accordionBody}>
              <View style={styles.twoColumnRow}>
                <View style={styles.halfCol}>
                  <Controller
                    control={control}
                    name="purchasePrice"
                    render={({ field: { onChange, value } }) => (
                      <Input
                        label="Buy Price ($)"
                        optional
                        keyboardType="numeric"
                        value={value}
                        onChangeText={onChange}
                        error={errors.purchasePrice?.message}
                      />
                    )}
                  />
                </View>

                <View style={styles.halfCol}>
                  <Controller
                    control={control}
                    name="minimumStock"
                    render={({ field: { onChange, value } }) => (
                      <Input
                        label="Min. Stock Alert"
                        optional
                        keyboardType="numeric"
                        value={value}
                        onChangeText={onChange}
                        error={errors.minimumStock?.message}
                      />
                    )}
                  />
                </View>
              </View>

              <Controller
                control={control}
                name="rackLocation"
                render={({ field: { onChange, value } }) => (
                  <Input label="Shelf / Rack Location" optional value={value} onChangeText={onChange} />
                )}
              />

              <Controller
                control={control}
                name="supplierName"
                render={({ field: { onChange, value } }) => (
                  <Input label="Supplier Name" optional value={value} onChangeText={onChange} />
                )}
              />

              <Controller
                control={control}
                name="barcode"
                render={({ field: { onChange, value } }) => (
                  <Input label="Barcode" optional value={value} onChangeText={onChange} />
                )}
              />
            </View>
          )}
        </Card>

        {/* Batch & Expiry */}
        <Card style={styles.accordionCard}>
          <TouchableOpacity
            style={styles.accordionHeader}
            onPress={() => setShowExpirySection(!showExpirySection)}
          >
            <Text style={styles.accordionTitle}>Batch, Expiry & Online Links</Text>
            {showExpirySection ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </TouchableOpacity>

          {showExpirySection && (
            <View style={styles.accordionBody}>
              <View style={styles.twoColumnRow}>
                <View style={styles.halfCol}>
                  <Controller
                    control={control}
                    name="batchNumber"
                    render={({ field: { onChange, value } }) => (
                      <Input label="Batch Lot" optional value={value} onChangeText={onChange} />
                    )}
                  />
                </View>

                <View style={styles.halfCol}>
                  <Controller
                    control={control}
                    name="expiryDate"
                    render={({ field: { onChange, value } }) => (
                      <Input
                        label="Expiry Date"
                        optional
                        placeholder="YYYY-MM-DD"
                        value={value}
                        onChangeText={onChange}
                        error={errors.expiryDate?.message}
                      />
                    )}
                  />
                </View>
              </View>

              <Controller
                control={control}
                name="onlinePurchaseUrl"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Online Purchase URL"
                    optional
                    value={value}
                    onChangeText={onChange}
                    error={errors.onlinePurchaseUrl?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="notes"
                render={({ field: { onChange, value } }) => (
                  <Input label="Notes" optional multiline value={value} onChangeText={onChange} />
                )}
              />
            </View>
          )}
        </Card>

        <Button
          title="Save Changes"
          onPress={handleSubmit((d) => updateMutation.mutate(d))}
          loading={updateMutation.isPending}
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
  card: {
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
  accordionCard: {
    padding: 0,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  accordionTitle: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  accordionBody: {
    padding: Spacing.lg,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  submitBtn: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
});
