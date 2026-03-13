import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { colors, fonts } from '../../src/theme/colors';
import { spacing } from '../../src/theme';
import { MaslowCard } from '../../src/components';
import { UseItNowFlow } from '../../src/components/UseItNowFlow';
import { useHaptics } from '../../src/hooks/useHaptics';

interface Location {
  id: string;
  name: string;
  address: string;
  city: string | null;
  state: string | null;
  available_suites: number;
  total_suites: number;
  hours: string | null;
  image_url: string | null;
}

type BookView = 'main' | 'useItNow' | 'schedule';

export default function BookScreen() {
  const router = useRouter();
  const haptics = useHaptics();
  const [view, setView] = useState<BookView>('main');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [userMemberId, setUserMemberId] = useState<string>('');

  useEffect(() => {
    fetchLocations();
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('member_number')
          .eq('id', user.id)
          .single() as { data: { member_number: number | null } | null };

        if (profile?.member_number) {
          setUserMemberId(`MASLOW-${profile.member_number}`);
        } else {
          setUserMemberId(user.id);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
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

  const onRefresh = async () => {
    setRefreshing(true);
    haptics.light();
    await fetchLocations();
    setRefreshing(false);
  };

  const handleLocationPress = (location: Location) => {
    haptics.light();
    router.push(`/book/${location.id}`);
  };

  const handleUseItNow = () => {
    haptics.medium();
    setView('useItNow');
  };

  const handleScheduleVisit = () => {
    haptics.light();
    setView('schedule');
  };

  const handleUseItNowComplete = () => {
    // TODO: In production, navigate to active session screen
    haptics.success();
    setView('main');
    router.push('/control'); // Navigate to suite control screen
  };

  const handleBackToMain = () => {
    haptics.light();
    setView('main');
  };

  // Use It Now Flow (full screen)
  if (view === 'useItNow') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <UseItNowFlow
          userQrData={userMemberId}
          onComplete={handleUseItNowComplete}
          onCancel={handleBackToMain}
        />
      </SafeAreaView>
    );
  }

  // Schedule a Visit (location list)
  if (view === 'schedule') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header with back button */}
        <View style={styles.scheduleHeader}>
          <TouchableOpacity onPress={handleBackToMain} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.charcoal} />
          </TouchableOpacity>
          <View style={styles.scheduleHeaderText}>
            <Text style={styles.title}>Schedule a Visit</Text>
            <Text style={styles.subtitle}>CHOOSE A LOCATION</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.gold}
            />
          }
        >
          {loading ? (
            <ActivityIndicator size="large" color={colors.gold} />
          ) : locations.length === 0 ? (
            <MaslowCard style={styles.emptyCard} padding="xl">
              <Ionicons name="location-outline" size={48} color={colors.charcoal30} />
              <Text style={styles.emptyTitle}>No Locations Available</Text>
              <Text style={styles.emptySubtitle}>
                Check back soon for available locations
              </Text>
            </MaslowCard>
          ) : (
            locations.map((location) => {
              const isAvailable = location.available_suites > 0;

              return (
                <TouchableOpacity
                  key={location.id}
                  onPress={() => handleLocationPress(location)}
                  activeOpacity={0.8}
                >
                  <MaslowCard style={styles.locationCard} padding="md">
                    <View style={styles.locationHeader}>
                      <View style={styles.locationInfo}>
                        <Text style={styles.locationName}>{location.name}</Text>
                        <View style={styles.addressRow}>
                          <Ionicons name="location-outline" size={14} color={colors.charcoal50} />
                          <Text style={styles.locationAddress} numberOfLines={1}>
                            {location.address}
                            {location.city && `, ${location.city}`}
                          </Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={colors.charcoal30} />
                    </View>

                    <View style={styles.locationFooter}>
                      <View style={styles.availabilityBadge}>
                        <View style={[
                          styles.availabilityDot,
                          { backgroundColor: isAvailable ? colors.success : colors.error }
                        ]} />
                        <Text style={[
                          styles.availabilityText,
                          { color: isAvailable ? colors.success : colors.error }
                        ]}>
                          {isAvailable
                            ? `${location.available_suites} suite${location.available_suites > 1 ? 's' : ''} available`
                            : 'Fully booked'}
                        </Text>
                      </View>

                      {location.hours && (
                        <View style={styles.hoursRow}>
                          <Ionicons name="time-outline" size={12} color={colors.charcoal50} />
                          <Text style={styles.hoursText}>{location.hours}</Text>
                        </View>
                      )}
                    </View>
                  </MaslowCard>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Main view - Two CTAs
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.mainContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.mainTitle}>Book</Text>
          <Text style={styles.subtitle}>YOUR SANCTUARY AWAITS</Text>
        </View>

        {/* Two CTAs */}
        <View style={styles.ctaContainer}>
          {/* Use It Now - Primary */}
          <TouchableOpacity
            style={styles.primaryCta}
            onPress={handleUseItNow}
            activeOpacity={0.8}
          >
            <View style={styles.ctaIconContainer}>
              <Ionicons name="flash" size={32} color={colors.charcoal} />
            </View>
            <Text style={styles.primaryCtaTitle}>Use It Now</Text>
            <Text style={styles.primaryCtaSubtitle}>
              I'm here and want a suite
            </Text>
          </TouchableOpacity>

          {/* Schedule a Visit - Secondary */}
          <TouchableOpacity
            style={styles.secondaryCta}
            onPress={handleScheduleVisit}
            activeOpacity={0.8}
          >
            <View style={styles.ctaIconContainerSecondary}>
              <Ionicons name="calendar-outline" size={32} color={colors.charcoal} />
            </View>
            <Text style={styles.secondaryCtaTitle}>Schedule a Visit</Text>
            <Text style={styles.secondaryCtaSubtitle}>
              Book for a future date/time
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info text */}
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle-outline" size={20} color={colors.charcoal30} />
          <Text style={styles.infoText}>
            "Use It Now" places you in the queue instantly. Perfect for when you're already at the location.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  header: {
    marginBottom: spacing.xl,
  },
  mainTitle: {
    fontSize: 36,
    fontFamily: fonts.serifLight,
    color: colors.charcoal,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.serifLight,
    color: colors.charcoal,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: fonts.sansSemiBold,
    color: colors.gold,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  ctaContainer: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  primaryCta: {
    backgroundColor: colors.gold,
    borderRadius: 12, // 0.75rem as per brief
    padding: spacing.xl,
    alignItems: 'center',
  },
  ctaIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  primaryCtaTitle: {
    fontSize: 22,
    fontFamily: fonts.serifLight,
    color: colors.charcoal,
    marginBottom: 4,
  },
  primaryCtaSubtitle: {
    fontSize: 14,
    fontFamily: fonts.sansRegular,
    color: colors.charcoal,
    opacity: 0.8,
  },
  secondaryCta: {
    backgroundColor: colors.cream,
    borderRadius: 12,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.charcoal,
  },
  ctaIconContainerSecondary: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.charcoal10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  secondaryCtaTitle: {
    fontSize: 22,
    fontFamily: fonts.serifLight,
    color: colors.charcoal,
    marginBottom: 4,
  },
  secondaryCtaSubtitle: {
    fontSize: 14,
    fontFamily: fonts.sansRegular,
    color: colors.charcoal50,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.sansRegular,
    color: colors.charcoal50,
    lineHeight: 20,
  },
  // Schedule view styles
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.charcoal10,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  scheduleHeaderText: {
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    padding: 20,
    paddingTop: spacing.md,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCard: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: fonts.serifLight,
    color: colors.charcoal,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: fonts.sansRegular,
    color: colors.charcoal50,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  locationCard: {
    marginBottom: spacing.md,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 20,
    fontFamily: fonts.serifLight,
    color: colors.charcoal,
    marginBottom: 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationAddress: {
    fontSize: 13,
    fontFamily: fonts.sansRegular,
    color: colors.charcoal50,
    flex: 1,
  },
  locationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.charcoal10,
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
  },
  availabilityText: {
    fontSize: 13,
    fontFamily: fonts.sansSemiBold,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hoursText: {
    fontSize: 12,
    fontFamily: fonts.sansRegular,
    color: colors.charcoal50,
  },
});
