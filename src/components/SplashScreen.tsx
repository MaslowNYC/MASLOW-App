import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import * as ExpoSplashScreen from 'expo-splash-screen';

type SplashVariant = 'authenticated' | 'unauthenticated' | null;

interface SplashScreenProps {
  onFinish: () => void;
  onStart?: () => void;
  variant?: SplashVariant;
}

const { width, height } = Dimensions.get('window');

const BACKGROUND = '#F8F7F4';
const HOLD = 800;
const FADE_OUT = 500;

export default function SplashScreen({ onFinish, onStart }: SplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const startAnimation = async () => {
      onStart?.();

      // Hide native splash now that custom splash is mounted with matching background
      await ExpoSplashScreen.hideAsync();

      // Hold the wordmark, then fade out the entire splash
      Animated.sequence([
        Animated.delay(HOLD),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: FADE_OUT,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onFinish();
      });
    };

    startAnimation();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Animated.Text style={styles.wordmark}>
        MASLOW
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: width,
    height: height,
    backgroundColor: BACKGROUND,
  },
  wordmark: {
    fontFamily: 'CormorantGaramond_400Regular',
    fontSize: 36,
    letterSpacing: 12,
    color: '#1C2B3A',
  },
});
