import { Redirect } from 'expo-router';

// Redirect to unified auth screen with signup mode
export default function SignupRedirect() {
  return <Redirect href="/(auth)/login?mode=signup" />;
}
