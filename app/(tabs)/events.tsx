import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../src/theme';
import { MaslowCard } from '../../src/components';
import { useHaptics } from '../../src/hooks/useHaptics';
import { supabase } from '../../lib/supabase';

// Category type and colors
type EventCategory = 'cultural' | 'childrens' | 'dancing' | 'learning' | 'wellness' | 'social' | 'nightlife';

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  category: EventCategory;
  tags: string[] | null;
  max_attendees: number | null;
  current_attendees: number;
  price_credits: number;
  host_name: string | null;
  status: string;
  image_url: string | null;
}

interface EventAttendee {
  id: string;
  event_id: string;
  user_id: string;
  rsvp_status: 'confirmed' | 'waitlisted' | 'cancelled';
}

const CATEGORIES: { key: EventCategory | 'all'; label: string; color: string }[] = [
  { key: 'all', label: 'All', color: colors.navy },
  { key: 'cultural', label: 'Cultural', color: '#8B5CF6' },
  { key: 'childrens', label: "Children's", color: '#F59E0B' },
  { key: 'dancing', label: 'Dancing', color: '#EC4899' },
  { key: 'learning', label: 'Learning', color: '#3B82F6' },
  { key: 'wellness', label: 'Wellness', color: '#10B981' },
  { key: 'social', label: 'Social', color: '#F97316' },
  { key: 'nightlife', label: 'Nightlife', color: '#6366F1' },
];

const getCategoryColor = (category: EventCategory): string => {
  const found = CATEGORIES.find(c => c.key === category);
  return found?.color || colors.gold;
};

const getCategoryLabel = (category: EventCategory): string => {
  const found = CATEGORIES.find(c => c.key === category);
  return found?.label || category;
};

const getCategoryIcon = (category: EventCategory): keyof typeof Ionicons.glyphMap => {
  switch (category) {
    case 'cultural':
      return 'globe-outline';
    case 'childrens':
      return 'balloon-outline';
    case 'dancing':
      return 'musical-notes-outline';
    case 'learning':
      return 'school-outline';
    case 'wellness':
      return 'leaf-outline';
    case 'social':
      return 'people-outline';
    case 'nightlife':
      return 'moon-outline';
    default:
      return 'calendar-outline';
  }
};

const formatEventDate = (dateString: string): { date: string; time: string } => {
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }),
    time: date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }),
  };
};

export default function EventsScreen() {
  const haptics = useHaptics();
  const [events, setEvents] = useState<Event[]>([]);
  const [userRSVPs, setUserRSVPs] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      let query = supabase
        .from('events')
        .select('*')
        .eq('status', 'upcoming')
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true });

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching events:', error);
        return;
      }

      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  }, [selectedCategory]);

  const fetchUserRSVPs = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('event_attendees')
        .select('event_id')
        .eq('user_id', user.id)
        .eq('rsvp_status', 'confirmed');

      if (error) {
        console.error('Error fetching RSVPs:', error);
        return;
      }

      setUserRSVPs(new Set(data?.map(r => r.event_id) || []));
    } catch (error) {
      console.error('Error fetching RSVPs:', error);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchEvents(), fetchUserRSVPs()]);
    setLoading(false);
  }, [fetchEvents, fetchUserRSVPs]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchEvents(), fetchUserRSVPs()]);
    setRefreshing(false);
  }, [fetchEvents, fetchUserRSVPs]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    fetchEvents();
  }, [selectedCategory, fetchEvents]);

  const handleCategoryPress = (category: EventCategory | 'all') => {
    haptics.light();
    setSelectedCategory(category);
  };

  const handleRSVP = async (event: Event) => {
    haptics.medium();
    setRsvpLoading(event.id);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Sign In Required', 'Please sign in to RSVP to events.');
        setRsvpLoading(null);
        return;
      }

      const isAlreadyRSVPd = userRSVPs.has(event.id);

      if (isAlreadyRSVPd) {
        // Cancel RSVP
        const { error } = await supabase
          .from('event_attendees')
          .delete()
          .eq('event_id', event.id)
          .eq('user_id', user.id);

        if (error) throw error;

        setUserRSVPs(prev => {
          const next = new Set(prev);
          next.delete(event.id);
          return next;
        });

        // Decrement the attendee count locally
        setEvents(prev =>
          prev.map(e =>
            e.id === event.id
              ? { ...e, current_attendees: Math.max(0, e.current_attendees - 1) }
              : e
          )
        );
      } else {
        // Check if event is full
        if (event.max_attendees && event.current_attendees >= event.max_attendees) {
          Alert.alert('Event Full', 'This event is at capacity. You can join the waitlist.');
          setRsvpLoading(null);
          return;
        }

        // Create RSVP
        const { error } = await supabase
          .from('event_attendees')
          .insert({
            event_id: event.id,
            user_id: user.id,
            rsvp_status: 'confirmed',
          });

        if (error) throw error;

        setUserRSVPs(prev => new Set(prev).add(event.id));

        // Increment the attendee count locally
        setEvents(prev =>
          prev.map(e =>
            e.id === event.id
              ? { ...e, current_attendees: e.current_attendees + 1 }
              : e
          )
        );
      }
    } catch (error) {
      console.error('Error handling RSVP:', error);
      Alert.alert('Error', 'Failed to update RSVP. Please try again.');
    }

    setRsvpLoading(null);
  };

  const handleEventPress = (event: Event) => {
    haptics.light();
    setSelectedEvent(event);
  };

  const renderEventCard = (event: Event) => {
    const { date, time } = formatEventDate(event.event_date);
    const categoryColor = getCategoryColor(event.category);
    const isRSVPd = userRSVPs.has(event.id);
    const isFull = event.max_attendees !== null && event.current_attendees >= event.max_attendees;
    const spotsLeft = event.max_attendees ? event.max_attendees - event.current_attendees : null;

    return (
      <TouchableOpacity
        key={event.id}
        activeOpacity={0.8}
        onPress={() => handleEventPress(event)}
      >
        <MaslowCard style={styles.eventCard} padding="md">
          {/* Header with category badge */}
          <View style={styles.eventHeader}>
            <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}15` }]}>
              <Ionicons
                name={getCategoryIcon(event.category)}
                size={14}
                color={categoryColor}
              />
              <Text style={[styles.categoryText, { color: categoryColor }]}>
                {getCategoryLabel(event.category)}
              </Text>
            </View>
            {isFull && !isRSVPd ? (
              <View style={styles.fullBadge}>
                <Text style={styles.fullText}>Full</Text>
              </View>
            ) : spotsLeft !== null && spotsLeft <= 5 && spotsLeft > 0 ? (
              <Text style={styles.spotsWarning}>
                {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} left
              </Text>
            ) : null}
          </View>

          {/* Event title */}
          <Text style={styles.eventTitle}>{event.title}</Text>

          {/* Event details */}
          <View style={styles.eventDetails}>
            <View style={styles.eventDetailRow}>
              <Ionicons name="calendar-outline" size={16} color={colors.darkGray} />
              <Text style={styles.eventDetailText}>{date} at {time}</Text>
            </View>
            {event.location && (
              <View style={styles.eventDetailRow}>
                <Ionicons name="location-outline" size={16} color={colors.darkGray} />
                <Text style={styles.eventDetailText}>{event.location}</Text>
              </View>
            )}
            {event.host_name && (
              <View style={styles.eventDetailRow}>
                <Ionicons name="person-outline" size={16} color={colors.darkGray} />
                <Text style={styles.eventDetailText}>Hosted by {event.host_name}</Text>
              </View>
            )}
          </View>

          {/* Footer with attendees and RSVP */}
          <View style={styles.eventFooter}>
            <View style={styles.footerLeft}>
              <View style={styles.attendeesRow}>
                <Ionicons name="people" size={16} color={colors.darkGray} />
                <Text style={styles.attendeesText}>
                  {event.current_attendees}
                  {event.max_attendees ? `/${event.max_attendees}` : ''} attending
                </Text>
              </View>
              <Text style={styles.priceText}>
                {event.price_credits === 0 ? 'Free' : `${event.price_credits} credits`}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.rsvpButton,
                isRSVPd && styles.rsvpButtonActive,
                isFull && !isRSVPd && styles.rsvpButtonDisabled,
              ]}
              onPress={(e) => {
                e.stopPropagation();
                handleRSVP(event);
              }}
              disabled={rsvpLoading === event.id}
            >
              {rsvpLoading === event.id ? (
                <ActivityIndicator size="small" color={isRSVPd ? colors.white : colors.navy} />
              ) : (
                <>
                  <Ionicons
                    name={isRSVPd ? 'checkmark-circle' : 'add-circle-outline'}
                    size={18}
                    color={isRSVPd ? colors.white : colors.navy}
                  />
                  <Text style={[
                    styles.rsvpButtonText,
                    isRSVPd && styles.rsvpButtonTextActive,
                  ]}>
                    {isRSVPd ? 'Going' : 'RSVP'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </MaslowCard>
      </TouchableOpacity>
    );
  };

  const renderEventModal = () => {
    if (!selectedEvent) return null;

    const { date, time } = formatEventDate(selectedEvent.event_date);
    const categoryColor = getCategoryColor(selectedEvent.category);
    const isRSVPd = userRSVPs.has(selectedEvent.id);
    const isFull = selectedEvent.max_attendees !== null &&
      selectedEvent.current_attendees >= selectedEvent.max_attendees;

    return (
      <Modal
        visible={!!selectedEvent}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedEvent(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedEvent(null)}
            >
              <Ionicons name="close" size={24} color={colors.navy} />
            </TouchableOpacity>
            <View style={[styles.modalCategoryBadge, { backgroundColor: `${categoryColor}15` }]}>
              <Ionicons
                name={getCategoryIcon(selectedEvent.category)}
                size={16}
                color={categoryColor}
              />
              <Text style={[styles.modalCategoryText, { color: categoryColor }]}>
                {getCategoryLabel(selectedEvent.category)}
              </Text>
            </View>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>{selectedEvent.title}</Text>

            <View style={styles.modalDetails}>
              <View style={styles.modalDetailRow}>
                <Ionicons name="calendar" size={20} color={colors.gold} />
                <View>
                  <Text style={styles.modalDetailLabel}>Date & Time</Text>
                  <Text style={styles.modalDetailValue}>{date} at {time}</Text>
                </View>
              </View>

              {selectedEvent.location && (
                <View style={styles.modalDetailRow}>
                  <Ionicons name="location" size={20} color={colors.gold} />
                  <View>
                    <Text style={styles.modalDetailLabel}>Location</Text>
                    <Text style={styles.modalDetailValue}>{selectedEvent.location}</Text>
                  </View>
                </View>
              )}

              {selectedEvent.host_name && (
                <View style={styles.modalDetailRow}>
                  <Ionicons name="person" size={20} color={colors.gold} />
                  <View>
                    <Text style={styles.modalDetailLabel}>Hosted by</Text>
                    <Text style={styles.modalDetailValue}>{selectedEvent.host_name}</Text>
                  </View>
                </View>
              )}

              <View style={styles.modalDetailRow}>
                <Ionicons name="people" size={20} color={colors.gold} />
                <View>
                  <Text style={styles.modalDetailLabel}>Attendees</Text>
                  <Text style={styles.modalDetailValue}>
                    {selectedEvent.current_attendees}
                    {selectedEvent.max_attendees ? ` of ${selectedEvent.max_attendees}` : ''} registered
                  </Text>
                </View>
              </View>

              <View style={styles.modalDetailRow}>
                <Ionicons name="ticket" size={20} color={colors.gold} />
                <View>
                  <Text style={styles.modalDetailLabel}>Price</Text>
                  <Text style={styles.modalDetailValue}>
                    {selectedEvent.price_credits === 0 ? 'Free' : `${selectedEvent.price_credits} credits`}
                  </Text>
                </View>
              </View>
            </View>

            {selectedEvent.description && (
              <View style={styles.descriptionSection}>
                <Text style={styles.descriptionTitle}>About This Event</Text>
                <Text style={styles.descriptionText}>{selectedEvent.description}</Text>
              </View>
            )}

            {selectedEvent.tags && selectedEvent.tags.length > 0 && (
              <View style={styles.tagsSection}>
                <Text style={styles.tagsTitle}>Tags</Text>
                <View style={styles.tagsContainer}>
                  {selectedEvent.tags.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[
                styles.modalRsvpButton,
                isRSVPd && styles.modalRsvpButtonActive,
                isFull && !isRSVPd && styles.modalRsvpButtonDisabled,
              ]}
              onPress={() => handleRSVP(selectedEvent)}
              disabled={rsvpLoading === selectedEvent.id || (isFull && !isRSVPd)}
            >
              {rsvpLoading === selectedEvent.id ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.modalRsvpButtonText}>
                  {isRSVPd ? 'Cancel RSVP' : isFull ? 'Event Full' : 'RSVP Now'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Events</Text>
        <Text style={styles.subtitle}>Discover experiences in The Hull</Text>
      </View>

      {/* Category Filter Chips */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
        >
          {CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category.key;
            return (
              <TouchableOpacity
                key={category.key}
                style={[
                  styles.filterChip,
                  isSelected && { backgroundColor: category.color },
                ]}
                onPress={() => handleCategoryPress(category.key)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.filterChipText,
                  isSelected && styles.filterChipTextSelected,
                  !isSelected && { color: category.color },
                ]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Events List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.gold} />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.eventsContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.gold}
            />
          }
        >
          {events.length === 0 ? (
            <MaslowCard style={styles.emptyCard} padding="xl">
              <Ionicons name="calendar-outline" size={48} color={colors.darkGray} />
              <Text style={styles.emptyTitle}>No Events Found</Text>
              <Text style={styles.emptySubtitle}>
                {selectedCategory === 'all'
                  ? 'No upcoming events scheduled'
                  : `No ${getCategoryLabel(selectedCategory as EventCategory)} events scheduled`}
              </Text>
              {selectedCategory !== 'all' && (
                <TouchableOpacity
                  style={styles.clearFilterButton}
                  onPress={() => setSelectedCategory('all')}
                >
                  <Text style={styles.clearFilterText}>Show All Events</Text>
                </TouchableOpacity>
              )}
            </MaslowCard>
          ) : (
            <>
              <Text style={styles.resultsCount}>
                {events.length} {events.length === 1 ? 'event' : 'events'} found
              </Text>
              {events.map(renderEventCard)}
            </>
          )}
        </ScrollView>
      )}

      {/* Event Detail Modal */}
      {renderEventModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.navy,
  },
  subtitle: {
    fontSize: 14,
    color: colors.darkGray,
    marginTop: 2,
  },
  filterSection: {
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    paddingBottom: spacing.sm,
  },
  filtersContainer: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipTextSelected: {
    color: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 14,
    color: colors.darkGray,
  },
  eventsContainer: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  resultsCount: {
    fontSize: 13,
    color: colors.darkGray,
    marginBottom: spacing.md,
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
    textAlign: 'center',
  },
  clearFilterButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.gold,
    borderRadius: 8,
  },
  clearFilterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.navy,
  },
  eventCard: {
    marginBottom: spacing.md,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  fullBadge: {
    backgroundColor: `${colors.error}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  fullText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.error,
  },
  spotsWarning: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.navy,
    marginBottom: spacing.sm,
  },
  eventDetails: {
    gap: 6,
    marginBottom: spacing.md,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  eventDetailText: {
    fontSize: 14,
    color: colors.darkGray,
  },
  eventFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  footerLeft: {
    flex: 1,
  },
  attendeesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  attendeesText: {
    fontSize: 13,
    color: colors.darkGray,
    fontWeight: '500',
  },
  priceText: {
    fontSize: 13,
    color: colors.gold,
    fontWeight: '600',
    marginTop: 2,
  },
  rsvpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.gold,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
  },
  rsvpButtonActive: {
    backgroundColor: '#10B981',
  },
  rsvpButtonDisabled: {
    backgroundColor: colors.lightGray,
  },
  rsvpButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.navy,
  },
  rsvpButtonTextActive: {
    color: colors.white,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  modalCategoryText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: spacing.lg,
  },
  modalDetails: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  modalDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  modalDetailLabel: {
    fontSize: 12,
    color: colors.darkGray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalDetailValue: {
    fontSize: 16,
    color: colors.navy,
    fontWeight: '500',
    marginTop: 2,
  },
  descriptionSection: {
    marginBottom: spacing.xl,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.navy,
    marginBottom: spacing.sm,
  },
  descriptionText: {
    fontSize: 15,
    color: colors.darkGray,
    lineHeight: 22,
  },
  tagsSection: {
    marginBottom: spacing.xl,
  },
  tagsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.navy,
    marginBottom: spacing.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  tagText: {
    fontSize: 13,
    color: colors.darkGray,
  },
  modalFooter: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    backgroundColor: colors.white,
  },
  modalRsvpButton: {
    backgroundColor: colors.gold,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalRsvpButtonActive: {
    backgroundColor: colors.error,
  },
  modalRsvpButtonDisabled: {
    backgroundColor: colors.lightGray,
  },
  modalRsvpButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.navy,
  },
});
