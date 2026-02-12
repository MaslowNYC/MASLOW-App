import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { colors, spacing, shadows } from '../theme';

interface SessionTimerProps {
  suiteNumber: string;
  timeRemaining: number; // in seconds
  isActive?: boolean;
}

export const SessionTimer: React.FC<SessionTimerProps> = ({
  suiteNumber,
  timeRemaining,
  isActive = true,
}) => {
  // Pulsing dot animation
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isActive) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => pulseAnimation.stop();
    }
  }, [isActive]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = (): string => {
    if (timeRemaining <= 60) return colors.error; // Last minute - red
    if (timeRemaining <= 180) return colors.warning; // Last 3 minutes - yellow
    return colors.navy; // Normal - navy
  };

  return (
    <View style={styles.container}>
      {/* Status indicator */}
      <View style={styles.statusRow}>
        <Animated.View
          style={[
            styles.statusDot,
            { opacity: pulseAnim },
            { backgroundColor: isActive ? colors.success : colors.warning },
          ]}
        />
        <Text style={styles.statusText}>
          {isActive ? 'SESSION ACTIVE' : 'PENDING'}
        </Text>
      </View>

      {/* Suite */}
      <Text style={styles.suiteNumber}>{suiteNumber}</Text>

      {/* Time */}
      <View style={styles.timeContainer}>
        <Text style={[styles.timeValue, { color: getTimeColor() }]}>
          {formatTime(timeRemaining)}
        </Text>
        <Text style={styles.timeLabel}>REMAINING</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(100, (timeRemaining / 600) * 100)}%`, // 10 min = 100%
                backgroundColor: getTimeColor(),
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.lightGray,
    ...shadows.card,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  statusText: {
    fontSize: 12,
    color: colors.darkGray,
    letterSpacing: 2,
    fontWeight: '500',
  },
  suiteNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gold,
    marginBottom: spacing.sm,
  },
  timeContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  timeValue: {
    fontSize: 48,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  timeLabel: {
    fontSize: 12,
    color: colors.darkGray,
    letterSpacing: 2,
    marginTop: spacing.xs,
  },
  progressContainer: {
    width: '100%',
    marginTop: spacing.sm,
  },
  progressBackground: {
    height: 4,
    backgroundColor: colors.lightGray,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
