import { View, Text, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import { OnboardingButton } from '@/components/onboarding/onboarding-button';

const { width } = Dimensions.get('window');

export default function OnboardingOne() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>

      <View className="flex-row items-center gap-2 mt-12 px-6">
        <Text className="text-xl font-geist-bold text-gray-900">Tallyx</Text>
      </View>

      <View className="mt-4 px-6">
        <Text className="font-geist-bold text-gray-900" style={{ fontSize: 40, lineHeight: 46 }}>
          {'Track every\nutang with '}
          <Text style={{ color: '#16A34A' }}>confidence.</Text>
        </Text>
        <Text className="font-geist text-gray-500 mt-1.5" style={{ fontSize: 15, lineHeight: 22 }}>
          Your digital ledger for sari-sari stores. Know who owes you, how much, and when — at a glance.
        </Text>
      </View>

      <View className="flex-1 items-center justify-center px-6">
        <LottieView
          source={require('@/assets/icons/onboarding1.json')}
          autoPlay
          loop
          style={{ width: width - 48, height: width - 48 }}
        />
      </View>

      <View className="flex-row justify-center gap-2 mb-7">
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: i === 0 ? '#059669' : '#D1FAE5' }}
          />
        ))}
      </View>

      <OnboardingButton label="Get Started" onPress={() => router.push('/(onboarding)/problem')} />
    </View>
  );
}
