import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { colors, spacing } from '../src/theme';
import { useHaptics } from '../src/hooks/useHaptics';

// Preference options matching website
const USAGE_OPTIONS = [
  { id: 'prayer', label: 'Meditation / Prayer', icon: '🙏' },
  { id: 'pumping', label: 'Nursing / Pumping', icon: '🍼' },
  { id: 'interview', label: 'Interview Prep', icon: '👔' },
  { id: 'decompress', label: 'Sensory Decompression', icon: '🧠' },
  { id: 'change', label: 'Outfit Change', icon: '👕' },
];

const AMENITY_OPTIONS = [
  { id: 'heated_seat', label: 'Heated Seat' },
  { id: 'dim_lights', label: 'Dimmed Lighting' },
  { id: 'white_noise', label: 'White Noise / Music' },
  { id: 'hair_dryer', label: 'Hair Dryer Access' },
  { id: 'steamer', label: 'Garment Steamer' },
];

const PRODUCT_OPTIONS = [
  { id: 'ursa_major', label: 'Ursa Major Face Wash' },
  { id: 'spf', label: 'SPF Lotion' },
  { id: 'mouthwash', label: 'Mouthwash' },
  { id: 'feminine_care', label: 'Organic Feminine Care' },
];

interface SuitePreferences {
  temperature: number;
  lighting: 'bright' | 'medium' | 'dim';
  heated_seat: boolean;
  bidet_temp: 'cool' | 'warm' | 'hot';
  music: 'none' | 'spa' | 'nature' | 'classical';
}

interface ProfileData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  dob: string;
  bio: string;
  photo_url: string | null;
  member_number: string | null;
  membership_tier: string | null;
  // Preferences
  default_preferences: SuitePreferences;
  preferences_amenities: string[];
  preferences_products: string[];
  preferences_usage: string[];
}

const defaultSuitePreferences: SuitePreferences = {
  temperature: 72,
  lighting: 'medium',
  heated_seat: true,
  bidet_temp: 'warm',
  music: 'spa',
};

const defaultProfile: ProfileData = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  dob: '',
  bio: '',
  photo_url: null,
  member_number: null,
  membership_tier: null,
  default_preferences: defaultSuitePreferences,
  preferences_amenities: [],
  preferences_products: [],
  preferences_usage: [],
};

// Helper to get avatar URL from filename
const getAvatarUrl = (photoUrl: string | null): string | null => {
  if (!photoUrl) return null;
  if (photoUrl.startsWith('http')) return photoUrl;
  const { data } = supabase.storage.from('avatars').getPublicUrl(photoUrl);
  return `${data.publicUrl}?t=${Date.now()}`;
};

// Format phone number as user types
const formatPhoneNumber = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
  return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
};

// Checkbox component
const Checkbox: React.FC<{
  checked: boolean;
  onToggle: () => void;
  label: string;
  icon?: string;
}> = ({ checked, onToggle, label, icon }) => (
  <TouchableOpacity style={styles.checkboxRow} onPress={onToggle} activeOpacity={0.7}>
    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
      {checked && <Ionicons name="checkmark" size={16} color={colors.white} />}
    </View>
    <Text style={styles.checkboxLabel}>
      {icon && `${icon} `}{label}
    </Text>
  </TouchableOpacity>
);

// Radio button component
const RadioButton: React.FC<{
  selected: boolean;
  onSelect: () => void;
  label: string;
}> = ({ selected, onSelect, label }) => (
  <TouchableOpacity style={styles.radioRow} onPress={onSelect} activeOpacity={0.7}>
    <View style={[styles.radio, selected && styles.radioSelected]}>
      {selected && <View style={styles.radioInner} />}
    </View>
    <Text style={styles.radioLabel}>{label}</Text>
  </TouchableOpacity>
);

// Accordion section header component
const SectionHeader: React.FC<{
  title: string;
  subtitle?: string;
  expanded: boolean;
  onToggle: () => void;
}> = ({ title, subtitle, expanded, onToggle }) => (
  <TouchableOpacity
    style={styles.sectionHeader}
    onPress={onToggle}
    activeOpacity={0.7}
  >
    <View style={styles.sectionHeaderLeft}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    </View>
    <Ionicons
      name={expanded ? 'chevron-up' : 'chevron-down'}
      size={20}
      color={colors.navy}
    />
  </TouchableOpacity>
);

export default function EditProfileScreen() {
  const router = useRouter();
  const haptics = useHaptics();
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [originalProfile, setOriginalProfile] = useState<ProfileData>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Accordion state - Personal Info expanded by default
  const [expandedSections, setExpandedSections] = useState({
    personalInfo: true,
    suitePreferences: false,
    amenities: false,
    products: false,
    usage: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    haptics.light();
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Load profile data
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert('Error', 'Not authenticated');
        router.back();
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error.message);
      }

      const profileData: ProfileData = {
        first_name: data?.first_name || '',
        last_name: data?.last_name || '',
        email: data?.email || user.email || '',
        phone: data?.phone || '',
        dob: data?.dob || '',
        bio: data?.bio || '',
        photo_url: data?.photo_url || null,
        member_number: data?.member_number || null,
        membership_tier: data?.membership_tier || null,
        default_preferences: data?.default_preferences || defaultSuitePreferences,
        preferences_amenities: data?.preferences_amenities || [],
        preferences_products: data?.preferences_products || [],
        preferences_usage: data?.preferences_usage || [],
      };

      setProfile(profileData);
      setOriginalProfile(profileData);
    } catch (error) {
      console.error('Failed to load profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // Toggle array preference
  const toggleArrayPreference = (
    field: 'preferences_amenities' | 'preferences_products' | 'preferences_usage',
    id: string
  ) => {
    haptics.light();
    setProfile(prev => {
      const current = prev[field] || [];
      const newArray = current.includes(id)
        ? current.filter(item => item !== id)
        : [...current, id];
      return { ...prev, [field]: newArray };
    });
  };

  // Update suite preference
  const updateSuitePreference = <K extends keyof SuitePreferences>(
    key: K,
    value: SuitePreferences[K]
  ) => {
    haptics.light();
    setProfile(prev => ({
      ...prev,
      default_preferences: {
        ...prev.default_preferences,
        [key]: value,
      },
    }));
  };

  // Handle photo upload
  const handlePhotoUpload = async () => {
    haptics.light();

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'We need photo library access to upload profile pictures.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (result.canceled || !result.assets?.[0] || !result.assets[0].base64) {
      return;
    }

    const selectedImage = result.assets[0];
    setUploadingPhoto(true);

    try {
      if (!userId) throw new Error('Not authenticated');

      const base64Data = selectedImage.base64;
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      let fileExt = 'jpg';
      if (selectedImage.mimeType) {
        const mimeExt = selectedImage.mimeType.split('/')[1];
        if (mimeExt === 'jpeg') fileExt = 'jpg';
        else if (['png', 'gif', 'webp', 'heic'].includes(mimeExt)) fileExt = mimeExt;
      }

      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const contentType = selectedImage.mimeType || `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;

      if (profile.photo_url) {
        try {
          await supabase.storage.from('avatars').remove([profile.photo_url]);
        } catch (e) {
          console.warn('Could not delete old avatar');
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, bytes, { contentType, upsert: false });

      if (uploadError) throw uploadError;

      setProfile(prev => ({ ...prev, photo_url: fileName }));
      haptics.success();
    } catch (error: any) {
      console.error('Photo upload error:', error);
      haptics.error();
      Alert.alert('Upload Failed', error.message || 'Could not upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Save profile changes
  const handleSave = async () => {
    haptics.medium();
    setSaving(true);

    try {
      if (!userId) throw new Error('Not authenticated');

      if (!profile.first_name.trim()) {
        Alert.alert('Required', 'Please enter your first name');
        setSaving(false);
        return;
      }

      const updates = {
        first_name: profile.first_name.trim(),
        last_name: profile.last_name.trim(),
        phone: profile.phone.replace(/\D/g, ''),
        dob: profile.dob === '' ? null : profile.dob,
        bio: profile.bio.trim(),
        photo_url: profile.photo_url,
        default_preferences: profile.default_preferences,
        preferences_amenities: profile.preferences_amenities,
        preferences_products: profile.preferences_products,
        preferences_usage: profile.preferences_usage,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;

      haptics.success();
      Alert.alert('Success', 'Profile updated!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Save error:', error);
      haptics.error();
      Alert.alert('Error', error.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    haptics.light();
    const hasChanges = JSON.stringify(profile) !== JSON.stringify(originalProfile);
    if (hasChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  const getInitials = (): string => {
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    if (profile.first_name) {
      return profile.first_name.substring(0, 2).toUpperCase();
    }
    return profile.email.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.navy} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={24} color={colors.navy} />
          <Text style={styles.headerButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Photo */}
          <View style={styles.photoSection}>
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
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>{getInitials()}</Text>
                </View>
              )}
              <View style={styles.avatarEditBadge}>
                <Ionicons name="camera" size={14} color={colors.white} />
              </View>
            </TouchableOpacity>
            <Text style={styles.photoHint}>Tap to change photo</Text>
          </View>

          {/* PERSONAL INFO */}
          <View style={styles.section}>
            <SectionHeader
              title="PERSONAL INFO"
              expanded={expandedSections.personalInfo}
              onToggle={() => toggleSection('personalInfo')}
            />
            {expandedSections.personalInfo && (
            <View style={styles.sectionContent}>
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                value={profile.first_name}
                onChangeText={(text) => setProfile(prev => ({ ...prev, first_name: text }))}
                placeholder="Enter first name"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={profile.last_name}
                onChangeText={(text) => setProfile(prev => ({ ...prev, last_name: text }))}
                placeholder="Enter last name"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.readOnlyField}>
                <Text style={styles.readOnlyText}>{profile.email}</Text>
                <Ionicons name="lock-closed" size={16} color="#9CA3AF" />
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={formatPhoneNumber(profile.phone)}
                onChangeText={(text) => setProfile(prev => ({ ...prev, phone: text.replace(/\D/g, '').slice(0, 10) }))}
                placeholder="(555) 123-4567"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Date of Birth</Text>
              <TextInput
                style={styles.input}
                value={profile.dob}
                onChangeText={(text) => setProfile(prev => ({ ...prev, dob: text }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={profile.bio}
                onChangeText={(text) => setProfile(prev => ({ ...prev, bio: text.slice(0, 200) }))}
                placeholder="Tell us about yourself..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                maxLength={200}
              />
              <Text style={styles.fieldHint}>{profile.bio.length}/200 characters</Text>
            </View>
            </View>
            )}
          </View>

          {/* SUITE PREFERENCES */}
          <View style={styles.section}>
            <SectionHeader
              title="SUITE PREFERENCES"
              subtitle="Your default settings when you book a suite"
              expanded={expandedSections.suitePreferences}
              onToggle={() => toggleSection('suitePreferences')}
            />
            {expandedSections.suitePreferences && (
            <View style={styles.sectionContent}>
            {/* Temperature */}
            <View style={styles.preferenceContainer}>
              <Text style={styles.preferenceLabel}>Temperature</Text>
              <View style={styles.sliderContainer}>
                <Slider
                  style={styles.slider}
                  minimumValue={68}
                  maximumValue={76}
                  step={1}
                  value={profile.default_preferences.temperature}
                  onValueChange={(value) => updateSuitePreference('temperature', value)}
                  minimumTrackTintColor={colors.navy}
                  maximumTrackTintColor={colors.lightGray}
                  thumbTintColor={colors.navy}
                />
                <Text style={styles.sliderValue}>{profile.default_preferences.temperature}°F</Text>
              </View>
            </View>

            {/* Lighting */}
            <View style={styles.preferenceContainer}>
              <Text style={styles.preferenceLabel}>Lighting</Text>
              <View style={styles.radioGroup}>
                <RadioButton
                  selected={profile.default_preferences.lighting === 'bright'}
                  onSelect={() => updateSuitePreference('lighting', 'bright')}
                  label="Bright"
                />
                <RadioButton
                  selected={profile.default_preferences.lighting === 'medium'}
                  onSelect={() => updateSuitePreference('lighting', 'medium')}
                  label="Medium"
                />
                <RadioButton
                  selected={profile.default_preferences.lighting === 'dim'}
                  onSelect={() => updateSuitePreference('lighting', 'dim')}
                  label="Dim"
                />
              </View>
            </View>

            {/* Heated Seat */}
            <View style={styles.preferenceContainer}>
              <Text style={styles.preferenceLabel}>Heated Seat</Text>
              <View style={styles.switchContainer}>
                <Switch
                  value={profile.default_preferences.heated_seat}
                  onValueChange={(value) => updateSuitePreference('heated_seat', value)}
                  trackColor={{ false: colors.lightGray, true: colors.navy }}
                  thumbColor={colors.white}
                />
                <Text style={styles.switchLabel}>
                  {profile.default_preferences.heated_seat ? 'On' : 'Off'}
                </Text>
              </View>
            </View>

            {/* Bidet Temperature */}
            <View style={styles.preferenceContainer}>
              <Text style={styles.preferenceLabel}>Bidet Temperature</Text>
              <View style={styles.radioGroup}>
                <RadioButton
                  selected={profile.default_preferences.bidet_temp === 'cool'}
                  onSelect={() => updateSuitePreference('bidet_temp', 'cool')}
                  label="Cool"
                />
                <RadioButton
                  selected={profile.default_preferences.bidet_temp === 'warm'}
                  onSelect={() => updateSuitePreference('bidet_temp', 'warm')}
                  label="Warm"
                />
                <RadioButton
                  selected={profile.default_preferences.bidet_temp === 'hot'}
                  onSelect={() => updateSuitePreference('bidet_temp', 'hot')}
                  label="Hot"
                />
              </View>
            </View>

            {/* Music */}
            <View style={styles.preferenceContainer}>
              <Text style={styles.preferenceLabel}>Music / Audio</Text>
              <View style={styles.radioGroup}>
                <RadioButton
                  selected={profile.default_preferences.music === 'none'}
                  onSelect={() => updateSuitePreference('music', 'none')}
                  label="None"
                />
                <RadioButton
                  selected={profile.default_preferences.music === 'spa'}
                  onSelect={() => updateSuitePreference('music', 'spa')}
                  label="Spa"
                />
                <RadioButton
                  selected={profile.default_preferences.music === 'nature'}
                  onSelect={() => updateSuitePreference('music', 'nature')}
                  label="Nature"
                />
                <RadioButton
                  selected={profile.default_preferences.music === 'classical'}
                  onSelect={() => updateSuitePreference('music', 'classical')}
                  label="Classical"
                />
              </View>
            </View>
            </View>
            )}
          </View>

          {/* AMENITIES */}
          <View style={styles.section}>
            <SectionHeader
              title="AMENITIES"
              subtitle="What you like to have available"
              expanded={expandedSections.amenities}
              onToggle={() => toggleSection('amenities')}
            />
            {expandedSections.amenities && (
            <View style={styles.sectionContent}>
            <View style={styles.checkboxGroup}>
              {AMENITY_OPTIONS.map(option => (
                <Checkbox
                  key={option.id}
                  checked={profile.preferences_amenities.includes(option.id)}
                  onToggle={() => toggleArrayPreference('preferences_amenities', option.id)}
                  label={option.label}
                />
              ))}
            </View>
            </View>
            )}
          </View>

          {/* PRODUCTS */}
          <View style={styles.section}>
            <SectionHeader
              title="PRODUCTS"
              subtitle="Brands and items you prefer"
              expanded={expandedSections.products}
              onToggle={() => toggleSection('products')}
            />
            {expandedSections.products && (
            <View style={styles.sectionContent}>
            <View style={styles.checkboxGroup}>
              {PRODUCT_OPTIONS.map(option => (
                <Checkbox
                  key={option.id}
                  checked={profile.preferences_products.includes(option.id)}
                  onToggle={() => toggleArrayPreference('preferences_products', option.id)}
                  label={option.label}
                />
              ))}
            </View>
            </View>
            )}
          </View>

          {/* USAGE */}
          <View style={styles.section}>
            <SectionHeader
              title="USAGE"
              subtitle="What you use Maslow for"
              expanded={expandedSections.usage}
              onToggle={() => toggleSection('usage')}
            />
            {expandedSections.usage && (
            <View style={styles.sectionContent}>
            <View style={styles.checkboxGroup}>
              {USAGE_OPTIONS.map(option => (
                <Checkbox
                  key={option.id}
                  checked={profile.preferences_usage.includes(option.id)}
                  onToggle={() => toggleArrayPreference('preferences_usage', option.id)}
                  label={option.label}
                  icon={option.icon}
                />
              ))}
            </View>
            </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              activeOpacity={0.8}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    backgroundColor: colors.cream,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButtonText: {
    fontSize: 16,
    color: colors.navy,
    marginLeft: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.navy,
  },
  headerSpacer: {
    width: 70,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },

  // Photo Section
  photoSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${colors.navy}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.navy,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.cream,
  },
  photoHint: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: spacing.sm,
  },

  // Sections
  section: {
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.lightGray,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
  },
  sectionHeaderLeft: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.navy,
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  sectionContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: spacing.md,
  },

  // Form Fields
  fieldContainer: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.navy,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.black,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  fieldHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: spacing.xs,
  },
  readOnlyField: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  readOnlyText: {
    fontSize: 16,
    color: '#6B7280',
  },

  // Preferences
  preferenceContainer: {
    marginBottom: spacing.lg,
  },
  preferenceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.navy,
    marginBottom: spacing.sm,
  },

  // Slider
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.navy,
    marginLeft: spacing.md,
    minWidth: 50,
  },

  // Switch
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 14,
    color: colors.navy,
    marginLeft: spacing.sm,
  },

  // Radio Buttons
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.navy,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  radioSelected: {
    borderColor: colors.navy,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.navy,
  },
  radioLabel: {
    fontSize: 14,
    color: colors.navy,
  },

  // Checkboxes
  checkboxGroup: {
    gap: spacing.sm,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.navy,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: colors.navy,
  },
  checkboxLabel: {
    fontSize: 15,
    color: colors.navy,
  },

  // Buttons
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.navy,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
});
