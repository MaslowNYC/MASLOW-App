import React, { useEffect, useRef, useState } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Animated,
  View,
  Text,
  Modal,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHaptics } from '../hooks/useHaptics';
import { ConciergeChat } from './ConciergeChat';
import { useConcierge } from '../context/ConciergeContext';

const COLORS = {
  blue: '#286BCD',
  cream: '#FAF4ED',
  white: '#FFFFFF',
  gold: '#C49F58',
  darkGray: '#4A5568',
};

interface ConciergeBubbleProps {
  userId: string | null;
}

export function ConciergeBubble({ userId }: ConciergeBubbleProps) {
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const { isVisible, setIsVisible } = useConcierge();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  const handleDismiss = () => {
    haptics.light();
    Alert.alert(
      'Hide Concierge?',
      'You can bring it back anytime in Settings → Preferences → Show Concierge',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Hide',
          onPress: async () => {
            await setIsVisible(false);
          },
        },
      ]
    );
  };

  // Pulsing animation
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.6,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, []);

  const handlePress = () => {
    haptics.medium();
    setIsChatOpen(true);
  };

  const handleClose = () => {
    haptics.light();
    setIsChatOpen(false);
  };

  // Don't render if no user or hidden
  if (!userId || !isVisible) {
    return null;
  }

  return (
    <>
      {/* Floating Bubble */}
      <View
        style={[
          styles.container,
          {
            bottom: 80, // Fixed position above tab bar
            right: 20,
          },
        ]}
        pointerEvents="box-none"
      >
        {/* Dismiss X Button */}
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={12} color={COLORS.darkGray} />
        </TouchableOpacity>

        {/* Glow Effect */}
        <Animated.View
          style={[
            styles.glow,
            {
              opacity: glowAnim,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />

        {/* Main Button */}
        <Animated.View
          style={{
            transform: [{ scale: pulseAnim }],
          }}
        >
          <TouchableOpacity
            style={styles.bubble}
            onPress={handlePress}
            activeOpacity={0.8}
          >
            {/* Maslow Logo */}
            <Image
              source={require('../../assets/MASLOW_Round_Inverted.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Label */}
        <View style={styles.labelContainer}>
          <Text style={styles.labelText}>Concierge</Text>
        </View>
      </View>

      {/* Chat Modal */}
      <Modal
        visible={isChatOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleClose}
      >
        <ConciergeChat userId={userId} onClose={handleClose} />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 999,
    alignItems: 'center',
  },
  dismissButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  glow: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.blue,
  },
  bubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.blue,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  labelContainer: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  labelText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.blue,
  },
});
