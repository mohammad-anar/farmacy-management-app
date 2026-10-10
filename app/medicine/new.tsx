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
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MedicineService } from '../../src/services/medicine.service';
import { medicineFormSchema, MedicineFormData } from '../../src/validation/medicineSchema';
import { Colors, Spacing, Typography, BorderRadius } from '../../src/constants/theme';
import { Header } from '../../src/components/common/Header';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import { Card } from '../../src/components/common/Card';
import { ChevronDown, ChevronUp, Sparkles, Check } from 'lucide-react-native';

export default function NewMedicineScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [showClinicalSection, setShowClinicalSection] = useState(false);
  const [showInventorySection, setShowInventorySection] = useState(false);
  const [showExpirySection, setShowExpirySection] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<MedicineFormData>({
    resolver: zodResolver(medicineFormSchema),
    defaultValues: {
      name: '',
      sellingPrice: '',
      quantity: '',
      genericName: '',
      brandName: '',
      manufacturer: '',
      strength: '',
      dosageForm: '',
      category: '',
      barcode: '',
      purchasePrice: '',
      minimumStock: '',
      rackLocation: '',
      supplierName: '',
      batchNumber: '',
      expiryDate: '',
      notes: '',
      onlinePurchaseUrl: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: MedicineFormData) => {
      const payload: any = {
        name: data.name.trim(),
        sellingPrice: parseFloat(data.sellingPrice),
        quantity: parseFloat(data.quantity),
      };

      if (data.genericName?.trim()) payload.genericName = data.genericName.trim();
      if (data.brandName?.trim()) payload.brandName = data.brandName.trim();
      if (data.manufacturer?.trim()) payload.manufacturer = data.manufacturer.trim();
      if (data.strength?.trim()) payload.strength = data.strength.trim();
      if (data.dosageForm?.trim()) payload.dosageForm = data.dosageForm.trim();
      if (data.category?.trim()) payload.category = data.category.trim();
      if (data.barcode?.trim()) payload.barcode = data.barcode.trim();
      if (data.purchasePrice?.trim()) payload.purchasePrice = parseFloat(data.purchasePrice);
      if (data.minimumStock?.trim()) payload.minimumStock = parseFloat(data.minimumStock);
      if (data.rackLocation?.trim()) payload.rackLocation = data.rackLocation.trim();
      if (data.supplierName?.trim()) payload.supplierName = data.supplierName.trim();
      if (data.batchNumber?.trim()) payload.batchNumber = data.batchNumber.trim();
      if (data.expiryDate?.trim()) payload.expiryDate = data.expiryDate.trim();
      if (data.notes?.trim()) payload.notes = data.notes.trim();
      if (data.onlinePurchaseUrl?.trim()) payload.onlinePurchaseUrl = data.onlinePurchaseUrl.trim();

      return MedicineService.createMedicine(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-list'] });
      Alert.alert('Saved', 'Medicine saved locally and queued for synchronization.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/medicines') },
      ]);
    },
    onError: (err: any) => {
      const message =
        err.response?.data?.message || err.message || 'Failed to create medicine';
      Alert.alert('Error', typeof message === 'string' ? message : JSON.stringify(message));
    },
  });

  const onSubmit = (data: MedicineFormData) => {
    createMutation.mutate(data);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header title="Add New Medicine" subtitle="Enter medicine inventory record" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* MANDATORY SECTION (Only 3 required fields) */}
        <Card style={styles.requiredCard}>
          <View style={styles.requiredHeader}>
            <Sparkles size={18} color={Colors.primary} />
            <Text style={styles.requiredTitle}>Required Fields (3)</Text>
          </View>
          <Text style={styles.requiredSubtitle}>
            These 3 fields are all you need to save and start tracking this medicine.
          </Text>

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Medicine Name"
                required
                placeholder="e.g., Napa Extra 500mg"
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
                    placeholder="0.00"
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
                    placeholder="0"
                    keyboardType="numeric"
                    value={value}
                    onChangeText={onChange}
                    error={errors.quantity?.message}
                  />
                )}
              />
            </View>
          </View>

          {/* Primary Shelf Number / Rack Input */}
          <Controller
            control={control}
            name="rackLocation"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Shelf / Rack Number (সেল্ফ / র‍্যাক নং)"
                optional
                placeholder="e.g., Shelf A-1, Rack 3, Drawer B"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
        </Card>

        {/* SECTION 1: CLINICAL DETAILS (Optional) */}
        <Card style={styles.accordionCard}>
          <TouchableOpacity
            style={styles.accordionHeader}
            onPress={() => setShowClinicalSection(!showClinicalSection)}
            activeOpacity={0.7}
          >
            <Text style={styles.accordionTitle}>Clinical & Brand Details</Text>
            {showClinicalSection ? (
              <ChevronUp size={20} color={Colors.textSecondary} />
            ) : (
              <ChevronDown size={20} color={Colors.textSecondary} />
            )}
          </TouchableOpacity>

          {showClinicalSection && (
            <View style={styles.accordionBody}>
              <Controller
                control={control}
                name="genericName"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Generic Name"
                    optional
                    placeholder="e.g., Paracetamol + Caffeine"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />

              <Controller
                control={control}
                name="brandName"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Brand Name"
                    optional
                    placeholder="e.g., Napa"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />

              <Controller
                control={control}
                name="manufacturer"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Manufacturer / Company"
                    optional
                    placeholder="e.g., Beximco Pharmaceuticals"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />

              <View style={styles.twoColumnRow}>
                <View style={styles.halfCol}>
                  <Controller
                    control={control}
                    name="strength"
                    render={({ field: { onChange, value } }) => (
                      <Input
                        label="Strength"
                        optional
                        placeholder="e.g., 500mg"
                        value={value}
                        onChangeText={onChange}
                      />
                    )}
                  />
                </View>

                <View style={styles.halfCol}>
                  <Controller
                    control={control}
                    name="dosageForm"
                    render={({ field: { onChange, value } }) => (
                      <Input
                        label="Dosage Form"
                        optional
                        placeholder="e.g., Tablet, Syrup"
                        value={value}
                        onChangeText={onChange}
                      />
                    )}
                  />
                </View>
              </View>

              <Controller
                control={control}
                name="category"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Category"
                    optional
                    placeholder="e.g., Analgesic, Antibiotic"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            </View>
          )}
        </Card>

        {/* SECTION 2: INVENTORY & THRESHOLDS (Optional) */}
        <Card style={styles.accordionCard}>
          <TouchableOpacity
            style={styles.accordionHeader}
            onPress={() => setShowInventorySection(!showInventorySection)}
            activeOpacity={0.7}
          >
            <Text style={styles.accordionTitle}>Pricing & Storage Details</Text>
            {showInventorySection ? (
              <ChevronUp size={20} color={Colors.textSecondary} />
            ) : (
              <ChevronDown size={20} color={Colors.textSecondary} />
            )}
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
                        placeholder="Leave blank if unknown"
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
                        placeholder="e.g., 10"
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
                name="supplierName"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Supplier Name"
                    optional
                    placeholder="e.g., Square Distribution"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />

              <Controller
                control={control}
                name="barcode"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Barcode / SKU"
                    optional
                    placeholder="e.g., 8901234567890"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            </View>
          )}
        </Card>

        {/* SECTION 3: BATCH & ONLINE RE-ORDER (Optional) */}
        <Card style={styles.accordionCard}>
          <TouchableOpacity
            style={styles.accordionHeader}
            onPress={() => setShowExpirySection(!showExpirySection)}
            activeOpacity={0.7}
          >
            <Text style={styles.accordionTitle}>Batch, Expiry & Online Links</Text>
            {showExpirySection ? (
              <ChevronUp size={20} color={Colors.textSecondary} />
            ) : (
              <ChevronDown size={20} color={Colors.textSecondary} />
            )}
          </TouchableOpacity>

          {showExpirySection && (
            <View style={styles.accordionBody}>
              <View style={styles.twoColumnRow}>
                <View style={styles.halfCol}>
                  <Controller
                    control={control}
                    name="batchNumber"
                    render={({ field: { onChange, value } }) => (
                      <Input
                        label="Batch Lot"
                        optional
                        placeholder="e.g., LOT-2026-X"
                        value={value}
                        onChangeText={onChange}
                      />
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
                    placeholder="https://distributor.example.com/order"
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
                  <Input
                    label="Storage Notes"
                    optional
                    placeholder="e.g., Keep refrigerated below 8°C"
                    multiline
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            </View>
          )}
        </Card>

        <Button
          title="Save Medicine Record"
          onPress={handleSubmit(onSubmit)}
          loading={createMutation.isPending}
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
  requiredCard: {
    padding: Spacing.lg,
    borderColor: Colors.primaryBorder,
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  requiredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
    marginBottom: 4,
  },
  requiredTitle: {
    fontSize: Typography.base,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  requiredSubtitle: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
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
