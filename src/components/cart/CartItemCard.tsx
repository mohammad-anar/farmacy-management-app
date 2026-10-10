import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { CartItem } from '../../types';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { Card } from '../common/Card';
import { formatCurrency } from '../../utils/formatters';
import { Minus, Plus, Trash2, PackageMinus, Layers } from 'lucide-react-native';
import { useCartStore } from '../../store/cartStore';

interface CartItemCardProps {
  item: CartItem;
  onDeductItemStock?: (item: CartItem) => void;
}

export const CartItemCard: React.FC<CartItemCardProps> = ({ item, onDeductItemStock }) => {
  const { updateQuantity, removeItem } = useCartStore();
  const unitPrice = item.customPrice !== undefined ? item.customPrice : item.medicine.sellingPrice;
  const subtotal = unitPrice * item.quantity;

  const handleIncrement = () => {
    updateQuantity(item.medicine.id, item.quantity + 1);
  };

  const handleDecrement = () => {
    if (item.quantity > 1) {
      updateQuantity(item.medicine.id, item.quantity - 1);
    } else {
      removeItem(item.medicine.id);
    }
  };

  const handleQuantityTextChange = (text: string) => {
    const parsed = parseFloat(text);
    if (!isNaN(parsed) && parsed >= 0) {
      updateQuantity(item.medicine.id, parsed);
    } else if (text === '') {
      updateQuantity(item.medicine.id, 0);
    }
  };

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.nameColumn}>
          <Text style={styles.name} numberOfLines={1}>
            {item.medicine.name}
          </Text>
          <View style={styles.metaBadgeRow}>
            <Text style={styles.unitPrice}>
              Unit: {formatCurrency(unitPrice)}
            </Text>
            <Text style={styles.stockBadgeText}>
              • Stock: {item.medicine.quantity}
            </Text>
            {item.medicine.rackLocation ? (
              <View style={styles.shelfMiniBadge}>
                <Layers size={10} color="#4F46E5" />
                <Text style={styles.shelfMiniText}>{item.medicine.rackLocation}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <TouchableOpacity
          onPress={() => removeItem(item.medicine.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.deleteButton}
        >
          <Trash2 size={18} color={Colors.danger} />
        </TouchableOpacity>
      </View>

      <View style={styles.footerRow}>
        {/* Quantity Stepper */}
        <View style={styles.stepperContainer}>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={handleDecrement}
            activeOpacity={0.7}
          >
            <Minus size={14} color={Colors.textPrimary} />
          </TouchableOpacity>

          <TextInput
            style={styles.quantityInput}
            value={item.quantity.toString()}
            onChangeText={handleQuantityTextChange}
            keyboardType="numeric"
            selectTextOnFocus
          />

          <TouchableOpacity
            style={styles.stepperButton}
            onPress={handleIncrement}
            activeOpacity={0.7}
          >
            <Plus size={14} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Individual Deduct Stock Button */}
        {onDeductItemStock && (
          <TouchableOpacity
            style={styles.singleDeductBtn}
            onPress={() => onDeductItemStock(item)}
            activeOpacity={0.7}
          >
            <PackageMinus size={13} color="#B91C1C" />
            <Text style={styles.singleDeductText}>- {item.quantity} Stock</Text>
          </TouchableOpacity>
        )}

        {/* Subtotal */}
        <View style={styles.subtotalColumn}>
          <Text style={styles.subtotalLabel}>Subtotal</Text>
          <Text style={styles.subtotalValue}>{formatCurrency(subtotal)}</Text>
        </View>
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
    marginBottom: Spacing.md,
  },
  nameColumn: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  name: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  unitPrice: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
  },
  metaBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 3,
  },
  stockBadgeText: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  shelfMiniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: 4,
    gap: 2,
  },
  shelfMiniText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#4F46E5',
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  singleDeductBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.sm,
    gap: 3,
  },
  singleDeductText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B91C1C',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
  },
  stepperButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityInput: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    minWidth: 40,
    paddingVertical: 2,
  },
  subtotalColumn: {
    alignItems: 'flex-end',
  },
  subtotalLabel: {
    fontSize: Typography.xs - 2,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  subtotalValue: {
    fontSize: Typography.md,
    fontWeight: '800',
    color: Colors.primary,
  },
});
