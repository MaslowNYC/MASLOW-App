
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

const BLUE = '#2C5F8D';
const CREAM = '#F9F2EC';
const GOLD = '#C5A059';

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const router = useRouter();

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

  async function handleSignOut() {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/(auth)/login');
          }
        }
      ]
    );
  }

  const membershipTier = profile?.membership_tier || 'free';
  const tierInfo = getTierInfo(membershipTier);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>
            {profile?.first_name && profile?.last_name 
              ? `${profile.first_name} ${profile.last_name}`
              : profile?.first_name || 'Member'}
          </Text>
          <Text style={styles.email}>{user?.email}</Text>

          <View style={[styles.tierBadge, { backgroundColor: tierInfo.bgColor }]}>
            <Text style={[styles.tierLabel, { color: tierInfo.textColor }]}>
              {tierInfo.label}
            </Text>
            <Text style={[styles.tierPrice, { color: tierInfo.textColor }]}>
              {tierInfo.price}
            </Text>
          </View>
        </View>

        {profile?.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bioText}>{profile.bio}</Text>
          </View>
        )}

        <TouchableOpacity 
          style={styles.signOutButton} 
          onPress={handleSignOut}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>Maslow NYC • Infrastructure of Dignity</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function getTierInfo(tier) {
  switch(tier) {
    case 'founding':
      return { label: 'Founding Member', bgColor: GOLD, textColor: '#1A202C', price: '$500/year' };
    case 'architect':
      return { label: 'The Architect', bgColor: '#1A202C', textColor: GOLD, price: '$10K Lifetime' };
    case 'sovereign':
      return { label: 'The Sovereign', bgColor: GOLD, textColor: '#1A202C', price: '$25K Lifetime' };
    default:
      return { label: 'Free Pass', bgColor: BLUE, textColor: CREAM, price: 'Free' };
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CREAM,
  },
  content: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: BLUE,
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: BLUE,
    opacity: 0.6,
    marginBottom: 16,
  },
  tierBadge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  tierLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  tierPrice: {
    fontSize: 12,
    opacity: 0.9,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${BLUE}10`,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: BLUE,
    marginBottom: 12,
  },
  bioText: {
    fontSize: 15,
    color: BLUE,
    opacity: 0.8,
    lineHeight: 22,
  },
  signOutButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: BLUE,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  signOutText: {
    color: BLUE,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    color: BLUE,
    opacity: 0.6,
    fontSize: 12,
    marginTop: 32,
    fontStyle: 'italic',
  },
});