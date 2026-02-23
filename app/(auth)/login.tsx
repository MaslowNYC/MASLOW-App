import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useHaptics } from '../../src/hooks/useHaptics';
import { SUPPORTED_LANGUAGES, LanguageCode } from '../../src/i18n';
import { useLanguage } from '../../src/context/LanguageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  background: '#0a1628',
  backgroundDark: '#050d1a',
  cardBackground: '#1a2332',
  cardBorder: '#2a3444',
  primary: '#3C5999',
  accent: '#C5A059',
  accentDark: '#a88a4a',
  cream: '#FAF4ED',
  white: '#FFFFFF',
  gray: '#6b7280',
  grayLight: '#9ca3af',
  inputBg: '#252d3d',
  inputBorder: '#3a4454',
  error: '#ef4444',
};

// Welcome greetings
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

type AuthMode = 'signin' | 'signup';

export default function AuthScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const haptics = useHaptics();

  // Check if coming from signup button
  const initialMode: AuthMode = params.mode === 'signup' ? 'signup' : 'signin';
  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Language state
  const { language: currentLanguage, changeLanguage, revertLanguage } = useLanguage();
  const [rotatingIndex, setRotatingIndex] = useState(0);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Undo toast state
  const [showUndoToast, setShowUndoToast] = useState(false);
  const undoProgressAnim = useRef(new Animated.Value(1)).current;
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Entrance animation
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Rotating language animation
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

  const switchMode = (newMode: AuthMode) => {
    haptics.light();
    setMode(newMode);
  };

  const handleLanguageChange = async (code: LanguageCode) => {
    haptics.medium();
    setShowLanguageModal(false);

    // Change language and get previous
    await changeLanguage(code);

    // Show undo toast
    setShowUndoToast(true);
    undoProgressAnim.setValue(1);

    // Start countdown animation
    Animated.timing(undoProgressAnim, {
      toValue: 0,
      duration: 4000,
      useNativeDriver: false,
    }).start();

    // Auto-dismiss after 4 seconds
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
    }
    undoTimerRef.current = setTimeout(() => {
      setShowUndoToast(false);
    }, 4000);
  };

  const handleUndo = async () => {
    haptics.light();

    // Cancel timer
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }

    // Revert language
    await revertLanguage();

    // Dismiss toast immediately
    setShowUndoToast(false);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
    };
  }, []);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    haptics.medium();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      haptics.warning();
      Alert.alert('Sign In Failed', error.message);
    }
    setLoading(false);
  };

  const handleSignUp = async () => {
    if (!firstName || !lastName || !email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    haptics.medium();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim(),
        },
      },
    });

    if (error) {
      haptics.warning();
      Alert.alert('Sign Up Failed', error.message);
      setLoading(false);
    } else {
      haptics.success();
      // Create profile in profiles table
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim(),
          email: email.trim(),
        });
      }
      Alert.alert('Success', 'Account created! Please check your email to verify.');
      setMode('signin');
      setLoading(false);
    }
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

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Back button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                haptics.light();
                router.back();
              }}
            >
              <Ionicons name="chevron-back" size={24} color={COLORS.cream} />
            </TouchableOpacity>

            {/* Auth Card */}
            <Animated.View
              style={[
                styles.card,
                {
                  opacity: cardOpacity,
                  transform: [{ scale: cardScale }],
                },
              ]}
            >
              {/* Header */}
              <Text style={styles.logoText}>Maslow</Text>
              <Text style={styles.tagline}>The Infrastructure of Dignity</Text>

              {/* Tab Switcher */}
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tab, mode === 'signin' && styles.tabActive]}
                  onPress={() => switchMode('signin')}
                >
                  <Text style={[styles.tabText, mode === 'signin' && styles.tabTextActive]}>
                    Sign In
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, mode === 'signup' && styles.tabActive]}
                  onPress={() => switchMode('signup')}
                >
                  <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Form */}
              <View style={styles.form}>
                {mode === 'signup' && (
                  <>
                    {/* Name Row */}
                    <View style={styles.nameRow}>
                      <View style={styles.nameField}>
                        <Text style={styles.label}>First Name</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="First name"
                          placeholderTextColor={COLORS.gray}
                          value={firstName}
                          onChangeText={setFirstName}
                          autoCapitalize="words"
                          editable={!loading}
                        />
                      </View>
                      <View style={styles.nameField}>
                        <Text style={styles.label}>Last Name</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="Last name"
                          placeholderTextColor={COLORS.gray}
                          value={lastName}
                          onChangeText={setLastName}
                          autoCapitalize="words"
                          editable={!loading}
                        />
                      </View>
                    </View>
                  </>
                )}

                {/* Email */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor={COLORS.gray}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!loading}
                  />
                </View>

                {mode === 'signup' && (
                  <>
                    {/* Phone */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.label}>Phone Number</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="(555) 123-4567"
                        placeholderTextColor={COLORS.gray}
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        editable={!loading}
                      />
                      <Text style={styles.hint}>We'll send a verification code to this number</Text>
                    </View>
                  </>
                )}

                {/* Password */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={mode === 'signup' ? '' : ''}
                    placeholderTextColor={COLORS.gray}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    editable={!loading}
                  />
                  {mode === 'signup' && (
                    <Text style={styles.hint}>Minimum 6 characters</Text>
                  )}
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                  onPress={mode === 'signin' ? handleSignIn : handleSignUp}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <Text style={styles.submitButtonText}>
                    {loading
                      ? (mode === 'signin' ? 'Signing In...' : 'Creating Account...')
                      : (mode === 'signin' ? 'Sign In' : 'Create Account')
                    }
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Language Bubble */}
        <View style={styles.languageBubble}>
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
              <Text style={styles.languageName}>
                {rotatingLang.name.toUpperCase()}
              </Text>
            </Animated.View>
            <Text style={styles.languageHint}>Tap to select language</Text>
          </TouchableOpacity>
        </View>

        {/* Undo Toast */}
        {showUndoToast && (
          <View style={styles.undoToast}>
            <View style={styles.undoToastContent}>
              <Text style={styles.undoToastText}>Language changed</Text>
              <TouchableOpacity onPress={handleUndo} style={styles.undoButton}>
                <Text style={styles.undoButtonText}>Undo</Text>
              </TouchableOpacity>
            </View>
            <Animated.View
              style={[
                styles.undoProgressBar,
                {
                  width: undoProgressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        )}
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
            <Text style={styles.modalTitle}>Select Language</Text>
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
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    padding: 8,
    zIndex: 10,
  },

  // Card
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '400',
    fontStyle: 'italic',
    color: COLORS.accent,
    textAlign: 'center',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.grayLight,
    textAlign: 'center',
    marginBottom: 28,
    letterSpacing: 1,
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    padding: 4,
    marginBottom: 28,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: COLORS.cardBorder,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray,
  },
  tabTextActive: {
    color: COLORS.cream,
  },

  // Form
  form: {
    gap: 20,
  },
  fieldContainer: {
    gap: 8,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameField: {
    flex: 1,
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.cream,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.cream,
  },
  hint: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },

  // Submit Button
  submitButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.accentDark,
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.cardBackground,
  },

  // Language Bubble
  languageBubble: {
    position: 'absolute',
    bottom: 24,
    right: 20,
  },
  languageBubbleInner: {
    backgroundColor: 'rgba(40, 50, 65, 0.95)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    minWidth: 140,
  },
  languageGreeting: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.accent,
    textAlign: 'center',
    marginBottom: 4,
  },
  languageName: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.gray,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  languageHint: {
    fontSize: 10,
    color: COLORS.grayLight,
    textAlign: 'center',
    marginTop: 8,
  },

  // Undo Toast
  undoToast: {
    position: 'absolute',
    bottom: 100,
    left: 24,
    right: 24,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  undoToastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  undoToastText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.cream,
  },
  undoButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: COLORS.accent,
    borderRadius: 6,
  },
  undoButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.cardBackground,
  },
  undoProgressBar: {
    height: 3,
    backgroundColor: COLORS.accent,
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
