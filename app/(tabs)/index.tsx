import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { colors, spacing } from '../../src/theme';
import { useHaptics } from '../../src/hooks/useHaptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Luxury powder room images - local assets
const MASLOW_IMAGES = [
  {
    source: require('../../assets/images/Suite.jpg'),
    caption: 'Minimalist Elegance',
  },
  {
    source: require('../../assets/images/room.jpg'),
    caption: 'Marble & Wood Vanity',
  },
  {
    source: require('../../assets/images/vanity.jpg'),
    caption: 'Herringbone Tile Design',
  },
  {
    source: require('../../assets/images/another.jpg'),
    caption: 'Vessel Sink & Marble',
  },
  {
    source: require('../../assets/images/Sink.jpg'),
    caption: 'Gold Fixtures & Marble',
  },
  {
    source: require('../../assets/images/Maslow suite.webp'),
    caption: 'Contemporary Powder Room',
  },
  {
    source: require('../../assets/images/Toilet.webp'),
    caption: 'Modern Luxury Suite',
  },
];

// Placeholder colors for NYC videos (will be replaced with actual videos)
const NYC_SCENES = [
  { color: '#1a1a2e', label: 'SoHo Streets' },
  { color: '#16213e', label: 'DUMBO Views' },
  { color: '#0f3460', label: 'City Life' },
  { color: '#1a1a2e', label: 'Crosswalk' },
  { color: '#16213e', label: 'Evening Glow' },
];

const AUTHENTICATED_INTERVAL = 5000; // 5 seconds per image
const AUTHENTICATED_FADE_DURATION = 1200; // Slower dissolve
const UNAUTHENTICATED_INTERVAL = 8000;
const UNAUTHENTICATED_FADE_DURATION = 1000;

export default function HomeScreen() {
  const router = useRouter();
  const haptics = useHaptics();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [firstName, setFirstName] = useState<string>('');

  // Carousel state - track both indices for smooth crossfade
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const nextFadeAnim = useRef(new Animated.Value(0)).current;

  // Check authentication status
  useEffect(() => {
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      setCurrentIndex(0); // Reset carousel index on auth change
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

  // Carousel animation - smooth crossfade without glitches
  useEffect(() => {
    if (isAuthenticated === null || isTransitioning) return;

    const images = isAuthenticated ? MASLOW_IMAGES : NYC_SCENES;
    const interval = isAuthenticated ? AUTHENTICATED_INTERVAL : UNAUTHENTICATED_INTERVAL;
    const fadeDuration = isAuthenticated ? AUTHENTICATED_FADE_DURATION : UNAUTHENTICATED_FADE_DURATION;

    const timer = setTimeout(() => {
      setIsTransitioning(true);
      const upcomingIndex = (currentIndex + 1) % images.length;
      setNextIndex(upcomingIndex);

      // Crossfade: current fades out, next fades in
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
        // After fade completes, swap indices and reset opacities
        setCurrentIndex(upcomingIndex);
        setNextIndex((upcomingIndex + 1) % images.length);
        fadeAnim.setValue(1);
        nextFadeAnim.setValue(0);
        setIsTransitioning(false);
      });
    }, interval);

    return () => clearTimeout(timer);
  }, [isAuthenticated, currentIndex, isTransitioning]);

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
    const displayNextIndex = nextIndex % NYC_SCENES.length;

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
              { backgroundColor: NYC_SCENES[displayNextIndex].color, opacity: nextFadeAnim },
            ]}
          >
            <Ionicons name="film-outline" size={48} color="rgba(255,255,255,0.3)" />
            <Text style={styles.sceneLabel}>{NYC_SCENES[displayNextIndex].label}</Text>
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
  const displayNextIndex = nextIndex % MASLOW_IMAGES.length;

  return (
    <SafeAreaView style={styles.authContainer} edges={['top']}>
      {/* Small Logo */}
      <View style={styles.smallLogoContainer}>
        <Text style={styles.smallLogoText}>MASLOW</Text>
      </View>

      {/* Image Carousel */}
      <View style={styles.carouselContainer}>
        {/* Current Image */}
        <Animated.View style={[styles.imageWrapper, { opacity: fadeAnim }]}>
          <Image
            source={MASLOW_IMAGES[currentIndex].source}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.imageOverlay}>
            <Text style={styles.overlayText}>New York's First Real Restroom</Text>
            <Text style={styles.overlaySubtext}>{MASLOW_IMAGES[currentIndex].caption}</Text>
          </View>
        </Animated.View>

        {/* Next Image */}
        <Animated.View style={[styles.imageWrapper, styles.nextImage, { opacity: nextFadeAnim }]}>
          <Image
            source={MASLOW_IMAGES[displayNextIndex].source}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.imageOverlay}>
            <Text style={styles.overlayText}>New York's First Real Restroom</Text>
            <Text style={styles.overlaySubtext}>{MASLOW_IMAGES[displayNextIndex].caption}</Text>
          </View>
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
  imageWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  nextImage: {
    zIndex: -1,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  overlayText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 1,
  },
  overlaySubtext: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 4,
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
