import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../src/theme';
import { MaslowCard } from '../../src/components';
import { useHaptics } from '../../src/hooks/useHaptics';

interface Event {
  id: string;
  title: string;
  time: string;
  duration: string;
  instructor: string;
  spotsLeft: number;
  totalSpots: number;
  category: 'wellness' | 'workshop' | 'social' | 'class';
}

interface DayOption {
  date: Date;
  dayName: string;
  dayNum: number;
  monthName: string;
  hasEvents: boolean;
}

// Mock events data for Feb 12
const MOCK_EVENTS: Record<string, Event[]> = {
  '2025-02-12': [
    {
      id: '1',
      title: 'Morning Meditation',
      time: '7:30 AM',
      duration: '30 min',
      instructor: 'Sarah Chen',
      spotsLeft: 4,
      totalSpots: 12,
      category: 'wellness',
    },
    {
      id: '2',
      title: 'Breathwork & Sound Bath',
      time: '12:00 PM',
      duration: '45 min',
      instructor: 'Marcus Lee',
      spotsLeft: 2,
      totalSpots: 8,
      category: 'wellness',
    },
    {
      id: '3',
      title: 'Skincare Essentials Workshop',
      time: '5:30 PM',
      duration: '60 min',
      instructor: 'Dr. Emily Park',
      spotsLeft: 6,
      totalSpots: 15,
      category: 'workshop',
    },
    {
      id: '4',
      title: 'Member Mixer & Wine Tasting',
      time: '7:00 PM',
      duration: '90 min',
      instructor: 'Hosted by Maslow',
      spotsLeft: 12,
      totalSpots: 25,
      category: 'social',
    },
  ],
  '2025-02-13': [
    {
      id: '5',
      title: 'Yoga Flow',
      time: '8:00 AM',
      duration: '45 min',
      instructor: 'Jamie Rivera',
      spotsLeft: 8,
      totalSpots: 12,
      category: 'class',
    },
  ],
  '2025-02-14': [
    {
      id: '6',
      title: 'Valentine\'s Self-Care Session',
      time: '6:00 PM',
      duration: '90 min',
      instructor: 'Multiple Instructors',
      spotsLeft: 0,
      totalSpots: 20,
      category: 'wellness',
    },
  ],
};

const getCategoryColor = (category: Event['category']): string => {
  switch (category) {
    case 'wellness':
      return '#10B981';
    case 'workshop':
      return '#8B5CF6';
    case 'social':
      return '#F59E0B';
    case 'class':
      return '#3B82F6';
    default:
      return colors.gold;
  }
};

const getCategoryIcon = (category: Event['category']): keyof typeof Ionicons.glyphMap => {
  switch (category) {
    case 'wellness':
      return 'leaf-outline';
    case 'workshop':
      return 'bulb-outline';
    case 'social':
      return 'people-outline';
    case 'class':
      return 'body-outline';
    default:
      return 'calendar-outline';
  }
};

const generateDays = (): DayOption[] => {
  const days: DayOption[] = [];
  const today = new Date();

  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const dateKey = date.toISOString().split('T')[0];

    days.push({
      date,
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: date.getDate(),
      monthName: date.toLocaleDateString('en-US', { month: 'short' }),
      hasEvents: !!MOCK_EVENTS[dateKey]?.length,
    });
  }

  return days;
};

export default function EventsScreen() {
  const haptics = useHaptics();
  const scrollRef = useRef<ScrollView>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const days = generateDays();

  const handleDayPress = (day: DayOption) => {
    haptics.light();
    setSelectedDate(day.date);
  };

  const getEventsForDate = (date: Date): Event[] => {
    const dateKey = date.toISOString().split('T')[0];
    return MOCK_EVENTS[dateKey] || [];
  };

  const selectedEvents = getEventsForDate(selectedDate);
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const formatSelectedDate = (): string => {
    if (isToday(selectedDate)) return 'Today';
    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>The Hull</Text>
        <Text style={styles.subtitle}>Events & Workshops</Text>
      </View>

      {/* Date Selector */}
      <View style={styles.dateSelector}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daysContainer}
        >
          {days.map((day, index) => {
            const isSelected = day.date.toDateString() === selectedDate.toDateString();
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayChip,
                  isSelected && styles.dayChipSelected,
                ]}
                onPress={() => handleDayPress(day)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dayName,
                  isSelected && styles.dayNameSelected,
                ]}>
                  {isToday(day.date) ? 'Today' : day.dayName}
                </Text>
                <Text style={[
                  styles.dayNum,
                  isSelected && styles.dayNumSelected,
                ]}>
                  {day.dayNum}
                </Text>
                {day.hasEvents && !isSelected && (
                  <View style={styles.eventDot} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Events List */}
      <ScrollView
        contentContainerStyle={styles.eventsContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.dateHeader}>{formatSelectedDate()}</Text>

        {selectedEvents.length === 0 ? (
          <MaslowCard style={styles.emptyCard} padding="xl">
            <Ionicons name="calendar-outline" size={48} color={colors.darkGray} />
            <Text style={styles.emptyTitle}>No Events Scheduled</Text>
            <Text style={styles.emptySubtitle}>
              Check back soon or select another day
            </Text>
          </MaslowCard>
        ) : (
          selectedEvents.map((event) => (
            <TouchableOpacity
              key={event.id}
              activeOpacity={0.8}
              onPress={() => haptics.light()}
            >
              <MaslowCard style={styles.eventCard} padding="md">
                <View style={styles.eventHeader}>
                  <View style={[
                    styles.categoryBadge,
                    { backgroundColor: `${getCategoryColor(event.category)}15` }
                  ]}>
                    <Ionicons
                      name={getCategoryIcon(event.category)}
                      size={14}
                      color={getCategoryColor(event.category)}
                    />
                    <Text style={[
                      styles.categoryText,
                      { color: getCategoryColor(event.category) }
                    ]}>
                      {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
                    </Text>
                  </View>
                  {event.spotsLeft === 0 ? (
                    <View style={styles.soldOutBadge}>
                      <Text style={styles.soldOutText}>Sold Out</Text>
                    </View>
                  ) : event.spotsLeft <= 3 ? (
                    <Text style={styles.spotsWarning}>
                      {event.spotsLeft} spots left
                    </Text>
                  ) : null}
                </View>

                <Text style={styles.eventTitle}>{event.title}</Text>

                <View style={styles.eventDetails}>
                  <View style={styles.eventDetailRow}>
                    <Ionicons name="time-outline" size={16} color={colors.darkGray} />
                    <Text style={styles.eventDetailText}>
                      {event.time} · {event.duration}
                    </Text>
                  </View>
                  <View style={styles.eventDetailRow}>
                    <Ionicons name="person-outline" size={16} color={colors.darkGray} />
                    <Text style={styles.eventDetailText}>{event.instructor}</Text>
                  </View>
                </View>

                <View style={styles.eventFooter}>
                  <View style={styles.spotsContainer}>
                    <View style={styles.spotsBar}>
                      <View style={[
                        styles.spotsFilled,
                        {
                          width: `${((event.totalSpots - event.spotsLeft) / event.totalSpots) * 100}%`,
                          backgroundColor: event.spotsLeft === 0 ? colors.error : colors.gold,
                        }
                      ]} />
                    </View>
                    <Text style={styles.spotsText}>
                      {event.totalSpots - event.spotsLeft}/{event.totalSpots} registered
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.registerButton,
                      event.spotsLeft === 0 && styles.registerButtonDisabled,
                    ]}
                    disabled={event.spotsLeft === 0}
                    onPress={() => haptics.medium()}
                  >
                    <Text style={[
                      styles.registerButtonText,
                      event.spotsLeft === 0 && styles.registerButtonTextDisabled,
                    ]}>
                      {event.spotsLeft === 0 ? 'Waitlist' : 'Register'}
                    </Text>
                  </TouchableOpacity>
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
  dateSelector: {
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    paddingBottom: spacing.sm,
  },
  daysContainer: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  dayChip: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.white,
    minWidth: 60,
  },
  dayChipSelected: {
    backgroundColor: colors.navy,
  },
  dayName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.darkGray,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  dayNameSelected: {
    color: colors.gold,
  },
  dayNum: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.navy,
  },
  dayNumSelected: {
    color: colors.white,
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
    marginTop: 4,
  },
  eventsContainer: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.navy,
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
  soldOutBadge: {
    backgroundColor: `${colors.error}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  soldOutText: {
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
  spotsContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  spotsBar: {
    height: 4,
    backgroundColor: colors.lightGray,
    borderRadius: 2,
    marginBottom: 4,
  },
  spotsFilled: {
    height: '100%',
    borderRadius: 2,
  },
  spotsText: {
    fontSize: 11,
    color: colors.darkGray,
  },
  registerButton: {
    backgroundColor: colors.gold,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
  },
  registerButtonDisabled: {
    backgroundColor: colors.lightGray,
  },
  registerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.navy,
  },
  registerButtonTextDisabled: {
    color: colors.darkGray,
  },
});
