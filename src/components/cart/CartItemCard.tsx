import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { CartItem } from '../../types';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { Card } from '../common/Card';
import { formatCurrency } from '../../utils/formatters';
import { Minus, Plus, Trash2 } from 'lucide-react-native';
import { useCartStore } from '../../store/cartStore';

interface CartItemCardProps {
  item: CartItem;
}

export const CartItemCard: React.FC<CartItemCardProps> = ({ item }) => {
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
          <Text style={styles.unitPrice}>
            Unit Price: {formatCurrency(unitPrice)}
          </Text>
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

        {/* Subtotal */}
        <View style={styles.subtotalColumn}>
          <Text style={styles.subtotalLabel}>Item Subtotal</Text>
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
    marginTop: 2,
  },
  deleteButton: {
    padding: Spacing.xs,
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
