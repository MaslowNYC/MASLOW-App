import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { colors, spacing } from '../src/theme';
import { MaslowCard } from '../src/components';
import { useHaptics } from '../src/hooks/useHaptics';

interface Location {
  id: string;
  name: string;
  address: string;
  available_suites: number;
  total_suites: number;
}

export default function QuickVisitScreen() {
  const router = useRouter();
  const haptics = useHaptics();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'credits' | 'cash'>('credits');
  const [userCredits, setUserCredits] = useState<number>(0);

  useEffect(() => {
    fetchLocations();
    fetchUserCredits();
  }, []);

  const fetchUserCredits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date().toISOString();
      const { data } = await supabase
        .from('credits')
        .select('amount')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .or(`expires_at.is.null,expires_at.gt.${now}`);

      const total = (data || []).reduce((sum, row) => sum + (row.amount || 0), 0);
      setUserCredits(total);
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, address, available_suites, total_suites')
        .eq('is_operational', true)
        .order('name');

      if (error) {
        console.error('Error fetching locations:', error.message);
        return;
      }

      setLocations(data || []);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    haptics.light();
    router.back();
  };

  const handleLocationPress = (location: Location) => {
    haptics.light();
    router.push(`/book/${location.id}?quick=true`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quick Visit</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Price Card */}
        <View style={styles.priceCard}>
          <View style={styles.priceHeader}>
            <View style={styles.flashIconContainer}>
              <Ionicons name="flash" size={24} color={colors.gold} />
            </View>
            <Text style={styles.priceCardTitle}>Quick Visit</Text>
          </View>

          {/* Payment Toggle */}
          <View style={styles.paymentToggleContainer}>
            <TouchableOpacity
              style={[
                styles.paymentToggleOption,
                paymentMethod === 'credits' && styles.paymentToggleOptionActive,
              ]}
              onPress={() => {
                haptics.light();
                setPaymentMethod('credits');
              }}
            >
              <Ionicons
                name="ticket-outline"
                size={16}
                color={paymentMethod === 'credits' ? colors.gold : colors.darkGray}
              />
              <Text style={[
                styles.paymentToggleText,
                paymentMethod === 'credits' && styles.paymentToggleTextActive,
              ]}>
                Credits
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.paymentToggleOption,
                paymentMethod === 'cash' && styles.paymentToggleOptionActive,
              ]}
              onPress={() => {
                haptics.light();
                setPaymentMethod('cash');
              }}
            >
              <Ionicons
                name="cash-outline"
                size={16}
                color={paymentMethod === 'cash' ? colors.gold : colors.darkGray}
              />
              <Text style={[
                styles.paymentToggleText,
                paymentMethod === 'cash' && styles.paymentToggleTextActive,
              ]}>
                Cash
              </Text>
            </TouchableOpacity>
          </View>

          {/* Price Display */}
          <View style={styles.priceDisplay}>
            <Text style={styles.priceAmount}>
              {paymentMethod === 'credits' ? '1' : '$5'}
            </Text>
            <Text style={styles.priceUnit}>
              {paymentMethod === 'credits' ? 'credit' : ''}
            </Text>
          </View>
          <Text style={styles.priceDetails}>10 minutes • No reservation needed</Text>

          {/* Credit Balance Hint */}
          {paymentMethod === 'credits' && (
            <View style={styles.creditBalanceHint}>
              <Ionicons name="wallet-outline" size={14} color={colors.darkGray} />
              <Text style={styles.creditBalanceText}>
                You have {userCredits} credits.{' '}
                {userCredits < 1 && (
                  <Text
                    style={styles.buyCreditsLink}
                    onPress={() => router.push('/buy-credits')}
                  >
                    Buy more
                  </Text>
                )}
              </Text>
            </View>
          )}
        </View>

        {/* Available Now Section */}
        <Text style={styles.sectionTitle}>Available Now</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.navy} />
          </View>
        ) : locations.length === 0 ? (
          <MaslowCard padding="lg" style={styles.emptyCard}>
            <Ionicons name="location-outline" size={48} color={colors.darkGray} />
            <Text style={styles.emptyTitle}>No locations available</Text>
            <Text style={styles.emptySubtitle}>Check back soon!</Text>
          </MaslowCard>
        ) : (
          locations.map((location) => (
            <TouchableOpacity
              key={location.id}
              onPress={() => handleLocationPress(location)}
              activeOpacity={0.8}
            >
              <MaslowCard style={styles.locationCard} padding="md">
                <View style={styles.locationContent}>
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationName}>{location.name}</Text>
                    <Text style={styles.locationAddress}>{location.address}</Text>
                    <View style={styles.availabilityBadge}>
                      <View style={styles.availabilityDot} />
                      <Text style={styles.availabilityText}>
                        {location.available_suites} suites available now
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color={colors.darkGray} />
                </View>
              </MaslowCard>
            </TouchableOpacity>
          ))
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
    width: 40,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  priceCard: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.gold,
    padding: spacing.lg,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  priceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  flashIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.gold}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.navy,
  },
  paymentToggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    padding: 2,
    marginBottom: spacing.md,
  },
  paymentToggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  paymentToggleOptionActive: {
    backgroundColor: colors.white,
  },
  paymentToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.darkGray,
  },
  paymentToggleTextActive: {
    color: colors.gold,
  },
  priceDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: spacing.xs,
  },
  priceAmount: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.gold,
  },
  priceUnit: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.gold,
  },
  priceDetails: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.darkGray,
    marginBottom: spacing.sm,
  },
  creditBalanceHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  creditBalanceText: {
    fontSize: 13,
    color: colors.darkGray,
  },
  buyCreditsLink: {
    color: colors.gold,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.darkGray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  loadingContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyCard: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.navy,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.darkGray,
    marginTop: spacing.xs,
  },
  locationCard: {
    marginBottom: spacing.md,
  },
  locationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.navy,
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: spacing.sm,
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  availabilityText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.success,
  },
});
