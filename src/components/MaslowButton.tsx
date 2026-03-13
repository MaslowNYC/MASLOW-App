import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, fonts, shape } from '../theme/colors';
import { spacing, shadows } from '../theme';
import { useHaptics } from '../hooks/useHaptics';

interface MaslowButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

export const MaslowButton: React.FC<MaslowButtonProps> = ({
  onPress,
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
}) => {
  const haptics = useHaptics();

  const handlePress = () => {
    haptics.medium();
    onPress();
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.primaryText;
      case 'secondary':
        return styles.secondaryText;
      case 'ghost':
        return styles.ghostText;
      default:
        return styles.primaryText;
    }
  };

  const getSizeTextStyle = () => {
    switch (size) {
      case 'sm':
        return styles.smText;
      case 'md':
        return styles.mdText;
      case 'lg':
        return styles.lgText;
      default:
        return styles.mdText;
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      accessible={true}
      accessibilityLabel={accessibilityLabel || (typeof children === 'string' ? children : undefined)}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      style={[
        styles.base,
        styles[variant],
        styles[size],
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'ghost' ? colors.charcoal : colors.cream}
        />
      ) : (
        <Text style={[
          styles.text,
          getTextStyle(),
          getSizeTextStyle(),
          textStyle,
        ]}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: shape.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  // Variants - Charcoal is primary (per redesign brief)
  primary: {
    backgroundColor: colors.charcoal,
    ...shadows.md,
  },
  secondary: {
    backgroundColor: colors.gold,
    ...shadows.md,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.charcoal,
  },

  // Sizes (using 8px grid)
  sm: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    minHeight: 40,
  },
  md: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  lg: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 18,
    minHeight: 56,
  },

  // Text base - Jost uppercase
  text: {
    fontFamily: fonts.sansSemiBold,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // Text variants
  primaryText: {
    color: colors.cream,
  },
  secondaryText: {
    color: colors.charcoal,
  },
  ghostText: {
    color: colors.charcoal,
  },

  // Text sizes
  smText: {
    fontSize: 12,
  },
  mdText: {
    fontSize: 14,
  },
  lgText: {
    fontSize: 14,
  },

  disabled: {
    opacity: 0.5,
  },
});
