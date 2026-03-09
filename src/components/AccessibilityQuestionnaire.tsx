import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility, AccessibilitySettings, DEFAULT_ACCESSIBILITY_SETTINGS } from '../context/AccessibilityContext';
import { t } from '../i18n';

const COLORS = {
  blue: '#286BCD',
  cream: '#FAF4ED',
  white: '#FFFFFF',
  navy: '#1A365D',
  gold: '#C49F58',
  darkGray: '#4A5568',
  lightGray: '#E2E8F0',
};

interface AccessibilityOption {
  key: keyof AccessibilitySettings;
  icon: string;
  title: string;
  description: string;
}

const OPTIONS: AccessibilityOption[] = [
  {
    key: 'reduce_animations',
    icon: 'sparkles-outline',
    title: 'reduceAnimations',
    description: 'reduceAnimationsDesc',
  },
  {
    key: 'no_haptics',
    icon: 'phone-portrait-outline',
    title: 'noHaptics',
    description: 'noHapticsDesc',
  },
  {
    key: 'high_contrast',
    icon: 'contrast-outline',
    title: 'highContrast',
    description: 'highContrastDesc',
  },
  {
    key: 'larger_text',
    icon: 'text-outline',
    title: 'largerText',
    description: 'largerTextDesc',
  },
  {
    key: 'screen_reader',
    icon: 'ear-outline',
    title: 'screenReader',
    description: 'screenReaderDesc',
  },
];

interface AccessibilityQuestionnaireProps {
  onComplete: () => void;
}

export function AccessibilityQuestionnaire({ onComplete }: AccessibilityQuestionnaireProps) {
  const { updateAllSettings, completeOnboarding } = useAccessibility();
  const [localSettings, setLocalSettings] = useState<AccessibilitySettings>(DEFAULT_ACCESSIBILITY_SETTINGS);

  const toggleSetting = (key: keyof AccessibilitySettings) => {
    setLocalSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleContinue = async () => {
    await updateAllSettings(localSettings);
    await completeOnboarding();
    onComplete();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="accessibility" size={40} color={COLORS.blue} />
          </View>
          <Text style={styles.title}>{t('personalizeTitle')}</Text>
          <Text style={styles.subtitle}>{t('personalizeSubtitle')}</Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.optionCard,
                localSettings[option.key] && styles.optionCardActive,
              ]}
              onPress={() => toggleSetting(option.key)}
              activeOpacity={0.7}
              accessibilityRole="switch"
              accessibilityState={{ checked: localSettings[option.key] }}
              accessibilityLabel={t(option.title)}
              accessibilityHint={t(option.description)}
            >
              <View style={styles.optionLeft}>
                <View style={[
                  styles.optionIcon,
                  localSettings[option.key] && styles.optionIconActive,
                ]}>
                  <Ionicons
                    name={option.icon as any}
                    size={22}
                    color={localSettings[option.key] ? COLORS.white : COLORS.blue}
                  />
                </View>
                <View style={styles.optionText}>
                  <Text style={[
                    styles.optionTitle,
                    localSettings[option.key] && styles.optionTitleActive,
                  ]}>
                    {t(option.title)}
                  </Text>
                  <Text style={styles.optionDescription}>
                    {t(option.description)}
                  </Text>
                </View>
              </View>
              <Switch
                value={localSettings[option.key]}
                onValueChange={() => toggleSetting(option.key)}
                trackColor={{ false: COLORS.lightGray, true: COLORS.blue }}
                thumbColor={COLORS.white}
                ios_backgroundColor={COLORS.lightGray}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Skip notice */}
        <Text style={styles.skipNotice}>
          You can skip this and change settings anytime in your Profile
        </Text>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>{t('continue')}</Text>
          <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 120,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${COLORS.blue}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.darkGray,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },

  // Options
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  optionCardActive: {
    borderColor: COLORS.blue,
    backgroundColor: `${COLORS.blue}05`,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${COLORS.blue}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  optionIconActive: {
    backgroundColor: COLORS.blue,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.navy,
    marginBottom: 2,
  },
  optionTitleActive: {
    color: COLORS.blue,
  },
  optionDescription: {
    fontSize: 12,
    color: COLORS.darkGray,
    lineHeight: 16,
  },

  // Skip notice
  skipNotice: {
    fontSize: 12,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginTop: 24,
    fontStyle: 'italic',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 32,
    backgroundColor: COLORS.cream,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.blue,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: COLORS.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
  },
});
