
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';

const BLUE = '#2C5F8D';
const CREAM = '#F9F2EC';
const GOLD = '#C5A059';
const DARK = '#1A202C';

// Mock data - replace with real Supabase query later
const MOCK_HISTORY = [
  {
    id: 1,
    location_name: 'SoHo - Men\'s',
    address: '123 Spring St',
    entry_time: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    duration_minutes: 7,
    settings: { lighting: 'relaxing', audio: 'nature' }
  },
  {
    id: 2,
    location_name: 'Chelsea - Unisex',
    address: '456 8th Ave',
    entry_time: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    duration_minutes: 5,
    settings: { lighting: 'energizing', audio: 'lofi' }
  },
  {
    id: 3,
    location_name: 'SoHo - Men\'s',
    address: '123 Spring St',
    entry_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    duration_minutes: 12,
    settings: { lighting: 'mirror', audio: 'whitenoise' }
  },
  {
    id: 4,
    location_name: 'West Village - Women\'s',
    address: '789 Bleecker St',
    entry_time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    duration_minutes: 8,
    settings: { lighting: 'relaxing', audio: 'silence' }
  },
  {
    id: 5,
    location_name: 'Chelsea - Unisex',
    address: '456 8th Ave',
    entry_time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    duration_minutes: 6,
    settings: { lighting: 'night', audio: 'nature' }
  },
];

export default function HistoryScreen() {
  const [history, setHistory] = useState(MOCK_HISTORY);
  
  // Calculate stats
  const thisMonthVisits = history.length;
  const uniqueLocations = new Set(history.map(h => h.location_name)).size;
  const avgDuration = Math.round(
    history.reduce((sum, h) => sum + h.duration_minutes, 0) / history.length
  );
  const mostVisited = history.reduce((acc, h) => {
    acc[h.location_name] = (acc[h.location_name] || 0) + 1;
    return acc;
  }, {});
  const topLocation = Object.entries(mostVisited).sort((a, b) => b[1] - a[1])[0];

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scroll} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Usage History</Text>
          <Text style={styles.subtitle}>Your recent activity</Text>
        </View>

        {/* Monthly Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>📊 This Month</Text>
          <View style={styles.statsGrid}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{thisMonthVisits}</Text>
              <Text style={styles.statLabel}>Visits</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{uniqueLocations}</Text>
              <Text style={styles.statLabel}>Locations</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{avgDuration}</Text>
              <Text style={styles.statLabel}>Avg Minutes</Text>
            </View>
          </View>
          <View style={styles.topLocation}>
            <Text style={styles.topLocationLabel}>Most visited:</Text>
            <Text style={styles.topLocationName}>
              {topLocation[0]} ({topLocation[1]}x)
            </Text>
          </View>
        </View>

        {/* Recent Activity */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        
        {history.map((visit) => (
          <View key={visit.id} style={styles.visitCard}>
            <View style={styles.visitHeader}>
              <View style={styles.locationInfo}>
                <Text style={styles.locationIcon}>📍</Text>
                <View style={styles.locationText}>
                  <Text style={styles.locationName}>{visit.location_name}</Text>
                  <Text style={styles.locationAddress}>{visit.address}</Text>
                </View>
              </View>
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>{visit.duration_minutes} min</Text>
              </View>
            </View>
            
            <View style={styles.visitDetails}>
              <Text style={styles.visitTime}>⏰ {formatTime(visit.entry_time)}</Text>
              <View style={styles.settingsTags}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>💡 {visit.settings.lighting}</Text>
                </View>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>🎵 {visit.settings.audio}</Text>
                </View>
              </View>
            </View>
          </View>
        ))}

        {/* View All Button */}
        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View All History</Text>
        </TouchableOpacity>

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
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: GOLD,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: DARK,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 36,
    fontWeight: '700',
    color: BLUE,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  topLocation: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  topLocationLabel: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
    marginBottom: 4,
  },
  topLocationName: {
    fontSize: 16,
    color: DARK,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
    marginBottom: 16,
  },
  visitCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  visitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  locationInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  locationIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  locationText: {
    flex: 1,
  },
  locationName: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 14,
    color: '#6B7280',
  },
  durationBadge: {
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '700',
    color: BLUE,
  },
  visitDetails: {
    gap: 8,
  },
  visitTime: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  settingsTags: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 13,
    color: DARK,
    fontWeight: '600',
  },
  viewAllButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: BLUE,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  viewAllText: {
    color: BLUE,
    fontWeight: '700',
    fontSize: 16,
  },
});