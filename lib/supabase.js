
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Listen for auth state changes and handle errors
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('Auth state changed:', event, session?.user?.email || 'no user');

  // Clear invalid sessions
  if (event === 'TOKEN_REFRESHED' && !session) {
    console.log('Token refresh failed, clearing session');
    await clearAuthState();
  }
});

// Helper to clear all auth state
export async function clearAuthState() {
  try {
    // Clear Supabase auth keys from AsyncStorage
    const keys = await AsyncStorage.getAllKeys();
    const supabaseKeys = keys.filter(key =>
      key.includes('supabase') ||
      key.includes('sb-') ||
      key.includes('auth-token')
    );
    if (supabaseKeys.length > 0) {
      await AsyncStorage.multiRemove(supabaseKeys);
      console.log('Cleared auth keys:', supabaseKeys);
    }
  } catch (error) {
    console.error('Failed to clear auth state:', error);
  }
}

// Helper to safely get session without throwing errors
export async function getSafeSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.log('Session error:', error.message);
      // Clear the bad session
      await supabase.auth.signOut();
      await clearAuthState();
      return null;
    }

    return session;
  } catch (error) {
    console.error('Failed to get session:', error);
    await clearAuthState();
    return null;
  }
}

// Helper to safely refresh session
export async function refreshSession() {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession();

    if (error) {
      console.log('Refresh failed:', error.message);
      await supabase.auth.signOut();
      await clearAuthState();
      return null;
    }

    return session;
  } catch (error) {
    console.error('Failed to refresh session:', error);
    await clearAuthState();
    return null;
  }
}
