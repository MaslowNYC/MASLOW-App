import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  PanResponder,
  Animated,
  Image,
  GestureResponderEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { colors, spacing } from '../../src/theme';
import { MaslowCard, MaslowButton } from '../../src/components';
import { useHaptics } from '../../src/hooks/useHaptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Calendar from 'expo-calendar';

// Helper function to add booking to calendar
async function addToCalendar(booking: { location: string; date: Date; duration: number }) {
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Calendar access is required to add events.');
      return;
    }

    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const defaultCalendar = calendars.find(cal => cal.allowsModifications) || calendars[0];

    if (!defaultCalendar) {
      Alert.alert('Error', 'No calendar available');
      return;
    }

    const endDate = new Date(booking.date.getTime() + booking.duration * 60000);

    await Calendar.createEventAsync(defaultCalendar.id, {
      title: 'Maslow Visit',
      location: booking.location,
      startDate: booking.date,
      endDate: endDate,
      notes: 'Your reserved sanctuary suite at Maslow',
    });

    Alert.alert('Success', 'Event added to your calendar!');
  } catch (error) {
    console.error('Calendar error:', error);
    Alert.alert('Error', 'Could not add to calendar');
  }
}

// Types
interface Suite {
  id: string;
  suite_number: string;
  is_available: boolean;
  capabilities: {
    has_shower: boolean;
    has_changing_table: boolean;
    has_heated_seat: boolean;
    has_bidet: boolean;
    has_vanity: boolean;
    max_occupancy: number;
  };
  available_samples: string[];
}

interface Location {
  id: string;
  name: string;
  address: string;
}

interface UserProfile {
  id: string;
  default_preferences: {
    lighting: string;
    music: string;
    temperature: number;
    bidet_temp: string;
    heated_seat: boolean;
    samples: string[];
  };
}

type BookingStep = 'time' | 'environment' | 'samples' | 'review' | 'success';

interface DurationOption {
  minutes: number;
  credits: number;
  cash: number;
  samples: number;
}

const DURATION_OPTIONS: DurationOption[] = [
  { minutes: 10, credits: 1, cash: 5, samples: 2 },
  { minutes: 15, credits: 2, cash: 10, samples: 5 },
  { minutes: 30, credits: 4, cash: 20, samples: 5 },
  { minutes: 60, credits: 8, cash: 40, samples: 5 },
];

interface BookingData {
  suite?: Suite;
  date?: Date;
  duration: 10 | 15 | 30 | 60;
  time?: string; // Time in 24hr format like "09:00", "14:30"
  preferences: {
    lighting: number; // 0-100 brightness level
    music: 'silence' | 'your-music' | 'white-noise' | 'flushing' | 'spa' | 'classical';
    temperature: number; // 68-76
    bidet_temp: 'cold' | 'warm' | 'hot';
    heated_seat: boolean;
    samples: string[];
  };
}

// Helper functions for time selection
const getTimeWindowSlots = (window: string): string[] => {
  switch (window) {
    case 'morning':
      return ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
    case 'afternoon':
      return ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
    case 'evening':
      return ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30'];
    case 'lateNight':
      return ['20:00', '20:30', '21:00', '21:30', '22:00'];
    default:
      return [];
  }
};

const getExactTimeSlots = (window: string): string[] => {
  const slots = getTimeWindowSlots(window);
  const exactSlots: string[] = [];
  slots.forEach(slot => {
    const [hour, minute] = slot.split(':');
    exactSlots.push(slot);
    // Add 10-min increments between 30-min slots
    if (minute === '00') {
      exactSlots.push(`${hour}:10`);
      exactSlots.push(`${hour}:20`);
    } else if (minute === '30') {
      exactSlots.push(`${hour}:40`);
      exactSlots.push(`${hour}:50`);
    }
  });
  return exactSlots.sort();
};

const formatTime12Hour = (time24: string): string => {
  const [hour, minute] = time24.split(':').map(Number);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
};

// Queue/availability helpers
const getQueueForTime = (time: string): number => {
  const hour = parseInt(time.split(':')[0], 10);
  // Lunch rush (12-14) and evening rush (17-19) have more people
  if (hour >= 12 && hour <= 14) return Math.floor(Math.random() * 5) + 2; // 2-6
  if (hour >= 17 && hour <= 19) return Math.floor(Math.random() * 6) + 3; // 3-8
  // Morning and late night are quieter
  if (hour < 11 || hour >= 21) return Math.floor(Math.random() * 2); // 0-1
  // Regular hours
  return Math.floor(Math.random() * 4); // 0-3
};

const getAvailabilityStatus = (queueCount: number): { color: string; label: string; disabled: boolean } => {
  if (queueCount === 0) return { color: colors.success, label: 'Available', disabled: false };
  if (queueCount <= 2) return { color: '#F59E0B', label: `${queueCount} ahead`, disabled: false };
  if (queueCount <= 5) return { color: colors.error, label: `${queueCount} ahead`, disabled: false };
  return { color: colors.darkGray, label: 'Full', disabled: true };
};

// Sample brand logos from Clearbit
const SAMPLE_LOGOS: Record<string, string> = {
  'aesop-handwash': 'https://logo.clearbit.com/aesop.com',
  'le-labo-perfume': 'https://logo.clearbit.com/lelabofragrances.com',
  'drunk-elephant-serum': 'https://logo.clearbit.com/drunkelephant.com',
  'kiehl-moisturizer': 'https://logo.clearbit.com/kiehls.com',
  'byredo-lotion': 'https://logo.clearbit.com/byredo.com',
  'tatcha-cleanser': 'https://logo.clearbit.com/tatcha.com',
  'fresh-lip-balm': 'https://logo.clearbit.com/fresh.com',
  'diptyque-candle': 'https://logo.clearbit.com/diptyqueparis.com',
  'malin-goetz-deodorant': 'https://logo.clearbit.com/malinandgoetz.com',
  'augustinus-bader-cream': 'https://logo.clearbit.com/augustinusbader.com',
};

// Continuous Slider Component
interface ContinuousSliderProps {
  title: string;
  value: number;
  min: number;
  max: number;
  leftLabel: string;
  rightLabel: string;
  showPercentage?: boolean;
  formatValue?: (val: number) => string;
  onValueChange: (val: number) => void;
  haptics: any;
}

const ContinuousSlider: React.FC<ContinuousSliderProps> = ({
  title,
  value,
  min,
  max,
  leftLabel,
  rightLabel,
  showPercentage = false,
  formatValue,
  onValueChange,
  haptics,
}) => {
  const sliderWidth = useRef(0);
  const isDragging = useRef(false);
  const currentRawValue = useRef(value); // Track raw value during drag

  const updateValue = (x: number) => {
    const percent = Math.max(0, Math.min(1, x / sliderWidth.current));
    const rawValue = min + percent * (max - min);
    currentRawValue.current = rawValue;
    
    const roundedValue = Math.round(rawValue);
    if (roundedValue !== value && isDragging.current) {
      onValueChange(roundedValue);
      haptics.light();
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        isDragging.current = true;
        currentRawValue.current = value;
        const x = evt.nativeEvent.locationX;
        updateValue(x);
        haptics.medium();
      },
      onPanResponderMove: (evt) => {
        const x = evt.nativeEvent.locationX;
        updateValue(x);
      },
      onPanResponderRelease: () => {
        const finalValue = Math.round(currentRawValue.current);
        if (finalValue !== value) {
          onValueChange(finalValue);
        }
        isDragging.current = false;
        haptics.medium();
      },
    })
  ).current;

  const displayValue = formatValue ? formatValue(value) : showPercentage ? `${value}%` : `${value}°`;
  const knobPosition = isDragging.current ? currentRawValue.current : value;
  const percent = ((knobPosition - min) / (max - min)) * 100;

  return (
    <View style={styles.ultraCompactSection}>
      <View style={styles.sliderHeader}>
        <Text style={styles.ultraCompactTitle}>{title}</Text>
        <Text style={styles.sliderValue}>{displayValue}</Text>
      </View>
      <View style={styles.sliderTrack}>
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabelText}>{leftLabel}</Text>
          <Text style={styles.sliderLabelText}>{rightLabel}</Text>
        </View>
        <View
          style={styles.continuousSliderContainer}
          onLayout={(e) => {
            sliderWidth.current = e.nativeEvent.layout.width;
          }}
          {...panResponder.panHandlers}
        >
          <View style={styles.continuousSliderTrack}>
            <View style={[styles.continuousSliderFill, { width: `${percent}%` }]} />
          </View>
          <View style={[styles.continuousSliderKnob, { left: `${percent}%` }]} />
        </View>
      </View>
    </View>
  );
};

// Rotatable Music Disc Component
interface RotatableMusicDiscProps {
  value: string;
  onValueChange: (val: string) => void;
  haptics: ReturnType<typeof useHaptics>;
}

const RotatableMusicDisc: React.FC<RotatableMusicDiscProps> = ({ value, onValueChange, haptics }) => {
  const rotation = useRef(new Animated.Value(0)).current;
  const lastAngle = useRef(0);

  const musicOptions = [
    { value: 'silence', label: 'Silence', angle: 0 },
    { value: 'your-music', label: 'Your Music', angle: 60 },
    { value: 'white-noise', label: 'White Noise', angle: 120 },
    { value: 'flushing', label: 'Otohime', angle: 180 },
    { value: 'spa', label: 'Spa Sounds', angle: 240 },
    { value: 'classical', label: 'Classical', angle: 300 },
  ];

  const getAngleFromValue = (val: string) => {
    return musicOptions.find(opt => opt.value === val)?.angle || 0;
  };

  const getValueFromAngle = (angle: number) => {
    const normalizedAngle = ((angle % 360) + 360) % 360;

    let closest = musicOptions[0];
    let minDiff = 360;

    musicOptions.forEach(opt => {
      const diff = Math.abs(normalizedAngle - opt.angle);
      const wrapDiff = 360 - diff;
      const actualDiff = Math.min(diff, wrapDiff);
      if (actualDiff < minDiff) {
        minDiff = actualDiff;
        closest = opt;
      }
    });

    return closest.value;
  };

  useEffect(() => {
    const currentAngle = getAngleFromValue(value);
    lastAngle.current = currentAngle;
    rotation.setValue(currentAngle);
  }, [value]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        haptics.medium();
      },
      onPanResponderMove: (evt: GestureResponderEvent) => {
        const { locationX, locationY } = evt.nativeEvent;
        const centerX = 90;
        const centerY = 90;

        const angle = Math.atan2(locationY - centerY, locationX - centerX) * (180 / Math.PI) + 90;
        const normalizedAngle = ((angle % 360) + 360) % 360;

        rotation.setValue(normalizedAngle);
        lastAngle.current = normalizedAngle;

        const newValue = getValueFromAngle(normalizedAngle);
        if (newValue !== value) {
          onValueChange(newValue);
          haptics.light();
        }
      },
      onPanResponderRelease: () => {
        const finalValue = getValueFromAngle(lastAngle.current);
        const finalAngle = getAngleFromValue(finalValue);

        Animated.spring(rotation, {
          toValue: finalAngle,
          useNativeDriver: true,
          tension: 100,
          friction: 10,
        }).start();

        haptics.medium();
      },
    })
  ).current;

  const currentLabel = musicOptions.find(opt => opt.value === value)?.label || 'Silence';

  return (
    <View style={styles.musicDiscContainer}>
      <Text style={styles.musicDiscLabel}>{currentLabel}</Text>

      <View style={styles.discWrapper} {...panResponder.panHandlers}>
        <Animated.View
          style={[
            styles.musicDisc,
            {
              transform: [{ rotate: rotation.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg'],
              })}],
            },
          ]}
        >
          <View style={styles.vinylGroove1} />
          <View style={styles.vinylGroove2} />
          <View style={styles.vinylGroove3} />

          <View style={styles.vinylCenter}>
            <Ionicons name="musical-notes" size={24} color={colors.gold} />
          </View>

          <View style={styles.discIndicator} />
        </Animated.View>
      </View>

      <Text style={styles.discHint}>Rotate to select</Text>
    </View>
  );
};

export default function BookingFlowScreen() {
  const { locationId } = useLocalSearchParams<{ locationId: string }>();
  const router = useRouter();
  const haptics = useHaptics();
  
  // State
  const [step, setStep] = useState<BookingStep>('time');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [location, setLocation] = useState<Location | null>(null);
  const [suites, setSuites] = useState<Suite[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [availableCredits, setAvailableCredits] = useState(0);
  
  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState<'credits' | 'cash'>('credits');

  // Booking data
  const [bookingData, setBookingData] = useState<BookingData>({
    duration: 15,
    preferences: {
      lighting: 75, // 0-100 scale
      music: 'silence',
      temperature: 72, // 68-76
      bidet_temp: 'warm',
      heated_seat: false,
      samples: [],
    },
  });

  // Time selection state
  const [selectedTimeWindow, setSelectedTimeWindow] = useState<'morning' | 'afternoon' | 'evening' | 'lateNight' | null>(null);
  const [showExactTimes, setShowExactTimes] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (locationId) {
      loadBookingData();
    }
  }, [locationId]);

  const loadBookingData = async () => {
    try {
      setLoading(true);

      // Get user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert('Error', 'You must be logged in to book');
        router.back();
        return;
      }

      // Load location
      const { data: locationData, error: locationError } = await supabase
        .from('locations')
        .select('id, name, address')
        .eq('id', locationId)
        .single();

      if (locationError || !locationData) {
        Alert.alert('Error', 'Location not found');
        router.back();
        return;
      }

      // Load available suites
      const { data: suitesData, error: suitesError } = await supabase
        .from('suites')
        .select('*')
        .eq('location_id', locationId)
        .eq('is_available', true)
        .eq('is_operational', true);

      // Load user profile and defaults
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, default_preferences')
        .eq('id', user.id)
        .single();

      // Load available credits
      const { data: creditsData } = await supabase
        .from('credits')
        .select('amount')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString());

      const totalCredits = creditsData?.reduce((sum, c) => sum + c.amount, 0) || 0;

      setLocation(locationData);
      setSuites(suitesData || []);
      setUserProfile(profileData);
      setAvailableCredits(totalCredits);

      // Auto-select first available suite (skip suite selection step)
      if (suitesData && suitesData.length > 0) {
        setBookingData(prev => ({ ...prev, suite: suitesData[0] }));
      }

      // Apply user's default preferences if they exist
      if (profileData?.default_preferences) {
        setBookingData(prev => ({
          ...prev,
          preferences: {
            ...prev.preferences,
            ...profileData.default_preferences,
          },
        }));
      }

    } catch (err) {
      console.error('Failed to load booking data:', err);
      Alert.alert('Error', 'Failed to load booking information');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    haptics.light();
    if (step === 'time') {
      router.back();
    } else if (step === 'environment') {
      setStep('time');
    } else if (step === 'samples') {
      setStep('environment');
    } else if (step === 'review') {
      setStep('samples');
    }
  };

  const handleNext = () => {
    haptics.light();

    if (step === 'time') {
      if (!bookingData.duration || !bookingData.date || !bookingData.time) {
        Alert.alert('Complete Selection', 'Please select duration, day, and time');
        return;
      }
      setStep('environment');
    } else if (step === 'environment') {
      setStep('samples');
    } else if (step === 'samples') {
      setStep('review');
    }
  };

  const handleConfirmBooking = async () => {
    if (!bookingData.suite || !bookingData.date) {
      Alert.alert('Error', 'Missing booking information');
      return;
    }

    if (availableCredits < 1) {
      Alert.alert('Insufficient Credits', 'You need at least 1 credit to book');
      return;
    }

    try {
      setSubmitting(true);
      haptics.medium();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Calculate end time
      const startTime = bookingData.date;
      const endTime = new Date(startTime.getTime() + bookingData.duration * 60000);

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          suite_id: bookingData.suite.id,
          location_id: locationId,
          start_time: startTime.toISOString(),
          starts_at: startTime.toISOString(),
          ends_at: endTime.toISOString(),
          duration_minutes: bookingData.duration,
          status: 'confirmed',
          credits_used: 1,
          preferences: bookingData.preferences,
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Deduct credit (find oldest active credit and use it)
      const { data: oldestCredit } = await supabase
        .from('credits')
        .select('id, amount')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (oldestCredit) {
        if (oldestCredit.amount === 1) {
          // Use up the credit completely
          await supabase
            .from('credits')
            .update({ status: 'used' })
            .eq('id', oldestCredit.id);
        } else {
          // Reduce the amount
          await supabase
            .from('credits')
            .update({ amount: oldestCredit.amount - 1 })
            .eq('id', oldestCredit.id);
        }
      }

      // Create transaction record
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          booking_id: booking.id,
          amount: -1,
          transaction_type: 'booking',
          description: `Booking at ${location?.name}`,
        });

      // Mark suite as unavailable (for now - in production you'd have better availability management)
      await supabase
        .from('suites')
        .update({ is_available: false })
        .eq('id', bookingData.suite.id);

      haptics.success();
      setStep('success');

    } catch (err) {
      console.error('Booking error:', err);
      Alert.alert('Booking Failed', 'Failed to create booking. Please try again.');
      haptics.error();
    } finally {
      setSubmitting(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'time': return 'Reserve Your Visit';
      case 'environment': return 'Set Your Environment';
      case 'samples': return 'Choose Your Samples';
      case 'review': return 'Confirm Reservation';
      case 'success': return 'Your Sanctuary Awaits!';
    }
  };

  const renderProgressBar = () => {
    if (step === 'success') return null;

    const steps: BookingStep[] = ['time', 'environment', 'samples', 'review'];
    const currentIndex = steps.indexOf(step);
    const progress = ((currentIndex + 1) / steps.length) * 100;

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Step {currentIndex + 1} of {steps.length}
        </Text>
      </View>
    );
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.navy} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={handleBack} 
          style={styles.backButton}
          disabled={step === 'success'}
        >
          {step !== 'success' && (
            <Ionicons name="arrow-back" size={24} color={colors.navy} />
          )}
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getStepTitle()}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {renderProgressBar()}

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {step === 'time' && (
          <View style={styles.singleScreenContainer}>
            {/* Duration & Pricing */}
            <View style={styles.ultraCompactSection}>
              <View style={styles.durationHeader}>
                <Text style={styles.ultraCompactTitle}>Duration & Pricing</Text>
                {availableCredits > 0 && (
                  <View style={styles.paymentToggle}>
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
                      <Ionicons name="card" size={14} color={paymentMethod === 'credits' ? colors.gold : colors.darkGray} />
                      <Text style={[
                        styles.paymentToggleText,
                        paymentMethod === 'credits' && styles.paymentToggleTextActive,
                      ]}>Credits</Text>
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
                      <Ionicons name="cash" size={14} color={paymentMethod === 'cash' ? colors.gold : colors.darkGray} />
                      <Text style={[
                        styles.paymentToggleText,
                        paymentMethod === 'cash' && styles.paymentToggleTextActive,
                      ]}>Cash</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <View style={styles.durationGrid}>
                {DURATION_OPTIONS.map((option) => {
                  const isSelected = bookingData.duration === option.minutes;
                  const canAfford = paymentMethod === 'cash' || availableCredits >= option.credits;

                  return (
                    <TouchableOpacity
                      key={option.minutes}
                      style={[
                        styles.durationCard,
                        isSelected && styles.durationCardSelected,
                        !canAfford && styles.durationCardDisabled,
                      ]}
                      onPress={() => {
                        if (!canAfford) {
                          haptics.warning();
                          Alert.alert(
                            'Insufficient Credits',
                            `You need ${option.credits} credits for ${option.minutes} minutes. You have ${availableCredits}.`,
                            [
                              { text: 'Pay Cash', onPress: () => setPaymentMethod('cash') },
                              { text: 'Buy Credits', onPress: () => router.push('/buy-credits') },
                              { text: 'Cancel', style: 'cancel' },
                            ]
                          );
                          return;
                        }
                        haptics.light();
                        setBookingData(prev => ({ ...prev, duration: option.minutes as BookingData['duration'] }));
                      }}
                    >
                      <Text style={[
                        styles.durationCardMinutes,
                        isSelected && styles.durationCardMinutesSelected,
                        !canAfford && styles.durationCardTextDisabled,
                      ]}>{option.minutes}min</Text>
                      <Text style={[
                        styles.durationCardPrice,
                        isSelected && styles.durationCardPriceSelected,
                        !canAfford && styles.durationCardTextDisabled,
                      ]}>
                        {paymentMethod === 'credits' ? `${option.credits}cr` : `$${option.cash}`}
                      </Text>
                      <View style={styles.durationCardSamples}>
                        <Ionicons
                          name="sparkles"
                          size={9}
                          color={!canAfford ? colors.darkGray : isSelected ? colors.gold : colors.darkGray}
                        />
                        <Text style={[
                          styles.durationCardSamplesText,
                          isSelected && styles.durationCardSamplesTextSelected,
                          !canAfford && styles.durationCardTextDisabled,
                        ]}>{option.samples} samples</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {availableCredits === 0 && (
                <TouchableOpacity
                  style={styles.buyCreditsLink}
                  onPress={() => {
                    haptics.light();
                    router.push('/buy-credits');
                  }}
                >
                  <Ionicons name="add-circle" size={18} color={colors.gold} />
                  <Text style={styles.buyCreditsLinkText}>Buy Credits & Save</Text>
                </TouchableOpacity>
              )}
              {availableCredits > 0 && availableCredits < 8 && (
                <Text style={styles.creditBalanceHint}>
                  You have {availableCredits} credits • Need more?{' '}
                  <Text
                    style={styles.buyCreditsInlineLink}
                    onPress={() => {
                      haptics.light();
                      router.push('/buy-credits');
                    }}
                  >Buy credits</Text>
                </Text>
              )}
            </View>

            {/* Day - Ultra Compact */}
            <View style={styles.ultraCompactSection}>
              <Text style={styles.ultraCompactTitle}>Day</Text>
              <View style={styles.dayUltraRow}>
                <TouchableOpacity
                  style={[
                    styles.dayChip,
                    bookingData.date?.toDateString() === new Date().toDateString() && styles.dayChipSelected,
                  ]}
                  onPress={() => {
                    haptics.light();
                    setBookingData(prev => ({ ...prev, date: new Date() }));
                  }}
                >
                  <Text style={[
                    styles.dayChipText,
                    bookingData.date?.toDateString() === new Date().toDateString() && styles.dayChipTextSelected,
                  ]}>Today</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.dayChip,
                    bookingData.date?.toDateString() === new Date(Date.now() + 86400000).toDateString() && styles.dayChipSelected,
                  ]}
                  onPress={() => {
                    haptics.light();
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    setBookingData(prev => ({ ...prev, date: tomorrow }));
                  }}
                >
                  <Text style={[
                    styles.dayChipText,
                    bookingData.date?.toDateString() === new Date(Date.now() + 86400000).toDateString() && styles.dayChipTextSelected,
                  ]}>Tomorrow</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.dayChip,
                    showDatePicker && styles.dayChipSelected,
                  ]}
                  onPress={() => {
                    haptics.light();
                    setShowDatePicker(true);
                  }}
                >
                  <Ionicons name="calendar-outline" size={18} color={showDatePicker ? colors.gold : colors.navy} />
                </TouchableOpacity>
              </View>
              {showDatePicker && (
                <DateTimePicker
                  value={bookingData.date || new Date()}
                  mode="date"
                  display="spinner"
                  minimumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setBookingData(prev => ({ ...prev, date: selectedDate }));
                    }
                  }}
                />
              )}
            </View>

            {/* Time Window - 2x2 Compact */}
            <View style={styles.ultraCompactSection}>
              <Text style={styles.ultraCompactTitle}>Time Window</Text>
              <View style={styles.timeWindowUltraGrid}>
                {[
                  { id: 'morning', label: 'Morning', time: '9-12', icon: 'sunny-outline' },
                  { id: 'afternoon', label: 'Afternoon', time: '12-5', icon: 'partly-sunny-outline' },
                  { id: 'evening', label: 'Evening', time: '5-8', icon: 'moon-outline' },
                  { id: 'lateNight', label: 'Late', time: '8-10', icon: 'moon' },
                ].map((window) => (
                  <TouchableOpacity
                    key={window.id}
                    style={[
                      styles.timeWindowUltraCard,
                      selectedTimeWindow === window.id && styles.timeWindowUltraCardSelected,
                    ]}
                    onPress={() => {
                      haptics.light();
                      setSelectedTimeWindow(window.id as any);
                      setShowExactTimes(false);
                    }}
                  >
                    <Ionicons
                      name={window.icon as any}
                      size={20}
                      color={selectedTimeWindow === window.id ? colors.gold : colors.navy}
                    />
                    <Text style={[
                      styles.timeWindowUltraLabel,
                      selectedTimeWindow === window.id && styles.timeWindowUltraLabelSelected,
                    ]}>{window.label}</Text>
                    <Text style={styles.timeWindowUltraTime}>{window.time}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Specific Time - Compact Grid */}
            {selectedTimeWindow && (
              <View style={styles.ultraCompactSection}>
                <View style={styles.timeSlotsTitleRow}>
                  <Text style={styles.ultraCompactTitle}>Select Time</Text>
                  <TouchableOpacity
                    onPress={() => {
                      haptics.light();
                      setShowExactTimes(!showExactTimes);
                    }}
                    style={styles.intervalToggle}
                  >
                    <Ionicons name="time-outline" size={12} color={colors.darkGray} />
                    <Text style={styles.intervalToggleText}>{showExactTimes ? '30m' : '10m'}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.timeSlotUltraGrid}>
                  {(showExactTimes ? getExactTimeSlots(selectedTimeWindow) : getTimeWindowSlots(selectedTimeWindow)).map((time) => {
                    const queueCount = getQueueForTime(time);
                    const availability = getAvailabilityStatus(queueCount);

                    return (
                      <TouchableOpacity
                        key={time}
                        style={[
                          styles.timeSlotUltraChip,
                          bookingData.time === time && styles.timeSlotUltraChipSelected,
                          availability.disabled && styles.timeSlotDisabled,
                        ]}
                        onPress={() => {
                          if (availability.disabled) {
                            haptics.warning();
                            return;
                          }
                          haptics.light();
                          setBookingData(prev => ({ ...prev, time }));
                        }}
                        disabled={availability.disabled}
                      >
                        <Text style={[
                          styles.timeSlotUltraText,
                          bookingData.time === time && styles.timeSlotUltraTextSelected,
                          availability.disabled && styles.timeSlotTextDisabled,
                        ]}>{formatTime12Hour(time)}</Text>
                        <View style={styles.availabilityRow}>
                          <View style={[styles.availabilityDot, { backgroundColor: availability.color }]} />
                          <Text style={[styles.availabilityLabel, { color: availability.color }]}>
                            {availability.label}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {/* Availability Legend */}
                <View style={styles.queueLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                    <Text style={styles.legendText}>Available</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                    <Text style={styles.legendText}>Short wait</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
                    <Text style={styles.legendText}>Busy</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.darkGray }]} />
                    <Text style={styles.legendText}>Full</Text>
                  </View>
                </View>
              </View>
            )}

          </View>
        )}

        {step === 'environment' && (
          <View style={styles.singleScreenContainer}>
            {/* Lighting - Continuous Gold Slider */}
            <ContinuousSlider
              title="Lighting"
              value={bookingData.preferences.lighting}
              min={0}
              max={100}
              leftLabel="Dark"
              rightLabel="Bright"
              showPercentage={false}
              formatValue={(val) => {
                if (val < 33) return 'Dark';
                if (val < 67) return 'Dim';
                return 'Bright';
              }}
              onValueChange={(val) => {
                setBookingData(prev => ({
                  ...prev,
                  preferences: { ...prev.preferences, lighting: val },
                }));
              }}
              haptics={haptics}
            />

            {/* Temperature - Continuous Gold Slider */}
            <ContinuousSlider
              title="Temperature"
              value={bookingData.preferences.temperature}
              min={68}
              max={76}
              leftLabel="68°"
              rightLabel="76°"
              showPercentage={false}
              formatValue={(val) => `${val}°F`}
              onValueChange={(val) => {
                setBookingData(prev => ({
                  ...prev,
                  preferences: { ...prev.preferences, temperature: val },
                }));
              }}
              haptics={haptics}
            />

            {/* Bidet Temperature - Ultra Compact */}
            <View style={styles.ultraCompactSection}>
              <Text style={styles.ultraCompactTitle}>Bidet</Text>
              <View style={styles.environmentRow}>
                {[
                  { value: 'cold', label: 'Cold' },
                  { value: 'warm', label: 'Warm' },
                  { value: 'hot', label: 'Hot' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.envChip,
                      bookingData.preferences.bidet_temp === option.value && styles.envChipSelected,
                    ]}
                    onPress={() => {
                      haptics.light();
                      setBookingData(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, bidet_temp: option.value as any },
                      }));
                    }}
                  >
                    <Text style={[
                      styles.envChipText,
                      bookingData.preferences.bidet_temp === option.value && styles.envChipTextSelected,
                    ]}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Heated Seat - Ultra Compact Toggle */}
            <View style={styles.ultraCompactSection}>
              <TouchableOpacity
                style={styles.toggleRowCompact}
                onPress={() => {
                  haptics.light();
                  setBookingData(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, heated_seat: !prev.preferences.heated_seat },
                  }));
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.toggleLabelCompact}>Heated Seat</Text>
                <View style={[
                  styles.toggleSwitchCompact,
                  bookingData.preferences.heated_seat && styles.toggleSwitchCompactActive,
                ]}>
                  <View style={[
                    styles.toggleKnobCompact,
                    bookingData.preferences.heated_seat && styles.toggleKnobCompactActive,
                  ]} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Ambience - Rotatable Vinyl Disc */}
            <View style={styles.ultraCompactSection}>
              <Text style={styles.ultraCompactTitle}>Ambience</Text>
              <RotatableMusicDisc
                value={bookingData.preferences.music}
                onValueChange={(val) => {
                  setBookingData(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, music: val as BookingData['preferences']['music'] },
                  }));
                }}
                haptics={haptics}
              />
            </View>
          </View>
        )}

        {step === 'samples' && (() => {
          const maxSamples = bookingData.duration === 10 ? 2 : 5;
          const canSelect = bookingData.preferences.samples.length < maxSamples;

          return (
            <View>
              <View style={styles.section}>
                <View style={styles.samplesTitleRow}>
                  <Text style={styles.sectionTitle}>
                    Select Your Samples ({maxSamples} Included)
                  </Text>
                  <View style={styles.samplesCounter}>
                    <Text style={styles.samplesCounterText}>
                      {bookingData.preferences.samples.length}/{maxSamples}
                    </Text>
                  </View>
                </View>
                <Text style={styles.sectionSubtitle}>
                  Premium single-use packets to take home and try. Choose {maxSamples === 2 ? '2 samples' : 'up to 5 samples'}.
                </Text>
                <View style={styles.samplesGrid}>
                  {[
                    { id: 'aesop-handwash', name: 'Aesop - Hand Wash Sample', icon: 'hand-left-outline' },
                    { id: 'le-labo-perfume', name: 'Le Labo - Perfume Sample', icon: 'rose-outline' },
                    { id: 'drunk-elephant-serum', name: 'Drunk Elephant - Serum Packet', icon: 'water-outline' },
                    { id: 'kiehl-moisturizer', name: "Kiehl's - Moisturizer Sample", icon: 'sparkles-outline' },
                    { id: 'byredo-lotion', name: 'Byredo - Body Lotion Sample', icon: 'heart-outline' },
                    { id: 'tatcha-cleanser', name: 'Tatcha - Cleanser Packet', icon: 'flower-outline' },
                    { id: 'fresh-lip-balm', name: 'Fresh - Lip Treatment Mini', icon: 'happy-outline' },
                    { id: 'diptyque-candle', name: 'Diptyque - Candle Sample', icon: 'flame-outline' },
                    { id: 'malin-goetz-deodorant', name: 'Malin+Goetz - Deodorant Sample', icon: 'shield-outline' },
                    { id: 'augustinus-bader-cream', name: 'Augustinus Bader - Cream Sample', icon: 'leaf-outline' },
                  ].map((sample) => {
                    const isSelected = bookingData.preferences.samples.includes(sample.id);
                    // Disable only if NOT selected AND limit is reached
                    const isDisabled = !isSelected && !canSelect;

                    return (
                      <TouchableOpacity
                        key={sample.id}
                        style={[
                          styles.sampleCard,
                          isSelected && styles.sampleCardSelected,
                          isDisabled && styles.sampleCardDisabled,
                        ]}
                        onPress={() => {
                          if (isSelected) {
                            // Always allow deselection
                            haptics.light();
                            setBookingData(prev => ({
                              ...prev,
                              preferences: {
                                ...prev.preferences,
                                samples: prev.preferences.samples.filter(s => s !== sample.id),
                              },
                            }));
                          } else if (canSelect) {
                            // Only allow selection if under limit
                            haptics.light();
                            setBookingData(prev => ({
                              ...prev,
                              preferences: {
                                ...prev.preferences,
                                samples: [...prev.preferences.samples, sample.id],
                              },
                            }));
                          } else {
                            haptics.warning();
                          }
                        }}
                        activeOpacity={isDisabled ? 1 : 0.7}
                      >
                        {isSelected && (
                          <View style={styles.sampleCheckmark}>
                            <Ionicons name="checkmark" size={16} color={colors.white} />
                          </View>
                        )}
                        {SAMPLE_LOGOS[sample.id] ? (
                          <Image
                            source={{ uri: SAMPLE_LOGOS[sample.id] }}
                            style={styles.sampleLogo}
                          />
                        ) : (
                          <Ionicons
                            name={sample.icon as any}
                            size={28}
                            color={isSelected ? colors.gold : isDisabled ? colors.lightGray : colors.navy}
                          />
                        )}
                        <Text style={[
                          styles.sampleName,
                          isSelected && styles.sampleNameSelected,
                          isDisabled && styles.sampleNameDisabled,
                        ]} numberOfLines={2}>{sample.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {bookingData.duration === 10 && bookingData.preferences.samples.length === 2 && (
                  <View style={styles.samplesUpgradeHint}>
                    <Ionicons name="arrow-up-circle" size={20} color={colors.gold} />
                    <Text style={styles.samplesUpgradeText}>
                      Book 15+ minutes to get 5 samples instead of 2!
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        })()}

        {step === 'review' && (
          <View style={styles.reviewContainer}>
            {/* Location & Time Card */}
            <MaslowCard padding="md">
              <Text style={styles.reviewSectionTitle}>Location & Time</Text>
              <View style={styles.reviewRow}>
                <Ionicons name="location-outline" size={18} color={colors.gold} />
                <Text style={styles.reviewText}>{location?.name}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Ionicons name="calendar-outline" size={18} color={colors.gold} />
                <Text style={styles.reviewText}>
                  {bookingData.date?.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
              </View>
              <View style={styles.reviewRow}>
                <Ionicons name="time-outline" size={18} color={colors.gold} />
                <Text style={styles.reviewText}>
                  {bookingData.time ? formatTime12Hour(bookingData.time) : ''} • {bookingData.duration} minutes
                </Text>
              </View>
            </MaslowCard>

            {/* Preferences Card */}
            <MaslowCard padding="md">
              <Text style={styles.reviewSectionTitle}>Your Environment</Text>
              <View style={styles.reviewRow}>
                <Ionicons name="sunny-outline" size={18} color={colors.gold} />
                <Text style={styles.reviewText}>
                  Lighting: {bookingData.preferences.lighting < 33 ? 'Dark' : bookingData.preferences.lighting < 67 ? 'Dim' : 'Bright'}
                </Text>
              </View>
              <View style={styles.reviewRow}>
                <Ionicons name="thermometer-outline" size={18} color={colors.gold} />
                <Text style={styles.reviewText}>
                  Temperature: {bookingData.preferences.temperature}°F
                </Text>
              </View>
              <View style={styles.reviewRow}>
                <Ionicons name="musical-notes-outline" size={18} color={colors.gold} />
                <Text style={styles.reviewText}>
                  Music: {
                    bookingData.preferences.music === 'silence' ? 'Silence' :
                    bookingData.preferences.music === 'your-music' ? 'Your Music' :
                    bookingData.preferences.music === 'white-noise' ? 'White Noise' :
                    bookingData.preferences.music === 'flushing' ? 'Otohime' :
                    bookingData.preferences.music === 'spa' ? 'Spa Sounds' :
                    bookingData.preferences.music === 'classical' ? 'Classical' : bookingData.preferences.music
                  }
                </Text>
              </View>
              <View style={styles.reviewRow}>
                <Ionicons name="water-outline" size={18} color={colors.gold} />
                <Text style={styles.reviewText}>
                  Bidet: {bookingData.preferences.bidet_temp.charAt(0).toUpperCase() + bookingData.preferences.bidet_temp.slice(1)} • Heated Seat: {bookingData.preferences.heated_seat ? 'On' : 'Off'}
                </Text>
              </View>
            </MaslowCard>

            {/* Samples Card */}
            {bookingData.preferences.samples.length > 0 && (
              <MaslowCard padding="md">
                <Text style={styles.reviewSectionTitle}>
                  Samples ({bookingData.preferences.samples.length})
                </Text>
                <View style={styles.reviewSamplesGrid}>
                  {bookingData.preferences.samples.map((sampleId) => (
                    <View key={sampleId} style={styles.reviewSampleChip}>
                      <Text style={styles.reviewSampleText}>
                        {sampleId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </Text>
                    </View>
                  ))}
                </View>
              </MaslowCard>
            )}

            {/* Credit Cost Card */}
            <MaslowCard padding="md">
              <Text style={styles.reviewSectionTitle}>Payment</Text>
              <View style={styles.creditSummary}>
                <View style={styles.creditSummaryRow}>
                  <View style={styles.reviewRow}>
                    <Ionicons name="card-outline" size={18} color={colors.gold} />
                    <Text style={styles.creditSummaryLabel}>Cost</Text>
                  </View>
                  <Text style={styles.creditSummaryValue}>1 Credit</Text>
                </View>
              </View>
              <Text style={styles.creditBalance}>
                Balance after booking: {availableCredits - 1} credits
              </Text>
            </MaslowCard>
          </View>
        )}

        {step === 'success' && (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={80} color={colors.success} />
            <Text style={styles.successTitle}>Your Sanctuary Awaits!</Text>
            <Text style={styles.successSubtitle}>
              Booking confirmed at {location?.name}
            </Text>
            <View style={styles.successActions}>
              <TouchableOpacity
                style={styles.addCalendarButton}
                onPress={() => {
                  haptics.light();
                  // Construct booking datetime
                  const bookingDateTime = new Date(bookingData.date || new Date());
                  if (bookingData.time) {
                    const [hours, minutes] = bookingData.time.split(':').map(Number);
                    bookingDateTime.setHours(hours, minutes, 0, 0);
                  }
                  addToCalendar({
                    location: location?.name || 'Maslow',
                    date: bookingDateTime,
                    duration: bookingData.duration,
                  });
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="calendar-outline" size={20} color={colors.gold} />
                <Text style={styles.addCalendarButtonText}>Add to Calendar</Text>
              </TouchableOpacity>
              <MaslowButton
                onPress={() => {
                  haptics.light();
                  router.replace('/(tabs)/');
                }}
                variant="secondary"
                size="lg"
              >
                Back to Home
              </MaslowButton>
              <MaslowButton
                onPress={() => {
                  haptics.light();
                  router.replace('/bookings');
                }}
                variant="primary"
                size="lg"
              >
                View My Bookings
              </MaslowButton>
            </View>
            <TouchableOpacity
              onPress={() => router.replace('/(tabs)/profile')}
              style={styles.successLink}
            >
              <Text style={styles.successLinkText}>Set up your preferences</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.gold} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Footer Actions */}
      {step !== 'success' && (
        <View style={styles.footer}>
          <View style={styles.creditBadge}>
            <Ionicons name="card" size={16} color={colors.gold} />
            <Text style={styles.creditText}>{availableCredits} credits</Text>
          </View>
          <MaslowButton
            onPress={step === 'review' ? handleConfirmBooking : handleNext}
            variant="primary"
            size="lg"
            disabled={submitting}
          >
            {submitting ? 'Booking...' : step === 'review' ? 'Confirm Booking' : 'Continue'}
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
  progressContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.lightGray,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.gold,
  },
  progressText: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.darkGray,
    textAlign: 'center',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100, // Minimal clearance for footer
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
  instruction: {
    fontSize: 16,
    color: colors.darkGray,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  comingSoon: {
    fontSize: 14,
    color: colors.darkGray,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: spacing.xl,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.md,
  },
  successActions: {
    gap: spacing.md,
    width: '100%',
    marginTop: spacing.xl,
  },
  addCalendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.gold,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  addCalendarButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gold,
  },
  successLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  successLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gold,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.navy,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  successSubtitle: {
    fontSize: 16,
    color: colors.darkGray,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    backgroundColor: colors.cream,
  },
  creditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  creditText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.darkGray,
  },
  suitesContainer: {
    gap: spacing.md,
  },
  suiteCard: {
    marginBottom: spacing.md,
  },
  suiteCardSelected: {
    borderWidth: 2,
    borderColor: colors.gold,
  },
  suiteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  suiteInfo: {
    flex: 1,
  },
  suiteName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.navy,
    marginBottom: 2,
  },
  suiteStatus: {
    fontSize: 13,
    color: colors.success,
    fontWeight: '500',
  },
  selectedBadge: {
    marginLeft: spacing.sm,
  },
  suiteCapabilities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  capability: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.lightGray,
    borderRadius: 12,
  },
  capabilityText: {
    fontSize: 12,
    color: colors.darkGray,
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
    textAlign: 'center',
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navy,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.darkGray,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  dateButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  dateButton: {
    width: '47%',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.lightGray,
    alignItems: 'center',
  },
  dateButtonSelected: {
    borderColor: colors.gold,
    backgroundColor: `${colors.gold}10`,
  },
  dateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.navy,
    marginBottom: 4,
  },
  dateButtonTextSelected: {
    color: colors.gold,
  },
  dateButtonSubtext: {
    fontSize: 12,
    color: colors.darkGray,
  },
  timeWindowsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  timeWindowCard: {
    width: '47%',
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.lightGray,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  timeWindowCardSelected: {
    borderColor: colors.gold,
    backgroundColor: `${colors.gold}10`,
  },
  timeWindowCardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.navy,
    marginTop: spacing.sm,
  },
  timeWindowCardLabelSelected: {
    color: colors.gold,
  },
  timeWindowCardTime: {
    fontSize: 13,
    color: colors.darkGray,
    marginTop: 4,
  },
  timeWindowCardTimeSelected: {
    color: colors.gold,
    fontWeight: '500',
  },
  durationButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  durationButton: {
    flex: 1,
    paddingVertical: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.lightGray,
    alignItems: 'center',
  },
  durationButtonSelected: {
    borderColor: colors.gold,
    backgroundColor: `${colors.gold}10`,
  },
  durationButtonText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.navy,
  },
  durationButtonTextSelected: {
    color: colors.gold,
  },
  durationMinutes: {
    fontSize: 12,
    color: colors.darkGray,
    marginTop: 2,
  },
  durationNote: {
    fontSize: 13,
    color: colors.darkGray,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  // Duration Grid with Pricing
  durationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentToggle: {
    flexDirection: 'row',
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    padding: 2,
  },
  paymentToggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  paymentToggleOptionActive: {
    backgroundColor: colors.white,
  },
  paymentToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.darkGray,
  },
  paymentToggleTextActive: {
    color: colors.gold,
  },
  durationGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  durationCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 4,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.lightGray,
    alignItems: 'center',
  },
  durationCardSelected: {
    borderColor: colors.gold,
    backgroundColor: `${colors.gold}15`,
  },
  durationCardDisabled: {
    opacity: 0.4,
    backgroundColor: colors.cream,
  },
  durationCardMinutes: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navy,
  },
  durationCardMinutesSelected: {
    color: colors.gold,
  },
  durationCardPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.darkGray,
    marginTop: 2,
  },
  durationCardPriceSelected: {
    color: colors.gold,
  },
  durationCardSamples: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  durationCardSamplesText: {
    fontSize: 9,
    color: colors.darkGray,
  },
  durationCardSamplesTextSelected: {
    color: colors.gold,
  },
  durationCardTextDisabled: {
    color: colors.darkGray,
  },
  buyCreditsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    padding: 10,
    backgroundColor: `${colors.gold}20`,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 8,
  },
  buyCreditsLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gold,
  },
  creditBalanceHint: {
    fontSize: 11,
    color: colors.darkGray,
    textAlign: 'center',
    marginTop: 8,
  },
  buyCreditsInlineLink: {
    color: colors.gold,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  // Day Buttons (new combined UI)
  dayButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dayButton: {
    flex: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonSelected: {
    borderColor: colors.gold,
    backgroundColor: `${colors.gold}10`,
  },
  dayButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.navy,
  },
  dayButtonLabelSelected: {
    color: colors.gold,
  },
  dayButtonDate: {
    fontSize: 12,
    color: colors.darkGray,
    marginTop: 2,
  },
  dayButtonPickDate: {
    gap: spacing.xs,
  },
  // Option Buttons (Lighting, Music, Bidet)
  optionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  optionButton: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.lightGray,
    borderRadius: 12,
    gap: spacing.xs,
  },
  optionButtonSelected: {
    borderColor: colors.gold,
    backgroundColor: `${colors.gold}10`,
  },
  optionButtonText: {
    fontSize: 14,
    color: colors.navy,
    fontWeight: '500',
  },
  optionButtonTextSelected: {
    color: colors.gold,
    fontWeight: '600',
  },
  // Temperature Slider
  temperatureContainer: {
    alignItems: 'center',
  },
  temperatureValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: spacing.md,
  },
  temperatureSlider: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  tempButton: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.lightGray,
    borderRadius: 12,
    alignItems: 'center',
  },
  tempButtonSelected: {
    borderColor: colors.gold,
    backgroundColor: colors.gold,
  },
  tempButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.navy,
  },
  tempButtonTextSelected: {
    color: colors.white,
  },
  // Heated Seat Toggle
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.lightGray,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.navy,
  },
  toggle: {
    width: 51,
    height: 31,
    borderRadius: 15.5,
    backgroundColor: colors.lightGray,
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: colors.gold,
  },
  toggleKnob: {
    width: 27,
    height: 27,
    borderRadius: 13.5,
    backgroundColor: colors.white,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleKnobActive: {
    transform: [{ translateX: 20 }],
  },
  // Samples Grid
  samplesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sampleCard: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.lightGray,
    borderRadius: 12,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    position: 'relative',
  },
  sampleCardSelected: {
    borderColor: colors.gold,
    backgroundColor: `${colors.gold}10`,
  },
  sampleCardDisabled: {
    opacity: 0.4,
  },
  sampleCheckmark: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sampleName: {
    fontSize: 11,
    color: colors.navy,
    textAlign: 'center',
    fontWeight: '500',
  },
  sampleNameSelected: {
    color: colors.gold,
    fontWeight: '600',
  },
  sampleNameDisabled: {
    color: colors.lightGray,
  },
  sampleLogo: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  samplesCount: {
    fontSize: 13,
    color: colors.darkGray,
    textAlign: 'center',
    marginTop: spacing.md,
    fontWeight: '600',
  },
  samplesTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  samplesCounter: {
    backgroundColor: colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  samplesCounterText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navy,
  },
  samplesUpgradeHint: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: `${colors.gold}20`,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 12,
  },
  samplesUpgradeText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.navy,
    lineHeight: 18,
  },
  // Time Selection Drill-Down Styles
  backToWindows: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
    padding: spacing.sm,
  },
  backToWindowsText: {
    fontSize: 14,
    color: colors.navy,
    fontWeight: '500',
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  timeSlotCard: {
    width: '31%',
    paddingVertical: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.lightGray,
    alignItems: 'center',
  },
  timeSlotCardSelected: {
    borderColor: colors.gold,
    backgroundColor: `${colors.gold}10`,
  },
  timeSlotText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.navy,
  },
  timeSlotTextSelected: {
    color: colors.gold,
  },
  exactTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.lightGray,
  },
  exactTimeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.navy,
  },
  exactTimesScroll: {
    maxHeight: 400,
  },
  // Music Knob Styles
  musicKnobContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  musicKnob: {
    width: 180,
    height: 180,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  knobLabels: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  knobOption: {
    position: 'absolute',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.lightGray,
    minWidth: 70,
    alignItems: 'center',
  },
  knobOptionSelected: {
    borderColor: colors.gold,
    backgroundColor: `${colors.gold}10`,
  },
  knobOptionText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.navy,
    textAlign: 'center',
  },
  knobOptionTextSelected: {
    color: colors.gold,
  },
  knobCenter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.white,
    borderWidth: 3,
    borderColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  knobCenterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navy,
    marginTop: 4,
    textAlign: 'center',
  },
  musicKnobHint: {
    fontSize: 10,
    color: colors.darkGray,
    marginTop: 6,
    fontStyle: 'italic',
  },
  // Knob Pointer Styles
  knobPointer: {
    position: 'absolute',
    width: 2,
    height: 45,
    backgroundColor: colors.gold,
    top: '50%',
    left: '50%',
    marginLeft: -1,
    marginTop: -45,
    transformOrigin: 'bottom center',
  },
  pointerArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.gold,
    position: 'absolute',
    top: -10,
    left: -5,
  },
  // Compact Layout Styles
  compactSection: {
    marginBottom: spacing.lg,
  },
  compactSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Duration Row
  durationRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  durationCompactCard: {
    flex: 1,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationCompactCardSelected: {
    borderColor: colors.gold,
    backgroundColor: `${colors.gold}10`,
  },
  durationCompactNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.navy,
  },
  durationCompactNumberSelected: {
    color: colors.gold,
  },
  // Day Row
  dayRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dayCompactButton: {
    flex: 1,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCompactButtonSelected: {
    borderColor: colors.gold,
    backgroundColor: `${colors.gold}10`,
  },
  dayCompactLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.navy,
  },
  dayCompactLabelSelected: {
    color: colors.gold,
  },
  // Time Window Compact Grid
  timeWindowCompactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  timeWindowCompactCard: {
    width: '48%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.lightGray,
    alignItems: 'center',
    gap: spacing.xs,
  },
  timeWindowCompactCardSelected: {
    borderColor: colors.gold,
    backgroundColor: `${colors.gold}10`,
  },
  timeWindowCompactLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navy,
  },
  timeWindowCompactLabelSelected: {
    color: colors.gold,
  },
  timeWindowCompactTime: {
    fontSize: 11,
    color: colors.darkGray,
  },
  // Time Slots Header & Scroll
  timeSlotsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  exactTimeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  exactTimeLinkText: {
    fontSize: 11,
    color: colors.navy,
    fontWeight: '600',
  },
  timeSlotsScroll: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  timeSlotCompact: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.lightGray,
    minWidth: 80,
    alignItems: 'center',
  },
  timeSlotCompactSelected: {
    borderColor: colors.gold,
    backgroundColor: `${colors.gold}10`,
  },
  timeSlotCompactText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.navy,
  },
  timeSlotCompactTextSelected: {
    color: colors.gold,
  },
  // Ultra Compact Single Screen Styles
  singleScreenContainer: {
    paddingVertical: spacing.sm,
  },
  ultraCompactSection: {
    marginBottom: spacing.xs,
  },
  ultraCompactTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.darkGray,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Duration Ultra Compact
  durationUltraRow: {
    flexDirection: 'row',
    gap: 8,
  },
  durationChip: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.lightGray,
    alignItems: 'center',
  },
  durationChipSelected: {
    borderColor: colors.gold,
    backgroundColor: `${colors.gold}15`,
  },
  durationChipText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.navy,
  },
  durationChipTextSelected: {
    color: colors.gold,
    fontWeight: '700',
  },
  // Day Ultra Compact
  dayUltraRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dayChip: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipSelected: {
    borderColor: colors.gold,
    backgroundColor: `${colors.gold}15`,
  },
  dayChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navy,
  },
  dayChipTextSelected: {
    color: colors.gold,
    fontWeight: '700',
  },
  // Time Window Ultra Compact
  timeWindowUltraGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeWindowUltraCard: {
    width: '48%',
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.lightGray,
    alignItems: 'center',
    gap: 4,
  },
  timeWindowUltraCardSelected: {
    borderColor: colors.gold,
    backgroundColor: `${colors.gold}15`,
  },
  timeWindowUltraLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.navy,
  },
  timeWindowUltraLabelSelected: {
    color: colors.gold,
    fontWeight: '700',
  },
  timeWindowUltraTime: {
    fontSize: 10,
    color: colors.darkGray,
  },
  // Time Slots Ultra Compact
  timeSlotsTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  intervalToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.cream,
  },
  intervalToggleText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.darkGray,
  },
  timeSlotUltraGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  timeSlotUltraChip: {
    width: '23.5%',
    paddingVertical: 8,
    backgroundColor: colors.white,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.lightGray,
    alignItems: 'center',
  },
  timeSlotUltraChipSelected: {
    borderColor: colors.gold,
    backgroundColor: `${colors.gold}15`,
  },
  timeSlotUltraText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.navy,
  },
  timeSlotUltraTextSelected: {
    color: colors.gold,
    fontWeight: '700',
  },
  timeSlotDisabled: {
    opacity: 0.5,
    backgroundColor: colors.lightGray,
  },
  timeSlotTextDisabled: {
    color: colors.darkGray,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  availabilityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  availabilityLabel: {
    fontSize: 9,
    fontWeight: '600',
  },
  queueLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: colors.darkGray,
    fontWeight: '500',
  },
  // Environment Ultra Compact Styles
  musicKnobCompact: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingBottom: spacing.sm,
  },
  environmentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  envChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.lightGray,
  },
  envChipSelected: {
    borderColor: colors.gold,
    backgroundColor: `${colors.gold}15`,
  },
  envChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navy,
  },
  envChipTextSelected: {
    color: colors.gold,
    fontWeight: '700',
  },
  toggleRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.lightGray,
  },
  toggleLabelCompact: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navy,
  },
  toggleSwitchCompact: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.lightGray,
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchCompactActive: {
    backgroundColor: colors.gold,
  },
  toggleKnobCompact: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.white,
  },
  toggleKnobCompactActive: {
    transform: [{ translateX: 18 }],
  },
  // Gold Slider Styles
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  sliderValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gold,
  },
  sliderTrack: {
    paddingVertical: 0,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sliderLabelText: {
    fontSize: 10,
    color: colors.darkGray,
    fontWeight: '600',
  },
  sliderTouchArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.lightGray,
    height: 3,
    borderRadius: 1.5,
    position: 'relative',
  },
  sliderStop: {
    position: 'absolute',
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -18,
    marginTop: -16,
  },
  sliderDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.darkGray,
  },
  sliderDotActive: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.gold,
    borderColor: colors.gold,
    borderWidth: 2,
  },
  // Brass Knob Styles
  knobSelectedLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.navy,
    textAlign: 'center',
    marginBottom: 4,
  },
  knobRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  knobIndicator: {
    position: 'absolute',
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    left: '50%',
    top: '50%',
    marginLeft: -16,
    marginTop: -16,
  },
  knobDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.darkGray,
  },
  knobDotSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.gold,
    borderWidth: 2,
    borderColor: colors.white,
  },
  brassKnob: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  brassRidge: {
    position: 'absolute',
    width: 2,
    height: 50,
    backgroundColor: `${colors.gold}40`,
  },
  // Continuous Slider Styles
  continuousSliderContainer: {
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  continuousSliderTrack: {
    height: 6,
    backgroundColor: colors.lightGray,
    borderRadius: 3,
    overflow: 'hidden',
  },
  continuousSliderFill: {
    height: '100%',
    backgroundColor: colors.gold,
    borderRadius: 3,
  },
  continuousSliderKnob: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gold,
    marginLeft: -12,
    top: '50%',
    marginTop: -12,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  // Review Screen Styles
  reviewContainer: {
    gap: spacing.md,
  },
  reviewSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: spacing.sm,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  reviewText: {
    fontSize: 14,
    color: colors.darkGray,
    flex: 1,
  },
  reviewSamplesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  reviewSampleChip: {
    backgroundColor: `${colors.gold}20`,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  reviewSampleText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.navy,
  },
  creditSummary: {
    marginBottom: spacing.sm,
  },
  creditSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  creditSummaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.navy,
  },
  creditSummaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gold,
  },
  creditBalance: {
    fontSize: 13,
    color: colors.darkGray,
    textAlign: 'center',
  },
  // Rotatable Music Disc Styles
  musicDiscContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  musicDiscLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.navy,
    textAlign: 'center',
    marginBottom: 4,
  },
  discWrapper: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  musicDisc: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.navy,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  vinylGroove1: {
    position: 'absolute',
    width: 105,
    height: 105,
    borderRadius: 52.5,
    borderWidth: 1,
    borderColor: `${colors.gold}20`,
  },
  vinylGroove2: {
    position: 'absolute',
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 1,
    borderColor: `${colors.gold}30`,
  },
  vinylGroove3: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: `${colors.gold}20`,
  },
  vinylCenter: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 3,
  },
  discIndicator: {
    position: 'absolute',
    top: 8,
    width: 3,
    height: 12,
    backgroundColor: colors.gold,
    borderRadius: 1.5,
  },
  discHint: {
    fontSize: 10,
    color: colors.darkGray,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
