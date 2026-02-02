import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

const BLUE = '#2C5F8D';
const CREAM = '#F9F2EC';
const GOLD = '#C5A059';

export default function HowItWorksScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.main, { opacity: fadeAnim }]}>
          <Text style={styles.title}>How It Works</Text>
          <Text style={styles.subtitle}>Simple. Fast. Dignified.</Text>

          <View style={styles.steps}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>📱 Open Your Pass</Text>
                <Text style={styles.stepDesc}>
                  Your unique QR code is always ready in the app
                </Text>
              </View>
            </View>

            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>🔍 Scan at Door</Text>
                <Text style={styles.stepDesc}>
                  Hold your phone up to the scanner at any Maslow location
                </Text>
              </View>
            </View>

            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>✨ Enter & Customize</Text>
                <Text style={styles.stepDesc}>
                  Door unlocks. Adjust lighting, audio, and air quality to your preference
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        <View style={styles.footer}>
          <View style={styles.dots}>
            <View style={styles.dot} />
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
          </View>

          <TouchableOpacity 
            style={styles.nextButton}
            onPress={() => router.push('/(onboarding)/get-started')}
          >
            <Text style={styles.nextButtonText}>Next</Text>
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
  main: {
    flex: 1,
    paddingTop: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: CREAM,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: CREAM,
    opacity: 0.8,
    marginBottom: 48,
  },
  steps: {
    gap: 32,
  },
  step: {
    flexDirection: 'row',
    gap: 20,
  },
  stepNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: GOLD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A202C',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: CREAM,
    marginBottom: 8,
  },
  stepDesc: {
    fontSize: 16,
    color: CREAM,
    opacity: 0.85,
    lineHeight: 24,
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
