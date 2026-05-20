import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { TallyxLogo } from '@/components/common/tallyx-logo';

export default function ForgotPassword() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-row items-center px-6 mb-1">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
        >
          <ChevronLeft size={20} color="#111827" strokeWidth={2.5} />
        </TouchableOpacity>
        <View className="flex-1 items-center">
          <TallyxLogo />
        </View>
        <View className="w-9" />
      </View>

      <View className="mx-6 mt-10 items-center rounded-2xl p-6" style={{ backgroundColor: '#FFF7ED' }}>
        <Text style={{ fontSize: 36 }}>🔧</Text>
        <Text className="font-geist-bold text-gray-900 mt-4 text-center" style={{ fontSize: 17 }}>
          Coming soon
        </Text>
        <Text className="font-geist text-gray-500 mt-2 text-center" style={{ fontSize: 14, lineHeight: 20 }}>
          Password reset is not yet available.{'\n'}Please contact support to recover your account.
        </Text>
        <TouchableOpacity className="mt-5" onPress={() => router.replace('/(auth)/sign-in')}>
          <Text className="font-geist-bold" style={{ fontSize: 14, color: '#16A34A' }}>Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
