import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { colors, fonts, shape } from '../../src/theme/colors';
import { spacing } from '../../src/theme';
import { MaslowCard, MaslowButton } from '../../src/components';
import { useHaptics } from '../../src/hooks/useHaptics';

const HULL_QUEUE_URL = 'https://hrfmphkjeqcwhsfvzfvw.supabase.co/functions/v1/hull-queue';

interface HullStatus {
  current_occupancy: number;
  max_capacity: number;
  queue_length: number;
}

interface HullQueueEntry {
  id: string;
  queue_type: 'walk_up' | 'reservation';
  status: string;
  position: number | null;
  reserved_for: string | null;
  created_at: string;
}

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

  // Hull queue state
  const [hullStatus, setHullStatus] = useState<HullStatus | null>(null);
  const [hullEntry, setHullEntry] = useState<HullQueueEntry | null>(null);
  const [hullLoading, setHullLoading] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
    fetchHullStatus();
  }, []);

  // Fetch Hull status (no auth required)
  const fetchHullStatus = async () => {
    try {
      const res = await fetch(`${HULL_QUEUE_URL}?action=status`);
      const data = await res.json();
      if (data.success) {
        setHullStatus(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch Hull status:', err);
    }
  };

  // Fetch user's active Hull queue entry
  const fetchHullEntry = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('queue')
        .select('*')
        .eq('user_id', session.user.id)
        .in('status', ['waiting', 'called', 'checked_in'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setHullEntry(data as HullQueueEntry);
      } else {
        setHullEntry(null);
      }
    } catch (err) {
      console.error('Failed to fetch Hull entry:', err);
    }
  }, []);

  useEffect(() => {
    fetchHullEntry();
    // Poll Hull status every 30 seconds
    const interval = setInterval(fetchHullStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchHullEntry]);

  // Join walk-up queue
  const handleJoinQueue = async () => {
    setHullLoading(true);
    haptics.light();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert('Sign In Required', 'Please sign in to join the Hull queue.');
        return;
      }

      const res = await fetch(`${HULL_QUEUE_URL}?action=join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ queue_type: 'walk_up' }),
      });
      const data = await res.json();

      if (data.success) {
        haptics.success();
        await fetchHullEntry();
        await fetchHullStatus();
      } else {
        Alert.alert('Error', data.error || 'Failed to join queue');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to join queue');
    } finally {
      setHullLoading(false);
    }
  };

  // Make reservation
  const handleReserve = async (timeSlot: string) => {
    setHullLoading(true);
    haptics.light();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert('Sign In Required', 'Please sign in to reserve a spot.');
        return;
      }

      const res = await fetch(`${HULL_QUEUE_URL}?action=join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ queue_type: 'reservation', reserved_for: timeSlot }),
      });
      const data = await res.json();

      if (data.success) {
        haptics.success();
        setShowTimePicker(false);
        await fetchHullEntry();
        await fetchHullStatus();
      } else {
        Alert.alert('Error', data.error || 'Failed to reserve');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to reserve');
    } finally {
      setHullLoading(false);
    }
  };

  // Cancel queue/reservation
  const handleCancelHull = async () => {
    if (!hullEntry) return;
    haptics.warning();
    Alert.alert(
      'Cancel',
      hullEntry.queue_type === 'reservation' ? 'Cancel your Hull reservation?' : 'Leave the Hull queue?',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (!session) return;

              const res = await fetch(`${HULL_QUEUE_URL}?action=cancel`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ queue_id: hullEntry.id }),
              });
              const data = await res.json();

              if (data.success) {
                haptics.success();
                setHullEntry(null);
                await fetchHullStatus();
              } else {
                Alert.alert('Error', data.error || 'Failed to cancel');
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to cancel');
            }
          },
        },
      ]
    );
  };

  // Generate time slots for the picker
  const generateTimeSlots = (): string[] => {
    const slots: string[] = [];
    const now = new Date();
    const startHour = Math.max(7, now.getHours() + 1);
    for (let h = startHour; h <= 21; h++) {
      for (const m of [0, 30]) {
        const date = new Date();
        date.setHours(h, m, 0, 0);
        if (date > now) {
          slots.push(date.toISOString());
        }
      }
    }
    return slots;
  };

  const formatTimeSlot = (iso: string): string => {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

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
    await Promise.all([fetchBookings(), fetchHullStatus(), fetchHullEntry()]);
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
        return colors.charcoal50;
      case 'cancelled':
        return colors.error;
      default:
        return colors.charcoal50;
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
          <Ionicons name="calendar-outline" size={16} color={colors.charcoal50} />
          <Text style={styles.detailText}>{formatDateTime(booking.start_time)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color={colors.charcoal50} />
          <Text style={styles.detailText}>{booking.duration_minutes} minutes</Text>
        </View>
        {booking.suites?.locations?.address && (
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color={colors.charcoal50} />
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
            <Ionicons name="arrow-back" size={24} color={colors.charcoal} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Bookings</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.gold} />
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
          <Ionicons name="arrow-back" size={24} color={colors.charcoal} />
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
            tintColor={colors.gold}
          />
        }
      >
        {/* Hull Queue Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>The Hull</Text>

          {/* Occupancy Status */}
          {hullStatus && (
            <MaslowCard style={styles.hullStatusCard} padding="md">
              <View style={styles.hullStatusHeader}>
                <Text style={styles.hullStatusTitle}>Current Occupancy</Text>
                <Text style={[
                  styles.hullStatusValue,
                  { color: hullStatus.current_occupancy >= hullStatus.max_capacity ? colors.error :
                           hullStatus.current_occupancy >= hullStatus.max_capacity * 0.75 ? colors.warning :
                           colors.success }
                ]}>
                  {hullStatus.current_occupancy} / {hullStatus.max_capacity}
                </Text>
              </View>
              <View style={styles.occupancyBar}>
                <View style={[
                  styles.occupancyFill,
                  {
                    width: `${Math.min(100, (hullStatus.current_occupancy / hullStatus.max_capacity) * 100)}%`,
                    backgroundColor: hullStatus.current_occupancy >= hullStatus.max_capacity ? colors.error :
                                     hullStatus.current_occupancy >= hullStatus.max_capacity * 0.75 ? colors.warning :
                                     colors.success
                  }
                ]} />
              </View>
              {hullStatus.queue_length > 0 && (
                <Text style={styles.queueInfo}>
                  {hullStatus.queue_length} {hullStatus.queue_length === 1 ? 'person' : 'people'} waiting
                </Text>
              )}
            </MaslowCard>
          )}

          {/* Active Hull Entry Card */}
          {hullEntry && (
            <MaslowCard style={styles.hullActiveCard} padding="md">
              <View style={styles.hullActiveHeader}>
                <Ionicons name="checkmark-circle" size={24} color={colors.gold} />
                <Text style={styles.hullActiveTitle}>
                  {hullEntry.queue_type === 'reservation' ? 'Reservation Confirmed' : "You're in Line"}
                </Text>
              </View>
              {hullEntry.queue_type === 'reservation' && hullEntry.reserved_for && (
                <Text style={styles.hullActiveTime}>
                  Reserved for {formatTimeSlot(hullEntry.reserved_for)}
                </Text>
              )}
              {hullEntry.queue_type === 'walk_up' && hullEntry.position && (
                <Text style={styles.hullActivePosition}>
                  Position #{hullEntry.position} in queue
                </Text>
              )}
              <TouchableOpacity onPress={handleCancelHull} style={styles.hullCancelLink}>
                <Text style={styles.hullCancelText}>Cancel</Text>
              </TouchableOpacity>
            </MaslowCard>
          )}

          {/* Action Buttons (only show if no active entry) */}
          {!hullEntry && (
            <View style={styles.hullActions}>
              <MaslowButton
                onPress={handleJoinQueue}
                variant="secondary"
                size="md"
                loading={hullLoading}
                style={styles.hullButton}
              >
                Join Walk-up Queue
              </MaslowButton>
              <MaslowButton
                onPress={() => setShowTimePicker(true)}
                variant="primary"
                size="md"
                style={styles.hullButton}
              >
                Reserve a Spot
              </MaslowButton>
            </View>
          )}
        </View>

        {/* Time Picker Modal */}
        <Modal
          visible={showTimePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowTimePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select a Time</Text>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Ionicons name="close" size={24} color={colors.charcoal} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.timeSlotList}>
                {generateTimeSlots().map((slot) => (
                  <TouchableOpacity
                    key={slot}
                    style={[
                      styles.timeSlotItem,
                      selectedTime === slot && styles.timeSlotSelected
                    ]}
                    onPress={() => setSelectedTime(slot)}
                  >
                    <Text style={[
                      styles.timeSlotText,
                      selectedTime === slot && styles.timeSlotTextSelected
                    ]}>
                      {formatTimeSlot(slot)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <MaslowButton
                onPress={() => selectedTime && handleReserve(selectedTime)}
                variant="primary"
                size="lg"
                disabled={!selectedTime}
                loading={hullLoading}
              >
                Confirm Reservation
              </MaslowButton>
            </View>
          </View>
        </Modal>

        {/* Upcoming Bookings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Bookings</Text>

          {upcomingBookings.length > 0 ? (
            upcomingBookings.map(booking => renderBookingCard(booking, true))
          ) : (
            <MaslowCard style={styles.emptyCard} padding="lg">
              <Ionicons name="calendar-outline" size={48} color={colors.charcoal50} />
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
    paddingHorizontal: 20,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.charcoal10,
    backgroundColor: colors.cream,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: fonts.serifLight,
    color: colors.charcoal,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 20,
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
    fontFamily: fonts.sansRegular,
    color: colors.charcoal50,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: fonts.sansSemiBold,
    color: colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 3,
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
    fontFamily: fonts.serifLight,
    color: colors.charcoal,
    marginBottom: 2,
  },
  suiteName: {
    fontSize: 14,
    fontFamily: fonts.sansRegular,
    color: colors.charcoal50,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: shape.borderRadius,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontFamily: fonts.sansSemiBold,
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
    fontFamily: fonts.sansRegular,
    color: colors.charcoal50,
    flex: 1,
  },
  cancelButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.charcoal10,
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: fonts.sansSemiBold,
    color: colors.error,
    textAlign: 'center',
  },
  emptyCard: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: fonts.serifLight,
    color: colors.charcoal,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: fonts.sansRegular,
    color: colors.charcoal50,
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
    backgroundColor: colors.goldOverlay,
    borderWidth: 1,
    borderColor: `${colors.gold}40`,
    borderRadius: shape.borderRadius,
  },
  prefText: {
    fontSize: 11,
    fontFamily: fonts.sansSemiBold,
    color: colors.charcoal,
  },
  // Hull Queue Styles
  hullStatusCard: {
    marginBottom: spacing.md,
  },
  hullStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  hullStatusTitle: {
    fontSize: 14,
    fontFamily: fonts.sansRegular,
    color: colors.charcoal50,
  },
  hullStatusValue: {
    fontSize: 18,
    fontFamily: fonts.sansSemiBold,
  },
  occupancyBar: {
    height: 8,
    backgroundColor: colors.charcoal10,
    borderRadius: 4,
    overflow: 'hidden',
  },
  occupancyFill: {
    height: '100%',
    borderRadius: 4,
  },
  queueInfo: {
    marginTop: spacing.sm,
    fontSize: 12,
    fontFamily: fonts.sansRegular,
    color: colors.charcoal50,
  },
  hullActiveCard: {
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gold,
    backgroundColor: colors.goldOverlay,
  },
  hullActiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  hullActiveTitle: {
    fontSize: 16,
    fontFamily: fonts.sansSemiBold,
    color: colors.charcoal,
  },
  hullActiveTime: {
    fontSize: 14,
    fontFamily: fonts.sansRegular,
    color: colors.charcoal,
    marginLeft: 32,
  },
  hullActivePosition: {
    fontSize: 14,
    fontFamily: fonts.sansRegular,
    color: colors.charcoal,
    marginLeft: 32,
  },
  hullCancelLink: {
    marginTop: spacing.sm,
    marginLeft: 32,
  },
  hullCancelText: {
    fontSize: 14,
    fontFamily: fonts.sansRegular,
    color: colors.error,
  },
  hullActions: {
    gap: spacing.sm,
  },
  hullButton: {
    marginBottom: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.lg,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: fonts.serifLight,
    color: colors.charcoal,
  },
  timeSlotList: {
    marginBottom: spacing.lg,
  },
  timeSlotItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.charcoal10,
  },
  timeSlotSelected: {
    backgroundColor: colors.goldOverlay,
    borderColor: colors.gold,
  },
  timeSlotText: {
    fontSize: 16,
    fontFamily: fonts.sansRegular,
    color: colors.charcoal,
  },
  timeSlotTextSelected: {
    fontFamily: fonts.sansSemiBold,
    color: colors.gold,
  },
});
