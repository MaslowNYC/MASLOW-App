import { Tabs, usePathname } from 'expo-router';
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors } from '../../src/theme';

type IoniconsName = keyof typeof Ionicons.glyphMap;

// Tab configuration
const TAB_CONFIG: Record<string, { icon: IoniconsName; iconOutline: IoniconsName }> = {
  index: { icon: 'home', iconOutline: 'home-outline' },
  locations: { icon: 'location', iconOutline: 'location-outline' },
  events: { icon: 'calendar', iconOutline: 'calendar-outline' },
  pass: { icon: 'qr-code', iconOutline: 'qr-code-outline' },
  profile: { icon: 'person-circle', iconOutline: 'person-circle-outline' },
};

// Custom TabBar that shows exactly 4 tabs with no gaps
function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  // Determine which 4 tabs to show
  const isOnLocations = pathname.includes('/locations');

  // Always show these 3, plus either Home or Locations in first slot
  const visibleTabNames = isOnLocations
    ? ['index', 'events', 'pass', 'profile']
    : ['locations', 'events', 'pass', 'profile'];

  // Filter routes to only visible ones
  const visibleRoutes = state.routes.filter((route) =>
    visibleTabNames.includes(route.name)
  );

  return (
    <View
      style={[
        styles.tabBar,
        {
          height: 70 + insets.bottom,
          paddingBottom: insets.bottom + 4,
        },
      ]}
    >
      {visibleRoutes.map((route) => {
        const { options } = descriptors[route.key];
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
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isFocused ? config.icon : config.iconOutline}
              size={24}
              color={isFocused ? colors.gold : colors.darkGray}
            />
          </TouchableOpacity>
        );
      })}
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
      {/* Home - Peaceful landing page */}
      <Tabs.Screen name="index" />
      {/* Locations - List of Maslow locations */}
      <Tabs.Screen name="locations" />
      {/* Events - The Hull events */}
      <Tabs.Screen name="events" />
      {/* Pass - QR code pass */}
      <Tabs.Screen name="pass" />
      {/* Profile/Account */}
      <Tabs.Screen name="profile" />
      {/* Hidden screens - keep for routing but hide from tabs */}
      <Tabs.Screen name="control" options={{ href: null }} />
      <Tabs.Screen name="history" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
