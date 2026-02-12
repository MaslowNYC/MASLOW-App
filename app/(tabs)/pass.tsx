import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { colors, spacing } from '../../src/theme';
import { MaslowCard, MaslowButton } from '../../src/components';
import { useHaptics } from '../../src/hooks/useHaptics';

// Mock data - will connect to Supabase later
const mockMember = {
  name: 'Patrick May',
  tier: 'Founding Member',
  memberNumber: '#00042',
  credits: 10,
  hasWalletPass: false,
  qrValue: 'MASLOW-PM-00042-2026',
};

export default function PassScreen() {
  const haptics = useHaptics();
  const [hasWalletPass, setHasWalletPass] = useState(mockMember.hasWalletPass);
  const [loading, setLoading] = useState(false);

  const handleAddToWallet = async () => {
    haptics.medium();
    setLoading(true);

    // TODO: Call Supabase Edge Function to generate .pkpass
    // For now, show placeholder alert
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Coming Soon',
        'Apple Wallet integration will be available soon. For now, use the QR code below.',
        [{ text: 'OK' }]
      );
    }, 1000);
  };

  const handleViewInWallet = () => {
    haptics.light();
    // Open Apple Wallet app
    if (Platform.OS === 'ios') {
      Linking.openURL('shoebox://');
    }
  };

  const handleUpdatePass = async () => {
    haptics.light();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Pass Updated', 'Your wallet pass has been refreshed.');
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.title}>Your Pass</Text>

        {hasWalletPass ? (
          // User HAS added to wallet
          <>
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              <Text style={styles.successText}>Pass Added to Apple Wallet</Text>
            </View>

            <MaslowCard style={styles.previewCard} padding="lg">
              <View style={styles.previewHeader}>
                <Text style={styles.previewTier}>{mockMember.tier}</Text>
                <Text style={styles.previewMemberNumber}>{mockMember.memberNumber}</Text>
              </View>
              <Text style={styles.previewCredits}>
                {mockMember.credits} credits remaining
              </Text>
            </MaslowCard>

            <View style={styles.buttonGroup}>
              <MaslowButton
                onPress={handleViewInWallet}
                variant="primary"
                size="lg"
              >
                View in Wallet
              </MaslowButton>

              <MaslowButton
                onPress={handleUpdatePass}
                variant="secondary"
                size="md"
                loading={loading}
                style={styles.secondaryButton}
              >
                Update Pass
              </MaslowButton>
            </View>

            {/* Instructions */}
            <MaslowCard style={styles.instructionsCard} padding="lg">
              <Text style={styles.instructionsTitle}>Using Your Pass</Text>

              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.stepText}>Double-click side button</Text>
              </View>

              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepText}>Select Maslow pass</Text>
              </View>

              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={styles.stepText}>Scan QR code at suite door</Text>
              </View>

              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>4</Text>
                </View>
                <Text style={styles.stepText}>Enter and enjoy!</Text>
              </View>
            </MaslowCard>
          </>
        ) : (
          // User has NOT added to wallet
          <>
            <MaslowCard style={styles.walletPromptCard} padding="xl">
              <View style={styles.walletIcon}>
                <Ionicons name="wallet-outline" size={48} color={colors.navy} />
              </View>

              <Text style={styles.walletHeading}>
                Add to Wallet for Fast Access
              </Text>

              <Text style={styles.walletDescription}>
                For the fastest check-in, add your membership pass to Apple Wallet.
              </Text>

              <MaslowButton
                onPress={handleAddToWallet}
                variant="primary"
                size="lg"
                loading={loading}
                style={styles.walletButton}
              >
                <View style={styles.walletButtonContent}>
                  <Ionicons name="wallet" size={20} color={colors.white} style={styles.walletButtonIcon} />
                  <Text style={styles.walletButtonText}>Add to Apple Wallet</Text>
                </View>
              </MaslowButton>
            </MaslowCard>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Fallback QR Code */}
            <MaslowCard style={styles.qrCard} padding="lg">
              <Text style={styles.qrTitle}>Show QR Code Instead</Text>

              <View style={styles.qrContainer}>
                <QRCode
                  value={mockMember.qrValue}
                  size={180}
                  backgroundColor={colors.white}
                  color={colors.navy}
                />
              </View>

              <Text style={styles.qrHint}>Scan this at the suite door</Text>

              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{mockMember.name}</Text>
                <Text style={styles.memberTier}>{mockMember.tier}</Text>
                <Text style={styles.memberCredits}>{mockMember.credits} Credits</Text>
              </View>
            </MaslowCard>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: spacing.lg,
  },

  // Success state (has wallet pass)
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.success}15`,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  successText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.success,
    marginLeft: spacing.sm,
  },
  previewCard: {
    marginBottom: spacing.lg,
    backgroundColor: colors.navy,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  previewTier: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
  previewMemberNumber: {
    fontSize: 14,
    color: colors.cream,
    opacity: 0.8,
  },
  previewCredits: {
    fontSize: 15,
    color: colors.gold,
  },
  buttonGroup: {
    marginBottom: spacing.lg,
  },
  secondaryButton: {
    marginTop: spacing.sm,
  },

  // Instructions
  instructionsCard: {
    marginBottom: spacing.lg,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.navy,
    marginBottom: spacing.md,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${colors.navy}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.navy,
  },
  stepText: {
    fontSize: 15,
    color: colors.darkGray,
    flex: 1,
  },

  // Wallet prompt (no pass)
  walletPromptCard: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  walletIcon: {
    marginBottom: spacing.lg,
    opacity: 0.8,
  },
  walletHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.navy,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  walletDescription: {
    fontSize: 15,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  walletButton: {
    width: '100%',
  },
  walletButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletButtonIcon: {
    marginRight: spacing.sm,
  },
  walletButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.lightGray,
  },
  dividerText: {
    fontSize: 13,
    color: colors.darkGray,
    paddingHorizontal: spacing.md,
    fontWeight: '500',
  },

  // QR Code fallback
  qrCard: {
    alignItems: 'center',
  },
  qrTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.navy,
    marginBottom: spacing.lg,
  },
  qrContainer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: spacing.md,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  qrHint: {
    fontSize: 13,
    color: colors.darkGray,
    marginBottom: spacing.lg,
  },
  memberInfo: {
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    width: '100%',
  },
  memberName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.navy,
    marginBottom: spacing.xs,
  },
  memberTier: {
    fontSize: 14,
    color: colors.gold,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  memberCredits: {
    fontSize: 14,
    color: colors.darkGray,
  },
});
