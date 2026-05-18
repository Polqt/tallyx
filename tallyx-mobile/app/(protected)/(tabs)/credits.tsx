import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

// TODO(backend): fetch credit list from API
// TODO(blockchain): display on-chain verification status per credit

export default function Credits() {
  return (
    <View className="flex-1 bg-slate-50 px-6 pt-16">
      <Text className="text-2xl font-bold text-gray-900 mb-4">Credits</Text>
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-400 text-base mb-6">No credits recorded yet.</Text>
      </View>
      <TouchableOpacity
        className="bg-primary py-4 rounded-2xl items-center"
        onPress={() => router.push('/(protected)/credits/new')}
      >
        <Text className="text-white text-base font-semibold">+ Record Credit</Text>
      </TouchableOpacity>
    </View>
  );
}
