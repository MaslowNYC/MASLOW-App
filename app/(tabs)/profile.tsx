import React, { useState, useEffect, useCallback } from 'react';
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
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { supabase, clearAuthState } from '../../lib/supabase';

// Helper to get avatar URL from filename
const getAvatarUrl = (photoUrl: string | null): string | null => {
  if (!photoUrl) {
    console.log('DEBUG getAvatarUrl: photoUrl is null');
    return null;
  }
  // If it's already a full URL, return as-is
  if (photoUrl.startsWith('http')) {
    console.log('DEBUG getAvatarUrl: Already full URL:', photoUrl);
    return photoUrl;
  }
  // Otherwise construct the full URL from filename
  const { data } = supabase.storage.from('avatars').getPublicUrl(photoUrl);
  console.log('DEBUG getAvatarUrl: Constructed URL:', data.publicUrl);
  // Add cache buster to force reload
  return `${data.publicUrl}?t=${Date.now()}`;
};

// Helper to format membership tier display (never show "Guest")
const formatTierDisplay = (tier: string | null): string => {
  if (!tier) return 'Member';
  const tierLower = tier.toLowerCase();
  if (tierLower === 'founding') return 'Founding Member';
  if (tierLower === 'architect') return 'Architect';
  if (tierLower === 'sovereign') return 'Sovereign';
  // Default to "Member" for any other value including "guest"
  return i18n.t('member');
};
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fonts, shape } from '../../src/theme/colors';
import { spacing } from '../../src/theme';
import { MaslowCard } from '../../src/components';
import { useHaptics } from '../../src/hooks/useHaptics';
import i18n from '../../src/i18n';
import { useLanguage } from '../../src/context/LanguageContext';

// Profile data from Supabase
interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  photo_url: string | null;
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
  photo_url: null,
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
          color={danger ? colors.error : colors.charcoal}
        />
        <Text style={[styles.menuItemLabel, danger && styles.menuItemDanger]}>
          {label}
        </Text>
      </View>
      {showChevron && (
        <Ionicons name="chevron-forward" size={18} color={colors.charcoal30} />
      )}
    </TouchableOpacity>
  );
};

export default function AccountScreen() {
  const router = useRouter();
  const haptics = useHaptics();
  const { language } = useLanguage();
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);

  // Handle adding pass to Apple Wallet
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
      // Force token refresh by calling getUser() - getSession() can return expired tokens
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Please sign in again');
      }

      // Get the refreshed session for the auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please sign in again');
      }

      // Call the edge function to generate the .pkpass file
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-wallet-pass`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate pass');
      }

      // Get the .pkpass file data (React Native compatible - no FileReader)
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const pkpassBase64 = btoa(binary);

      // Save to local file system
      const fileUri = `${FileSystem.cacheDirectory}maslow-pass.pkpass`;
      await FileSystem.writeAsStringAsync(fileUri, pkpassBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // On iOS, open the file to trigger Apple Wallet prompt
      if (Platform.OS === 'ios') {
        const canOpen = await Linking.canOpenURL(fileUri);
        if (canOpen) {
          await Linking.openURL(fileUri);
        } else {
          throw new Error('Unable to open wallet pass');
        }
      }

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
        // Use user email and created_at as fallback
        setProfile({
          ...defaultProfile,
          id: user.id,
          email: user.email || '',
          created_at: user.created_at || null,
        });
      } else if (data) {
        console.log('DEBUG fetchProfile: photo_url from DB:', data.photo_url);
        console.log('DEBUG fetchProfile: created_at from DB:', data.created_at);
        console.log('DEBUG fetchProfile: user.created_at:', user.created_at);
        setProfile({
          id: data.id,
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email || user.email || '',
          photo_url: data.photo_url,
          membership_tier: data.membership_tier || 'Member',
          member_number: data.member_number,
          credits: data.credits ?? 0,
          // Use profile created_at, fallback to auth user created_at
          created_at: data.created_at || user.created_at || null,
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch credits balance from profiles.credits column (same source as Transfer screen)
  const fetchCredits = async () => {
    console.log('PROFILE: fetchCredits() called');
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.log('PROFILE: No user found');
        return;
      }

      // Read from profiles.credits column (current balance)
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching credits:', error.message);
        return;
      }

      const totalCredits = profileData?.credits || 0;
      console.log('PROFILE: Credits fetched =', totalCredits);
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

  // Refresh data when screen comes into focus (e.g., after transferring credits)
  useFocusEffect(
    useCallback(() => {
      console.log('PROFILE: useFocusEffect triggered - refreshing data');
      fetchProfile();
      fetchCredits();
    }, [])
  );

  // Get display name
  const getDisplayName = (): string => {
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (profile.first_name) {
      return profile.first_name;
    }
    return profile.email.split('@')[0] || i18n.t('member');
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
      i18n.t('signOut'),
      i18n.t('signOutConfirm'),
      [
        { text: i18n.t('cancel'), style: 'cancel' },
        {
          text: i18n.t('signOut'),
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            // Navigation handled automatically by _layout.tsx auth listener
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

  // Handle photo upload
  const handlePhotoUpload = async () => {
    haptics.light();
    console.log('=== PHOTO UPLOAD DEBUG START ===');

    // Request permission
    console.log('1. Requesting permissions...');
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    console.log('1. Permission status:', status);
    if (status !== 'granted') {
      Alert.alert(
        'Permission Needed',
        'We need photo library access to upload profile pictures. Please enable it in Settings.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Launch image picker - REQUEST BASE64 for reliable upload
    console.log('2. Launching image picker...');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true, // CRITICAL: Get base64 for reliable Supabase upload
    });
    console.log('2. Image picker result - canceled:', result.canceled, 'has assets:', !!result.assets?.length);

    if (result.canceled || !result.assets?.[0]) {
      console.log('2. User canceled or no image selected');
      return;
    }

    const selectedImage = result.assets[0];
    console.log('3. Selected image details:', {
      uri: selectedImage.uri?.substring(0, 100) + '...',
      width: selectedImage.width,
      height: selectedImage.height,
      mimeType: selectedImage.mimeType,
      fileSize: selectedImage.fileSize,
      hasBase64: !!selectedImage.base64,
      base64Length: selectedImage.base64?.length || 0,
    });

    // Validate we have base64 data
    if (!selectedImage.base64) {
      console.error('3. ERROR: No base64 data from image picker!');
      Alert.alert('Error', 'Could not read image data. Please try again.');
      return;
    }

    setUploadingPhoto(true);

    try {
      console.log('4. Getting current user...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      console.log('4. User ID:', user.id);

      // Convert base64 to ArrayBuffer (works reliably with Supabase)
      console.log('5. Converting base64 to ArrayBuffer...');
      const base64Data = selectedImage.base64;
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const arrayBuffer = bytes.buffer;
      console.log('5. ArrayBuffer created - size:', arrayBuffer.byteLength, 'bytes');

      // Get file extension from mimeType (most reliable) or fallback to URI parsing
      let fileExt = 'jpg'; // default
      if (selectedImage.mimeType) {
        const mimeExt = selectedImage.mimeType.split('/')[1];
        if (mimeExt === 'jpeg') fileExt = 'jpg';
        else if (['png', 'gif', 'webp', 'heic'].includes(mimeExt)) fileExt = mimeExt;
      } else {
        const uriExt = selectedImage.uri.split('.').pop()?.toLowerCase();
        if (uriExt && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(uriExt)) {
          fileExt = uriExt === 'jpeg' ? 'jpg' : uriExt;
        }
      }
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const contentType = selectedImage.mimeType || `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;
      console.log('6. File details:', { fileName, fileExt, contentType, arrayBufferSize: arrayBuffer.byteLength });

      // Delete old photo if exists
      if (profile.photo_url) {
        console.log('7. Deleting old photo:', profile.photo_url);
        try {
          const { error: deleteError } = await supabase.storage.from('avatars').remove([profile.photo_url]);
          console.log('7. Delete result - error:', deleteError);
        } catch (deleteError) {
          console.warn('7. Could not delete old avatar:', deleteError);
        }
      }

      // Upload to Supabase Storage using ArrayBuffer (reliable for React Native)
      console.log('8. Starting Supabase storage upload...');
      console.log('8. Bucket: avatars, fileName:', fileName, 'size:', bytes.length);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, bytes, {
          contentType,
          upsert: false,
        });
      console.log('8. Upload complete!');
      console.log('8. Upload data:', JSON.stringify(uploadData, null, 2));
      console.log('8. Upload error:', JSON.stringify(uploadError, null, 2));

      if (uploadError) {
        console.error('8. UPLOAD FAILED:', uploadError.message);
        throw uploadError;
      }

      console.log('9. Upload SUCCESS! Updating database...');

      // Update profile with just the filename (matches website)
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({ photo_url: fileName })
        .eq('id', user.id)
        .select();
      console.log('9. Database update - data:', updateData, 'error:', updateError);

      if (updateError) throw updateError;

      // Verify the file exists in storage
      console.log('10. Verifying file exists in storage...');
      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      console.log('10. Public URL:', publicUrlData.publicUrl);

      // Update local state with filename
      setProfile(prev => ({ ...prev, photo_url: fileName }));
      haptics.success();
      console.log('=== PHOTO UPLOAD DEBUG END - SUCCESS ===');
      Alert.alert('Success', 'Profile photo updated!');
    } catch (error: any) {
      console.error('=== PHOTO UPLOAD DEBUG END - FAILED ===');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Full error:', JSON.stringify(error, null, 2));
      haptics.error();
      Alert.alert('Upload Failed', error.message || 'Could not upload photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
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
            tintColor={colors.gold}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{i18n.t('account')}</Text>
        </View>

        {/* Profile Card */}
        <MaslowCard style={styles.profileCard} padding="lg">
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.gold} />
            </View>
          ) : (
            <>
              {/* Avatar - Touchable for upload */}
              <TouchableOpacity
                onPress={handlePhotoUpload}
                activeOpacity={0.7}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <View style={styles.avatarPlaceholder}>
                    <ActivityIndicator size="small" color={colors.gold} />
                  </View>
                ) : profile.photo_url ? (
                  <Image
                    source={{ uri: getAvatarUrl(profile.photo_url) || '' }}
                    style={styles.avatar}
                    onError={(e) => console.log('IMAGE LOAD ERROR:', e.nativeEvent.error)}
                    onLoad={() => console.log('IMAGE LOADED SUCCESSFULLY')}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitials}>{getInitials()}</Text>
                  </View>
                )}
                <View style={styles.avatarEditBadge}>
                  <Ionicons name="camera" size={12} color={colors.white} />
                </View>
              </TouchableOpacity>

              <Text style={styles.userName}>{getDisplayName()}</Text>
              <Text style={styles.userEmail}>{profile.email}</Text>
              {profile.member_number && (
                <Text style={styles.memberNumber}>Member #{profile.member_number}</Text>
              )}
              <Text style={styles.memberSince}>{i18n.t('memberSince')} {getMemberSince()}</Text>
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
              <Text style={styles.walletLabel}>{i18n.t('creditBalance')}</Text>
              <View style={styles.walletBalanceRow}>
                <Text style={styles.walletBalance}>{credits}</Text>
                <Text style={styles.walletCreditsLabel}>{i18n.t('credits')}</Text>
              </View>
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
            <Ionicons name="add-circle" size={20} color={colors.charcoal} />
            <Text style={styles.buyCreditsButtonText}>{i18n.t('buyCredits')}</Text>
          </TouchableOpacity>
        </View>

        {/* Membership Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('membership')}</Text>
          <MaslowCard padding="sm">
            <MenuItem
              icon="person-outline"
              label={i18n.t('editProfile')}
              onPress={() => router.push('/edit-profile')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="ribbon-outline"
              label={`Tier: ${formatTierDisplay(profile.membership_tier)}`}
              onPress={() => handleNavigate('membership')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="book-outline"
              label={i18n.t('myBookings')}
              onPress={() => router.push('/bookings')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="calendar-outline"
              label={i18n.t('myEvents')}
              onPress={() => router.push('/(tabs)/events?filter=my-events')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="gift-outline"
              label={i18n.t('transferCredits')}
              onPress={() => router.push('/transfer-credits')}
            />
            {Platform.OS === 'ios' && (
              <>
                <View style={styles.menuDivider} />
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleAddToWallet}
                  activeOpacity={0.7}
                  disabled={walletLoading}
                >
                  <View style={styles.menuItemLeft}>
                    {walletLoading ? (
                      <ActivityIndicator size="small" color={colors.gold} />
                    ) : (
                      <Ionicons name="wallet-outline" size={20} color={colors.charcoal} />
                    )}
                    <Text style={styles.menuItemLabel}>
                      {walletLoading ? 'Generating Pass...' : 'Add to Apple Wallet'}
                    </Text>
                  </View>
                  {!walletLoading && (
                    <Ionicons name="chevron-forward" size={18} color={colors.charcoal30} />
                  )}
                </TouchableOpacity>
              </>
            )}
          </MaslowCard>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <MaslowCard padding="sm">
            <MenuItem
              icon="log-out-outline"
              label={i18n.t('signOut')}
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

        {/* Settings Link */}
        <TouchableOpacity
          onPress={() => router.push('/settings')}
          style={styles.settingsLinkContainer}
        >
          <Text style={styles.settingsLink}>⚙️ {i18n.t('settings')}</Text>
        </TouchableOpacity>

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
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  header: {
    paddingVertical: spacing.sm,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: fonts.serifLight,
    color: colors.charcoal,
  },

  // Profile Card
  profileCard: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  loadingContainer: {
    paddingVertical: spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: spacing.sm,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.charcoal15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarInitials: {
    fontSize: 28,
    fontFamily: fonts.serifLight,
    color: colors.charcoal,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  userName: {
    fontSize: 22,
    fontFamily: fonts.serifLight,
    color: colors.charcoal,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: 14,
    fontFamily: fonts.sansRegular,
    color: colors.charcoal50,
    marginBottom: spacing.xs,
  },
  memberNumber: {
    fontSize: 13,
    fontFamily: fonts.sansRegular,
    color: colors.charcoal30,
    marginBottom: spacing.xs,
  },
  memberSince: {
    fontSize: 13,
    fontFamily: fonts.sansRegular,
    color: colors.charcoal30,
  },

  // Credit Wallet Card
  walletCard: {
    backgroundColor: colors.charcoal,
    borderRadius: shape.borderRadius,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  walletIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.gold}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  walletInfo: {
    flex: 1,
  },
  walletLabel: {
    fontSize: 11,
    fontFamily: fonts.sansSemiBold,
    color: colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  walletBalanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  walletBalance: {
    fontSize: 32,
    fontFamily: fonts.serifLight,
    color: colors.cream,
  },
  walletCreditsLabel: {
    fontSize: 16,
    fontFamily: fonts.sansSemiBold,
    color: colors.cream,
  },
  buyCreditsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.cream,
    paddingVertical: 12,
    borderRadius: shape.borderRadius,
  },
  buyCreditsButtonText: {
    fontSize: 14,
    fontFamily: fonts.sansSemiBold,
    color: colors.charcoal,
    letterSpacing: 1,
  },

  // Sections
  section: {
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: fonts.sansSemiBold,
    color: colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },

  // Menu Items
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemLabel: {
    fontSize: 16,
    fontFamily: fonts.sansRegular,
    color: colors.charcoal,
    marginLeft: spacing.md,
  },
  menuItemDanger: {
    color: colors.error,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.charcoal10,
    marginHorizontal: spacing.md,
  },

  // Settings Link
  settingsLinkContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: spacing.sm,
  },
  settingsLink: {
    fontSize: 14,
    fontFamily: fonts.sansRegular,
    color: colors.charcoal50,
  },

  // Version
  version: {
    fontSize: 12,
    fontFamily: fonts.sansRegular,
    color: colors.charcoal30,
    textAlign: 'center',
    marginTop: 4,
  },
});
