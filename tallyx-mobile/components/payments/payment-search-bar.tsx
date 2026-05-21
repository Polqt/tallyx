import { TextInput, TouchableOpacity, View } from 'react-native';
import { Search, X } from 'lucide-react-native';

interface Props {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
}

export function PaymentSearchBar({ value, onChange, placeholder = 'Search...' }: Props) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#FFFFFF',
      }}
    >
      <Search size={14} color="#9CA3AF" strokeWidth={2} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        style={{
          flex: 1,
          fontFamily: 'Geist_400Regular',
          fontSize: 13,
          color: '#111827',
          paddingVertical: 0,
        }}
      />
      {value.length > 0 && (
        <TouchableOpacity
          onPress={() => onChange('')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={13} color="#9CA3AF" strokeWidth={2} />
        </TouchableOpacity>
      )}
    </View>
  );
}
