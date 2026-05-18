import { View, Text, Dimensions } from 'react-native';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import { OnboardingProgress } from '@/components/onboarding/onboarding-progress';
import { OnboardingButton } from '@/components/onboarding/onboarding-button';
import { useOnboardingStore } from '@/stores/onboarding.store';

const { width } = Dimensions.get('window');

export default function OnboardingThree() {
  const setHasSeenOnboarding = useOnboardingStore((s) => s.setHasSeenOnboarding);

  function finish() {
    setHasSeenOnboarding(true);
    router.replace('/(auth)/sign-in');
  }

  return (
    <View className="flex-1 bg-white">
      <OnboardingProgress current={3} onSkip={finish} />

      <View className="mt-4 px-6">
        <Text className="font-geist-bold text-gray-900" style={{ fontSize: 40, lineHeight: 46 }}>
          {'Record. Verify.\n'}
          <Text style={{ color: '#16A34A' }}>Get Paid.</Text>
        </Text>
        <Text className="font-geist text-gray-500 mt-1.5" style={{ fontSize: 15, lineHeight: 22 }}>
          Log a credit, let your customer confirm it, and collect payments — simple as that.
        </Text>
      </View>

      <View className="flex-1 items-center justify-center px-6">
        <LottieView
          source={require('@/assets/icons/onboarding3.json')}
          autoPlay
          loop
          style={{ width: width - 48, height: width - 48 }}
        />
      </View>

      <OnboardingButton label="Continue" onPress={finish} />
    </View>
  );
}
