import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, getSafeSession, clearAuthState } from '../lib/supabase';
import { colors, spacing } from '../src/theme';

export default function AuthTest() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const addStatus = (message: string) => {
    setStatus(prev => (prev ? `${prev}\n${message}` : message));
  };

  const testConnection = async () => {
    setLoading(true);
    setStatus('');
    addStatus('Testing Supabase connection...');

    try {
      // Test basic connection
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) {
        addStatus(`Connection failed: ${error.message}`);
        return;
      }

      addStatus('Supabase connected!');

      // Check env vars
      const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const keyExists = !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      addStatus(`URL: ${url ? url.substring(0, 30) + '...' : 'NOT SET'}`);
      addStatus(`Anon Key: ${keyExists ? 'SET' : 'NOT SET'}`);
    } catch (error) {
      addStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testSession = async () => {
    setLoading(true);
    setStatus('');
    addStatus('Checking session...');

    try {
      const session = await getSafeSession();

      if (session) {
        addStatus(`Session valid`);
        addStatus(`User: ${session.user.email}`);
        if (session.expires_at) {
          addStatus(`Expires: ${new Date(session.expires_at * 1000).toLocaleString()}`);
        }
      } else {
        addStatus('No valid session');
      }
    } catch (error) {
      addStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testSignIn = async () => {
    if (!email || !password) {
      setStatus('Please enter email and password');
      return;
    }

    setLoading(true);
    setStatus('');
    addStatus('Signing in...');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        addStatus(`Sign in failed: ${error.message}`);
        return;
      }

      addStatus(`Signed in as ${data.user?.email}`);
      addStatus('Session stored successfully');
    } catch (error) {
      addStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const clearAuth = async () => {
    setLoading(true);
    setStatus('');
    addStatus('Clearing auth state...');

    try {
      await AsyncStorage.clear();
      await supabase.auth.signOut();
      await clearAuthState();
      addStatus('Auth state cleared!');
      addStatus('AsyncStorage cleared');
      addStatus('Session removed');
    } catch (error) {
      addStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const viewStorageKeys = async () => {
    setLoading(true);
    setStatus('');
    addStatus('Checking AsyncStorage...');

    try {
      const keys = await AsyncStorage.getAllKeys();
      addStatus(`Found ${keys.length} keys:`);
      keys.forEach(key => addStatus(`  - ${key}`));
    } catch (error) {
      addStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={colors.navy} />
            </TouchableOpacity>
            <Text style={styles.title}>Auth Test</Text>
          </View>

          {/* Test Buttons */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={testConnection}
              disabled={loading}
            >
              <Ionicons name="cloud-outline" size={20} color={colors.white} />
              <Text style={styles.buttonText}>Test Connection</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={testSession}
              disabled={loading}
            >
              <Ionicons name="key-outline" size={20} color={colors.white} />
              <Text style={styles.buttonText}>Check Session</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary, loading && styles.buttonDisabled]}
              onPress={viewStorageKeys}
              disabled={loading}
            >
              <Ionicons name="list-outline" size={20} color={colors.navy} />
              <Text style={[styles.buttonText, styles.buttonTextSecondary]}>View Storage Keys</Text>
            </TouchableOpacity>
          </View>

          {/* Sign In Form */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Test Sign In</Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor={colors.mediumGray}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor={colors.mediumGray}
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={testSignIn}
              disabled={loading}
            >
              <Ionicons name="log-in-outline" size={20} color={colors.white} />
              <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Danger Zone */}
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>
            <TouchableOpacity
              style={[styles.button, styles.buttonDanger, loading && styles.buttonDisabled]}
              onPress={clearAuth}
              disabled={loading}
            >
              <Ionicons name="trash-outline" size={20} color={colors.white} />
              <Text style={styles.buttonText}>Clear All Auth State</Text>
            </TouchableOpacity>
          </View>

          {/* Status Output */}
          {status ? (
            <View style={styles.statusContainer}>
              <Text style={styles.statusLabel}>Output:</Text>
              <ScrollView style={styles.statusScroll} nestedScrollEnabled>
                <Text style={styles.statusText}>{status}</Text>
              </ScrollView>
            </View>
          ) : null}
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.navy,
  },
  buttonGroup: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  button: {
    backgroundColor: colors.navy,
    padding: spacing.md,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  buttonSecondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.navy,
  },
  buttonDanger: {
    backgroundColor: colors.error,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: colors.navy,
  },
  formSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.darkGray,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  dangerTitle: {
    color: colors.error,
  },
  input: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.lightGray,
    fontSize: 16,
    color: colors.black,
  },
  statusContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.darkGray,
    marginBottom: spacing.sm,
  },
  statusScroll: {
    maxHeight: 200,
  },
  statusText: {
    fontSize: 14,
    color: colors.navy,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 20,
  },
});
