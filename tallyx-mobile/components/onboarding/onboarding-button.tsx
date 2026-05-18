import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight } from 'lucide-react-native';

interface Props {
  label: string;
  onPress: () => void;
}

export function OnboardingButton({ label, onPress }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="mx-6 h-14 rounded-full bg-green-600 items-center justify-center"
      style={{ marginBottom: Math.max(insets.bottom, 32) }}
    >
      <Text className="text-white text-base font-geist-semibold">{label}</Text>
      <View className="absolute right-2.5 w-9 h-9 rounded-full items-center justify-center"
        style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
      >
        <ArrowRight size={18} color="#ffffff" strokeWidth={2.5} />
      </View>
    </TouchableOpacity>
  );
}
