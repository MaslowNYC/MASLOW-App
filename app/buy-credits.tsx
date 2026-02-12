import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../src/theme';
import { MaslowButton } from '../src/components';
import { useHaptics } from '../src/hooks/useHaptics';

interface CreditBundle {
  credits: number;
  price: number;
  savings: number;
  popular?: boolean;
}

const BUNDLES: CreditBundle[] = [
  { credits: 10, price: 45, savings: 5 },
  { credits: 25, price: 100, savings: 25, popular: true },
  { credits: 50, price: 200, savings: 50 },
  { credits: 100, price: 350, savings: 150 },
];

const FOUNDING_MEMBER_BUNDLE: CreditBundle = {
  credits: 200,
  price: 500,
  savings: 500,
};

const getEquivalency = (credits: number): string => {
  const quickVisits = credits;
  const thirtyMinSessions = Math.floor(credits / 5);
  if (credits <= 10) {
    return `= ${quickVisits} quick visits`;
  }
  return `= ${quickVisits} quick visits or ${thirtyMinSessions} 30-min sessions`;
};

export default function BuyCreditsScreen() {
  const router = useRouter();
  const haptics = useHaptics();
  const [selectedBundle, setSelectedBundle] = useState<CreditBundle | null>(null);

  const handleClose = () => {
    haptics.light();
    router.back();
  };

  const handleSelectBundle = (bundle: CreditBundle) => {
    haptics.light();
    if (selectedBundle?.credits === bundle.credits && selectedBundle?.price === bundle.price) {
      setSelectedBundle(null);
    } else {
      setSelectedBundle(bundle);
    }
  };

  const handlePurchase = () => {
    haptics.medium();
    Alert.alert('Coming Soon', 'Purchase credits integration coming soon!');
  };

  const isBundleSelected = (bundle: CreditBundle): boolean => {
    return selectedBundle?.credits === bundle.credits && selectedBundle?.price === bundle.price;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={colors.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buy Credits</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Explainer Card */}
        <View style={styles.explainerCard}>
          <View style={styles.explainerIcon}>
            <Ionicons name="card" size={28} color={colors.gold} />
          </View>
          <View style={styles.explainerContent}>
            <Text style={styles.explainerTitle}>Credits = Time at Maslow</Text>
            <Text style={styles.explainerText}>
              1 credit = $5 value. Buy bundles and save!{'\n'}
              Valid for 1 year • Can be gifted
            </Text>
          </View>
        </View>

        {/* Choose Your Bundle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Your Bundle</Text>
          <View style={styles.bundlesGrid}>
            {BUNDLES.map((bundle) => {
              const isSelected = isBundleSelected(bundle);
              return (
                <TouchableOpacity
                  key={bundle.credits}
                  style={[
                    styles.bundleCard,
                    isSelected && styles.bundleCardSelected,
                  ]}
                  onPress={() => handleSelectBundle(bundle)}
                  activeOpacity={0.8}
                >
                  {bundle.popular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                    </View>
                  )}
                  {isSelected && (
                    <View style={styles.selectedCheckmark}>
                      <Ionicons name="checkmark-circle" size={24} color={colors.gold} />
                    </View>
                  )}
                  <Text style={styles.bundleCredits}>{bundle.credits}</Text>
                  <Text style={styles.bundleCreditsLabel}>Credits</Text>
                  <Text style={styles.bundlePrice}>${bundle.price}</Text>
                  <Text style={styles.bundleSavings}>Save ${bundle.savings}!</Text>
                  <Text style={styles.bundleEquivalency}>{getEquivalency(bundle.credits)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Pre-Launch Special */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pre-Launch Special</Text>
          <TouchableOpacity
            style={[
              styles.foundingMemberCard,
              isBundleSelected(FOUNDING_MEMBER_BUNDLE) && styles.foundingMemberCardSelected,
            ]}
            onPress={() => handleSelectBundle(FOUNDING_MEMBER_BUNDLE)}
            activeOpacity={0.8}
          >
            <View style={styles.foundingBadge}>
              <Text style={styles.foundingBadgeText}>FOUNDING MEMBER</Text>
            </View>
            {isBundleSelected(FOUNDING_MEMBER_BUNDLE) && (
              <View style={styles.foundingCheckmark}>
                <Ionicons name="checkmark-circle" size={28} color={colors.gold} />
              </View>
            )}
            <Text style={styles.foundingCredits}>200 Credits</Text>
            <Text style={styles.foundingPrice}>$500</Text>
            <Text style={styles.foundingSavings}>Save $500!</Text>

            <View style={styles.foundingPerks}>
              <View style={styles.perkRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.gold} />
                <Text style={styles.perkText}>$1,000 value for $500</Text>
              </View>
              <View style={styles.perkRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.gold} />
                <Text style={styles.perkText}>Only available before opening</Text>
              </View>
              <View style={styles.perkRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.gold} />
                <Text style={styles.perkText}>Help build NYC's first real restroom</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* What You Get */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What You Get</Text>
          <View style={styles.benefitsCard}>
            <View style={styles.benefitRow}>
              <Ionicons name="time-outline" size={20} color={colors.gold} />
              <Text style={styles.benefitText}>1 credit = $5 value (10 min)</Text>
            </View>
            <View style={styles.benefitDivider} />
            <View style={styles.benefitRow}>
              <Ionicons name="calendar-outline" size={20} color={colors.gold} />
              <Text style={styles.benefitText}>Valid for 1 year from purchase</Text>
            </View>
            <View style={styles.benefitDivider} />
            <View style={styles.benefitRow}>
              <Ionicons name="gift-outline" size={20} color={colors.gold} />
              <Text style={styles.benefitText}>Transferable to friends & family</Text>
            </View>
            <View style={styles.benefitDivider} />
            <View style={styles.benefitRow}>
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.gold} />
              <Text style={styles.benefitText}>Use for any Maslow service</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      {selectedBundle && (
        <View style={styles.footer}>
          <View style={styles.footerSummary}>
            <Text style={styles.footerCredits}>{selectedBundle.credits} Credits</Text>
            <Text style={styles.footerPrice}>${selectedBundle.price}</Text>
          </View>
          <MaslowButton onPress={handlePurchase} variant="primary" size="lg">
            Purchase Credits
          </MaslowButton>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  closeButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.navy,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  // Explainer Card
  explainerCard: {
    flexDirection: 'row',
    backgroundColor: colors.navy,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  explainerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${colors.gold}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  explainerContent: {
    flex: 1,
  },
  explainerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
  },
  explainerText: {
    fontSize: 13,
    color: `${colors.white}CC`,
    lineHeight: 18,
  },
  // Section
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: spacing.md,
  },
  // Bundles Grid
  bundlesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  bundleCard: {
    width: '47%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.lightGray,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  bundleCardSelected: {
    borderColor: colors.gold,
    backgroundColor: `${colors.gold}10`,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 10,
  },
  popularBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.navy,
    letterSpacing: 0.5,
  },
  selectedCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  bundleCredits: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.navy,
    marginTop: spacing.sm,
  },
  bundleCreditsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.darkGray,
    marginBottom: spacing.sm,
  },
  bundlePrice: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gold,
    marginBottom: 2,
  },
  bundleSavings: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.success,
    marginBottom: spacing.sm,
  },
  bundleEquivalency: {
    fontSize: 10,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 14,
  },
  // Founding Member Card
  foundingMemberCard: {
    backgroundColor: colors.navy,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 3,
    borderColor: colors.gold,
    alignItems: 'center',
    position: 'relative',
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  foundingMemberCardSelected: {
    borderColor: colors.gold,
    backgroundColor: '#1a1a2e',
  },
  foundingBadge: {
    position: 'absolute',
    top: -12,
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 12,
  },
  foundingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.navy,
    letterSpacing: 1,
  },
  foundingCheckmark: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  foundingCredits: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.white,
    marginTop: spacing.md,
  },
  foundingPrice: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.gold,
    marginVertical: spacing.xs,
  },
  foundingSavings: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.success,
    marginBottom: spacing.md,
  },
  foundingPerks: {
    width: '100%',
    gap: spacing.sm,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  perkText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '500',
  },
  // Benefits Card
  benefitsCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.md,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  benefitText: {
    fontSize: 14,
    color: colors.navy,
    fontWeight: '500',
  },
  benefitDivider: {
    height: 1,
    backgroundColor: colors.lightGray,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.cream,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  footerSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  footerCredits: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.navy,
  },
  footerPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gold,
  },
});
