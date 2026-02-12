import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing } from '../src/theme';
import { useHaptics } from '../src/hooks/useHaptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Placeholder video paths - will be replaced with actual videos
// const NYC_VIDEOS = [
//   require('../assets/videos/nyc-soho.mp4'),
//   require('../assets/videos/nyc-dumbo.mp4'),
//   require('../assets/videos/nyc-pigeons.mp4'),
//   require('../assets/videos/nyc-crosswalk.mp4'),
//   require('../assets/videos/nyc-subway.mp4'),
// ];

// For now, use placeholder images until videos are added
const NYC_PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1080', // SoHo street
  'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1080', // NYC skyline
  'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=1080', // Manhattan
  'https://images.unsplash.com/photo-1522083165195-3424ed129620?w=1080', // Brooklyn Bridge
  'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=1080', // NYC night
];

const CROSSFADE_DURATION = 500;
const SLIDE_INTERVAL = 8000;

export default function UnauthenticatedHomeScreen() {
  const router = useRouter();
  const haptics = useHaptics();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const nextFadeAnim = useRef(new Animated.Value(0)).current;

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      // Start crossfade
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: CROSSFADE_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(nextFadeAnim, {
          toValue: 1,
          duration: CROSSFADE_DURATION,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // After fade, update indices
        const newCurrentIndex = nextIndex;
        const newNextIndex = (nextIndex + 1) % NYC_PLACEHOLDER_IMAGES.length;

        setCurrentIndex(newCurrentIndex);
        setNextIndex(newNextIndex);

        // Reset animations instantly
        fadeAnim.setValue(1);
        nextFadeAnim.setValue(0);
      });
    }, SLIDE_INTERVAL);

    return () => clearInterval(timer);
  }, [nextIndex]);

  const handleLogin = () => {
    haptics.light();
    router.push('/(auth)/login');
  };

  const handleSignup = () => {
    haptics.medium();
    router.push('/(auth)/signup');
  };

  return (
    <View style={styles.container}>
      {/* Video/Image Carousel */}
      <View style={styles.carouselContainer}>
        {/* Current Image */}
        <Animated.View style={[styles.imageWrapper, { opacity: fadeAnim }]}>
          <Image
            source={{ uri: NYC_PLACEHOLDER_IMAGES[currentIndex] }}
            style={styles.carouselImage}
            onLoad={() => setIsLoading(false)}
          />
        </Animated.View>

        {/* Next Image (underneath, fading in) */}
        <Animated.View style={[styles.imageWrapper, styles.nextImage, { opacity: nextFadeAnim }]}>
          <Image
            source={{ uri: NYC_PLACEHOLDER_IMAGES[nextIndex] }}
            style={styles.carouselImage}
          />
        </Animated.View>

        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.gold} />
          </View>
        )}

        {/* Gradient overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
          locations={[0, 0.5, 1]}
          style={styles.gradientOverlay}
        />

        {/* Logo */}
        <SafeAreaView style={styles.logoContainer} edges={['top']}>
          <Text style={styles.logoText}>MASLOW</Text>
          <Text style={styles.tagline}>Your Sanctuary Awaits</Text>
        </SafeAreaView>

        {/* Page indicators */}
        <View style={styles.indicators}>
          {NYC_PLACEHOLDER_IMAGES.map((_, index) => (
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

      {/* Bottom buttons */}
      <SafeAreaView style={styles.buttonsContainer} edges={['bottom']}>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          activeOpacity={0.8}
        >
          <Text style={styles.loginButtonText}>Log In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signupButton}
          onPress={handleSignup}
          activeOpacity={0.8}
        >
          <Text style={styles.signupButtonText}>Create Account</Text>
        </TouchableOpacity>

        <Text style={styles.termsText}>
          By continuing, you agree to our Terms of Service
        </Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navy,
  },
  carouselContainer: {
    flex: 1,
    position: 'relative',
  },
  imageWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  nextImage: {
    zIndex: -1,
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.navy,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  logoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  tagline: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.8,
    marginTop: spacing.xs,
    fontWeight: '500',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  indicators: {
    position: 'absolute',
    bottom: 180,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  indicatorActive: {
    backgroundColor: colors.gold,
    width: 24,
  },
  buttonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  loginButton: {
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
  termsText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
