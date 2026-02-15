import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Dimensions,
  Easing,
} from 'react-native';

interface SplashScreenProps {
  onFinish: () => void;
}

const { width, height } = Dimensions.get('window');

// Brand colors
const CREAM = '#FAF4ED';
const BLUE = '#2B5F9F';

// Logo size (matches large splash logo)
const LOGO_SIZE = 120;

// Tab bar home button size
const TAB_BUTTON_SIZE = 52;

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  // Animation values
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;

  // Position animation for dive to tab bar
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const logoScaleAnim = useRef(new Animated.Value(1)).current;

  // Final fade out
  const fadeOutAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // PHASE 1: SPIN + COLOR INVERT (800ms)
    const phase1 = Animated.parallel([
      // 720° counterclockwise rotation (2 full spins)
      Animated.timing(rotationAnim, {
        toValue: -2,
        duration: 800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      // Scale pulse: 1 → 0.9 → 1.1 → 1.0
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      // Color transition
      Animated.timing(colorAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }),
    ]);

    // PHASE 2: DIVE TO TAB BAR (500ms)
    // Target: center bottom where tab bar home button sits (adjusted 4px lower)
    const targetY = (height / 2) - 86;

    const phase2 = Animated.parallel([
      // Dive down to tab bar position with spring bounce
      Animated.spring(translateYAnim, {
        toValue: targetY,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      // Scale down to match tab bar button (52px / 120px ≈ 0.43)
      Animated.spring(logoScaleAnim, {
        toValue: 0.43,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]);

    // PHASE 3: Fade out to reveal app (200ms)
    const phase3 = Animated.timing(fadeOutAnim, {
      toValue: 0,
      duration: 200,
      delay: 100,
      useNativeDriver: true,
    });

    // Run sequence
    Animated.sequence([phase1, phase2, phase3]).start(onFinish);
  }, []);

  // Interpolations
  const rotation = rotationAnim.interpolate({
    inputRange: [-2, 0],
    outputRange: ['-720deg', '0deg'],
  });

  // Background: cream → blue
  const backgroundColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CREAM, BLUE],
  });

  // Circle: cream (invisible on cream bg) → blue (matches focused home button)
  const circleBackground = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CREAM, BLUE],
  });

  // Letter M: blue (visible on cream) → cream (visible on blue circle)
  const letterColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [BLUE, CREAM],
  });

  return (
    <Animated.View style={[styles.container, { backgroundColor, opacity: fadeOutAnim }]}>
      {/* M Circle Logo */}
      <Animated.View
        style={[
          styles.logoWrapper,
          {
            transform: [
              { translateY: translateYAnim },
              { rotate: rotation },
              { scale: Animated.multiply(scaleAnim, logoScaleAnim) },
            ],
          },
        ]}
      >
        <Animated.View style={[styles.circle, { backgroundColor: circleBackground }]}>
          <Animated.Text style={[styles.letterM, { color: letterColor }]}>
            M
          </Animated.Text>
        </Animated.View>
      </Animated.View>
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
  },
  logoWrapper: {
    position: 'absolute',
  },
  circle: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  letterM: {
    fontSize: 56,
    fontWeight: '300',
    letterSpacing: 2,
  },
});
