import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { colors, spacing } from '../../src/theme';
import { MaslowCard, MaslowButton } from '../../src/components';
import { useHaptics } from '../../src/hooks/useHaptics';

interface LocationDetail {
  id: string;
  name: string;
  address: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  description: string | null;
  amenities: string[] | null;
  available_suites: number;
  total_suites: number;
  image_url: string | null;
  hours: string | null;
}

export default function LocationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const haptics = useHaptics();
  const [location, setLocation] = useState<LocationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchLocation();
    }
  }, [id]);

  const fetchLocation = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('locations')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching location:', fetchError.message);
        setError('Location not found');
        return;
      }

      setLocation(data);
    } catch (err) {
      console.error('Failed to fetch location:', err);
      setError('Failed to load location');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    haptics.light();
    router.back();
  };

  const handleBookNow = () => {
    haptics.medium();
    router.push(`/book/${id}`);
  };

  const getFullAddress = (): string => {
    if (!location) return '';
    const parts = [
      location.address,
      location.city,
      location.state,
      location.zip,
    ].filter(Boolean);
    return parts.join(', ');
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.navy} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.navy} />
          <Text style={styles.loadingText}>Loading location...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !location) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.navy} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.darkGray} />
          <Text style={styles.errorTitle}>Location Not Found</Text>
          <Text style={styles.errorSubtitle}>
            This location may no longer be available.
          </Text>
          <MaslowButton onPress={handleBack} variant="secondary" size="md">
            Go Back
          </MaslowButton>
        </View>
      </SafeAreaView>
    );
  }

  const isAvailable = location.available_suites > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {location.name}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image */}
        <View style={styles.heroCard}>
          {location.image_url ? (
            <Image
              source={{ uri: location.image_url }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.heroImagePlaceholder}>
              <Ionicons name="image-outline" size={48} color={colors.darkGray} />
              <Text style={styles.placeholderText}>No image yet</Text>
            </View>
          )}
        </View>

        {/* Location Name */}
        <Text style={styles.locationName}>{location.name}</Text>

        {/* Info Rows - Slightly Compressed */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color={colors.gold} />
            <Text style={styles.infoText}>{getFullAddress()}</Text>
          </View>
          {location.hours && (
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={18} color={colors.gold} />
              <Text style={styles.infoText}>{location.hours}</Text>
            </View>
          )}
        </View>

        {/* Availability - Slightly Compressed */}
        <View style={styles.availabilityCard}>
          <View style={styles.availabilityHeader}>
            <View style={[
              styles.availabilityDot,
              { backgroundColor: isAvailable ? colors.success : colors.error }
            ]} />
            <Text style={styles.availabilityTitle}>
              {isAvailable ? 'Available Now' : 'Fully Booked'}
            </Text>
          </View>
          <Text style={styles.availabilitySubtitle}>
            {isAvailable
              ? `${location.available_suites} of ${location.total_suites} suites available`
              : 'Check back soon'}
          </Text>
        </View>

        {/* Description - Slightly Compressed */}
        {location.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.descriptionText}>{location.description}</Text>
          </View>
        )}

        {/* Amenities - Slightly Compressed */}
        {location.amenities && location.amenities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesGrid}>
              {location.amenities.map((amenity, index) => (
                <View key={index} style={styles.amenityChip}>
                  <Ionicons
                    name={getAmenityIcon(amenity)}
                    size={14}
                    color={colors.navy}
                  />
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={[
            styles.bookButton,
            !isAvailable && styles.bookButtonDisabled
          ]}
          onPress={handleBookNow}
          activeOpacity={0.8}
        >
          <Text style={styles.bookButtonText}>
            {isAvailable ? 'Reserve Your Suite' : 'View Waitlist'}
          </Text>
          <Ionicons
            name={isAvailable ? 'arrow-forward' : 'time-outline'}
            size={20}
            color={colors.white}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Helper function to get icon for amenity
function getAmenityIcon(amenity: string): keyof typeof Ionicons.glyphMap {
  const lower = amenity.toLowerCase();
  if (lower.includes('shower')) return 'water-outline';
  if (lower.includes('wifi')) return 'wifi-outline';
  if (lower.includes('music')) return 'musical-notes-outline';
  if (lower.includes('vanity') || lower.includes('mirror')) return 'sparkles-outline';
  if (lower.includes('towel')) return 'shirt-outline';
  if (lower.includes('locker')) return 'lock-closed-outline';
  if (lower.includes('parking')) return 'car-outline';
  if (lower.includes('coffee') || lower.includes('tea')) return 'cafe-outline';
  return 'checkmark-circle-outline';
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
    paddingTop: spacing.sm,
    paddingBottom: 100,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorTitle: {
    marginTop: spacing.md,
    fontSize: 20,
    fontWeight: '600',
    color: colors.navy,
  },
  errorSubtitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    fontSize: 14,
    color: colors.darkGray,
    textAlign: 'center',
  },
  heroCard: {
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: colors.white,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  heroImage: {
    width: '100%',
    height: 140,
    borderRadius: 12,
  },
  heroImagePlaceholder: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    backgroundColor: `${colors.gold}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.darkGray,
  },
  infoSection: {
    marginBottom: spacing.sm,
  },
  locationName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    marginLeft: spacing.sm,
    fontSize: 14,
    color: colors.darkGray,
    flex: 1,
  },
  availabilityCard: {
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
  },
  availabilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  availabilityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  availabilityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.navy,
  },
  availabilitySubtitle: {
    fontSize: 13,
    color: colors.darkGray,
  },
  section: {
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.darkGray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 14,
    color: colors.navy,
    lineHeight: 20,
    backgroundColor: colors.white,
    padding: spacing.sm,
    borderRadius: 8,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  amenityText: {
    fontSize: 13,
    color: colors.navy,
    fontWeight: '500',
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.cream,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  bookButton: {
    backgroundColor: colors.gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    gap: spacing.sm,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bookButtonDisabled: {
    backgroundColor: colors.darkGray,
    shadowColor: colors.darkGray,
  },
  bookButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
});
