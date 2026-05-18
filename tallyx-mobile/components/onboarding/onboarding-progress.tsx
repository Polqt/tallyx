import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

interface Props {
  total?: number;
  current: number;
  onSkip?: () => void;
}

export function OnboardingProgress({ total = 3, current, onSkip }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View className="px-6" style={{ paddingTop: insets.top + 8 }}>
      <View className="flex-row items-center mb-2">
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
        >
          <ChevronLeft size={20} color="#111827" strokeWidth={2.5} />
        </TouchableOpacity>

        <View className="flex-1 flex-row mx-3 gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <View
              key={i}
              className="flex-1 h-1 rounded-full"
              style={{ backgroundColor: i < current ? '#10b981' : '#E5E7EB' }}
            />
          ))}
        </View>

        {onSkip ? (
          <TouchableOpacity
            onPress={onSkip}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text className="text-sm font-geist-semibold text-gray-500">Skip</Text>
          </TouchableOpacity>
        ) : (
          <View className="w-9" />
        )}
      </View>
    </View>
  );
}
