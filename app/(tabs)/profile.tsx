import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase, clearAuthState } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from '../../src/theme';
import { MaslowCard } from '../../src/components';
import { useHaptics } from '../../src/hooks/useHaptics';

// Profile data from Supabase
interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  avatar_url: string | null;
  membership_tier: string | null;
  member_number: string | null;
  credits: number;
  created_at: string | null;
}

// Default values when profile doesn't exist
const defaultProfile: UserProfile = {
  id: '',
  first_name: null,
  last_name: null,
  email: '',
  avatar_url: null,
  membership_tier: 'Member',
  member_number: null,
  credits: 0,
  created_at: null,
};

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  showChevron?: boolean;
  danger?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  label,
  onPress,
  showChevron = true,
  danger = false,
}) => {
  const haptics = useHaptics();

  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={() => {
        haptics.light();
        onPress();
      }}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <Ionicons
          name={icon}
          size={20}
          color={danger ? colors.error : colors.navy}
        />
        <Text style={[styles.menuItemLabel, danger && styles.menuItemDanger]}>
          {label}
        </Text>
      </View>
      {showChevron && (
        <Ionicons name="chevron-forward" size={18} color={colors.darkGray} />
      )}
    </TouchableOpacity>
  );
};

export default function AccountScreen() {
  const router = useRouter();
  const haptics = useHaptics();
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch user profile from Supabase
  const fetchProfile = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('Error getting user:', userError?.message);
        setLoading(false);
        return;
      }

      // Fetch profile from profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error.message);
        // Use user email as fallback
        setProfile({
          ...defaultProfile,
          id: user.id,
          email: user.email || '',
        });
      } else if (data) {
        setProfile({
          id: data.id,
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email || user.email || '',
          avatar_url: data.avatar_url,
          membership_tier: data.membership_tier || 'Member',
          member_number: data.member_number,
          credits: data.credits ?? 0,
          created_at: data.created_at,
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch credits balance from Supabase
  const fetchCredits = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return;
      }

      // Query credits table for active, non-expired credits
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('credits')
        .select('amount')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .or(`expires_at.is.null,expires_at.gt.${now}`);

      if (error) {
        console.error('Error fetching credits:', error.message);
        return;
      }

      // Sum up all credit amounts
      const totalCredits = (data || []).reduce((sum, row) => sum + (row.amount || 0), 0);
      setCredits(totalCredits);
    } catch (error) {
      console.error('Failed to fetch credits:', error);
    }
  };

  // Refresh all data
  const onRefresh = async () => {
    setRefreshing(true);
    haptics.light();
    await Promise.all([fetchProfile(), fetchCredits()]);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchProfile();
    fetchCredits();
  }, []);

  // Get display name
  const getDisplayName = (): string => {
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (profile.first_name) {
      return profile.first_name;
    }
    return profile.email.split('@')[0] || 'Member';
  };

  // Get initials for avatar
  const getInitials = (): string => {
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    if (profile.first_name) {
      return profile.first_name.substring(0, 2).toUpperCase();
    }
    return profile.email.substring(0, 2).toUpperCase();
  };

  // Format member since date
  const getMemberSince = (): string => {
    if (!profile.created_at) return '—';
    const date = new Date(profile.created_at);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const handleSignOut = () => {
    haptics.warning();
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
          },
        },
      ]
    );
  };

  const handleNavigate = (screen: string) => {
    haptics.light();
    console.log(`Navigate to: ${screen}`);
    // TODO: Navigate to respective screens
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Account</Text>
          <TouchableOpacity
            onPress={() => handleNavigate('edit-profile')}
            style={styles.editButton}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <MaslowCard style={styles.profileCard} padding="lg">
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.navy} />
            </View>
          ) : (
            <>
              {/* Avatar */}
              {profile.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>{getInitials()}</Text>
                </View>
              )}

              <Text style={styles.userName}>{getDisplayName()}</Text>
              <Text style={styles.userTier}>{profile.membership_tier}</Text>
              {profile.member_number && (
                <Text style={styles.memberNumber}>{profile.member_number}</Text>
              )}
              <Text style={styles.userEmail}>{profile.email}</Text>
            </>
          )}
        </MaslowCard>

        {/* Credit Wallet Card */}
        <View style={styles.walletCard}>
          <View style={styles.walletHeader}>
            <View style={styles.walletIconContainer}>
              <Ionicons name="wallet-outline" size={24} color={colors.gold} />
            </View>
            <View style={styles.walletInfo}>
              <Text style={styles.walletLabel}>Credit Balance</Text>
              <View style={styles.walletBalanceRow}>
                <Text style={styles.walletBalance}>{credits}</Text>
                <Text style={styles.walletCreditsLabel}>credits</Text>
              </View>
              <Text style={styles.walletValue}>= ${credits * 5} value</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.buyCreditsButton}
            onPress={() => {
              haptics.medium();
              router.push('/buy-credits');
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={20} color={colors.navy} />
            <Text style={styles.buyCreditsButtonText}>Buy Credits</Text>
          </TouchableOpacity>
        </View>

        {/* Membership Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Membership</Text>
          <MaslowCard padding="sm">
            <MenuItem
              icon="ribbon-outline"
              label={`Tier: ${profile.membership_tier || 'Member'}`}
              onPress={() => handleNavigate('membership')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="book-outline"
              label="My Bookings"
              onPress={() => router.push('/bookings')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="calendar-outline"
              label={`Member since: ${getMemberSince()}`}
              onPress={() => handleNavigate('membership')}
            />
          </MaslowCard>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <MaslowCard padding="sm">
            <MenuItem
              icon="notifications-outline"
              label="Notifications"
              onPress={() => handleNavigate('notifications')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="card-outline"
              label="Payment Methods"
              onPress={() => handleNavigate('payment')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="shield-outline"
              label="Privacy"
              onPress={() => handleNavigate('privacy')}
            />
          </MaslowCard>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <MaslowCard padding="sm">
            <MenuItem
              icon="help-circle-outline"
              label="Help Center"
              onPress={() => handleNavigate('help')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="chatbubble-outline"
              label="Contact Support"
              onPress={() => handleNavigate('support')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="document-text-outline"
              label="Terms & Privacy"
              onPress={() => handleNavigate('terms')}
            />
          </MaslowCard>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <MaslowCard padding="sm">
            <MenuItem
              icon="log-out-outline"
              label="Sign Out"
              onPress={handleSignOut}
              showChevron={false}
              danger
            />
          </MaslowCard>
        </View>

        {/* Dev Debug Section - only visible in development */}
        {__DEV__ && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Developer</Text>
            <MaslowCard padding="sm">
              <MenuItem
                icon="refresh-outline"
                label="Clear Auth State"
                onPress={async () => {
                  haptics.warning();
                  Alert.alert(
                    'Clear Auth State',
                    'This will clear all auth data and sign you out. Continue?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Clear',
                        style: 'destructive',
                        onPress: async () => {
                          await AsyncStorage.clear();
                          await supabase.auth.signOut();
                          await clearAuthState();
                          console.log('Auth state cleared');
                          router.replace('/(auth)/login');
                        },
                      },
                    ]
                  );
                }}
                showChevron={false}
                danger
              />
            </MaslowCard>
          </View>
        )}

        {/* App Version */}
        <Text style={styles.version}>Maslow v2.1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.navy,
  },
  editButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gold,
  },

  // Profile Card
  profileCard: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  loadingContainer: {
    paddingVertical: spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: spacing.md,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.navy}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.navy,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: spacing.xs,
  },
  userTier: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gold,
    marginBottom: spacing.xs,
  },
  memberNumber: {
    fontSize: 13,
    color: colors.darkGray,
    fontFamily: 'monospace',
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: 14,
    color: colors.darkGray,
  },

  // Credit Wallet Card
  walletCard: {
    backgroundColor: colors.navy,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  walletIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.gold}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  walletInfo: {
    flex: 1,
  },
  walletLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: `${colors.white}80`,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  walletBalanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  walletBalance: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.gold,
  },
  walletCreditsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gold,
  },
  walletValue: {
    fontSize: 13,
    color: `${colors.white}80`,
    marginTop: 2,
  },
  buyCreditsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.gold,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  buyCreditsButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navy,
  },

  // Sections
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.darkGray,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },

  // Menu Items
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemLabel: {
    fontSize: 16,
    color: colors.navy,
    marginLeft: spacing.md,
  },
  menuItemDanger: {
    color: colors.error,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.lightGray,
    marginHorizontal: spacing.md,
  },

  // Version
  version: {
    fontSize: 12,
    color: colors.darkGray,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
