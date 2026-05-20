import { ActivityIndicator, View } from 'react-native';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function ProtectedLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#16A34A" />
      </View>
    );
  }

  if (!user) return <Redirect href="/(auth)/sign-in" />;
  if (!user.hasStore) return <Redirect href="/(account)" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="customers/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="credits/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="credits/new" options={{ headerShown: true, title: 'New Credit', presentation: 'modal' }} />
      <Stack.Screen name="payments/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="payments/new" options={{ headerShown: true, title: 'Record Payment', presentation: 'modal' }} />
      <Stack.Screen name="settings/guide" options={{ headerShown: false }} />
      <Stack.Screen name="settings/about" options={{ headerShown: false }} />
    </Stack>
  );
}
