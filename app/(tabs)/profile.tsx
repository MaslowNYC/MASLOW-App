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
import * as ImagePicker from 'expo-image-picker';
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
  return 'Member';
};
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
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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
              {/* Avatar - Touchable for upload */}
              <TouchableOpacity
                onPress={handlePhotoUpload}
                activeOpacity={0.7}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <View style={styles.avatarPlaceholder}>
                    <ActivityIndicator size="small" color={colors.navy} />
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
              <Text style={styles.memberSince}>Member since {getMemberSince()}</Text>
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
              icon="person-outline"
              label="Edit Profile"
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
              label="My Bookings"
              onPress={() => router.push('/bookings')}
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

        {/* Settings Link */}
        <TouchableOpacity
          onPress={() => router.push('/settings')}
          style={styles.settingsLinkContainer}
        >
          <Text style={styles.settingsLink}>⚙️ Settings</Text>
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
    paddingHorizontal: spacing.md, // 16px (was 24px)
    paddingBottom: 24, // was 32px
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm, // 8px (was 16px)
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
    marginBottom: spacing.sm, // 8px (was 24px) - tighter spacing between cards
  },
  loadingContainer: {
    paddingVertical: spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: spacing.sm, // 8px (was 16px)
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.navy}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm, // 8px (was 16px)
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.navy,
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
    fontWeight: '700',
    color: colors.navy,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: spacing.xs,
  },
  memberNumber: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: spacing.xs,
  },
  memberSince: {
    fontSize: 13,
    color: '#6B7280',
  },

  // Credit Wallet Card
  walletCard: {
    backgroundColor: colors.navy,
    borderRadius: 16,
    padding: spacing.md, // 16px (was 24px)
    marginBottom: spacing.sm, // 8px (was 24px) - tighter spacing between cards
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm, // 8px (was 16px)
  },
  walletIconContainer: {
    width: 44, // slightly smaller (was 48)
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.gold}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm, // 8px (was 16px)
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
    fontSize: 32, // 32px (was 36px) - slightly more compact
    fontWeight: '700',
    color: colors.gold,
  },
  walletCreditsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gold,
  },
  buyCreditsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.gold,
    paddingVertical: 10, // 10px (was 16px) - more compact button
    borderRadius: 12,
  },
  buyCreditsButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navy,
  },

  // Sections
  section: {
    marginBottom: spacing.sm, // 8px (was 24px) - tighter spacing between sections
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.darkGray,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs, // 4px (was 8px)
    marginLeft: spacing.xs,
  },

  // Menu Items
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm, // 8px (was 16px) - tighter menu items
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

  // Settings Link
  settingsLinkContainer: {
    alignItems: 'center',
    paddingVertical: 12, // specific 12px (was 16px)
    marginTop: spacing.sm, // 8px gap before settings
  },
  settingsLink: {
    fontSize: 14,
    color: '#6B7280',
  },

  // Version
  version: {
    fontSize: 12,
    color: colors.darkGray,
    textAlign: 'center',
    marginTop: 4, // minimal gap (was 4px)
  },
});
