import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { supabase, getSafeSession, clearAuthState } from '../lib/supabase';
import SplashScreen from '../src/components/SplashScreen';
import { ConciergeBubble, AccessibilityQuestionnaire } from '../src/components';
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

  // Check if user needs to complete accessibility onboarding
  useEffect(() => {
    const checkAccessibilityOnboarding = async () => {
      if (!session) {
        setShowQuestionnaire(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('accessibility_onboarded')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error checking accessibility onboarding:', error);
          return;
        }

        // Show questionnaire if not onboarded
        setShowQuestionnaire(data?.accessibility_onboarded !== true);
      } catch (error) {
        console.error('Error checking accessibility onboarding:', error);
      }
    };

    if (!loading && session && !showSplash) {
      checkAccessibilityOnboarding();
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

            {/* AI Concierge bubble - only show when logged in, splash done, and onboarded */}
            {!showSplash && session && !showQuestionnaire && (
              <ConciergeBubble userId={session.user.id} />
            )}

            {/* Splash overlays on top, fades to reveal homepage */}
            {showSplash && (
              <View style={styles.splashOverlay}>
                <SplashScreen
                  onStart={() => setShowContent(true)}
                  onFinish={() => setShowSplash(false)}
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
  return <RootLayoutContent />;
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
