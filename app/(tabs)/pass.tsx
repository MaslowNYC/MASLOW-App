import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing } from '../../src/theme';
import { supabase } from '../../lib/supabase';
import { useHaptics } from '../../src/hooks/useHaptics';
//import { syncToWatch } from '../../src/utils/watchSync';

// Helper to format membership tier display
const formatTierDisplay = (tier: string | null): string => {
  if (!tier) return 'Member';
  const tierLower = tier.toLowerCase();
  if (tierLower === 'founding') return 'Founding Member';
  if (tierLower === 'architect') return 'Architect';
  if (tierLower === 'sovereign') return 'Sovereign';
  return 'Member';
};

interface MemberData {
  name: string;
  firstName: string;
  lastName: string;
  tier: string;
  memberNumber: string;
  memberNumberRaw: number;
  credits: number;
}

export default function PassScreen() {
  const haptics = useHaptics();
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  const fetchMemberData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, membership_tier, member_number, credits')
        .eq('id', user.id)
        .single();

      // Format member number
      const memberNumberRaw = profile?.member_number || 0;
      const memberNum = memberNumberRaw
        ? `#${String(memberNumberRaw).padStart(5, '0')}`
        : '#00000';

      // Format name
      const firstName = profile?.first_name || '';
      const lastName = profile?.last_name || '';
      const name = firstName && lastName
        ? `${firstName} ${lastName}`
        : firstName || user.email?.split('@')[0] || 'Member';

      // Format tier
      const tier = formatTierDisplay(profile?.membership_tier);

      setMemberData({
        name,
        firstName,
        lastName,
        tier,
        memberNumber: memberNum,
        memberNumberRaw,
        credits: profile?.credits || 0,
      });
    } catch (error) {
      console.error('Error fetching member data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  
  useEffect(() => {
    fetchMemberData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchMemberData();
    }, [])
  );

  // Sync to Apple Watch when member data changes
  //useEffect(() => {
  //  if (memberData && Platform.OS === 'ios') {
  //    const watchData = {
  //      credits: memberData.credits,
  //      memberNumber: memberData.memberNumberRaw,
  //      qrUrl: `https://maslownyc.com/member/${String(memberData.memberNumberRaw).padStart(5, '0')}`,
  //      firstName: memberData.firstName,
  //      lastName: memberData.lastName,
  //    };
  //    syncToWatch(watchData);
  //  }
  //}, [memberData?.credits, memberData?.memberNumberRaw]);

  const handleAddToWallet = () => {
    haptics.medium();
    Alert.alert(
      'Coming Soon',
      Platform.OS === 'ios'
        ? 'Apple Wallet integration will be available soon.'
        : 'Google Wallet integration will be available soon.',
      [{ text: 'OK' }]
    );
  };

  if (dataLoading) {
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Member Pass</Text>
        </View>

        {/* QR Code */}
        <View style={styles.qrSection}>
          <View style={styles.qrContainer}>
            <Image
              source={require('../../assets/qr-code.png')}
              style={styles.qrImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Scan Instructions */}
        <View style={styles.instructionsSection}>
          <Ionicons name="scan-outline" size={18} color={colors.darkGray} />
          <Text style={styles.instructionsText}>
            Scan at any Maslow suite door
          </Text>
        </View>

        {/* Member Info Row */}
        <View style={styles.infoRow}>
          {/* Name & Tier */}
          <View style={styles.infoCard}>
            <Text style={styles.userName}>{memberData?.name || 'Member'}</Text>
            <View style={styles.tierRow}>
              <Ionicons name="ribbon" size={12} color={colors.gold} />
              <Text style={styles.tierText}>{memberData?.tier}</Text>
            </View>
          </View>

          {/* Credits */}
          <View style={styles.creditsCard}>
            <Text style={styles.creditsValue}>{memberData?.credits || 0}</Text>
            <Text style={styles.creditsLabel}>Credits</Text>
          </View>
        </View>

        {/* Wallet Buttons Row */}
        <View style={styles.walletRow}>
          <TouchableOpacity
            style={styles.walletButton}
            onPress={handleAddToWallet}
            activeOpacity={0.8}
          >
            <Image
              source={require('../../assets/add-to-apple-wallet-logo.png')}
              style={styles.walletBadge}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.walletButton}
            onPress={handleAddToWallet}
            activeOpacity={0.8}
          >
            <Image
              source={require('../../assets/Add_to_Google_Wallet_badge.svg.png')}
              style={styles.walletBadge}
              resizeMode="contain"
            />
          </TouchableOpacity>
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
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },

  // Header
  header: {
    width: '100%',
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.navy,
  },

  // QR Code
  qrSection: {
    marginBottom: spacing.md,
  },
  qrContainer: {
    padding: 12,
    backgroundColor: colors.cream,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  qrImage: {
    width: 240,
    height: 240,
  },

  // Instructions
  instructionsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: spacing.lg,
  },
  instructionsText: {
    fontSize: 13,
    color: colors.darkGray,
  },

  // Info Row - Name/Tier + Credits
  infoRow: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  infoCard: {
    flex: 2,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: 4,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tierText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gold,
  },
  creditsCard: {
    flex: 1,
    backgroundColor: colors.navy,
    borderRadius: 12,
    padding: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  creditsValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gold,
  },
  creditsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.white,
    opacity: 0.8,
  },

  // Wallet Buttons Row
  walletRow: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.sm,
  },
  walletButton: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  walletBadge: {
    width: '90%',
    height: 40,
  },
});
