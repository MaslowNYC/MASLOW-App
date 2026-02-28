import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { colors, spacing } from '../../src/theme';
import { MaslowCard } from '../../src/components';
import { useHaptics } from '../../src/hooks/useHaptics';
import i18n, { SUPPORTED_LANGUAGES, LanguageCode, setLanguage, saveLanguagePreference, loadLanguagePreference } from '../../src/i18n';
import { useLanguage } from '../../src/context/LanguageContext';

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
          color={danger ? colors.error : colors.darkGray}
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

interface AccessibilitySettings {
  reduce_animations: boolean;
  no_haptics: boolean;
  high_contrast: boolean;
  larger_text: boolean;
  screen_reader: boolean;
}

const DEFAULT_ACCESSIBILITY: AccessibilitySettings = {
  reduce_animations: false,
  no_haptics: false,
  high_contrast: false,
  larger_text: false,
  screen_reader: false,
};

export default function SettingsScreen() {
  const router = useRouter();
  const haptics = useHaptics();
  const { language } = useLanguage();
  const [userId, setUserId] = useState<string | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>('en');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [accessibilitySettings, setAccessibilitySettings] = useState<AccessibilitySettings>(DEFAULT_ACCESSIBILITY);

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      // Load language preference
      const savedLang = await loadLanguagePreference(user.id);
      if (savedLang) {
        setCurrentLanguage(savedLang);
        setLanguage(savedLang);
      }
      // Load accessibility settings
      const { data: profile } = await supabase
        .from('profiles')
        .select('accessibility_settings')
        .eq('id', user.id)
        .single();
      if (profile?.accessibility_settings) {
        setAccessibilitySettings({ ...DEFAULT_ACCESSIBILITY, ...profile.accessibility_settings });
      }
    }
  };

  const handleLanguageChange = async (code: LanguageCode) => {
    setCurrentLanguage(code);
    setLanguage(code);
    if (userId) {
      await saveLanguagePreference(userId, code);
    }
    setShowLanguageModal(false);
  };

  const updateAccessibilitySetting = async (key: keyof AccessibilitySettings, value: boolean) => {
    const newSettings = { ...accessibilitySettings, [key]: value };
    setAccessibilitySettings(newSettings);
    if (userId) {
      await supabase
        .from('profiles')
        .update({ accessibility_settings: newSettings })
        .eq('id', userId);
    }
  };

  const handleNavigate = (screen: string) => {
    haptics.light();
    console.log(`Navigate to: ${screen}`);
  };

  const handleSignOut = () => {
    haptics.warning();
    Alert.alert(
      i18n.t('signOut'),
      i18n.t('signOutConfirm'),
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: i18n.t('signOut'),
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={colors.navy} />
          <Text style={styles.backText}>{i18n.t('cancel')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{i18n.t('settings')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('account')}</Text>
          <MaslowCard padding="sm">
            <MenuItem
              icon="card-outline"
              label={i18n.t('paymentMethods')}
              onPress={() => handleNavigate('payment')}
            />
          </MaslowCard>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('preferences')}</Text>
          <MaslowCard padding="sm">
            <MenuItem
              icon="notifications-outline"
              label={i18n.t('notifications')}
              onPress={() => handleNavigate('notifications')}
            />
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setShowLanguageModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name="language-outline" size={20} color={colors.darkGray} />
                <Text style={styles.menuItemLabel}>{i18n.t('language')}</Text>
              </View>
              <View style={styles.languageValue}>
                <Text style={styles.languageText}>
                  {SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage)?.native || 'English'}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.darkGray} />
              </View>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <MenuItem
              icon="shield-outline"
              label={i18n.t('privacy')}
              onPress={() => handleNavigate('privacy-settings')}
            />
          </MaslowCard>
        </View>

        {/* Accessibility Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('accessibility')}</Text>
          <MaslowCard padding="sm">
            <View style={styles.accessibilityItem}>
              <View style={styles.accessibilityLeft}>
                <Ionicons name="sparkles-outline" size={20} color={colors.darkGray} />
                <View style={styles.accessibilityText}>
                  <Text style={styles.menuItemLabel}>{i18n.t('reduceAnimations')}</Text>
                  <Text style={styles.accessibilityDesc}>{i18n.t('reduceAnimationsDesc')}</Text>
                </View>
              </View>
              <Switch
                value={accessibilitySettings.reduce_animations}
                onValueChange={(v) => updateAccessibilitySetting('reduce_animations', v)}
                trackColor={{ false: colors.lightGray, true: colors.navy }}
                thumbColor={colors.white}
              />
            </View>
            <View style={styles.menuDivider} />
            <View style={styles.accessibilityItem}>
              <View style={styles.accessibilityLeft}>
                <Ionicons name="phone-portrait-outline" size={20} color={colors.darkGray} />
                <View style={styles.accessibilityText}>
                  <Text style={styles.menuItemLabel}>{i18n.t('noHaptics')}</Text>
                  <Text style={styles.accessibilityDesc}>{i18n.t('noHapticsDesc')}</Text>
                </View>
              </View>
              <Switch
                value={accessibilitySettings.no_haptics}
                onValueChange={(v) => updateAccessibilitySetting('no_haptics', v)}
                trackColor={{ false: colors.lightGray, true: colors.navy }}
                thumbColor={colors.white}
              />
            </View>
            <View style={styles.menuDivider} />
            <View style={styles.accessibilityItem}>
              <View style={styles.accessibilityLeft}>
                <Ionicons name="contrast-outline" size={20} color={colors.darkGray} />
                <View style={styles.accessibilityText}>
                  <Text style={styles.menuItemLabel}>{i18n.t('highContrast')}</Text>
                  <Text style={styles.accessibilityDesc}>{i18n.t('highContrastDesc')}</Text>
                </View>
              </View>
              <Switch
                value={accessibilitySettings.high_contrast}
                onValueChange={(v) => updateAccessibilitySetting('high_contrast', v)}
                trackColor={{ false: colors.lightGray, true: colors.navy }}
                thumbColor={colors.white}
              />
            </View>
            <View style={styles.menuDivider} />
            <View style={styles.accessibilityItem}>
              <View style={styles.accessibilityLeft}>
                <Ionicons name="text-outline" size={20} color={colors.darkGray} />
                <View style={styles.accessibilityText}>
                  <Text style={styles.menuItemLabel}>{i18n.t('largerText')}</Text>
                  <Text style={styles.accessibilityDesc}>{i18n.t('largerTextDesc')}</Text>
                </View>
              </View>
              <Switch
                value={accessibilitySettings.larger_text}
                onValueChange={(v) => updateAccessibilitySetting('larger_text', v)}
                trackColor={{ false: colors.lightGray, true: colors.navy }}
                thumbColor={colors.white}
              />
            </View>
            <View style={styles.menuDivider} />
            <View style={styles.accessibilityItem}>
              <View style={styles.accessibilityLeft}>
                <Ionicons name="ear-outline" size={20} color={colors.darkGray} />
                <View style={styles.accessibilityText}>
                  <Text style={styles.menuItemLabel}>{i18n.t('screenReader')}</Text>
                  <Text style={styles.accessibilityDesc}>{i18n.t('screenReaderDesc')}</Text>
                </View>
              </View>
              <Switch
                value={accessibilitySettings.screen_reader}
                onValueChange={(v) => updateAccessibilitySetting('screen_reader', v)}
                trackColor={{ false: colors.lightGray, true: colors.navy }}
                thumbColor={colors.white}
              />
            </View>
          </MaslowCard>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('support')}</Text>
          <MaslowCard padding="sm">
            <MenuItem
              icon="help-circle-outline"
              label={i18n.t('helpCenter')}
              onPress={() => handleNavigate('help')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="chatbubble-outline"
              label={i18n.t('contactSupport')}
              onPress={() => handleNavigate('support')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="document-text-outline"
              label={i18n.t('termsAndConditions')}
              onPress={() => router.push('/terms')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="lock-closed-outline"
              label={i18n.t('privacyPolicy')}
              onPress={() => router.push('/privacy')}
            />
          </MaslowCard>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <MaslowCard padding="sm">
            <MenuItem
              icon="trash-outline"
              label={i18n.t('deleteAccount')}
              onPress={() => {
                Alert.alert(
                  i18n.t('deleteAccount'),
                  i18n.t('deleteAccountMessage'),
                  [{ text: 'OK' }]
                );
              }}
              showChevron={false}
              danger
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="log-out-outline"
              label={i18n.t('signOut')}
              onPress={handleSignOut}
              showChevron={false}
              danger
            />
          </MaslowCard>
        </View>

        {/* Version */}
        <Text style={styles.version}>Maslow v2.1.0</Text>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{i18n.t('selectLanguage')}</Text>
            <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
              <Ionicons name="close" size={24} color={colors.darkGray} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.languageList}>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageItem,
                  currentLanguage === lang.code && styles.languageItemSelected,
                ]}
                onPress={() => handleLanguageChange(lang.code)}
              >
                <View style={styles.languageItemLeft}>
                  <Text style={styles.languageFlag}>{lang.flag}</Text>
                  <View>
                    <Text style={styles.languageNative}>{lang.native}</Text>
                    <Text style={styles.languageName}>{lang.name}</Text>
                  </View>
                </View>
                {currentLanguage === lang.code && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.navy} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  backText: {
    fontSize: 16,
    color: colors.navy,
    marginLeft: spacing.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.navy,
  },
  headerSpacer: {
    width: 70, // Balance the back button width
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },

  // Sections
  section: {
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.darkGray,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
    marginLeft: spacing.xs,
  },

  // Menu Items
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemLabel: {
    fontSize: 15,
    color: colors.navy,
    marginLeft: spacing.sm,
  },
  menuItemDanger: {
    color: colors.error,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.lightGray,
    marginHorizontal: spacing.sm,
  },

  // Version
  version: {
    fontSize: 11,
    color: colors.darkGray,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  // Language
  languageValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  languageText: {
    fontSize: 14,
    color: colors.darkGray,
  },

  // Accessibility
  accessibilityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  accessibilityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  accessibilityText: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  accessibilityDesc: {
    fontSize: 11,
    color: colors.darkGray,
    marginTop: 1,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    backgroundColor: colors.white,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.navy,
  },
  languageList: {
    flex: 1,
    padding: spacing.md,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageItemSelected: {
    borderColor: colors.navy,
    backgroundColor: `${colors.navy}08`,
  },
  languageItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  languageFlag: {
    fontSize: 28,
  },
  languageNative: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.navy,
  },
  languageName: {
    fontSize: 13,
    color: colors.darkGray,
    marginTop: 2,
  },
});
