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
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '../../lib/supabase';
import { signInWithApple, signInWithGoogle, isAppleAuthAvailable } from '../../lib/socialAuth';
import { useHaptics } from '../../src/hooks/useHaptics';
import { useMaslowFonts, fonts } from '../../src/hooks/useMaslowFonts';
import { SUPPORTED_LANGUAGES, LanguageCode } from '../../src/i18n';
import { useLanguage } from '../../src/context/LanguageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Brand colors for auth screen (redesign March 2026)
const COLORS = {
  charcoal: '#2A2724',
  gold: '#C49F58',
  cream: '#FAF4ED',
  text: '#2A2724',
  mid: '#9a8e80',
  light: '#b8ad9e',
  white: '#FFFFFF',
  error: '#ef4444',
  success: '#22c55e',
  blue: '#C49F58', // Using gold for active states to match theme
  // Gradient (keep warm)
  gradientStart: '#fdf8f0',
  gradientMid: '#f5ede0',
  gradientEnd: '#ede4d4',
  // Inputs
  inputBg: 'rgba(255,255,255,0.72)',
  inputBorder: 'rgba(196,159,88,0.2)',
  inputFocusBorder: 'rgba(196,159,88,0.5)',
  // Card
  cardBg: 'rgba(255,255,255,0.52)',
  cardBorder: 'rgba(255,255,255,0.75)',
};

type AuthMode = 'signin' | 'signup';
type SignupStep = 'credentials' | 'phone' | 'verification';

export default function AuthScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const haptics = useHaptics();
  const fontsLoaded = useMaslowFonts();

  // Auth mode
  const initialMode: AuthMode = params.mode === 'signup' ? 'signup' : 'signin';
  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Signup step (only relevant when mode === 'signup')
  const [signupStep, setSignupStep] = useState<SignupStep>('credentials');

  // Form state
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Verification code (6 digits)
  const [verificationCode, setVerificationCode] = useState<string[]>(['', '', '', '', '', '']);
  const codeInputRefs = useRef<Array<TextInput | null>>([]);

  // Member number teaser
  const [nextMemberNumber, setNextMemberNumber] = useState<number | null>(null);

  // Language state
  const { language: currentLanguage, changeLanguage, revertLanguage } = useLanguage();
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  // Social auth state
  const [appleAuthAvailable, setAppleAuthAvailable] = useState(false);

  // Undo toast state
  const [showUndoToast, setShowUndoToast] = useState(false);
  const undoProgressAnim = useRef(new Animated.Value(1)).current;
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Entrance animations
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(10)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(10)).current;
  const dividerOpacity = useRef(new Animated.Value(0)).current;

  // Run entrance animations on mount
  useEffect(() => {
    Animated.stagger(150, [
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(logoTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(dividerOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(cardTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  // Fetch next member number on mount
  useEffect(() => {
    const fetchNextMemberNumber = async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (!error && count !== null) {
        setNextMemberNumber(count + 1);
      }
    };
    fetchNextMemberNumber();
  }, []);

  // Check Apple auth availability
  useEffect(() => {
    isAppleAuthAvailable().then(setAppleAuthAvailable);
  }, []);

  // Reset signup step when switching modes
  useEffect(() => {
    if (mode === 'signup') {
      setSignupStep('credentials');
    }
  }, [mode]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
    };
  }, []);

  const switchMode = (newMode: AuthMode) => {
    haptics.light();
    setMode(newMode);
  };

  // ===================
  // LANGUAGE HANDLING
  // ===================

  const handleLanguageChange = async (code: LanguageCode) => {
    haptics.medium();
    setShowLanguageModal(false);
    await changeLanguage(code);

    setShowUndoToast(true);
    undoProgressAnim.setValue(1);

    Animated.timing(undoProgressAnim, {
      toValue: 0,
      duration: 4000,
      useNativeDriver: false,
    }).start();

    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
    }
    undoTimerRef.current = setTimeout(() => {
      setShowUndoToast(false);
    }, 4000);
  };

  const handleUndo = async () => {
    haptics.light();
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    await revertLanguage();
    setShowUndoToast(false);
  };

  // ===================
  // SIGN IN
  // ===================

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

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Email Required', 'Please enter your email address to reset your password.');
      return;
    }

    haptics.light();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'maslow://reset-password',
    });

    setLoading(false);

    if (error) {
      haptics.warning();
      Alert.alert('Reset Failed', error.message);
    } else {
      haptics.success();
      Alert.alert(
        'Check Your Email',
        'If an account exists with this email, you will receive a password reset link shortly.',
        [{ text: 'OK' }]
      );
    }
  };

  // ===================
  // SOCIAL SIGN IN
  // ===================

  const handleAppleSignIn = async () => {
    haptics.medium();
    setLoading(true);
    try {
      const result = await signInWithApple();
      if (!result) {
        // User cancelled
        setLoading(false);
        return;
      }
      haptics.success();
    } catch (error: any) {
      haptics.warning();
      Alert.alert('Sign In Failed', error.message || 'Apple sign-in failed');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    haptics.medium();
    setLoading(true);
    try {
      await signInWithGoogle();
      // Google OAuth will redirect, loading state will be cleared on return
    } catch (error: any) {
      haptics.warning();
      Alert.alert('Sign In Failed', error.message || 'Google sign-in failed');
      setLoading(false);
    }
  };

  // ===================
  // SIGN UP - STEP 1 (Credentials)
  // ===================

  const handleCredentialsNext = () => {
    if (!firstName || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    haptics.light();
    setSignupStep('phone');
  };

  // ===================
  // SIGN UP - STEP 2 (Phone)
  // ===================

  const handleSendCode = async () => {
    if (!phone) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    haptics.medium();
    setLoading(true);

    // Create account with Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          first_name: firstName.trim(),
        },
      },
    });

    if (authError) {
      haptics.warning();
      Alert.alert('Sign Up Failed', authError.message);
      setLoading(false);
      return;
    }

    if (!authData.user) {
      Alert.alert('Error', 'Failed to create account');
      setLoading(false);
      return;
    }

    setUserId(authData.user.id);

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Clean phone number
    const cleanPhone = phone.replace(/\D/g, '');

    // Create profile with verification code
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: authData.user.id,
      first_name: firstName.trim(),
      phone: cleanPhone,
      email: email.trim(),
      verification_code: parseInt(code),
      code_expires_at: expiresAt.toISOString(),
      phone_verified: false,
    });

    if (profileError) {
      console.error('Profile error:', profileError);
    }

    // DEV MODE: Show code in alert
    console.log(`[SMS] Verification code for ${phone}: ${code}`);
    Alert.alert(
      'Code Sent',
      `Verification code sent to ${phone}\n\n[DEV MODE: Code is ${code}]`
    );

    setLoading(false);
    haptics.success();
    setSignupStep('verification');
  };

  // ===================
  // SIGN UP - STEP 3 (Verification)
  // ===================

  const handleCodeChange = (index: number, value: string) => {
    // Only allow single digit
    const digit = value.replace(/\D/g, '').slice(-1);
    const newCode = [...verificationCode];
    newCode[index] = digit;
    setVerificationCode(newCode);

    // Auto-advance to next input
    if (digit && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyPress = (index: number, key: string) => {
    // Handle backspace - go to previous input
    if (key === 'Backspace' && !verificationCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async () => {
    const enteredCode = verificationCode.join('');

    if (enteredCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit code');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'User ID not found');
      return;
    }

    haptics.medium();
    setLoading(true);

    // Fetch stored code from profiles
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('verification_code, code_expires_at')
      .eq('id', userId)
      .single();

    if (fetchError || !profile) {
      Alert.alert('Error', 'Failed to verify code');
      setLoading(false);
      return;
    }

    // Check code matches
    if (profile.verification_code?.toString() !== enteredCode) {
      haptics.warning();
      Alert.alert('Invalid Code', 'The code you entered is incorrect');
      setLoading(false);
      return;
    }

    // Check expiration
    if (new Date(profile.code_expires_at) < new Date()) {
      Alert.alert('Code Expired', 'The verification code has expired. Please request a new one.');
      setLoading(false);
      return;
    }

    // Mark phone as verified
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        phone_verified: true,
        verification_code: null,
        code_expires_at: null,
      })
      .eq('id', userId);

    if (updateError) {
      Alert.alert('Error', 'Failed to verify phone number');
      setLoading(false);
      return;
    }

    haptics.success();
    setLoading(false);
    Alert.alert('Welcome to Maslow!', 'Your account has been created successfully.');
  };

  const handleResendCode = async () => {
    if (!userId) return;

    haptics.light();
    setLoading(true);

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const { error } = await supabase.from('profiles').update({
      verification_code: parseInt(code),
      code_expires_at: expiresAt.toISOString(),
    }).eq('id', userId);

    setLoading(false);

    if (error) {
      Alert.alert('Error', 'Failed to resend code');
      return;
    }

    console.log(`[SMS] Verification code resent: ${code}`);
    Alert.alert('Code Sent', `New verification code sent!\n\n[DEV MODE: Code is ${code}]`);
  };

  const handleSignupBack = () => {
    haptics.light();
    if (signupStep === 'phone') {
      setSignupStep('credentials');
    } else if (signupStep === 'verification') {
      setSignupStep('phone');
    }
  };

  // Get current language info
  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  // Loading state while fonts load
  if (!fontsLoaded) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.blue} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Warm cream gradient background */}
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientMid, COLORS.gradientEnd]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Language Pill - Top Right */}
        <TouchableOpacity
          style={styles.languagePill}
          onPress={() => {
            haptics.light();
            setShowLanguageModal(true);
          }}
        >
          <Text style={styles.languagePillText}>{currentLang.code.toUpperCase()}</Text>
          <Ionicons name="chevron-down" size={12} color={COLORS.light} />
        </TouchableOpacity>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Logo Section */}
            <Animated.View
              style={[
                styles.logoSection,
                {
                  opacity: logoOpacity,
                  transform: [{ translateY: logoTranslateY }],
                },
              ]}
            >
              <View style={styles.logoCircle}>
                <Image
                  source={require('../../assets/splash-icon.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.wordmark}>MASLOW</Text>
              <Text style={styles.tagline}>The Infrastructure of Dignity</Text>
            </Animated.View>

            {/* Gold Divider */}
            <Animated.View style={[styles.divider, { opacity: dividerOpacity }]} />

            {/* Frosted Glass Card */}
            <Animated.View
              style={[
                styles.cardWrapper,
                {
                  opacity: cardOpacity,
                  transform: [{ translateY: cardTranslateY }],
                },
              ]}
            >
              <BlurView intensity={Platform.OS === 'ios' ? 40 : 0} tint="light" style={styles.card}>
                <View style={styles.cardContent}>
                  {/* Tab Switcher */}
                  <View style={styles.tabRow}>
                    <TouchableOpacity
                      style={styles.tab}
                      onPress={() => switchMode('signin')}
                    >
                      <Text style={[styles.tabText, mode === 'signin' && styles.tabTextActive]}>
                        Sign In
                      </Text>
                      {mode === 'signin' && <View style={styles.tabUnderline} />}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.tab}
                      onPress={() => switchMode('signup')}
                    >
                      <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>
                        Sign Up
                      </Text>
                      {mode === 'signup' && <View style={styles.tabUnderline} />}
                    </TouchableOpacity>
                  </View>

                  {/* SIGN IN FORM */}
                  {mode === 'signin' && (
                    <View style={styles.form}>
                      <View style={styles.field}>
                        <Text style={styles.inputLabel}>EMAIL</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="you@email.com"
                          placeholderTextColor="rgba(42,34,24,0.22)"
                          value={email}
                          onChangeText={setEmail}
                          autoCapitalize="none"
                          keyboardType="email-address"
                          editable={!loading}
                        />
                      </View>
                      <View style={styles.field}>
                        <Text style={styles.inputLabel}>PASSWORD</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="••••••••"
                          placeholderTextColor="rgba(42,34,24,0.22)"
                          value={password}
                          onChangeText={setPassword}
                          secureTextEntry
                          editable={!loading}
                        />
                      </View>
                      <TouchableOpacity
                        style={[styles.btnPrimary, loading && styles.btnDisabled]}
                        onPress={handleSignIn}
                        disabled={loading}
                      >
                        <Text style={styles.btnPrimaryText}>
                          {loading ? 'Signing In...' : 'Enter'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleForgotPassword} disabled={loading}>
                        <Text style={styles.forgotLink}>Forgot password?</Text>
                      </TouchableOpacity>

                      {/* Social Sign In Divider */}
                      <View style={styles.socialDivider}>
                        <View style={styles.socialDividerLine} />
                        <Text style={styles.socialDividerText}>or continue with</Text>
                        <View style={styles.socialDividerLine} />
                      </View>

                      {/* Social Sign In Buttons */}
                      <View style={styles.socialButtons}>
                        {Platform.OS === 'ios' && appleAuthAvailable && (
                          <AppleAuthentication.AppleAuthenticationButton
                            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                            cornerRadius={2}
                            style={styles.appleButton}
                            onPress={handleAppleSignIn}
                          />
                        )}
                        <TouchableOpacity
                          style={styles.googleButton}
                          onPress={handleGoogleSignIn}
                          disabled={loading}
                        >
                          <Ionicons name="logo-google" size={18} color={COLORS.text} />
                          <Text style={styles.googleButtonText}>Google</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* SIGN UP FLOW */}
                  {mode === 'signup' && (
                    <View style={styles.form}>
                      {/* Step Dots */}
                      <View style={styles.stepDots}>
                        <View style={[styles.dot, signupStep === 'credentials' && styles.dotActive]} />
                        <View style={[styles.dot, signupStep === 'phone' && styles.dotActive]} />
                        <View style={[styles.dot, signupStep === 'verification' && styles.dotActive]} />
                      </View>

                      {/* Step 1: Credentials */}
                      {signupStep === 'credentials' && (
                        <>
                          <View style={styles.field}>
                            <Text style={styles.inputLabel}>FIRST NAME</Text>
                            <TextInput
                              style={styles.input}
                              placeholder="First name"
                              placeholderTextColor="rgba(42,34,24,0.22)"
                              value={firstName}
                              onChangeText={setFirstName}
                              autoCapitalize="words"
                              editable={!loading}
                            />
                          </View>
                          <View style={styles.field}>
                            <Text style={styles.inputLabel}>EMAIL</Text>
                            <TextInput
                              style={styles.input}
                              placeholder="you@email.com"
                              placeholderTextColor="rgba(42,34,24,0.22)"
                              value={email}
                              onChangeText={setEmail}
                              autoCapitalize="none"
                              keyboardType="email-address"
                              editable={!loading}
                            />
                          </View>
                          <View style={styles.field}>
                            <Text style={styles.inputLabel}>PASSWORD</Text>
                            <TextInput
                              style={styles.input}
                              placeholder="••••••••"
                              placeholderTextColor="rgba(42,34,24,0.22)"
                              value={password}
                              onChangeText={setPassword}
                              secureTextEntry
                              editable={!loading}
                            />
                          </View>
                          {nextMemberNumber && (
                            <Text style={styles.memberTeaser}>
                              You'll be member{' '}
                              <Text style={styles.memberNumber}>
                                #{String(nextMemberNumber).padStart(5, '0')}
                              </Text>
                            </Text>
                          )}
                          <TouchableOpacity
                            style={[styles.btnPrimary, loading && styles.btnDisabled]}
                            onPress={handleCredentialsNext}
                            disabled={loading}
                          >
                            <Text style={styles.btnPrimaryText}>Continue</Text>
                          </TouchableOpacity>
                        </>
                      )}

                      {/* Step 2: Phone */}
                      {signupStep === 'phone' && (
                        <>
                          <View style={styles.field}>
                            <Text style={styles.inputLabel}>MOBILE NUMBER</Text>
                            <View style={styles.phoneRow}>
                              <View style={styles.phoneFlag}>
                                <Text style={styles.phoneFlagText}>🇺🇸 +1</Text>
                              </View>
                              <TextInput
                                style={[styles.input, styles.phoneInput]}
                                placeholder="(212) 555-0100"
                                placeholderTextColor="rgba(42,34,24,0.22)"
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                                editable={!loading}
                              />
                            </View>
                          </View>
                          <Text style={styles.note}>
                            We'll send a one-time code to verify your number.
                          </Text>
                          <TouchableOpacity
                            style={[styles.btnPrimary, loading && styles.btnDisabled]}
                            onPress={handleSendCode}
                            disabled={loading}
                          >
                            <Text style={styles.btnPrimaryText}>
                              {loading ? 'Sending...' : 'Send Code'}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.btnGhost}
                            onPress={handleSignupBack}
                            disabled={loading}
                          >
                            <Text style={styles.btnGhostText}>← Back</Text>
                          </TouchableOpacity>
                        </>
                      )}

                      {/* Step 3: Verification */}
                      {signupStep === 'verification' && (
                        <>
                          <Text style={styles.note}>
                            Enter the 6-digit code sent to your phone.
                          </Text>
                          <View style={styles.codeBoxes}>
                            {[0, 1, 2, 3, 4, 5].map((index) => (
                              <TextInput
                                key={index}
                                ref={(ref) => { codeInputRefs.current[index] = ref; }}
                                style={[
                                  styles.codeBox,
                                  verificationCode[index] && styles.codeBoxFilled,
                                ]}
                                maxLength={1}
                                keyboardType="number-pad"
                                value={verificationCode[index]}
                                onChangeText={(text) => handleCodeChange(index, text)}
                                onKeyPress={({ nativeEvent }) =>
                                  handleCodeKeyPress(index, nativeEvent.key)
                                }
                              />
                            ))}
                          </View>
                          <TouchableOpacity onPress={handleResendCode} disabled={loading}>
                            <Text style={styles.resendLink}>
                              Didn't get it? <Text style={styles.resendLinkBlue}>Resend</Text>
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.btnPrimary, loading && styles.btnDisabled]}
                            onPress={handleVerifyCode}
                            disabled={loading}
                          >
                            <Text style={styles.btnPrimaryText}>
                              {loading ? 'Verifying...' : 'Verify & Enter'}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.btnGhost}
                            onPress={handleSignupBack}
                            disabled={loading}
                          >
                            <Text style={styles.btnGhostText}>← Back</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  )}
                </View>
              </BlurView>
            </Animated.View>

            {/* Footer */}
            <Text style={styles.footerNote}>
              By continuing you agree to Maslow's{'\n'}Terms of Service & Privacy Policy
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>

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
              <Ionicons name="close" size={24} color={COLORS.mid} />
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
                      <Text
                        style={[
                          styles.languageItemNative,
                          isSelected && styles.languageItemNativeSelected,
                        ]}
                      >
                        {lang.native}
                      </Text>
                      <Text style={styles.languageItemEnglish}>{lang.name}</Text>
                    </View>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.blue} />
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
    backgroundColor: COLORS.cream,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },

  // Language Pill
  languagePill: {
    position: 'absolute',
    top: 12,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(196,159,88,0.2)',
    gap: 4,
  },
  languagePillText: {
    fontFamily: fonts.ui,
    fontSize: 10,
    letterSpacing: 1,
    color: COLORS.light,
  },

  // Logo Section
  logoSection: {
    alignItems: 'center',
    marginBottom: 10,
  },
  logoCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: 'hidden',
    marginBottom: 18,
    shadowColor: COLORS.blue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 8,
  },
  logoImage: {
    width: 110,
    height: 110,
  },
  wordmark: {
    fontFamily: fonts.displayLight,
    fontSize: 11,
    letterSpacing: 6,
    color: COLORS.light,
    marginBottom: 8,
  },
  tagline: {
    fontFamily: fonts.displayItalic,
    fontSize: 15,
    color: 'rgba(154,142,128,0.85)',
    letterSpacing: 0.5,
  },

  // Divider
  divider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.gold,
    opacity: 0.3,
    marginVertical: 24,
  },

  // Card
  cardWrapper: {
    width: '100%',
    maxWidth: 340,
  },
  card: {
    borderRadius: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  cardContent: {
    backgroundColor: Platform.OS === 'android' ? COLORS.cardBg : 'transparent',
    padding: 28,
  },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(196,159,88,0.18)',
    marginBottom: 22,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 11,
  },
  tabText: {
    fontFamily: fonts.ui,
    fontSize: 10.5,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: COLORS.light,
  },
  tabTextActive: {
    color: COLORS.text,
  },
  tabUnderline: {
    position: 'absolute',
    bottom: -1,
    left: '20%',
    right: '20%',
    height: 1,
    backgroundColor: COLORS.gold,
  },

  // Form
  form: {
    gap: 13,
  },
  field: {
    gap: 5,
  },
  inputLabel: {
    fontFamily: fonts.ui,
    fontSize: 9,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: 'rgba(196,159,88,0.85)',
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 2,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontFamily: fonts.uiLight,
    fontSize: 14,
    color: COLORS.text,
  },

  // Phone row
  phoneRow: {
    flexDirection: 'row',
    gap: 8,
  },
  phoneFlag: {
    width: 58,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneFlagText: {
    fontFamily: fonts.ui,
    fontSize: 13,
    color: COLORS.text,
  },
  phoneInput: {
    flex: 1,
  },

  // Code boxes
  codeBoxes: {
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
  },
  codeBox: {
    width: 42,
    height: 46,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 2,
    textAlign: 'center',
    fontFamily: fonts.uiLight,
    fontSize: 20,
    color: COLORS.text,
  },
  codeBoxFilled: {
    borderColor: COLORS.inputFocusBorder,
    backgroundColor: COLORS.white,
  },

  // Step dots
  stepDots: {
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    marginBottom: 8,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(196,159,88,0.25)',
  },
  dotActive: {
    backgroundColor: COLORS.gold,
    transform: [{ scale: 1.3 }],
  },

  // Member teaser
  memberTeaser: {
    fontFamily: fonts.displayItalic,
    fontSize: 13,
    color: COLORS.light,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  memberNumber: {
    color: COLORS.gold,
    fontFamily: fonts.display,
  },

  // Notes
  note: {
    fontFamily: fonts.uiLight,
    fontSize: 11,
    color: COLORS.light,
    textAlign: 'center',
    lineHeight: 18,
  },
  resendLink: {
    fontFamily: fonts.uiLight,
    fontSize: 11,
    color: COLORS.light,
    textAlign: 'center',
  },
  resendLinkBlue: {
    color: COLORS.gold,
  },

  // Buttons - charcoal primary per redesign
  btnPrimary: {
    backgroundColor: COLORS.charcoal,
    borderRadius: 2,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: COLORS.charcoal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnPrimaryText: {
    fontFamily: fonts.ui,
    fontSize: 11,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: COLORS.cream,
  },
  btnGhost: {
    borderWidth: 1,
    borderColor: 'rgba(196,159,88,0.22)',
    borderRadius: 2,
    paddingVertical: 11,
    alignItems: 'center',
  },
  btnGhostText: {
    fontFamily: fonts.ui,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: COLORS.light,
  },

  // Links
  forgotLink: {
    fontFamily: fonts.uiLight,
    fontSize: 11,
    color: COLORS.gold,
    textAlign: 'center',
    marginTop: 2,
  },

  // Social Sign In
  socialDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  socialDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(196,159,88,0.2)',
  },
  socialDividerText: {
    fontFamily: fonts.uiLight,
    fontSize: 10,
    color: COLORS.light,
    paddingHorizontal: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  socialButtons: {
    gap: 10,
  },
  appleButton: {
    width: '100%',
    height: 44,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: 'rgba(196,159,88,0.25)',
    borderRadius: 2,
    paddingVertical: 12,
    gap: 8,
  },
  googleButtonText: {
    fontFamily: fonts.ui,
    fontSize: 14,
    color: COLORS.text,
  },

  // Footer
  footerNote: {
    fontFamily: fonts.uiLight,
    fontSize: 9.5,
    color: COLORS.light,
    letterSpacing: 0.5,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 18,
  },

  // Undo Toast
  undoToast: {
    position: 'absolute',
    bottom: 100,
    left: 24,
    right: 24,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
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
    fontFamily: fonts.ui,
    fontSize: 14,
    color: COLORS.text,
  },
  undoButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: COLORS.gold,
    borderRadius: 6,
  },
  undoButtonText: {
    fontFamily: fonts.ui,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },
  undoProgressBar: {
    height: 3,
    backgroundColor: COLORS.gold,
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
    borderBottomColor: 'rgba(196,159,88,0.15)',
    backgroundColor: COLORS.white,
  },
  modalTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: COLORS.text,
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
    borderColor: COLORS.blue,
    backgroundColor: `${COLORS.blue}08`,
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
    fontFamily: fonts.ui,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  languageItemNativeSelected: {
    color: COLORS.blue,
  },
  languageItemEnglish: {
    fontFamily: fonts.uiLight,
    fontSize: 13,
    color: COLORS.mid,
    marginTop: 2,
  },
});
