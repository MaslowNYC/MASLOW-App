
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

const BLUE = '#2C5F8D';
const CREAM = '#F9F2EC';
const GOLD = '#C5A059';

export default function WelcomeScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View 
          style={[
            styles.heroSection,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.logo}>MASLOW</Text>
          <Text style={styles.tagline}>Infrastructure of Dignity</Text>
          
          <View style={styles.iconContainer}>
            <Text style={styles.heroIcon}>🚻</Text>
          </View>

          <Text style={styles.headline}>
            Access to clean, private restrooms when you need them most
          </Text>

          <Text style={styles.description}>
            No more searching. No more stress. Just scan, enter, and experience dignity.
          </Text>
        </Animated.View>

        <View style={styles.footer}>
          <View style={styles.dots}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>

          <TouchableOpacity 
            style={styles.nextButton}
            onPress={() => router.push('/(onboarding)/how-it-works')}
          >
            <Text style={styles.nextButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.skipButton}
            onPress={() => router.replace('/(auth)/login')}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BLUE,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  heroSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 56,
    fontWeight: 'bold',
    color: CREAM,
    letterSpacing: 6,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: CREAM,
    opacity: 0.8,
    letterSpacing: 3,
    marginBottom: 48,
  },
  iconContainer: {
    marginBottom: 32,
  },
  heroIcon: {
    fontSize: 80,
  },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    color: CREAM,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 36,
  },
  description: {
    fontSize: 16,
    color: CREAM,
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: CREAM,
    opacity: 0.3,
  },
  dotActive: {
    opacity: 1,
    width: 24,
  },
  nextButton: {
    backgroundColor: GOLD,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  nextButtonText: {
    color: '#1A202C',
    fontSize: 18,
    fontWeight: '700',
  },
  skipButton: {
    paddingVertical: 12,
  },
  skipButtonText: {
    color: CREAM,
    fontSize: 16,
    opacity: 0.7,
  },
});