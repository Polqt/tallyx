import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useOnboardingStore } from '@/stores/onboarding.store';
import { useAuth } from '@/context/AuthContext';

export default function Index() {
  const { user, isLoading } = useAuth();
  const hasSeenOnboarding = useOnboardingStore((s) => s.hasSeenOnboarding);
  const hasHydratedOnboarding = useOnboardingStore((s) => s.hasHydrated);

  if (isLoading || !hasHydratedOnboarding) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#16A34A" />
      </View>
    );
  }

  if (user && !user.hasStore) return <Redirect href="/(account)" />;
  if (user) return <Redirect href="/(protected)/(tabs)/dashboard" />;
  if (!hasSeenOnboarding) return <Redirect href="/(onboarding)" />;
  return <Redirect href="/(auth)/sign-in" />;
}
