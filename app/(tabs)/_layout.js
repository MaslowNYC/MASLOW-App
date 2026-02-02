
import { Tabs } from 'expo-router';

const BLUE = '#2C5F8D';
const CREAM = '#F9F2EC';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: BLUE,
        tabBarInactiveTintColor: `${BLUE}60`,
        tabBarStyle: {
          backgroundColor: CREAM,
          borderTopColor: `${BLUE}20`,
        },
        headerStyle: {
          backgroundColor: CREAM,
        },
        headerTintColor: BLUE,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Pass',
        }}
      />
      <Tabs.Screen
        name="control"
        options={{
          title: 'Control',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'You',
        }}
      />
    </Tabs>
  );
}