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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors, fonts, shape } from '../../src/theme/colors';
import { spacing } from '../../src/theme';
import { supabase } from '../../lib/supabase';
import { useHaptics } from '../../src/hooks/useHaptics';
import i18n from '../../src/i18n';
import { useLanguage } from '../../src/context/LanguageContext';

// Helper to format membership tier display
const formatTierDisplay = (tier: string | null): string => {
  if (!tier) return i18n.t('member');
  const tierLower = tier.toLowerCase();
  if (tierLower === 'founding') return 'Founding Member';
  if (tierLower === 'architect') return 'Architect';
  if (tierLower === 'sovereign') return 'Sovereign';
  return i18n.t('member');
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
  const { language } = useLanguage();
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
        : firstName || user.email?.split('@')[0] || i18n.t('member');

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

  const [walletLoading, setWalletLoading] = useState(false);

  const handleAddToWallet = async () => {
    haptics.medium();

    // Google Wallet not yet supported
    if (Platform.OS === 'android') {
      Alert.alert(
        i18n.t('comingSoon'),
        i18n.t('walletComingSoonAndroid'),
        [{ text: i18n.t('ok') }]
      );
      return;
    }

    setWalletLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not logged in');

      const passUrl = `https://hrfmphkjeqcwhsfvzfvw.supabase.co/functions/v1/generate-wallet-pass`;

      await Linking.openURL(
        `${passUrl}?token=${session.access_token}`
      );

      haptics.success();
    } catch (error) {
      console.error('Error adding to wallet:', error);
      haptics.error();
      Alert.alert(
        'Unable to Add Pass',
        error instanceof Error ? error.message : 'Please try again later.',
        [{ text: i18n.t('ok') }]
      );
    } finally {
      setWalletLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.gold} />
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
        {/* Logo - centered, small */}
        <View style={styles.logoSection}>
          <Image
            source={require('../../assets/splash-icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* QR Code - generous white space, no border */}
        <View style={styles.qrSection}>
          <Image
            source={require('../../assets/qr-code.png')}
            style={styles.qrImage}
            resizeMode="contain"
          />
        </View>

        {/* Session Info */}
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionType}>{memberData?.tier || 'MEMBER'}</Text>
          <Text style={styles.scanLabel}>SCAN TO ENTER</Text>
        </View>

        {/* Credits Badge */}
        <View style={styles.creditsBadge}>
          <Text style={styles.creditsValue}>{memberData?.credits || 0}</Text>
          <Text style={styles.creditsLabel}>PASSES</Text>
        </View>

        {/* Member Number - bottom, subtle */}
        <Text style={styles.memberNumber}>{memberData?.memberNumber}</Text>

        {/* Wallet Buttons */}
        <View style={styles.walletRow}>
          <TouchableOpacity
            style={[styles.walletButton, walletLoading && styles.walletButtonDisabled]}
            onPress={handleAddToWallet}
            activeOpacity={0.8}
            disabled={walletLoading}
          >
            {walletLoading && Platform.OS === 'ios' ? (
              <ActivityIndicator size="small" color={colors.charcoal} />
            ) : (
              <Image
                source={require('../../assets/add-to-apple-wallet-logo.png')}
                style={styles.walletBadge}
                resizeMode="contain"
              />
            )}
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
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },

  // Logo
  logoSection: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  logoImage: {
    width: 48,
    height: 48,
  },

  // QR Code - clean, generous white space
  qrSection: {
    marginBottom: spacing.lg,
  },
  qrImage: {
    width: 220,
    height: 220,
  },

  // Session Info
  sessionInfo: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  sessionType: {
    fontSize: 14,
    fontFamily: fonts.sansSemiBold,
    color: colors.charcoal,
    letterSpacing: 2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  scanLabel: {
    fontSize: 11,
    fontFamily: fonts.sansSemiBold,
    color: colors.gold,
    letterSpacing: 3,
  },

  // Credits Badge
  creditsBadge: {
    backgroundColor: colors.charcoal,
    borderRadius: shape.borderRadius,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  creditsValue: {
    fontSize: 32,
    fontFamily: fonts.serifLight,
    color: colors.cream,
  },
  creditsLabel: {
    fontSize: 10,
    fontFamily: fonts.sansSemiBold,
    color: colors.gold,
    letterSpacing: 2,
    marginTop: 4,
  },

  // Member Number
  memberNumber: {
    fontSize: 12,
    fontFamily: fonts.sansRegular,
    color: colors.charcoal30,
    marginBottom: spacing.xl,
  },

  // Wallet Buttons
  walletRow: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.sm,
    marginTop: 'auto',
  },
  walletButton: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: shape.borderRadius,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.charcoal10,
    minHeight: 56,
  },
  walletButtonDisabled: {
    opacity: 0.6,
  },
  walletBadge: {
    width: '90%',
    height: 40,
  },
});
