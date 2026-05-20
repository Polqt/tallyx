import { View, Text } from 'react-native';
import { History } from 'lucide-react-native';

export function PaymentEmptyState() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 80 }}>
      <View 
        style={{ 
          width: 64, 
          height: 64, 
          borderRadius: 32, 
          backgroundColor: '#F3F4F6', 
          alignItems: 'center', 
          justifyContent: 'center', 
          marginBottom: 16 
        }}
      >
        <History size={28} color="#9CA3AF" />
      </View>
      <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 16, color: '#374151', textAlign: 'center' }}>
        No payments recorded yet
      </Text>
      <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginTop: 6, lineHeight: 20 }}>
        Keep track of your customer collections in one clean place. Tap the button below to log your first payment receipt.
      </Text>
    </View>
  );
}
