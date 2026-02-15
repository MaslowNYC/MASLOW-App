import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

const COLORS = {
  black: '#1A1A1A',
  darkGray: '#2A2A2A',
  borderGray: '#3A3A3A',
  textGray: '#9CA3AF',
  gold: '#C5A059',
  white: '#FFFFFF',
  error: '#EF4444',
};

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  initialTab?: 'signin' | 'signup';
}

export default function AuthModal({ visible, onClose, initialTab = 'signin' }: AuthModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(initialTab);
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [userId, setUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
  });

  const [errors, setErrors] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
  });

  useEffect(() => {
    if (visible) {
      setActiveTab(initialTab);
      setShowVerification(false);
      setVerificationCode(['', '', '', '', '', '']);
    }
  }, [visible, initialTab]);

  const handleClose = () => {
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
    });
    setErrors({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
    });
    setShowVerification(false);
    setVerificationCode(['', '', '', '', '', '']);
    onClose();
  };

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validatePhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10;
  };

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setFormData({ ...formData, phone: formatted });
    setErrors({ ...errors, phone: '' });
  };

  const handleSignIn = async () => {
    const newErrors = { ...errors };
    let hasError = false;

    if (!formData.email) {
      newErrors.email = 'Email is required';
      hasError = true;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email address';
      hasError = true;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email.trim(),
      password: formData.password,
    });

    if (error) {
      Alert.alert('Sign In Failed', error.message);
      setLoading(false);
    } else {
      setLoading(false);
      handleClose();
    }
  };

  const handleSignUp = async () => {
    const newErrors = {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
    };
    let hasError = false;

    if (!formData.firstName) {
      newErrors.firstName = 'First name is required';
      hasError = true;
    }

    if (!formData.lastName) {
      newErrors.lastName = 'Last name is required';
      hasError = true;
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
      hasError = true;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email address';
      hasError = true;
    }

    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
      hasError = true;
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Invalid phone number';
      hasError = true;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      hasError = true;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email.trim(),
      password: formData.password,
      options: {
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
        },
      },
    });

    if (authError) {
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

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const cleanPhone = formData.phone.replace(/\D/g, '');
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: authData.user.id,
      first_name: formData.firstName,
      last_name: formData.lastName,
      phone: cleanPhone,
      verification_code: parseInt(code),
      code_expires_at: expiresAt.toISOString(),
      phone_verified: false,
    });

    if (profileError) {
      console.error('Profile error:', profileError);
    }

    console.log(`[SMS] Verification code for ${formData.phone}: ${code}`);
    Alert.alert(
      'Code Sent',
      `Verification code sent to ${formData.phone}\n\n[DEV MODE: Code is ${code}]`
    );

    setLoading(false);
    setShowVerification(true);
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

    setLoading(true);

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

    if (profile.verification_code?.toString() !== enteredCode) {
      Alert.alert('Invalid Code', 'The code you entered is incorrect');
      setLoading(false);
      return;
    }

    if (new Date(profile.code_expires_at) < new Date()) {
      Alert.alert('Code Expired', 'The verification code has expired. Please request a new one.');
      setLoading(false);
      return;
    }

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

    setLoading(false);
    handleClose();
  };

  const handleResendCode = async () => {
    if (!userId) return;

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const { error } = await supabase.from('profiles').update({
      verification_code: parseInt(code),
      code_expires_at: expiresAt.toISOString(),
    }).eq('id', userId);

    if (error) {
      Alert.alert('Error', 'Failed to resend code');
      return;
    }

    console.log(`[SMS] Verification code resent: ${code}`);
    Alert.alert('Code Sent', `New verification code sent!\n\n[DEV MODE: Code is ${code}]`);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />

        <View style={styles.modalContent}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {!showVerification ? (
              <>
                <Text style={styles.title}>Maslow</Text>
                <Text style={styles.subtitle}>The Infrastructure of Dignity</Text>

                <View style={styles.tabContainer}>
                  <TouchableOpacity
                    style={[styles.tab, activeTab === 'signin' && styles.tabActive]}
                    onPress={() => setActiveTab('signin')}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        activeTab === 'signin' && styles.tabTextActive,
                      ]}
                    >
                      Sign In
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.tab, activeTab === 'signup' && styles.tabActive]}
                    onPress={() => setActiveTab('signup')}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        activeTab === 'signup' && styles.tabTextActive,
                      ]}
                    >
                      Sign Up
                    </Text>
                  </TouchableOpacity>
                </View>

                {activeTab === 'signin' && (
                  <View>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="you@example.com"
                      placeholderTextColor={COLORS.textGray}
                      value={formData.email}
                      onChangeText={(text) => {
                        setFormData({ ...formData, email: text });
                        setErrors({ ...errors, email: '' });
                      }}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      editable={!loading}
                    />
                    {errors.email ? (
                      <Text style={styles.errorText}>{errors.email}</Text>
                    ) : null}

                    <Text style={styles.label}>Password</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor={COLORS.textGray}
                      value={formData.password}
                      onChangeText={(text) => {
                        setFormData({ ...formData, password: text });
                        setErrors({ ...errors, password: '' });
                      }}
                      secureTextEntry
                      editable={!loading}
                    />
                    {errors.password ? (
                      <Text style={styles.errorText}>{errors.password}</Text>
                    ) : null}

                    <TouchableOpacity
                      style={[styles.button, loading && styles.buttonDisabled]}
                      onPress={handleSignIn}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color={COLORS.black} />
                      ) : (
                        <Text style={styles.buttonText}>Sign In</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {activeTab === 'signup' && (
                  <View>
                    <View style={styles.row}>
                      <View style={styles.halfWidth}>
                        <Text style={styles.label}>First Name</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="First name"
                          placeholderTextColor={COLORS.textGray}
                          value={formData.firstName}
                          onChangeText={(text) => {
                            setFormData({ ...formData, firstName: text });
                            setErrors({ ...errors, firstName: '' });
                          }}
                          editable={!loading}
                        />
                        {errors.firstName ? (
                          <Text style={styles.errorText}>{errors.firstName}</Text>
                        ) : null}
                      </View>

                      <View style={styles.halfWidth}>
                        <Text style={styles.label}>Last Name</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="Last name"
                          placeholderTextColor={COLORS.textGray}
                          value={formData.lastName}
                          onChangeText={(text) => {
                            setFormData({ ...formData, lastName: text });
                            setErrors({ ...errors, lastName: '' });
                          }}
                          editable={!loading}
                        />
                        {errors.lastName ? (
                          <Text style={styles.errorText}>{errors.lastName}</Text>
                        ) : null}
                      </View>
                    </View>

                    <Text style={styles.label}>Email</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="you@example.com"
                      placeholderTextColor={COLORS.textGray}
                      value={formData.email}
                      onChangeText={(text) => {
                        setFormData({ ...formData, email: text });
                        setErrors({ ...errors, email: '' });
                      }}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      editable={!loading}
                    />
                    {errors.email ? (
                      <Text style={styles.errorText}>{errors.email}</Text>
                    ) : null}

                    <Text style={styles.label}>Phone Number</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="(555) 123-4567"
                      placeholderTextColor={COLORS.textGray}
                      value={formData.phone}
                      onChangeText={handlePhoneChange}
                      keyboardType="phone-pad"
                      maxLength={14}
                      editable={!loading}
                    />
                    <Text style={styles.helperText}>
                      We'll send a verification code to this number
                    </Text>
                    {errors.phone ? (
                      <Text style={styles.errorText}>{errors.phone}</Text>
                    ) : null}

                    <Text style={styles.label}>Password</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor={COLORS.textGray}
                      value={formData.password}
                      onChangeText={(text) => {
                        setFormData({ ...formData, password: text });
                        setErrors({ ...errors, password: '' });
                      }}
                      secureTextEntry
                      editable={!loading}
                    />
                    <Text style={styles.helperText}>Minimum 6 characters</Text>
                    {errors.password ? (
                      <Text style={styles.errorText}>{errors.password}</Text>
                    ) : null}

                    <TouchableOpacity
                      style={[styles.button, loading && styles.buttonDisabled]}
                      onPress={handleSignUp}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color={COLORS.black} />
                      ) : (
                        <Text style={styles.buttonText}>Create Account</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </>
            ) : (
              <View>
                <Text style={styles.title}>Verify Phone</Text>
                <Text style={styles.subtitle}>
                  Enter the 6-digit code sent to {formData.phone}
                </Text>

                <View style={styles.codeContainer}>
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <TextInput
                      key={index}
                      style={styles.codeInput}
                      maxLength={1}
                      keyboardType="number-pad"
                      value={verificationCode[index]}
                      onChangeText={(text) => {
                        const newCode = [...verificationCode];
                        newCode[index] = text;
                        setVerificationCode(newCode);
                      }}
                      editable={!loading}
                    />
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleVerifyCode}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.black} />
                  ) : (
                    <Text style={styles.buttonText}>Verify</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.resendButton} onPress={handleResendCode}>
                  <Text style={styles.resendText}>Resend Code</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContent: {
    backgroundColor: COLORS.black,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
  },
  scrollView: {
    maxHeight: '100%',
  },
  scrollContent: {
    padding: 32,
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    color: COLORS.gold,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textGray,
    textAlign: 'center',
    marginBottom: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  tabActive: {
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textGray,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.white,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.darkGray,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    padding: 14,
    color: COLORS.white,
    fontSize: 16,
    marginBottom: 16,
  },
  helperText: {
    fontSize: 13,
    color: COLORS.textGray,
    marginTop: -12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.error,
    marginTop: -12,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  button: {
    backgroundColor: COLORS.gold,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  codeInput: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: COLORS.darkGray,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  resendText: {
    fontSize: 14,
    color: COLORS.textGray,
    textDecorationLine: 'underline',
  },
});
