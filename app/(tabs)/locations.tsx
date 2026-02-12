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
import { colors, spacing } from '../../src/theme';
import { MaslowCard } from '../../src/components';
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

export default function LocationsScreen() {
  const router = useRouter();
  const haptics = useHaptics();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    fetchLocations();
  }, []);

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
    router.push(`/location/${location.id}`);
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
        <Text style={styles.title}>Locations</Text>
        <Text style={styles.subtitle}>Find your sanctuary</Text>
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
        {locations.length === 0 ? (
          <MaslowCard style={styles.emptyCard} padding="xl">
            <Ionicons name="location-outline" size={48} color={colors.darkGray} />
            <Text style={styles.emptyTitle}>No Locations Available</Text>
            <Text style={styles.emptySubtitle}>
              Check back soon! We're opening new locations.
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
                        <Ionicons name="location-outline" size={14} color={colors.darkGray} />
                        <Text style={styles.locationAddress} numberOfLines={1}>
                          {location.address}
                          {location.city && `, ${location.city}`}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.darkGray} />
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
                        <Ionicons name="time-outline" size={12} color={colors.darkGray} />
                        <Text style={styles.hoursText}>{location.hours}</Text>
                      </View>
                    )}
                  </View>
                </MaslowCard>
              </TouchableOpacity>
            );
          })
        )}

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => {
                haptics.medium();
                router.push('/quick-visit');
              }}
              activeOpacity={0.8}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="flash" size={24} color={colors.gold} />
              </View>
              <Text style={styles.quickActionTitle}>Quick Visit</Text>
              <Text style={styles.quickActionSubtitle}>Walk in, 10 min</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => {
                haptics.medium();
                router.push('/buy-credits');
              }}
              activeOpacity={0.8}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="card" size={24} color={colors.gold} />
              </View>
              <Text style={styles.quickActionTitle}>Buy Credits</Text>
              <Text style={styles.quickActionSubtitle}>Save with bundles</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  scrollContent: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 100,
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
    fontSize: 18,
    fontWeight: '600',
    color: colors.navy,
    marginBottom: 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationAddress: {
    fontSize: 13,
    color: colors.darkGray,
    flex: 1,
  },
  locationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
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
    fontWeight: '600',
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hoursText: {
    fontSize: 12,
    color: colors.darkGray,
  },
  quickActionsSection: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.darkGray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.gold}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.navy,
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: colors.darkGray,
  },
});
