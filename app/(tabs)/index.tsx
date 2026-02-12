import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { colors, spacing } from '../../src/theme';
import { useHaptics } from '../../src/hooks/useHaptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Placeholder colors for Maslow interior images (will be replaced with actual images)
const MASLOW_IMAGES = [
  { color: '#E8E6E1', label: 'Suite 1' },
  { color: '#D4C5B0', label: 'Vanity' },
  { color: '#B8A990', label: 'Details' },
  { color: '#C9B8A3', label: 'Lighting' },
  { color: '#9D8F7D', label: 'Textures' },
  { color: '#A89985', label: 'Zen' },
  { color: '#8B7D6B', label: 'Ambiance' },
];

// Placeholder colors for NYC videos (will be replaced with actual videos)
const NYC_SCENES = [
  { color: '#1a1a2e', label: 'SoHo Streets' },
  { color: '#16213e', label: 'DUMBO Views' },
  { color: '#0f3460', label: 'City Life' },
  { color: '#1a1a2e', label: 'Crosswalk' },
  { color: '#16213e', label: 'Evening Glow' },
];

const AUTHENTICATED_INTERVAL = 3000;
const AUTHENTICATED_FADE_DURATION = 500;
const UNAUTHENTICATED_INTERVAL = 8000;
const UNAUTHENTICATED_FADE_DURATION = 1000;

export default function HomeScreen() {
  const router = useRouter();
  const haptics = useHaptics();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [firstName, setFirstName] = useState<string>('');

  // Carousel state
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const nextFadeAnim = useRef(new Animated.Value(0)).current;

  // Check authentication status
  useEffect(() => {
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      if (session) {
        fetchUserProfile(session.user.id);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
    if (session) {
      fetchUserProfile(session.user.id);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('id', userId)
        .single();

      if (data?.first_name) {
        setFirstName(data.first_name);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  // Carousel animation
  useEffect(() => {
    if (isAuthenticated === null) return;

    const images = isAuthenticated ? MASLOW_IMAGES : NYC_SCENES;
    const interval = isAuthenticated ? AUTHENTICATED_INTERVAL : UNAUTHENTICATED_INTERVAL;
    const fadeDuration = isAuthenticated ? AUTHENTICATED_FADE_DURATION : UNAUTHENTICATED_FADE_DURATION;

    const timer = setInterval(() => {
      const nextIndex = (currentIndex + 1) % images.length;

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: fadeDuration,
          useNativeDriver: true,
        }),
        Animated.timing(nextFadeAnim, {
          toValue: 1,
          duration: fadeDuration,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentIndex(nextIndex);
        fadeAnim.setValue(1);
        nextFadeAnim.setValue(0);
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isAuthenticated, currentIndex]);

  // Loading state
  if (isAuthenticated === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  // Unauthenticated UI
  if (!isAuthenticated) {
    const nextIndex = (currentIndex + 1) % NYC_SCENES.length;

    return (
      <View style={styles.unauthContainer}>
        {/* Logo Bar */}
        <SafeAreaView style={styles.logoBar} edges={['top']}>
          <Text style={styles.logoText}>MASLOW</Text>
        </SafeAreaView>

        {/* Video/Scene Carousel */}
        <View style={styles.videoContainer}>
          {/* Current Scene */}
          <Animated.View
            style={[
              styles.scenePlaceholder,
              { backgroundColor: NYC_SCENES[currentIndex].color, opacity: fadeAnim },
            ]}
          >
            <Ionicons name="film-outline" size={48} color="rgba(255,255,255,0.3)" />
            <Text style={styles.sceneLabel}>{NYC_SCENES[currentIndex].label}</Text>
          </Animated.View>

          {/* Next Scene */}
          <Animated.View
            style={[
              styles.scenePlaceholder,
              styles.nextScene,
              { backgroundColor: NYC_SCENES[nextIndex].color, opacity: nextFadeAnim },
            ]}
          >
            <Ionicons name="film-outline" size={48} color="rgba(255,255,255,0.3)" />
            <Text style={styles.sceneLabel}>{NYC_SCENES[nextIndex].label}</Text>
          </Animated.View>

          {/* Gradient Overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']}
            locations={[0, 0.5, 1]}
            style={styles.gradientOverlay}
          />

          {/* Page Indicators */}
          <View style={styles.indicators}>
            {NYC_SCENES.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  currentIndex === index && styles.indicatorActive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Bottom Buttons */}
        <SafeAreaView style={styles.buttonsContainer} edges={['bottom']}>
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => {
                haptics.light();
                router.push('/(auth)/login');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>Log In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.signupButton}
              onPress={() => {
                haptics.medium();
                router.push('/(auth)/signup');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.signupButtonText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Authenticated UI
  const nextIndex = (currentIndex + 1) % MASLOW_IMAGES.length;

  return (
    <SafeAreaView style={styles.authContainer} edges={['top']}>
      {/* Small Logo */}
      <View style={styles.smallLogoContainer}>
        <Text style={styles.smallLogoText}>MASLOW</Text>
      </View>

      {/* Image Carousel */}
      <View style={styles.carouselContainer}>
        {/* Current Image */}
        <Animated.View
          style={[
            styles.imagePlaceholder,
            { backgroundColor: MASLOW_IMAGES[currentIndex].color, opacity: fadeAnim },
          ]}
        >
          <Ionicons name="image-outline" size={48} color="rgba(0,0,0,0.1)" />
          <Text style={styles.imageLabel}>{MASLOW_IMAGES[currentIndex].label}</Text>
        </Animated.View>

        {/* Next Image */}
        <Animated.View
          style={[
            styles.imagePlaceholder,
            styles.nextImage,
            { backgroundColor: MASLOW_IMAGES[nextIndex].color, opacity: nextFadeAnim },
          ]}
        >
          <Ionicons name="image-outline" size={48} color="rgba(0,0,0,0.1)" />
          <Text style={styles.imageLabel}>{MASLOW_IMAGES[nextIndex].label}</Text>
        </Animated.View>
      </View>

      {/* Compact Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => {
            haptics.light();
            router.push('/quick-visit');
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="flash-outline" size={18} color={colors.navy} />
          <Text style={styles.quickActionText}>Quick Visit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => {
            haptics.light();
            router.push('/(tabs)/locations');
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="calendar-outline" size={18} color={colors.navy} />
          <Text style={styles.quickActionText}>Reserve</Text>
        </TouchableOpacity>
      </View>

      {/* Welcome Text */}
      {firstName && (
        <Text style={styles.welcomeText}>Welcome back, {firstName}</Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.cream,
  },

  // Unauthenticated styles
  unauthContainer: {
    flex: 1,
    backgroundColor: colors.navy,
  },
  logoBar: {
    backgroundColor: colors.cream,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.navy,
    letterSpacing: 6,
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: colors.navy,
  },
  scenePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextScene: {
    zIndex: -1,
  },
  sceneLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: spacing.sm,
    fontWeight: '500',
    letterSpacing: 1,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 250,
  },
  indicators: {
    position: 'absolute',
    bottom: 140,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  indicatorActive: {
    backgroundColor: colors.gold,
    width: 20,
  },
  buttonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  loginButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  signupButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.gold,
    alignItems: 'center',
  },
  signupButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navy,
  },

  // Authenticated styles
  authContainer: {
    flex: 1,
    backgroundColor: '#F5F3F0',
  },
  smallLogoContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  smallLogoText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.navy,
    letterSpacing: 4,
    opacity: 0.6,
  },
  carouselContainer: {
    flex: 1,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextImage: {
    zIndex: -1,
  },
  imageLabel: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.2)',
    marginTop: spacing.sm,
    fontWeight: '500',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    backgroundColor: colors.cream,
    borderWidth: 1.5,
    borderColor: colors.gold,
    borderRadius: 8,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navy,
  },
  welcomeText: {
    fontSize: 14,
    color: colors.navy,
    opacity: 0.5,
    textAlign: 'center',
    paddingBottom: spacing.md,
  },
});
