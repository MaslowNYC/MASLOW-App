import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { StripeProvider } from '@stripe/stripe-react-native';
import { supabase, getSafeSession, clearAuthState } from '../lib/supabase';
import SplashScreen from '../src/components/SplashScreen';
import { ConciergeBubble, AccessibilityQuestionnaire, PreferencesModal } from '../src/components';
import { AccessibilityProvider } from '../src/context/AccessibilityContext';
import { ConciergeProvider } from '../src/context/ConciergeContext';
import { LanguageProvider } from '../src/context/LanguageContext';
import { initializeLanguage } from '../src/i18n';

function RootLayoutContent() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [showContent, setShowContent] = useState(false); // Homepage renders underneath splash
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Initialize auth state with error handling
    const initAuth = async () => {
      try {
        // Use getSafeSession to handle invalid tokens gracefully
        const currentSession = await getSafeSession();
        setSession(currentSession);
        // Initialize language based on user preference or device
        await initializeLanguage(currentSession?.user?.id);
      } catch (error) {
        console.error('Auth init error:', error);
        // Clear any bad state
        await clearAuthState();
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth event:', event);

        // Handle specific error events
        if (event === 'SIGNED_OUT') {
          setSession(null);
          // Reset to device language on sign out
          await initializeLanguage();
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(newSession);
          // Load user's language preference
          if (event === 'SIGNED_IN' && newSession?.user?.id) {
            await initializeLanguage(newSession.user.id);
          }
        } else {
          setSession(newSession);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Check if user needs to complete accessibility onboarding or see preferences modal
  useEffect(() => {
    const checkOnboarding = async () => {
      if (!session) {
        setShowQuestionnaire(false);
        setShowPreferencesModal(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('accessibility_onboarded, accessibility_settings')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error checking onboarding:', error);
          return;
        }

        // Show questionnaire if not onboarded
        if (data?.accessibility_onboarded !== true) {
          setShowQuestionnaire(true);
          setShowPreferencesModal(false);
        } else {
          // Already onboarded - check if preferences modal should show
          setShowQuestionnaire(false);
          const settings = data?.accessibility_settings || {};
          // Show preferences modal on login unless user opted out
          if (!settings.skip_preferences_modal) {
            setShowPreferencesModal(true);
          }
        }
      } catch (error) {
        console.error('Error checking onboarding:', error);
      }
    };

    if (!loading && session && !showSplash) {
      checkOnboarding();
    }
  }, [session, loading, showSplash]);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isWelcome = segments[0] === 'welcome';

    if (session && inAuthGroup) {
      // Logged in user on auth page -> go to main app
      router.replace('/(tabs)');
    } else if (!session && !inAuthGroup && !isWelcome) {
      // Not logged in and not on auth/welcome -> show welcome screen
      router.replace('/welcome');
    }
  }, [session, segments, loading]);

  const handleQuestionnaireComplete = () => {
    setShowQuestionnaire(false);
    // Show preferences modal after questionnaire completes
    setShowPreferencesModal(true);
  };

  const handlePreferencesClose = () => {
    setShowPreferencesModal(false);
  };

  // Render homepage underneath splash for smooth crossfade
  return (
    <LanguageProvider userId={session?.user.id ?? null}>
      <AccessibilityProvider userId={session?.user.id ?? null}>
        <ConciergeProvider>
          <View style={styles.container}>
            {/* Homepage renders underneath */}
            {showContent && !showQuestionnaire && <Slot />}

            {/* Accessibility Questionnaire - show after splash, before main app */}
            {!showSplash && showQuestionnaire && session && (
              <AccessibilityQuestionnaire onComplete={handleQuestionnaireComplete} />
            )}

            {/* Preferences Modal - shows after onboarding or on subsequent logins */}
            {!showSplash && session && !showQuestionnaire && (
              <PreferencesModal
                isOpen={showPreferencesModal}
                onClose={handlePreferencesClose}
                userId={session.user.id}
              />
            )}

            {/* DISABLED UNTIL LAUNCH
            {!showSplash && session && !showQuestionnaire && (
              <ConciergeBubble userId={session.user.id} />
            )}
            */}

            {/* Splash overlays on top, fades to reveal homepage */}
            {showSplash && (
              <View style={styles.splashOverlay}>
                <SplashScreen
                  onStart={() => setShowContent(true)}
                  onFinish={() => setShowSplash(false)}
                  variant={loading ? null : (session ? 'authenticated' : 'unauthenticated')}
                />
              </View>
            )}
          </View>
        </ConciergeProvider>
      </AccessibilityProvider>
    </LanguageProvider>
  );
}

export default function RootLayout() {
  return (
    <StripeProvider
      publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
      merchantIdentifier="merchant.com.maslownyc"
    >
      <RootLayoutContent />
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
});
