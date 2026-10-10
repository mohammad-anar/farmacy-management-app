import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors, BorderRadius, Spacing, Typography } from '../../constants/theme';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'md',
  style,
  textStyle,
  icon,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          container: styles.successContainer,
          text: styles.successText,
        };
      case 'warning':
        return {
          container: styles.warningContainer,
          text: styles.warningText,
        };
      case 'danger':
        return {
          container: styles.dangerContainer,
          text: styles.dangerText,
        };
      case 'info':
        return {
          container: styles.infoContainer,
          text: styles.infoText,
        };
      default:
        return {
          container: styles.neutralContainer,
          text: styles.neutralText,
        };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <View
      style={[
        styles.baseContainer,
        vStyles.container,
        size === 'sm' ? styles.smContainer : styles.mdContainer,
        style,
      ]}
    >
      {icon && <View style={styles.iconWrapper}>{icon}</View>}
      <Text
        style={[
          styles.baseText,
          vStyles.text,
          size === 'sm' ? styles.smText : styles.mdText,
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.full,
  },
  baseText: {
    fontWeight: '600',
  },
  iconWrapper: {
    marginRight: 4,
  },
  smContainer: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm - 2,
  },
  mdContainer: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm + 2,
  },
  smText: {
    fontSize: Typography.xs - 1,
  },
  mdText: {
    fontSize: Typography.xs,
  },
  successContainer: {
    backgroundColor: Colors.successLight,
    borderWidth: 1,
    borderColor: Colors.successBorder,
  },
  successText: {
    color: Colors.success,
  },
  warningContainer: {
    backgroundColor: Colors.warningLight,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
  },
  warningText: {
    color: Colors.warning,
  },
  dangerContainer: {
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
  },
  dangerText: {
    color: Colors.danger,
  },
  infoContainer: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  infoText: {
    color: Colors.primaryDark,
  },
  neutralContainer: {
    backgroundColor: Colors.borderLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  neutralText: {
    color: Colors.textSecondary,
  },
});
