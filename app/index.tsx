import { Redirect } from 'expo-router';

// Skip onboarding - splash screen handles the intro
// _layout.tsx handles auth routing (redirects to login if not authenticated)
export default function Index() {
  return <Redirect href="/(tabs)" />;
}
