import { Tabs } from 'expo-router';

const BLUE = '#2C5F8D';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: BLUE,
        tabBarInactiveTintColor: BLUE,
        tabBarStyle: { backgroundColor: '#F9F2EC' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Pass',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
