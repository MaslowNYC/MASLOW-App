import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, shadows, spacing } from '../theme';

interface MaslowCardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'flat' | 'glass';
  padding?: keyof typeof spacing;
  style?: ViewStyle;
}

export const MaslowCard: React.FC<MaslowCardProps> = ({
  children,
  variant = 'elevated',
  padding = 'md',
  style,
}) => {
  return (
    <View style={[
      styles.base,
      styles[variant],
      { padding: spacing[padding] },
      style,
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  elevated: {
    ...shadows.card,
  },
  flat: {
    shadowOpacity: 0,
    elevation: 0,
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    ...shadows.sm,
  },
});
