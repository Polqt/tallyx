import { TextInput, TouchableOpacity, View } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { haptics } from '@/utils/haptics';

interface Props {
  value: string;
  onChange: (text: string) => void;
}

export function CustomerSearchBar({ value, onChange }: Props) {
  function clear() {
    haptics.light();
    onChange('');
  }

  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3">
      <Search size={18} color="#9CA3AF" strokeWidth={2} />
      <TextInput
        className="flex-1 text-[15px] text-gray-950 py-2"
        placeholder="Search by name or phone"
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChange}
        onFocus={() => haptics.light()}
        returnKeyType="search"
        autoCorrect={false}
      />
      {value.length > 0 ? (
        <TouchableOpacity onPress={clear} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <X size={17} color="#9CA3AF" strokeWidth={2.4} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
