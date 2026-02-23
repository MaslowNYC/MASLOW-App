import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useHaptics } from '../src/hooks/useHaptics';
import i18n, {
  SUPPORTED_LANGUAGES,
  LanguageCode,
  setLanguage,
  saveLanguagePreference,
} from '../src/i18n';
import { useLanguage } from '../src/context/LanguageContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLORS = {
  background: '#0a1628',
  backgroundDark: '#050d1a',
  primary: '#3C5999',
  accent: '#C5A059',
  accentLight: '#d4b77a',
  cream: '#FAF4ED',
  white: '#FFFFFF',
  gray: '#6b7280',
  grayLight: '#9ca3af',
};

// Welcome greetings in each language
const WELCOME_GREETINGS: Record<LanguageCode, string> = {
  en: 'Welcome',
  es: 'Bienvenido',
  fr: 'Bienvenue',
  de: 'Willkommen',
  it: 'Benvenuto',
  pt: 'Bem-vindo',
  zh: '欢迎',
  ja: 'ようこそ',
  ko: '환영합니다',
  ar: 'مرحبا',
  ru: 'Добро пожаловать',
  hi: 'स्वागत है',
  he: 'ברוך הבא',
};

const ROTATION_INTERVAL = 2500;

export default function WelcomeScreen() {
  const router = useRouter();
  const haptics = useHaptics();
  const { language } = useLanguage();
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>('en');
  const [rotatingIndex, setRotatingIndex] = useState(0);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  // Animations
  const logoScale = useRef(new Animated.Value(0.9)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Entrance animations
  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Rotating language animation for bubble
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setRotatingIndex((prev) => (prev + 1) % SUPPORTED_LANGUAGES.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, ROTATION_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const handleLanguageChange = async (code: LanguageCode) => {
    haptics.medium();
    setCurrentLanguage(code);
    setLanguage(code);
    setShowLanguageModal(false);
  };

  const handleGetInLine = () => {
    haptics.medium();
    router.push('/(auth)/login?mode=signup');
  };

  const handleMemberAccess = () => {
    haptics.light();
    router.push('/(auth)/login?mode=signin');
  };

  const rotatingLang = SUPPORTED_LANGUAGES[rotatingIndex];

  return (
    <View style={styles.container}>
      {/* Dark gradient background */}
      <LinearGradient
        colors={[COLORS.backgroundDark, COLORS.background, COLORS.backgroundDark]}
        locations={[0, 0.5, 1]}
        style={styles.gradientBackground}
      />

      {/* Subtle radial glow behind logo */}
      <View style={styles.glowContainer}>
        <LinearGradient
          colors={['rgba(60, 89, 153, 0.15)', 'transparent']}
          style={styles.glow}
        />
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Logo Section */}
          <Animated.View
            style={[
              styles.logoSection,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            {/* Square Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={require('../assets/maslow-logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            {/* Tagline */}
            <Text style={styles.tagline}>{i18n.t('sanctuaryAwaits')}</Text>

            {/* Gold divider */}
            <View style={styles.divider} />

            {/* Waitlist Section */}
            <Text style={styles.waitlistLabel}>{i18n.t('waitlistLabel')}</Text>
            <Text style={styles.waitlistNumber}>#263</Text>
          </Animated.View>

          {/* Buttons Section */}
          <Animated.View
            style={[
              styles.buttonsSection,
              { opacity: contentOpacity },
            ]}
          >
            {/* Get In Line Button */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleGetInLine}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>{i18n.t('getInLine')}</Text>
              <Ionicons name="arrow-forward" size={18} color={COLORS.accent} />
            </TouchableOpacity>

            {/* Member Access */}
            <TouchableOpacity
              style={styles.memberAccessButton}
              onPress={handleMemberAccess}
              activeOpacity={0.7}
            >
              <Ionicons name="lock-closed-outline" size={14} color={COLORS.grayLight} />
              <Text style={styles.memberAccessText}>{i18n.t('memberAccess')}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Language Bubble - Bottom Right */}
        <Animated.View style={[styles.languageBubble, { opacity: contentOpacity }]}>
          <TouchableOpacity
            style={styles.languageBubbleInner}
            onPress={() => {
              haptics.light();
              setShowLanguageModal(true);
            }}
            activeOpacity={0.8}
          >
            <Animated.View style={{ opacity: fadeAnim }}>
              <Text style={styles.languageGreeting}>
                {WELCOME_GREETINGS[rotatingLang.code]}
              </Text>
              <Text style={styles.languageName}>{rotatingLang.name.toUpperCase()}</Text>
            </Animated.View>
            <Text style={styles.languageHint}>{i18n.t('selectLanguage')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{i18n.t('selectLanguage')}</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowLanguageModal(false)}
            >
              <Ionicons name="close" size={24} color={COLORS.gray} />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.languageList}
            contentContainerStyle={styles.languageListContent}
            showsVerticalScrollIndicator={false}
          >
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = lang.code === currentLanguage;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageItem,
                    isSelected && styles.languageItemSelected,
                  ]}
                  onPress={() => handleLanguageChange(lang.code)}
                  activeOpacity={0.7}
                >
                  <View style={styles.languageItemLeft}>
                    <Text style={styles.languageItemFlag}>{lang.flag}</Text>
                    <View>
                      <Text style={[
                        styles.languageItemNative,
                        isSelected && styles.languageItemNativeSelected,
                      ]}>
                        {lang.native}
                      </Text>
                      <Text style={styles.languageItemEnglish}>{lang.name}</Text>
                    </View>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  glowContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.15,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  glow: {
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  safeArea: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },

  // Logo Section
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  logoImage: {
    width: 160,
    height: 160,
    borderRadius: 20,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '300',
    color: COLORS.cream,
    letterSpacing: 6,
    textAlign: 'center',
    lineHeight: 28,
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.accent,
    marginVertical: 28,
    opacity: 0.8,
  },
  waitlistLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: COLORS.grayLight,
    letterSpacing: 3,
    marginBottom: 8,
  },
  waitlistNumber: {
    fontSize: 48,
    fontWeight: '300',
    color: COLORS.cream,
    fontStyle: 'italic',
    letterSpacing: 2,
  },

  // Buttons Section
  buttonsSection: {
    width: '100%',
    alignItems: 'center',
    gap: 20,
    marginTop: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
    paddingVertical: 18,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.accent,
    backgroundColor: 'transparent',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.accent,
    letterSpacing: 3,
  },
  memberAccessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  memberAccessText: {
    fontSize: 12,
    fontWeight: '400',
    color: COLORS.grayLight,
    letterSpacing: 2,
  },

  // Language Bubble
  languageBubble: {
    position: 'absolute',
    bottom: 40,
    right: 20,
  },
  languageBubbleInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 160,
  },
  languageGreeting: {
    fontSize: 18,
    fontWeight: '500',
    color: COLORS.accent,
    textAlign: 'center',
    marginBottom: 4,
  },
  languageName: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.gray,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 8,
  },
  languageHint: {
    fontSize: 10,
    color: COLORS.grayLight,
    textAlign: 'center',
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: COLORS.white,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.background,
  },
  modalCloseButton: {
    padding: 4,
  },
  languageList: {
    flex: 1,
  },
  languageListContent: {
    padding: 16,
    gap: 8,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 8,
  },
  languageItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}08`,
  },
  languageItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  languageItemFlag: {
    fontSize: 28,
  },
  languageItemNative: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.background,
  },
  languageItemNativeSelected: {
    color: COLORS.primary,
  },
  languageItemEnglish: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 2,
  },
});
