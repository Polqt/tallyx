import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

// TODO(backend): fetch payment history from API
// TODO(blockchain): show on-chain transaction hash per payment

export default function Payments() {
  return (
    <View className="flex-1 bg-slate-50 px-6 pt-16">
      <Text className="text-2xl font-bold text-gray-900 mb-4">Payments</Text>
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-400 text-base mb-6">No payments recorded yet.</Text>
      </View>
      <TouchableOpacity
        className="bg-primary py-4 rounded-2xl items-center"
        onPress={() => router.push('/(protected)/payments/new')}
      >
        <Text className="text-white text-base font-semibold">+ Record Payment</Text>
      </TouchableOpacity>
    </View>
  );
}
