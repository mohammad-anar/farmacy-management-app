import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path, Rect, Circle, G } from 'react-native-svg';
import { Colors } from '../../constants/theme';

interface MedicalLogoProps {
  size?: number;
  variant?: 'both' | 'cross' | 'crescent';
  containerStyle?: ViewStyle;
  showBackground?: boolean;
}

export const MedicalLogo: React.FC<MedicalLogoProps> = ({
  size = 64,
  variant = 'both',
  containerStyle,
  showBackground = true,
}) => {
  const primaryRed = '#DC2626';

  return (
    <View
      style={[
        styles.wrapper,
        showBackground && styles.defaultBg,
        {
          width: size,
          height: size,
          borderRadius: size * 0.28,
        },
        containerStyle,
      ]}
    >
      <Svg
        width={size * 0.72}
        height={size * 0.72}
        viewBox="0 0 100 100"
        fill="none"
      >
        {variant === 'both' ? (
          <>
            {/* Red Cross (Left side) */}
            <G fill={primaryRed}>
              {/* Vertical bar */}
              <Rect x="20" y="24" width="14" height="42" rx="3" />
              {/* Horizontal bar */}
              <Rect x="6" y="38" width="42" height="14" rx="3" />
            </G>

            {/* Red Crescent (Right side) */}
            <Path
              d="M 64 22 C 78 30, 84 50, 78 68 C 74 76, 66 82, 56 84 C 68 80, 76 68, 74 54 C 72 40, 64 28, 56 24 C 59 23, 62 22, 64 22 Z"
              fill={primaryRed}
            />

            {/* Subtle center pill accent */}
            <Rect x="38" y="78" width="24" height="10" rx="5" fill="#0D9488" />
            <Path
              d="M 38 78 L 50 78 L 50 88 L 38 88 A 5 5 0 0 1 38 78 Z"
              fill="#FFFFFF"
              opacity={0.85}
            />
          </>
        ) : variant === 'cross' ? (
          <G fill={primaryRed}>
            <Rect x="38" y="10" width="24" height="80" rx="4" />
            <Rect x="10" y="38" width="80" height="24" rx="4" />
          </G>
        ) : (
          /* Red Crescent Solo */
          <Path
            d="M 60 10 C 82 22, 92 52, 82 78 C 76 90, 64 96, 48 98 C 66 92, 78 76, 75 56 C 72 36, 60 20, 48 14 C 52 12, 56 11, 60 10 Z"
            fill={primaryRed}
          />
        )}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultBg: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
});
