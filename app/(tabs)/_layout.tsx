import { Tabs } from 'expo-router';
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Animated, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useHaptics } from '../../src/hooks/useHaptics';

type IoniconsName = keyof typeof Ionicons.glyphMap;

// Colors
const COLORS = {
  blue: '#286ABC',
  cream: '#FAF4ED',
  gray: '#6B7280',
  white: '#FFFFFF',
  border: '#E5E7EB',
};

// Tab configuration - order matters!
const TAB_ORDER = ['locations', 'events', 'index', 'pass', 'profile'] as const;

const TAB_CONFIG: Record<string, {
  icon: IoniconsName;
  iconOutline: IoniconsName;
  label: string;
}> = {
  locations: { icon: 'location', iconOutline: 'location-outline', label: 'Locations' },
  events: { icon: 'calendar', iconOutline: 'calendar-outline', label: 'Events' },
  index: { icon: 'home', iconOutline: 'home-outline', label: 'Home' },
  pass: { icon: 'qr-code', iconOutline: 'qr-code-outline', label: 'Pass' },
  profile: { icon: 'person', iconOutline: 'person-outline', label: 'Profile' },
};

// Standard Tab Button Component
function TabButton({
  route,
  isFocused,
  onPress,
  onLongPress,
  config,
}: {
  route: any;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  config: typeof TAB_CONFIG[string];
}) {
  const haptics = useHaptics();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 50,
      bounciness: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 10,
    }).start();
  };

  const handlePress = () => {
    haptics.light();
    onPress();
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      onPress={handlePress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabButton}
      activeOpacity={1}
    >
      <Animated.View style={[styles.tabButtonInner, { transform: [{ scale: scaleAnim }] }]}>
        <Ionicons
          name={isFocused ? config.icon : config.iconOutline}
          size={24}
          color={isFocused ? COLORS.blue : COLORS.gray}
        />
        <Text style={[
          styles.tabLabel,
          { color: isFocused ? COLORS.blue : COLORS.gray }
        ]}>
          {config.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// Elevated Home Button Component
function HomeButton({
  isFocused,
  onPress,
}: {
  isFocused: boolean;
  onPress: () => void;
}) {
  const haptics = useHaptics();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 50,
      bounciness: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 8,
    }).start();
  };

  const handlePress = () => {
    haptics.medium();
    onPress();
  };

  return (
    <View style={styles.homeButtonContainer}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Home"
        accessibilityState={isFocused ? { selected: true } : {}}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <Animated.View style={[
          styles.homeButton,
          isFocused && styles.homeButtonActive,
          { transform: [{ scale: scaleAnim }] }
        ]}>
          <Image
            source={require('../../assets/MASLOW_Round_Inverted.png')}
            style={styles.homeButtonLogo}
            resizeMode="contain"
          />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

// Custom TabBar with elevated center home button
function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  // Get routes in the correct order
  const orderedRoutes = TAB_ORDER.map(name =>
    state.routes.find(r => r.name === name)
  ).filter(Boolean);

  // Find home route for the elevated button
  const homeRoute = state.routes.find(r => r.name === 'index');
  const isHomeFocused = state.routes[state.index]?.name === 'index';

  const onHomePress = () => {
    if (homeRoute) {
      const event = navigation.emit({
        type: 'tabPress',
        target: homeRoute.key,
        canPreventDefault: true,
      });
      if (!isHomeFocused && !event.defaultPrevented) {
        navigation.navigate('index');
      }
    }
  };

  return (
    <View style={styles.tabBarWrapper}>
      {/* Elevated Home Button - rendered ABOVE tab bar to avoid clipping */}
      <View style={styles.elevatedHomeWrapper} pointerEvents="box-none">
        <HomeButton isFocused={isHomeFocused} onPress={onHomePress} />
      </View>

      {/* Main Tab Bar */}
      <View style={[
        styles.tabBarContainer,
        { paddingBottom: insets.bottom }
      ]}>
        <View style={styles.tabBar}>
          {orderedRoutes.map((route, index) => {
            if (!route) return null;

            const { options } = descriptors[route.key];
            const isFocused = state.routes[state.index]?.name === route.name;
            const config = TAB_CONFIG[route.name];
            const isHomeTab = route.name === 'index';

            if (!config) return null;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            // Render empty placeholder for home tab (button is above)
            if (isHomeTab) {
              return <View key={route.key} style={styles.homeTabPlaceholder} />;
            }

            // Render standard tab button
            return (
              <TabButton
                key={route.key}
                route={route}
                isFocused={isFocused}
                onPress={onPress}
                onLongPress={onLongPress}
                config={config}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Define tabs in display order */}
      <Tabs.Screen name="locations" />
      <Tabs.Screen name="events" />
      <Tabs.Screen name="index" />
      <Tabs.Screen name="pass" />
      <Tabs.Screen name="profile" />
      {/* Hidden screens - keep for routing but hide from tabs */}
      <Tabs.Screen name="control" options={{ href: null }} />
      <Tabs.Screen name="history" options={{ href: null }} />
      <Tabs.Screen name="edit-profile" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="quick-visit" options={{ href: null }} />
      <Tabs.Screen name="buy-credits" options={{ href: null }} />
      <Tabs.Screen name="bookings" options={{ href: null }} />
      <Tabs.Screen name="terms" options={{ href: null }} />
      <Tabs.Screen name="privacy" options={{ href: null }} />
      <Tabs.Screen name="book/[locationId]" options={{ href: null }} />
      <Tabs.Screen name="location/[id]" options={{ href: null }} />
      <Tabs.Screen name="transfer-credits" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  // Wrapper that allows home button to extend above
  tabBarWrapper: {
    position: 'relative',
  },
  // Home button wrapper - inline with other tabs
  elevatedHomeWrapper: {
    position: 'absolute',
    top: 0,  // Inline with other icons (use -3 for barely elevated)
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  tabBarContainer: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  tabBar: {
    flexDirection: 'row',
    height: 70,
    alignItems: 'flex-end',
    paddingBottom: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
  },
  tabButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
    letterSpacing: 0.2,
  },

  // Home button placeholder maintains spacing in tab bar
  homeTabPlaceholder: {
    flex: 1,
  },

  // Home button container (no longer needs absolute positioning)
  homeButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  homeButtonActive: {
    // No background change needed - logo handles it
  },
  homeButtonLogo: {
    width: 54,
    height: 54,
  },
});
