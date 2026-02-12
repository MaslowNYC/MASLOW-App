import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { colors, spacing } from '../src/theme';
import { MaslowCard, MaslowButton } from '../src/components';
import { useHaptics } from '../src/hooks/useHaptics';

interface Booking {
  id: string;
  start_time: string;
  end_time: string;
  status: 'confirmed' | 'checked_in' | 'completed' | 'cancelled';
  duration_minutes: number;
  suites: {
    suite_number: string;
    locations: {
      name: string;
      address: string;
    };
  } | null;
  preferences?: {
    lighting: number;
    music: string;
    temperature: number;
    bidet_temp: string;
    heated_seat: boolean;
    samples: string[];
  };
}

export default function BookingsScreen() {
  const router = useRouter();
  const haptics = useHaptics();
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [pastBookings, setPastBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('Error getting user:', userError?.message);
        setLoading(false);
        return;
      }

      const now = new Date().toISOString();

      // Fetch upcoming bookings
      const { data: upcoming, error: upcomingError } = await supabase
        .from('bookings')
        .select('*, suites(suite_number, locations(name, address))')
        .eq('user_id', user.id)
        .gte('start_time', now)
        .neq('status', 'cancelled')
        .order('start_time', { ascending: true });

      if (upcomingError) {
        console.error('Error fetching upcoming bookings:', upcomingError.message);
      } else {
        setUpcomingBookings(upcoming || []);
      }

      // Fetch past bookings
      const { data: past, error: pastError } = await supabase
        .from('bookings')
        .select('*, suites(suite_number, locations(name, address))')
        .eq('user_id', user.id)
        .lt('start_time', now)
        .order('start_time', { ascending: false })
        .limit(10);

      if (pastError) {
        console.error('Error fetching past bookings:', pastError.message);
      } else {
        setPastBookings(past || []);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    haptics.light();
    await fetchBookings();
    setRefreshing(false);
  };

  const handleBack = () => {
    haptics.light();
    router.back();
  };

  const handleCancelBooking = async (booking: Booking) => {
    haptics.warning();
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel your booking at ${booking.suites?.locations?.name || 'this location'}?`,
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              
              if (!user) {
                Alert.alert('Error', 'You must be logged in to cancel bookings');
                return;
              }

              // Call the cancel function
              const { data, error } = await supabase.rpc('cancel_and_refund_booking', {
                p_booking_id: booking.id,
                p_user_id: user.id
              });

              if (error) {
                console.error('Cancel error:', error);
                Alert.alert('Error', 'Failed to cancel booking. Please try again.');
                return;
              }

              // Check the result
              if (data && data.success) {
                haptics.success();
                Alert.alert(
                  'Booking Cancelled',
                  data.message || `${data.refunded_credits} credit(s) have been refunded to your account.`,
                  [{ text: 'OK', onPress: () => fetchBookings() }]
                );
              } else {
                Alert.alert('Error', data?.error || 'Failed to cancel booking');
              }
            } catch (err) {
              console.error('Cancel exception:', err);
              Alert.alert('Error', 'An unexpected error occurred');
            }
          },
        },
      ]
    );
  };

  const handleFindLocation = () => {
    haptics.light();
    router.push('/(tabs)');
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }) + ' at ' + date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusColor = (status: Booking['status']): string => {
    switch (status) {
      case 'confirmed':
        return colors.success;
      case 'checked_in':
        return colors.gold;
      case 'completed':
        return colors.darkGray;
      case 'cancelled':
        return colors.error;
      default:
        return colors.darkGray;
    }
  };

  const getStatusLabel = (status: Booking['status']): string => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'checked_in':
        return 'Checked In';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const renderBookingCard = (booking: Booking, isUpcoming: boolean) => (
    <MaslowCard key={booking.id} style={styles.bookingCard} padding="md">
      <View style={styles.bookingHeader}>
        <View style={styles.bookingInfo}>
          <Text style={styles.locationName}>
            {booking.suites?.locations?.name || 'Unknown Location'}
          </Text>
          <Text style={styles.suiteName}>
            {booking.suites?.suite_number || 'Suite'}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: `${getStatusColor(booking.status)}20` }
        ]}>
          <View style={[
            styles.statusDot,
            { backgroundColor: getStatusColor(booking.status) }
          ]} />
          <Text style={[
            styles.statusText,
            { color: getStatusColor(booking.status) }
          ]}>
            {getStatusLabel(booking.status)}
          </Text>
        </View>
      </View>

      <View style={styles.bookingDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color={colors.darkGray} />
          <Text style={styles.detailText}>{formatDateTime(booking.start_time)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color={colors.darkGray} />
          <Text style={styles.detailText}>{booking.duration_minutes} minutes</Text>
        </View>
        {booking.suites?.locations?.address && (
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color={colors.darkGray} />
            <Text style={styles.detailText} numberOfLines={1}>
              {booking.suites.locations.address}
            </Text>
          </View>
        )}
      </View>

      {/* Preferences */}
      {booking.preferences && (
        <View style={styles.preferencesRow}>
          <View style={styles.prefChip}>
            <Ionicons name="sunny-outline" size={12} color={colors.gold} />
            <Text style={styles.prefText}>
              {booking.preferences.lighting < 33 ? 'Dark' : booking.preferences.lighting < 67 ? 'Dim' : 'Bright'}
            </Text>
          </View>
          <View style={styles.prefChip}>
            <Ionicons name="thermometer-outline" size={12} color={colors.gold} />
            <Text style={styles.prefText}>{booking.preferences.temperature}°</Text>
          </View>
          <View style={styles.prefChip}>
            <Ionicons name="musical-note-outline" size={12} color={colors.gold} />
            <Text style={styles.prefText}>
              {booking.preferences.music === 'silence' ? 'Silent' :
               booking.preferences.music === 'flushing' ? 'Otohime' :
               booking.preferences.music.charAt(0).toUpperCase() + booking.preferences.music.slice(1)}
            </Text>
          </View>
          {booking.preferences.samples && booking.preferences.samples.length > 0 && (
            <View style={styles.prefChip}>
              <Ionicons name="sparkles-outline" size={12} color={colors.gold} />
              <Text style={styles.prefText}>{booking.preferences.samples.length} samples</Text>
            </View>
          )}
        </View>
      )}

      {isUpcoming && booking.status === 'confirmed' && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => handleCancelBooking(booking)}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelButtonText}>Cancel Booking</Text>
        </TouchableOpacity>
      )}
    </MaslowCard>
  );

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.navy} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Bookings</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.navy} />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.navy}
          />
        }
      >
        {/* Upcoming Bookings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Bookings</Text>

          {upcomingBookings.length > 0 ? (
            upcomingBookings.map(booking => renderBookingCard(booking, true))
          ) : (
            <MaslowCard style={styles.emptyCard} padding="lg">
              <Ionicons name="calendar-outline" size={48} color={colors.darkGray} />
              <Text style={styles.emptyTitle}>No Upcoming Bookings</Text>
              <Text style={styles.emptySubtitle}>
                Ready to book your next session?
              </Text>
              <MaslowButton
                onPress={handleFindLocation}
                variant="primary"
                size="md"
              >
                Find a Location
              </MaslowButton>
            </MaslowCard>
          )}
        </View>

        {/* Past Bookings */}
        {pastBookings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Past Bookings</Text>
            {pastBookings.map(booking => renderBookingCard(booking, false))}
          </View>
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
    backgroundColor: colors.cream,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.darkGray,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.darkGray,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  bookingCard: {
    marginBottom: spacing.md,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  bookingInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.navy,
    marginBottom: 2,
  },
  suiteName: {
    fontSize: 14,
    color: colors.darkGray,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bookingDetails: {
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailText: {
    fontSize: 14,
    color: colors.darkGray,
    flex: 1,
  },
  cancelButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
    textAlign: 'center',
  },
  emptyCard: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.navy,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  preferencesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  prefChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: `${colors.gold}10`,
    borderWidth: 1,
    borderColor: `${colors.gold}40`,
    borderRadius: 6,
  },
  prefText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.navy,
  },
});
