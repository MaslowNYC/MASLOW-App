
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

const BLUE = '#2C5F8D';
const CREAM = '#F9F2EC';
const GOLD = '#C5A059';

export default function GetStartedScreen() {
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
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>Ready to Experience Dignity?</Text>
          <Text style={styles.description}>
            Join thousands of New Yorkers who never worry about finding a clean restroom again.
          </Text>

          <View style={styles.features}>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>Instant access to all locations</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>Customize your experience</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>Always clean, always private</Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.footer}>
          <View style={styles.dots}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={[styles.dot, styles.dotActive]} />
          </View>

          <TouchableOpacity 
            style={styles.signupButton}
            onPress={() => router.replace('/(auth)/signup')}
          >
            <Text style={styles.signupButtonText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => router.replace('/(auth)/login')}
          >
            <Text style={styles.loginButtonText}>I Already Have an Account</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: CREAM,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 40,
  },
  description: {
    fontSize: 18,
    color: CREAM,
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 48,
    paddingHorizontal: 20,
  },
  features: {
    gap: 16,
    alignSelf: 'stretch',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureIcon: {
    fontSize: 24,
    color: GOLD,
  },
  featureText: {
    fontSize: 18,
    color: CREAM,
    fontWeight: '600',
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
  signupButton: {
    backgroundColor: GOLD,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  signupButtonText: {
    color: '#1A202C',
    fontSize: 18,
    fontWeight: '700',
  },
  loginButton: {
    paddingVertical: 12,
  },
  loginButtonText: {
    color: CREAM,
    fontSize: 16,
    fontWeight: '600',
  },
});