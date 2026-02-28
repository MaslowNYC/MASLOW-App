import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { useHaptics } from '../../src/hooks/useHaptics';

const COLORS = {
  background: '#0a1628',
  backgroundDark: '#050d1a',
  cardBackground: '#1a2332',
  cardBorder: '#2a3444',
  accent: '#C5A059',
  accentDark: '#a88a4a',
  cream: '#FAF4ED',
  gray: '#6b7280',
  grayLight: '#9ca3af',
  inputBg: '#252d3d',
  inputBorder: '#3a4454',
  error: '#ef4444',
};

export default function ResetPasswordScreen() {
  const router = useRouter();
  const haptics = useHaptics();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // Supabase handles the deep link token automatically via onAuthStateChange
    // We just need to listen for the PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
      }
    });

    // Also check if we already have a session (token already processed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in both fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      haptics.warning();
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      haptics.warning();
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    haptics.medium();
    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setLoading(false);

    if (error) {
      haptics.warning();
      Alert.alert('Reset Failed', error.message);
    } else {
      haptics.success();
      Alert.alert(
        'Password Updated',
        'Your password has been successfully updated. You are now signed in.',
        [
          {
            text: 'Continue',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.backgroundDark, COLORS.background, COLORS.backgroundDark]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.card}>
          <Text style={styles.logoText}>Maslow</Text>
          <Text style={styles.title}>Set New Password</Text>
          <Text style={styles.subtitle}>
            Enter and confirm your new password below.
          </Text>

          {!sessionReady ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={COLORS.accent} size="large" />
              <Text style={styles.loadingText}>Verifying reset link...</Text>
            </View>
          ) : (
            <View style={styles.form}>
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>New Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Minimum 6 characters"
                  placeholderTextColor={COLORS.gray}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  editable={!loading}
                  autoFocus
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter your password"
                  placeholderTextColor={COLORS.gray}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  editable={!loading}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Updating...' : 'Update Password'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
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
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.cream,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.grayLight,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.grayLight,
  },
  form: {
    gap: 20,
  },
  fieldContainer: {
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
});
