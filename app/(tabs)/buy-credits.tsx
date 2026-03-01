import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';
import { colors, spacing } from '../../src/theme';
import { MaslowButton } from '../../src/components';
import { useHaptics } from '../../src/hooks/useHaptics';
import { supabase, getSafeSession } from '../../lib/supabase';

interface CreditBundle {
  id: string;
  credits: number;
  price: number;
  pricePerCredit: number;
  savings: number;
  label: string | null;
  featured?: boolean;
}

const CREDIT_BUNDLES: CreditBundle[] = [
  {
    id: '1-credit',
    credits: 1,
    price: 5,
    pricePerCredit: 5,
    savings: 0,
    label: null,
  },
  {
    id: '5-credits',
    credits: 5,
    price: 22,
    pricePerCredit: 4.4,
    savings: 3,
    label: 'SAVE $3',
  },
  {
    id: '10-credits',
    credits: 10,
    price: 42,
    pricePerCredit: 4.2,
    savings: 8,
    label: 'MOST POPULAR',
    featured: true,
  },
  {
    id: '20-credits',
    credits: 20,
    price: 80,
    pricePerCredit: 4,
    savings: 20,
    label: 'BEST VALUE',
  },
];

const FOUNDING_MEMBER_BUNDLE: CreditBundle = {
  id: 'founding-200',
  credits: 200,
  price: 500,
  pricePerCredit: 2.5,
  savings: 500, // $1000 value (200 x $5) for $500
  label: 'FOUNDING MEMBER',
};

export default function BuyCreditsScreen() {
  const router = useRouter();
  const haptics = useHaptics();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [selectedBundle, setSelectedBundle] = useState<CreditBundle | null>(null);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  const fetchBalance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      const { data } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();

      setCurrentBalance(data?.credits || 0);
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchBalance();
    }, [])
  );

  const handleClose = () => {
    haptics.light();
    router.back();
  };

  const handleSelectBundle = (bundle: CreditBundle) => {
    haptics.light();
    if (selectedBundle?.id === bundle.id) {
      setSelectedBundle(null);
    } else {
      setSelectedBundle(bundle);
    }
  };

  const handlePurchase = async () => {
    if (!selectedBundle || !userId) {
      Alert.alert('No Bundle Selected', 'Please select a credit bundle');
      return;
    }

    haptics.medium();
    setPurchasing(true);

    try {
      // 1. Get auth session
      const session = await getSafeSession();
      if (!session) {
        Alert.alert('Error', 'Please sign in to purchase credits');
        return;
      }

      // 2. Create payment intent via edge function
      const response = await fetch(
        'https://hrfmphkjeqcwhsfvzfvw.supabase.co/functions/v1/create-payment-intent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            amount: selectedBundle.price * 100,
            userId,
            credits: selectedBundle.credits,
            packageName: selectedBundle.label || `${selectedBundle.credits} Credits`,
          }),
        }
      );

      const { clientSecret, error: intentError } = await response.json();

      if (intentError || !clientSecret) {
        throw new Error(intentError || 'Failed to create payment');
      }

      // 3. Init payment sheet (Apple Pay disabled until merchant ID configured in Apple Developer)
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'Maslow NYC',
        style: 'automatic',
      });

      if (initError) throw new Error(initError.message);

      // 4. Present payment sheet
      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        if (paymentError.code === 'Canceled') return; // user dismissed, not an error
        throw new Error(paymentError.message);
      }

      // 5. Payment succeeded — update credits in Supabase
      const newBalance = currentBalance + selectedBundle.credits;
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ credits: newBalance })
        .eq('id', userId);

      if (dbError) throw dbError;

      // 6. Record transaction (wrapped in try/catch in case table doesn't exist)
      try {
        await supabase.from('credit_transactions').insert({
          user_id: userId,
          amount: selectedBundle.credits,
          type: 'purchase',
          description: `Purchased ${selectedBundle.label || selectedBundle.credits + ' Credits'}`,
          price_paid: selectedBundle.price,
        });
      } catch (txError) {
        console.warn('Could not record transaction:', txError);
      }

      haptics.success();
      setCurrentBalance(newBalance);
      setSelectedBundle(null);
      Alert.alert(
        '✓ Purchase Complete',
        `${selectedBundle.credits} credits added to your account!\n\nNew balance: ${newBalance} credits`
      );

    } catch (error: any) {
      console.error('Purchase error:', error);
      haptics.error();
      Alert.alert('Payment Failed', error.message || 'Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const BundleCard = ({ bundle }: { bundle: CreditBundle }) => {
    const isSelected = selectedBundle?.id === bundle.id;

    return (
      <TouchableOpacity
        style={[
          styles.bundleCard,
          bundle.featured && styles.featuredCard,
          isSelected && styles.selectedCard,
        ]}
        onPress={() => handleSelectBundle(bundle)}
        activeOpacity={0.8}
      >
        {bundle.label && (
          <View style={[
            styles.labelBadge,
            bundle.featured && styles.featuredBadge,
          ]}>
            <Text style={styles.labelText}>{bundle.label}</Text>
          </View>
        )}

        {isSelected && (
          <View style={styles.checkmark}>
            <Ionicons name="checkmark-circle" size={24} color={colors.gold} />
          </View>
        )}

        <Text style={styles.creditsAmount}>
          {bundle.credits} CREDIT{bundle.credits > 1 ? 'S' : ''}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>${bundle.price}</Text>
          {bundle.savings > 0 && (
            <Text style={styles.perCredit}>(${bundle.pricePerCredit}/ea)</Text>
          )}
        </View>

        {bundle.savings > 0 && (
          <Text style={styles.savings}>Save ${bundle.savings}</Text>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.navy} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buy Credits</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Balance */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>{currentBalance} credits</Text>
        </View>

        {/* Bundle Cards */}
        <Text style={styles.sectionTitle}>Choose Your Bundle</Text>

        <View style={styles.bundlesContainer}>
          {CREDIT_BUNDLES.map((bundle) => (
            <BundleCard key={bundle.id} bundle={bundle} />
          ))}
        </View>

        {/* Founding Member Special */}
        <Text style={styles.sectionTitle}>Pre-Launch Special</Text>

        <TouchableOpacity
          style={[
            styles.foundingCard,
            selectedBundle?.id === FOUNDING_MEMBER_BUNDLE.id && styles.foundingCardSelected,
          ]}
          onPress={() => handleSelectBundle(FOUNDING_MEMBER_BUNDLE)}
          activeOpacity={0.8}
        >
          <View style={styles.foundingBadge}>
            <Text style={styles.foundingBadgeText}>FOUNDING MEMBER</Text>
          </View>

          {selectedBundle?.id === FOUNDING_MEMBER_BUNDLE.id && (
            <View style={styles.foundingCheckmark}>
              <Ionicons name="checkmark-circle" size={28} color={colors.gold} />
            </View>
          )}

          <Text style={styles.foundingCredits}>200 Credits</Text>
          <Text style={styles.foundingPrice}>$500</Text>
          <Text style={styles.foundingSavings}>Save $500 (50% off!)</Text>

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
              <Text style={styles.perkText}>Founding Member badge forever</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* What You Get */}
        <Text style={styles.sectionTitle}>What You Get</Text>

        <View style={styles.benefitsCard}>
          <View style={styles.benefitRow}>
            <Ionicons name="time-outline" size={20} color={colors.gold} />
            <Text style={styles.benefitText}>1 credit = 10 min suite time</Text>
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
        </View>
      </ScrollView>

      {/* Footer */}
      {selectedBundle && (
        <View style={styles.footer}>
          <View style={styles.footerSummary}>
            <Text style={styles.footerCredits}>{selectedBundle.credits} Credits</Text>
            <Text style={styles.footerPrice}>${selectedBundle.price}</Text>
          </View>
          <MaslowButton
            onPress={handlePurchase}
            variant="primary"
            size="lg"
            loading={purchasing}
          >
            Continue to Payment
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backButton: {
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
    paddingBottom: 140,
  },

  // Balance Card
  balanceCard: {
    backgroundColor: colors.navy,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.cream,
    opacity: 0.8,
    marginBottom: spacing.xs,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.gold,
  },

  // Section
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },

  // Bundle Cards
  bundlesContainer: {
    gap: spacing.md,
  },
  bundleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  featuredCard: {
    borderColor: colors.navy,
    borderWidth: 3,
  },
  selectedCard: {
    borderColor: colors.gold,
    backgroundColor: `${colors.gold}10`,
  },
  labelBadge: {
    position: 'absolute',
    top: -10,
    right: spacing.md,
    backgroundColor: colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featuredBadge: {
    backgroundColor: colors.navy,
  },
  labelText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  checkmark: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
  creditsAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  perCredit: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: spacing.sm,
  },
  savings: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 4,
  },

  // Founding Member Card
  foundingCard: {
    backgroundColor: colors.navy,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 3,
    borderColor: colors.gold,
    alignItems: 'center',
    position: 'relative',
  },
  foundingCardSelected: {
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
    fontSize: 28,
    fontWeight: '700',
    color: colors.cream,
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
    color: '#10B981',
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
    color: colors.cream,
    fontWeight: '500',
  },

  // Benefits Card
  benefitsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.md,
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
