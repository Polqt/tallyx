import { View, Text, TouchableOpacity } from 'react-native';
import { Coins, CircleDollarSign } from 'lucide-react-native';
import { haptics } from '@/utils/haptics';

interface Props {
  selected: 'cash' | 'usdc';
  onChange: (value: 'cash' | 'usdc') => void;
}

export function PaymentMethodSelector({ selected, onChange }: Props) {
  function handleSelect(val: 'cash' | 'usdc') {
    haptics.selection();
    onChange(val);
  }

  return (
    <View 
      style={{ 
        flexDirection: 'row', 
        backgroundColor: '#F3F4F6', 
        padding: 4, 
        borderRadius: 16, 
        marginBottom: 20 
      }}
    >
      <TouchableOpacity
        onPress={() => handleSelect('cash')}
        activeOpacity={0.8}
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          backgroundColor: selected === 'cash' ? '#FFFFFF' : 'transparent',
          paddingVertical: 12,
          borderRadius: 12,
          shadowColor: selected === 'cash' ? '#000000' : 'transparent',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: selected === 'cash' ? 1 : 0,
        }}
      >
        <CircleDollarSign size={18} color={selected === 'cash' ? '#16A34A' : '#6B7280'} />
        <Text 
          style={{ 
            fontFamily: 'Geist_600SemiBold', 
            fontSize: 14, 
            color: selected === 'cash' ? '#111827' : '#6B7280' 
          }}
        >
          Cash Payment
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => handleSelect('usdc')}
        activeOpacity={0.8}
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          backgroundColor: selected === 'usdc' ? '#FFFFFF' : 'transparent',
          paddingVertical: 12,
          borderRadius: 12,
          shadowColor: selected === 'usdc' ? '#000000' : 'transparent',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: selected === 'usdc' ? 1 : 0,
        }}
      >
        <Coins size={18} color={selected === 'usdc' ? '#2563EB' : '#6B7280'} />
        <Text 
          style={{ 
            fontFamily: 'Geist_600SemiBold', 
            fontSize: 14, 
            color: selected === 'usdc' ? '#111827' : '#6B7280' 
          }}
        >
          USDC (Stellar)
        </Text>
      </TouchableOpacity>
    </View>
  );
}
