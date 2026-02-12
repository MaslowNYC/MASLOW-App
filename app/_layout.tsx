
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase, getSafeSession, clearAuthState } from '../lib/supabase';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Initialize auth state with error handling
    const initAuth = async () => {
      try {
        // Use getSafeSession to handle invalid tokens gracefully
        const currentSession = await getSafeSession();
        setSession(currentSession);
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
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(newSession);
        } else {
          setSession(newSession);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (session && inAuthGroup) {
      router.replace('/(tabs)');
    } else if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    }
  }, [session, segments, loading]);

  return <Slot />;
}
