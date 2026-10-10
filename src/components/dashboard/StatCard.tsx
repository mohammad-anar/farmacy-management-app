import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { Card } from '../common/Card';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'primary' | 'warning' | 'danger' | 'info';
  onPress?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'primary',
  onPress,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return {
          iconBg: Colors.warningLight,
          valueColor: Colors.warning,
        };
      case 'danger':
        return {
          iconBg: Colors.dangerLight,
          valueColor: Colors.danger,
        };
      case 'info':
        return {
          iconBg: Colors.accentLight,
          valueColor: Colors.accent,
        };
      default:
        return {
          iconBg: Colors.primaryLight,
          valueColor: Colors.primary,
        };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={[styles.iconWrapper, { backgroundColor: vStyles.iconBg }]}>
          {icon}
        </View>
        <Text style={[styles.value, { color: vStyles.valueColor }]}>{value}</Text>
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {subtitle && (
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '47%',
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: Typography.xxl,
    fontWeight: '800',
  },
  title: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.xs - 1,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
