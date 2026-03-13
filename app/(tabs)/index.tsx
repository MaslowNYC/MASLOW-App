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
import { supabase } from '../../lib/supabase';
import { colors, fonts, shape } from '../../src/theme/colors';
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

const CAROUSEL_INTERVAL = 5000;
const FADE_DURATION = 1200;

// Get time-based greeting
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export default function HomeScreen() {
  const router = useRouter();
  const haptics = useHaptics();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [firstName, setFirstName] = useState<string>('');

  // Carousel state
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
      setCurrentIndex(0);
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
    if (isAuthenticated === null || !isAuthenticated || isTransitioning) return;

    const timer = setTimeout(() => {
      setIsTransitioning(true);
      const upcomingIndex = (currentIndex + 1) % MASLOW_IMAGES.length;
      setNextIndex(upcomingIndex);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: FADE_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(nextFadeAnim, {
          toValue: 1,
          duration: FADE_DURATION,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentIndex(upcomingIndex);
        setNextIndex((upcomingIndex + 1) % MASLOW_IMAGES.length);
        fadeAnim.setValue(1);
        nextFadeAnim.setValue(0);
        setIsTransitioning(false);
      });
    }, CAROUSEL_INTERVAL);

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

  // Redirect to welcome if not authenticated (shouldn't render here)
  if (!isAuthenticated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  // Authenticated UI
  const displayNextIndex = nextIndex % MASLOW_IMAGES.length;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header: Logo left-aligned */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/MASLOW_Round_Inverted.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>
            {getGreeting()}, {firstName || 'there'}.
          </Text>
          <Text style={styles.subLabel}>YOUR NEXT VISIT</Text>
        </View>

        {/* Image Carousel - full width, edge to edge */}
        <View style={styles.carouselContainer}>
          {/* Current Image */}
          <Animated.View style={[styles.imageWrapper, { opacity: fadeAnim }]}>
            <Image
              source={MASLOW_IMAGES[currentIndex].source}
              style={styles.heroImage}
              resizeMode="cover"
            />
          </Animated.View>

          {/* Next Image */}
          <Animated.View style={[styles.imageWrapper, styles.nextImage, { opacity: nextFadeAnim }]}>
            <Image
              source={MASLOW_IMAGES[displayNextIndex].source}
              style={styles.heroImage}
              resizeMode="cover"
            />
          </Animated.View>
        </View>

        {/* Quick Actions - charcoal bg, cream text, full width */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => {
              haptics.light();
              router.push('/(tabs)/locations');
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.quickActionText}>BOOK A VISIT</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => {
              haptics.light();
              router.push('/(tabs)/pass');
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.quickActionText}>MY PASS</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.cream,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  logoImage: {
    width: 40,
    height: 40,
  },

  // Greeting
  greetingSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontFamily: fonts.serifLight,
    color: colors.charcoal,
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 11,
    fontFamily: fonts.sansSemiBold,
    color: colors.gold,
    letterSpacing: 3,
  },

  // Carousel - full width, no border radius
  carouselContainer: {
    flex: 1,
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

  // Quick Actions
  quickActionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  quickActionButton: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: colors.charcoal,
    borderRadius: shape.borderRadius,
  },
  quickActionText: {
    fontSize: 14,
    fontFamily: fonts.sansSemiBold,
    color: colors.cream,
    letterSpacing: 2,
  },
});
