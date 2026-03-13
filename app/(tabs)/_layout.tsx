import { Tabs } from 'expo-router';
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useHaptics } from '../../src/hooks/useHaptics';
import { colors, fonts } from '../../src/theme/colors';

type IoniconsName = keyof typeof Ionicons.glyphMap;

// Tab configuration - order matters! Only 4 tabs per brief
const TAB_ORDER = ['index', 'locations', 'pass', 'profile'] as const;

const TAB_CONFIG: Record<string, {
  icon: IoniconsName;
  iconOutline: IoniconsName;
  label: string;
}> = {
  index: { icon: 'home', iconOutline: 'home-outline', label: 'HOME' },
  locations: { icon: 'calendar', iconOutline: 'calendar-outline', label: 'BOOK' },
  pass: { icon: 'qr-code', iconOutline: 'qr-code-outline', label: 'PASS' },
  profile: { icon: 'person', iconOutline: 'person-outline', label: 'PROFILE' },
};

// Tab Button Component
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
          color={isFocused ? colors.gold : colors.charcoal30}
        />
        <Text style={[
          styles.tabLabel,
          { color: isFocused ? colors.gold : colors.charcoal30 }
        ]}>
          {config.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// Custom TabBar - minimal cream design
function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  // Get routes in the correct order (only visible tabs)
  const orderedRoutes = TAB_ORDER.map(name =>
    state.routes.find(r => r.name === name)
  ).filter(Boolean);

  return (
    <View style={[
      styles.tabBarContainer,
      { paddingBottom: insets.bottom }
    ]}>
      <View style={styles.tabBar}>
        {orderedRoutes.map((route) => {
          if (!route) return null;

          const isFocused = state.routes[state.index]?.name === route.name;
          const config = TAB_CONFIG[route.name];

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
      {/* Primary tabs - 4 only */}
      <Tabs.Screen name="index" />
      <Tabs.Screen name="locations" />
      <Tabs.Screen name="pass" />
      <Tabs.Screen name="profile" />
      {/* Hidden screens - accessible from Profile or navigation */}
      <Tabs.Screen name="events" options={{ href: null }} />
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
  tabBarContainer: {
    backgroundColor: colors.cream,
    borderTopWidth: 1,
    borderTopColor: colors.charcoal10,
  },
  tabBar: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'center',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: fonts.sansSemiBold,
    marginTop: 4,
    letterSpacing: 1,
  },
});
