import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useHaptics } from '../src/hooks/useHaptics';
import { colors, fonts, shape } from '../src/theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const haptics = useHaptics();

  // Animations
  const logoScale = useRef(new Animated.Value(0.9)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  // Entrance animations
  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleCreateAccount = () => {
    haptics.medium();
    router.push('/(auth)/login?mode=signup');
  };

  const handleLogIn = () => {
    haptics.light();
    router.push('/(auth)/login?mode=signin');
  };

  return (
    <View style={styles.container}>
      {/* Dark moss gradient background */}
      <LinearGradient
        colors={[colors.mossDark, colors.mossLight, colors.mossDark]}
        locations={[0, 0.5, 1]}
        style={styles.gradientBackground}
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Logo Section - top 1/3 */}
          <Animated.View
            style={[
              styles.logoSection,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            {/* Round Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={require('../assets/MASLOW_Round_Inverted.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            {/* Tagline - Cormorant Garamond */}
            <Text style={styles.tagline}>Where the city can wait.</Text>
          </Animated.View>

          {/* Buttons Section */}
          <Animated.View
            style={[
              styles.buttonsSection,
              { opacity: contentOpacity },
            ]}
          >
            {/* Log In - outlined cream */}
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogIn}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>LOG IN</Text>
            </TouchableOpacity>

            {/* Create Account - gold filled */}
            <TouchableOpacity
              style={styles.createAccountButton}
              onPress={handleCreateAccount}
              activeOpacity={0.85}
            >
              <Text style={styles.createAccountButtonText}>CREATE ACCOUNT</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mossDark,
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: SCREEN_HEIGHT * 0.12,
    paddingBottom: 48,
  },

  // Logo Section - positioned in top 1/3
  logoSection: {
    alignItems: 'center',
    marginTop: SCREEN_HEIGHT * 0.05,
  },
  logoContainer: {
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  logoImage: {
    width: 120,
    height: 120,
  },
  tagline: {
    fontSize: 22,
    fontFamily: fonts.serifLight,
    color: colors.cream,
    letterSpacing: 1,
    textAlign: 'center',
    lineHeight: 30,
  },

  // Buttons Section
  buttonsSection: {
    width: '100%',
    gap: 16,
  },
  loginButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 14,
    borderRadius: shape.borderRadius,
    borderWidth: 1.5,
    borderColor: colors.cream,
    backgroundColor: 'transparent',
  },
  loginButtonText: {
    fontSize: 14,
    fontFamily: fonts.sansSemiBold,
    color: colors.cream,
    letterSpacing: 2,
  },
  createAccountButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 14,
    borderRadius: shape.borderRadius,
    backgroundColor: colors.gold,
  },
  createAccountButtonText: {
    fontSize: 14,
    fontFamily: fonts.sansSemiBold,
    color: colors.charcoal,
    letterSpacing: 2,
  },
});
