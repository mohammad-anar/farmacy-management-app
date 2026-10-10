import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Medicine } from '../../types';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { formatCurrency, formatQuantity, formatDate } from '../../utils/formatters';
import { AlertTriangle, Calendar, Calculator, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useCartStore } from '../../store/cartStore';

interface MedicineCardProps {
  medicine: Medicine;
  onPress?: () => void;
}

export const MedicineCard: React.FC<MedicineCardProps> = ({ medicine, onPress }) => {
  const router = useRouter();
  const addItemToCart = useCartStore((state) => state.addItem);

  const isLowStock =
    medicine.minimumStock !== null && medicine.minimumStock !== undefined
      ? medicine.quantity <= medicine.minimumStock
      : medicine.quantity <= 0;

  const isOutOfStock = medicine.quantity <= 0;

  const now = new Date();
  const isExpired = medicine.expiryDate ? new Date(medicine.expiryDate) < now : false;
  const isExpiringSoon =
    medicine.expiryDate && !isExpired
      ? (new Date(medicine.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24) <= 30
      : false;

  const handleCardPress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/medicine/${medicine.id}`);
    }
  };

  const handleAddToCart = (e: any) => {
    e.stopPropagation();
    addItemToCart(medicine, 1);
  };

  return (
    <Card style={styles.card} onPress={handleCardPress}>
      <View style={styles.headerRow}>
        <View style={styles.titleColumn}>
          <Text style={styles.name} numberOfLines={1}>
            {medicine.name}
          </Text>
          {(medicine.genericName || medicine.brandName || medicine.strength) && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {[medicine.brandName, medicine.genericName, medicine.strength]
                .filter(Boolean)
                .join(' • ')}
            </Text>
          )}
        </View>
        <ChevronRight size={18} color={Colors.textMuted} />
      </View>

      {/* Badges row */}
      <View style={styles.badgesRow}>
        {isOutOfStock ? (
          <Badge label="Out of Stock" variant="danger" size="sm" />
        ) : isLowStock ? (
          <Badge
            label={`Low Stock (${formatQuantity(medicine.quantity)})`}
            variant="warning"
            size="sm"
            icon={<AlertTriangle size={12} color={Colors.warning} />}
          />
        ) : (
          <Badge
            label={`In Stock: ${formatQuantity(medicine.quantity)}`}
            variant="success"
            size="sm"
          />
        )}

        {isExpired ? (
          <Badge
            label="Expired"
            variant="danger"
            size="sm"
            icon={<Calendar size={12} color={Colors.danger} />}
            style={styles.badgeMargin}
          />
        ) : isExpiringSoon ? (
          <Badge
            label={`Exp: ${formatDate(medicine.expiryDate)}`}
            variant="warning"
            size="sm"
            icon={<Calendar size={12} color={Colors.warning} />}
            style={styles.badgeMargin}
          />
        ) : medicine.expiryDate ? (
          <Badge
            label={`Exp: ${formatDate(medicine.expiryDate)}`}
            variant="neutral"
            size="sm"
            style={styles.badgeMargin}
          />
        ) : null}
      </View>

      {/* Footer row: Price & Quick Calculator Action */}
      <View style={styles.footerRow}>
        <View style={styles.priceColumn}>
          <Text style={styles.priceLabel}>Selling Price</Text>
          <Text style={styles.priceValue}>{formatCurrency(medicine.sellingPrice)}</Text>
        </View>

        <TouchableOpacity
          style={styles.calcButton}
          onPress={handleAddToCart}
          activeOpacity={0.7}
        >
          <Calculator size={14} color={Colors.primaryDark} />
          <Text style={styles.calcButtonText}>+ Calculator</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleColumn: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  name: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  badgeMargin: {
    marginLeft: Spacing.xs,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
  priceColumn: {
    flexDirection: 'column',
  },
  priceLabel: {
    fontSize: Typography.xs - 2,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  priceValue: {
    fontSize: Typography.md,
    fontWeight: '800',
    color: Colors.primary,
  },
  calcButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  calcButtonText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.primaryDark,
    marginLeft: 4,
  },
});
