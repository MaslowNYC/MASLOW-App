import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, shape } from '../theme/colors';
import { spacing } from '../theme';
import { MaslowButton } from './MaslowButton';
import { useHaptics } from '../hooks/useHaptics';
import QRCode from 'react-native-qrcode-svg';

// TODO: In production, queue state comes from Supabase Realtime subscription
// TODO: Queue table schema: queue(user_id, position, status, session_type, created_at)

type QueueStep = 'finding' | 'inQueue' | 'atDoor' | 'suiteReady';

interface UseItNowFlowProps {
  userQrData: string; // User's QR code data (e.g., member ID)
  onComplete: () => void; // Called when user taps "I'm heading in"
  onCancel: () => void; // Called when user cancels/exits flow
}

export function UseItNowFlow({ userQrData, onComplete, onCancel }: UseItNowFlowProps) {
  const haptics = useHaptics();
  const [step, setStep] = useState<QueueStep>('finding');
  const [queuePosition, setQueuePosition] = useState(2); // TODO: Real position from Supabase
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulsing animation for the queue indicator
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Simulate "finding suite" step
  useEffect(() => {
    if (step === 'finding') {
      // TODO: In production, this would check for available credits and
      // make a Supabase call to join the queue
      const timer = setTimeout(() => {
        haptics.light();
        setStep('inQueue');
      }, 1500); // Fake 1.5s loading
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Handle "I'm at the door" button
  const handleAtDoor = () => {
    haptics.medium();
    // TODO: In production, this promotion is triggered by ESP32 QR scanner
    // at hallway door, not by user tapping
    setQueuePosition(1);
    setStep('atDoor');

    // Simulate wait for suite to be ready
    // TODO: In production, this notification is pushed via Supabase Realtime
    // when suite ESP32 confirms vacancy + UV-C cycle complete
    setTimeout(() => {
      haptics.success();
      setStep('suiteReady');
    }, 6000); // Fake 6 second wait
  };

  // Handle "I'm heading in"
  const handleHeadingIn = () => {
    haptics.success();
    onComplete();
  };

  // Finding suite screen
  if (step === 'finding') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Animated.View style={[styles.loadingIndicator, { transform: [{ scale: pulseAnim }] }]}>
            <Ionicons name="search" size={48} color={colors.gold} />
          </Animated.View>
          <Text style={styles.mainText}>Finding you a suite...</Text>
          <Text style={styles.subText}>Checking availability</Text>
        </View>

        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // In queue screen
  if (step === 'inQueue') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Queue position */}
          <View style={styles.queuePositionContainer}>
            <Text style={styles.queueLabel}>YOU'RE</Text>
            <Text style={styles.queueNumber}>#{queuePosition}</Text>
            <Text style={styles.queueLabel}>IN LINE</Text>
          </View>

          {/* Live indicator */}
          <View style={styles.liveIndicator}>
            <Animated.View style={[styles.pulseDot, { transform: [{ scale: pulseAnim }] }]} />
            <Text style={styles.liveText}>Queue is live</Text>
          </View>

          {/* Instructions */}
          <Text style={styles.instructionText}>
            Head to the hallway door and scan your QR when you're close
          </Text>

          {/* QR Code */}
          <View style={styles.qrContainer}>
            <QRCode
              value={userQrData || 'maslow-member'}
              size={160}
              color={colors.charcoal}
              backgroundColor={colors.cream}
            />
          </View>

          {/* At the door button */}
          {/* TODO: In production, this button is replaced by ESP32 QR scan detection */}
          <MaslowButton
            onPress={handleAtDoor}
            variant="primary"
            size="lg"
            style={styles.atDoorButton}
          >
            I'm at the door
          </MaslowButton>
          <Text style={styles.mockNote}>
            {/* Dev note visible in app */}
            (In production: auto-detected by door scanner)
          </Text>
        </View>

        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>Leave queue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // At door / waiting screen
  if (step === 'atDoor') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.queuePositionContainer}>
            <Text style={styles.queueLabel}>YOU'RE</Text>
            <Text style={styles.queueNumberNext}>#1</Text>
            <Text style={styles.queueLabel}>NEXT UP</Text>
          </View>

          <View style={styles.liveIndicator}>
            <Animated.View style={[styles.pulseDot, { transform: [{ scale: pulseAnim }] }]} />
            <Text style={styles.liveText}>Preparing your suite</Text>
          </View>

          <Text style={styles.waitText}>Hang tight — your suite is being prepared</Text>

          <View style={styles.waitingIcons}>
            <Ionicons name="sparkles" size={24} color={colors.gold} />
            <Ionicons name="water" size={24} color={colors.gold} />
            <Ionicons name="sunny" size={24} color={colors.gold} />
          </View>
        </View>

        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>Leave queue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Suite ready screen
  if (step === 'suiteReady') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.readyIcon}>
            <Ionicons name="checkmark-circle" size={64} color={colors.success} />
          </View>

          <Text style={styles.readyTitle}>Your suite is ready</Text>

          {/* TODO: In production, suite number comes from Supabase */}
          <View style={styles.suiteNumberContainer}>
            <Text style={styles.suiteLabel}>SUITE</Text>
            <Text style={styles.suiteNumber}>3</Text>
          </View>

          <MaslowButton
            onPress={handleHeadingIn}
            variant="primary"
            size="lg"
            style={styles.headingInButton}
          >
            I'm heading in
          </MaslowButton>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIndicator: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${colors.gold}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  mainText: {
    fontSize: 24,
    fontFamily: fonts.serifLight,
    color: colors.charcoal,
    marginBottom: spacing.sm,
  },
  subText: {
    fontSize: 14,
    fontFamily: fonts.sansRegular,
    color: colors.charcoal50,
  },
  queuePositionContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  queueLabel: {
    fontSize: 12,
    fontFamily: fonts.sansSemiBold,
    color: colors.gold,
    letterSpacing: 3,
  },
  queueNumber: {
    fontSize: 72,
    fontFamily: fonts.serifLight,
    color: colors.charcoal,
    lineHeight: 80,
  },
  queueNumberNext: {
    fontSize: 72,
    fontFamily: fonts.serifLight,
    color: colors.gold,
    lineHeight: 80,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
  },
  liveText: {
    fontSize: 14,
    fontFamily: fonts.sansSemiBold,
    color: colors.charcoal50,
  },
  instructionText: {
    fontSize: 16,
    fontFamily: fonts.sansRegular,
    color: colors.charcoal,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: colors.cream,
    borderRadius: shape.borderRadius,
    borderWidth: 1,
    borderColor: colors.charcoal10,
    marginBottom: spacing.xl,
  },
  atDoorButton: {
    width: '100%',
  },
  mockNote: {
    fontSize: 11,
    fontFamily: fonts.sansRegular,
    color: colors.charcoal30,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  waitText: {
    fontSize: 18,
    fontFamily: fonts.sansRegular,
    color: colors.charcoal,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  waitingIcons: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  readyIcon: {
    marginBottom: spacing.lg,
  },
  readyTitle: {
    fontSize: 28,
    fontFamily: fonts.serifLight,
    color: colors.charcoal,
    marginBottom: spacing.xl,
  },
  suiteNumberContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  suiteLabel: {
    fontSize: 12,
    fontFamily: fonts.sansSemiBold,
    color: colors.gold,
    letterSpacing: 3,
  },
  suiteNumber: {
    fontSize: 96,
    fontFamily: fonts.serifLight,
    color: colors.charcoal,
    lineHeight: 110,
  },
  headingInButton: {
    width: '100%',
  },
  cancelButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontFamily: fonts.sansSemiBold,
    color: colors.charcoal50,
  },
});
