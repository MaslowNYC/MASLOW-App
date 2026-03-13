import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  Dimensions,
  Text,
} from 'react-native';

type SplashVariant = 'authenticated' | 'unauthenticated' | null;

interface SplashScreenProps {
  onFinish: () => void;
  onStart?: () => void;
  variant?: SplashVariant;
}

const { width, height } = Dimensions.get('window');

const CREAM = '#FAF4ED';
const FADE_IN = 600;
const HOLD = 400;
const FADE_OUT = 400;

export default function SplashScreen({ onFinish, onStart }: SplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    onStart?.();

    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: FADE_IN,
        useNativeDriver: true,
      }),
      Animated.delay(HOLD),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: FADE_OUT,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish();
    });
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.wordmark, { opacity: fadeAnim }]}>
        MASLOW
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: width,
    height: height,
    backgroundColor: CREAM,
  },
  wordmark: {
    fontFamily: 'CormorantGaramond_400Regular',
    fontSize: 36,
    letterSpacing: 12,
    color: '#1C2B3A',
  },
});
