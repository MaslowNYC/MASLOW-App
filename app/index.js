
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const BLUE = '#2C5F8D';
const CREAM = '#F9F2EC';
const GOLD = '#C5A059';

export default function PassScreen() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) loadProfile(user.id);
    });
  }, []);

  async function loadProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data) setProfile(data);
  }

  const membershipTier = profile?.membership_tier || 'free';
  const tierInfo = getTierInfo(membershipTier);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#2C5F8D', '#2C5F8D', '#1e4264']}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.logo}>MASLOW</Text>
            <Text style={styles.tagline}>Infrastructure of Dignity</Text>
          </View>

          <View style={styles.passCard}>
            <View style={[styles.tierBadge, { backgroundColor: tierInfo.bgColor }]}>
              <Text style={[styles.tierLabel, { color: tierInfo.textColor }]}>
                {tierInfo.label}
              </Text>
              <Text style={[styles.tierSubtitle, { color: tierInfo.textColor, opacity: 0.8 }]}>
                {tierInfo.subtitle}
              </Text>
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {profile?.first_name && profile?.last_name 
                  ? `${profile.first_name} ${profile.last_name}`
                  : profile?.first_name || 'Member'}
              </Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>

            <View style={styles.qrContainer}>
              <View style={styles.qrWrapper}>
                <QRCode
                  value={user?.id || 'no-id'}
                  size={200}
                  backgroundColor="white"
                  color={BLUE}
                />
              </View>
              <Text style={styles.qrLabel}>Scan at any Maslow location</Text>
            </View>

            <Text style={styles.passId}>Pass ID: {user?.id?.slice(0, 8)}</Text>
          </View>

          <Text style={styles.footer}>Questions? Text us at (555) 867-5309</Text>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

function getTierInfo(tier) {
  switch(tier) {
    case 'founding':
      return { label: 'FOUNDING MEMBER', bgColor: GOLD, textColor: '#1A202C', subtitle: 'Unlimited Access' };
    case 'architect':
      return { label: 'THE ARCHITECT', bgColor: '#1A202C', textColor: GOLD, subtitle: 'Lifetime Access' };
    case 'sovereign':
      return { label: 'THE SOVEREIGN', bgColor: GOLD, textColor: '#1A202C', subtitle: 'Lifetime + Guest' };
    default:
      return { label: 'MEMBER', bgColor: BLUE, textColor: CREAM, subtitle: 'Pay Per Session' };
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  logo: {
    fontSize: 42,
    fontWeight: 'bold',
    color: CREAM,
    letterSpacing: 4,
  },
  tagline: {
    fontSize: 12,
    color: CREAM,
    opacity: 0.7,
    marginTop: 4,
    letterSpacing: 2,
  },
  passCard: {
    backgroundColor: CREAM,
    borderRadius: 24,
    padding: 32,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  tierBadge: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  tierLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  tierSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: BLUE,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: BLUE,
    opacity: 0.7,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
  },
  qrLabel: {
    fontSize: 13,
    color: BLUE,
    opacity: 0.8,
    fontWeight: '500',
  },
  passId: {
    fontSize: 11,
    color: BLUE,
    opacity: 0.5,
    fontFamily: 'monospace',
  },
  footer: {
    marginTop: 32,
    fontSize: 13,
    color: CREAM,
    opacity: 0.6,
    textAlign: 'center',
  },
});