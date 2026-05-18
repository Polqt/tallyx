import { View, Text, Dimensions } from 'react-native';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import { OnboardingProgress } from '@/components/onboarding/onboarding-progress';
import { OnboardingButton } from '@/components/onboarding/onboarding-button';
import { useOnboardingStore } from '@/stores/onboarding.store';

const { width } = Dimensions.get('window');

export default function OnboardingTwo() {
  const setHasSeenOnboarding = useOnboardingStore((s) => s.setHasSeenOnboarding);

  function finish() {
    setHasSeenOnboarding(true);
    router.replace('/(auth)/sign-in');
  }

  return (
    <View className="flex-1 bg-white">
      <OnboardingProgress current={2} onSkip={finish} />

      <View className="mt-4 px-6">
        <Text className="font-geist-bold text-gray-900" style={{ fontSize: 40, lineHeight: 46 }}>
          {'Paper lists\nget lost. Trust\n'}
          <Text style={{ color: '#16A34A' }}>{"shouldn't."}</Text>
        </Text>
        <Text className="font-geist text-gray-500 mt-1.5" style={{ fontSize: 15, lineHeight: 22 }}>
          No more guessing who still owes you. Balances, due dates, and history — all in one place.
        </Text>
      </View>

      <View className="flex-1 items-center justify-center px-6">
        <LottieView
          source={require('@/assets/icons/onboarding2.json')}
          autoPlay
          loop
          style={{ width: width - 48, height: width - 48 }}
        />
      </View>

      <OnboardingButton label="Continue" onPress={() => router.push('/(onboarding)/how-it-works')} />
    </View>
  );
}
