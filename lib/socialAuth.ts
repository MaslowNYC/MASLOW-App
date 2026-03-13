import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { supabase } from './supabase';

/**
 * Sign in with Apple
 * Note: Apple only sends user's name and email on the VERY FIRST sign-in.
 * After that, those fields come back null.
 */
export async function signInWithApple() {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (credential.identityToken) {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (error) throw error;

      // Save user's name on first sign-in (Apple only provides this once)
      if (data.user && credential.fullName?.givenName) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          first_name: credential.fullName.givenName,
          last_name: credential.fullName.familyName || null,
          email: credential.email || data.user.email,
        }, { onConflict: 'id' });
      }

      return data;
    }

    return null;
  } catch (e: any) {
    // User cancelled - not an error
    if (e.code === 'ERR_REQUEST_CANCELED') {
      return null;
    }
    throw e;
  }
}

/**
 * Check if Apple Authentication is available on this device
 */
export async function isAppleAuthAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  return await AppleAuthentication.isAvailableAsync();
}

/**
 * Sign in with Google
 * Requires @react-native-google-signin/google-signin package
 * and EAS development build (not Expo Go)
 */
export async function signInWithGoogle() {
  // Note: Google Sign-In requires @react-native-google-signin/google-signin
  // which needs a development build. For now, we'll use Supabase OAuth redirect.
  // This works but opens a browser instead of native Google sign-in.

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'maslow://auth/callback',
      skipBrowserRedirect: false,
    },
  });

  if (error) throw error;
  return data;
}
