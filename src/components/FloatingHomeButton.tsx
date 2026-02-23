import React from 'react';
import { TouchableOpacity, StyleSheet, Image, View } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHaptics } from '../hooks/useHaptics';

const COLORS = {
  blue: '#286ABC',
  cream: '#FAF4ED',
  white: '#FFFFFF',
};

export function FloatingHomeButton() {
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  // Don't show on tab screens or auth screens or empty routes
  const firstSegment = segments[0];
  if (!firstSegment || firstSegment === '(tabs)' || firstSegment === '(auth)') {
    return null;
  }

  const handlePress = () => {
    haptics.medium();
    router.push('/(tabs)');
  };

  return (
    <View style={[styles.container, { bottom: insets.bottom + 20 }]} pointerEvents="box-none">
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Image
          source={require('../../assets/maslow-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    zIndex: 1000,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.cream,
    borderWidth: 3,
    borderColor: COLORS.blue,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  logo: {
    width: 36,
    height: 36,
  },
});
