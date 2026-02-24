import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
  Animated,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import i18n, { SUPPORTED_LANGUAGES, LanguageCode, setLanguage } from '../i18n';
import { useLanguage } from '../context/LanguageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  primaryBlue: '#3B5998',
  primaryBlueLight: '#4A6FB3',
  gold: '#C5A059',
  cream: '#F5F1E8',
  white: '#FFFFFF',
  gray: '#6b7280',
  grayLight: '#9ca3af',
  grayExtraLight: '#E2E8F0',
  navy: '#1A365D',
};

interface AccessibilitySettings {
  reduce_animations: boolean;
  high_contrast: boolean;
  larger_text: boolean;
  show_concierge: boolean;
  skip_preferences_modal: boolean;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  reduce_animations: false,
  high_contrast: false,
  larger_text: false,
  show_concierge: true,
  skip_preferences_modal: false,
};

interface SettingRowProps {
  icon: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

const SettingRow: React.FC<SettingRowProps> = ({ icon, title, description, children }) => (
  <View style={styles.settingRow}>
    <View style={styles.settingLeft}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon as any} size={20} color={COLORS.primaryBlue} />
      </View>
      <View style={styles.settingText}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
    </View>
    {children}
  </View>
);

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  userId?: string;
}

export function PreferencesModal({
  isOpen,
  onClose,
  onConfirm,
  userId,
}: PreferencesModalProps) {
  const { language: currentLang, changeLanguage } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_SETTINGS);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  // Animations
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Animate in when modal opens
  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.95);
      opacityAnim.setValue(0);
    }
  }, [isOpen]);

  // Load settings
  useEffect(() => {
    if (!isOpen || !userId) {
      setLoading(false);
      return;
    }

    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('accessibility_settings')
          .eq('id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading settings:', error);
        }

        if (data?.accessibility_settings) {
          setSettings({
            ...DEFAULT_SETTINGS,
            ...data.accessibility_settings,
          });
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [isOpen, userId]);

  // Update setting
  const updateSetting = (key: keyof AccessibilitySettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Handle language change
  const handleLanguageChange = async (code: LanguageCode) => {
    await changeLanguage(code);
    setShowLanguagePicker(false);
  };

  // Save and close
  const handleConfirm = async () => {
    if (!userId) {
      onConfirm?.();
      onClose();
      return;
    }

    setSaving(true);
    try {
      const updatedSettings = {
        ...settings,
        skip_preferences_modal: dontShowAgain,
      };

      await supabase
        .from('profiles')
        .update({ accessibility_settings: updatedSettings })
        .eq('id', userId);

      onConfirm?.();
      onClose();
    } catch (err) {
      console.error('Failed to save settings:', err);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const currentLanguage = SUPPORTED_LANGUAGES.find(l => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <View />
      </TouchableOpacity>

      {/* Modal Content */}
      <View style={styles.modalWrapper}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Header with gradient */}
          <LinearGradient
            colors={[COLORS.primaryBlue, COLORS.primaryBlueLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.headerTitle}>{i18n.t('welcomeToMaslow')}</Text>
                <Text style={styles.headerSubtitle}>{i18n.t('confirmPreferences')}</Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primaryBlue} />
            </View>
          ) : (
            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Language */}
              <SettingRow
                icon="globe-outline"
                title={i18n.t('language')}
                description={i18n.t('chooseLanguage')}
              >
                <TouchableOpacity
                  style={styles.languageSelector}
                  onPress={() => setShowLanguagePicker(true)}
                >
                  <Text style={styles.languageSelectorText}>
                    {currentLanguage.flag} {currentLanguage.native}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={COLORS.primaryBlue} />
                </TouchableOpacity>
              </SettingRow>

              <View style={styles.divider} />

              {/* AI Concierge */}
              <SettingRow
                icon="chatbubble-outline"
                title={i18n.t('aiConcierge')}
                description={i18n.t('showAiAssistant')}
              >
                <Switch
                  value={settings.show_concierge}
                  onValueChange={(v) => updateSetting('show_concierge', v)}
                  trackColor={{ false: COLORS.grayExtraLight, true: COLORS.primaryBlue }}
                  thumbColor={COLORS.white}
                  disabled={saving}
                />
              </SettingRow>

              <View style={styles.divider} />

              {/* Reduce Animations */}
              <SettingRow
                icon="sparkles-outline"
                title={i18n.t('reduceAnimations')}
                description={i18n.t('minimizeMotion')}
              >
                <Switch
                  value={settings.reduce_animations}
                  onValueChange={(v) => updateSetting('reduce_animations', v)}
                  trackColor={{ false: COLORS.grayExtraLight, true: COLORS.primaryBlue }}
                  thumbColor={COLORS.white}
                  disabled={saving}
                />
              </SettingRow>

              {/* High Contrast */}
              <SettingRow
                icon="contrast-outline"
                title={i18n.t('highContrast')}
                description={i18n.t('increaseVisibility')}
              >
                <Switch
                  value={settings.high_contrast}
                  onValueChange={(v) => updateSetting('high_contrast', v)}
                  trackColor={{ false: COLORS.grayExtraLight, true: COLORS.primaryBlue }}
                  thumbColor={COLORS.white}
                  disabled={saving}
                />
              </SettingRow>

              {/* Larger Text */}
              <SettingRow
                icon="text-outline"
                title={i18n.t('largerText')}
                description={i18n.t('increaseFontSize')}
              >
                <Switch
                  value={settings.larger_text}
                  onValueChange={(v) => updateSetting('larger_text', v)}
                  trackColor={{ false: COLORS.grayExtraLight, true: COLORS.primaryBlue }}
                  thumbColor={COLORS.white}
                  disabled={saving}
                />
              </SettingRow>
            </ScrollView>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            {/* Don't show again checkbox */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setDontShowAgain(!dontShowAgain)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, dontShowAgain && styles.checkboxChecked]}>
                {dontShowAgain && (
                  <Ionicons name="checkmark" size={14} color={COLORS.white} />
                )}
              </View>
              <Text style={styles.checkboxLabel}>{i18n.t('dontShowAgain')}</Text>
            </TouchableOpacity>

            {/* Confirm Button */}
            <TouchableOpacity
              style={[styles.confirmButton, (saving || loading) && styles.confirmButtonDisabled]}
              onPress={handleConfirm}
              disabled={saving || loading}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                  <Text style={styles.confirmButtonText}>{i18n.t('confirmPreferencesBtn')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>

      {/* Language Picker Modal */}
      <Modal
        visible={showLanguagePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLanguagePicker(false)}
      >
        <View style={styles.pickerBackdrop}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{i18n.t('selectLanguage')}</Text>
              <TouchableOpacity onPress={() => setShowLanguagePicker(false)}>
                <Ionicons name="close" size={24} color={COLORS.gray} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = lang.code === currentLang;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
                    onPress={() => handleLanguageChange(lang.code)}
                  >
                    <Text style={styles.pickerItemFlag}>{lang.flag}</Text>
                    <View style={styles.pickerItemText}>
                      <Text style={[styles.pickerItemNative, isSelected && styles.pickerItemNativeSelected]}>
                        {lang.native}
                      </Text>
                      <Text style={styles.pickerItemName}>{lang.name}</Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.primaryBlue} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    maxHeight: '80%',
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  closeButton: {
    padding: 4,
  },

  // Loading
  loadingContainer: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Content
  content: {
    maxHeight: 350,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 8,
  },

  // Setting Row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primaryBlue}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primaryBlue,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: COLORS.gray,
    opacity: 0.8,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: COLORS.grayExtraLight,
    marginVertical: 4,
  },

  // Language Selector
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.grayExtraLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  languageSelectorText: {
    fontSize: 14,
    color: COLORS.primaryBlue,
    fontWeight: '500',
  },

  // Footer
  footer: {
    padding: 20,
    paddingTop: 12,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: COLORS.grayExtraLight,
    gap: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primaryBlue,
    borderColor: COLORS.primaryBlue,
  },
  checkboxLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryBlue,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },

  // Language Picker
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: COLORS.cream,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayExtraLight,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.navy,
  },
  pickerList: {
    padding: 16,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pickerItemSelected: {
    borderColor: COLORS.primaryBlue,
    backgroundColor: `${COLORS.primaryBlue}08`,
  },
  pickerItemFlag: {
    fontSize: 24,
    marginRight: 14,
  },
  pickerItemText: {
    flex: 1,
  },
  pickerItemNative: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.navy,
  },
  pickerItemNativeSelected: {
    color: COLORS.primaryBlue,
  },
  pickerItemName: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 2,
  },
});

export default PreferencesModal;
