import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  Dimensions,
  Easing,
} from 'react-native';

interface SplashScreenProps {
  onFinish: () => void;
  onStart?: () => void;
}

const { width, height } = Dimensions.get('window');

// Brand colors
const CREAM = '#FAF4ED';

// Animation timing
const INITIAL_HOLD = 500; // Hold on Maslow_1 for 0.5s
const SPIN_DURATION = 2500; // Total spin time
const DRIFT_DURATION = 600; // Drop down duration
const HOLD_DURATION = 200;
const FADE_DURATION = 250;

// Logo frames
const frames = [
  require('../../assets/Maslow_1.png'), // Start - hold here
  require('../../assets/Maslow_2.png'), // Accelerating
  require('../../assets/Maslow_3.png'), // Fast
  require('../../assets/Maslow_4.png'), // Fast
  require('../../assets/Maslow_5.png'), // Fast
  require('../../assets/Maslow_6.png'), // Slowing
  require('../../assets/Maslow_7.png'), // Slowing
  require('../../assets/Maslow_8.png'), // Settle
];

// Frame timing - slower at start/end, faster in middle
// These are cumulative percentages of spin duration when each frame appears
const FRAME_TIMINGS = [
  0,      // Frame 0 (Maslow_1) - start
  0.15,   // Frame 1 (Maslow_2) - slow start
  0.30,   // Frame 2 (Maslow_3) - accelerating
  0.45,   // Frame 3 (Maslow_4) - fast
  0.58,   // Frame 4 (Maslow_5) - fast
  0.70,   // Frame 5 (Maslow_6) - slowing
  0.82,   // Frame 6 (Maslow_7) - slower
  0.92,   // Frame 7 (Maslow_8) - settle
];

// Target position
const TAB_BAR_HEIGHT = 70;
const HOME_BUTTON_SIZE = 68;
const SAFE_AREA_BOTTOM = 34;
const TARGET_Y = (height / 2) - SAFE_AREA_BOTTOM - (TAB_BAR_HEIGHT - HOME_BUTTON_SIZE / 2);

// Scale ratio
const LOGO_SIZE = 180;
const HOME_BUTTON_LOGO_SIZE = 54;
const TARGET_SCALE = HOME_BUTTON_LOGO_SIZE / LOGO_SIZE;

export default function SplashScreen({ onFinish, onStart }: SplashScreenProps) {
  const [currentFrame, setCurrentFrame] = useState(0);

  // Animation values
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    onStart?.();

    // Scale up immediately
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // PHASE 1: Hold on Maslow_1
    setTimeout(() => {
      // Schedule frame changes based on timing array
      const frameTimeouts: NodeJS.Timeout[] = [];
      FRAME_TIMINGS.forEach((timing, index) => {
        if (index > 0) {
          const timeout = setTimeout(() => {
            setCurrentFrame(index);
          }, timing * SPIN_DURATION);
          frameTimeouts.push(timeout);
        }
      });

      // PHASE 2: Spin with ease-in-out (slow-fast-slow)
      Animated.timing(rotationAnim, {
        toValue: 4, // 1440°
        duration: SPIN_DURATION,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Slow start, fast middle, slow end
        useNativeDriver: true,
      }).start(() => {
        // Clear any remaining timeouts
        frameTimeouts.forEach(t => clearTimeout(t));
        setCurrentFrame(frames.length - 1); // Ensure Maslow_8

        // PHASE 3: Drop down with deceleration
        Animated.parallel([
          Animated.timing(translateYAnim, {
            toValue: TARGET_Y,
            duration: DRIFT_DURATION,
            easing: Easing.out(Easing.cubic), // Fast start, gentle landing
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: TARGET_SCALE,
            duration: DRIFT_DURATION,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start(() => {
          // PHASE 4: Hold then fade
          setTimeout(() => {
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: FADE_DURATION,
              useNativeDriver: true,
            }).start(() => {
              onFinish();
            });
          }, HOLD_DURATION);
        });
      });
    }, INITIAL_HOLD);
  }, []);

  // Interpolate rotation (1440° = 4 full rotations)
  const rotation = rotationAnim.interpolate({
    inputRange: [0, 4],
    outputRange: ['0deg', '1440deg'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Animated.Image
        source={frames[currentFrame]}
        style={[
          styles.logo,
          {
            transform: [
              { translateY: translateYAnim },
              { rotate: rotation },
              { scale: scaleAnim },
            ],
          },
        ]}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CREAM,
    justifyContent: 'center',
    alignItems: 'center',
    width: width,
    height: height,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
});
