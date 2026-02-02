
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

const BLUE = '#2C5F8D';
const CREAM = '#F9F2EC';
const GOLD = '#C5A059';
const DARK = '#1A202C';

// Mock data - replace with real Supabase query later
const MOCK_LOCATIONS = [
  {
    id: 1,
    name: 'SoHo - Men\'s',
    address: '123 Spring St, New York, NY 10012',
    distance: 0.2,
    occupied: false,
    amenities: ['shower', 'changing_table'],
    hours: 'Open 6 AM - 11 PM',
  },
  {
    id: 2,
    name: 'Chelsea - Unisex',
    address: '456 8th Ave, New York, NY 10001',
    distance: 0.5,
    occupied: true,
    amenities: ['accessible', 'shower'],
    hours: 'Open 24/7',
  },
  {
    id: 3,
    name: 'West Village - Women\'s',
    address: '789 Bleecker St, New York, NY 10014',
    distance: 0.8,
    occupied: false,
    amenities: ['changing_table', 'accessible'],
    hours: 'Open 7 AM - 10 PM',
  },
  {
    id: 4,
    name: 'East Village - Men\'s',
    address: '321 Avenue A, New York, NY 10009',
    distance: 1.2,
    occupied: false,
    amenities: ['shower'],
    hours: 'Open 6 AM - Midnight',
  },
];

const AMENITY_ICONS = {
  shower: '🚿',
  changing_table: '👶',
  accessible: '♿',
};

export default function LocationsScreen() {
  const [locations] = useState(MOCK_LOCATIONS);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scroll} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Find a Location</Text>
          <Text style={styles.subtitle}>Nearby Maslow restrooms</Text>
        </View>

        {/* Map Placeholder */}
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapIcon}>🗺️</Text>
          <Text style={styles.mapText}>Map view coming soon</Text>
          <Text style={styles.mapSubtext}>Will show interactive map with pins</Text>
        </View>

        {/* Locations List */}
        <Text style={styles.sectionTitle}>Nearby Locations</Text>

        {locations.map((location) => (
          <View key={location.id} style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <View style={styles.locationInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.locationName}>{location.name}</Text>
                  {location.occupied ? (
                    <View style={styles.statusBadge}>
                      <View style={styles.statusDot} />
                      <Text style={styles.statusText}>Occupied</Text>
                    </View>
                  ) : (
                    <View style={[styles.statusBadge, styles.statusBadgeAvailable]}>
                      <View style={[styles.statusDot, styles.statusDotAvailable]} />
                      <Text style={[styles.statusText, styles.statusTextAvailable]}>Available</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.locationAddress}>{location.address}</Text>
                <Text style={styles.locationHours}>⏰ {location.hours}</Text>
              </View>
            </View>

            <View style={styles.distanceRow}>
              <Text style={styles.distance}>📍 {location.distance} mi away</Text>
            </View>

            {/* Amenities */}
            {location.amenities.length > 0 && (
              <View style={styles.amenities}>
                {location.amenities.map((amenity, index) => (
                  <View key={index} style={styles.amenityTag}>
                    <Text style={styles.amenityIcon}>{AMENITY_ICONS[amenity]}</Text>
                    <Text style={styles.amenityText}>
                      {amenity.replace('_', ' ')}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.navigateButton]}
                onPress={() => {/* Navigate */}}
              >
                <Text style={styles.actionButtonText}>🧭 Navigate</Text>
              </TouchableOpacity>
              
              {!location.occupied && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.qrButton]}
                  onPress={() => {/* Show QR */}}
                >
                  <Text style={[styles.actionButtonText, styles.qrButtonText]}>
                    Show Pass
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {/* Bottom padding */}
        <View style={{ height: 40 }} />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CREAM,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: BLUE,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  mapPlaceholder: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 48,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  mapIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  mapText: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
    marginBottom: 4,
  },
  mapSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
    marginBottom: 16,
  },
  locationCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  locationHeader: {
    marginBottom: 12,
  },
  locationInfo: {
    gap: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  locationName: {
    fontSize: 20,
    fontWeight: '700',
    color: DARK,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
  },
  statusBadgeAvailable: {
    backgroundColor: '#D1FAE5',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  statusDotAvailable: {
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  statusTextAvailable: {
    color: '#059669',
  },
  locationAddress: {
    fontSize: 14,
    color: '#6B7280',
  },
  locationHours: {
    fontSize: 14,
    color: '#6B7280',
  },
  distanceRow: {
    marginBottom: 12,
  },
  distance: {
    fontSize: 16,
    fontWeight: '600',
    color: BLUE,
  },
  amenities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  amenityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  amenityIcon: {
    fontSize: 16,
  },
  amenityText: {
    fontSize: 13,
    fontWeight: '600',
    color: DARK,
    textTransform: 'capitalize',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  navigateButton: {
    backgroundColor: BLUE,
  },
  qrButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: BLUE,
  },
  actionButtonText: {
    fontWeight: '700',
    fontSize: 15,
    color: 'white',
  },
  qrButtonText: {
    color: BLUE,
  },
});