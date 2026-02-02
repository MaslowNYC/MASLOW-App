
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(null);

  useEffect(() => {
    checkOnboarding();
  }, []);

  async function checkOnboarding() {
    const seen = await AsyncStorage.getItem('hasSeenOnboarding');
    setHasSeenOnboarding(seen === 'true');
  }

  if (hasSeenOnboarding === null) {
    return null; // Loading
  }

  if (hasSeenOnboarding) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(onboarding)/welcome" />;
}