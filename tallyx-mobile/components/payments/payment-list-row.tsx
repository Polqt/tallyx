import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Shield, Sparkles, Copy, Coins } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import type { PaymentItem } from '@/features/payments/payment.types';
import { getCustomerAvatarColor } from '@/utils/customers';
import { formatPeso, formatDashboardDate, compactKey } from '@/utils/dashboard';
import { haptics } from '@/utils/haptics';

interface Props {
  item: PaymentItem;
}

export function PaymentListRow({ item }: Props) {
  const avatarColor = getCustomerAvatarColor(item.customer.name);
  const initials = item.customer.name[0]?.toUpperCase() ?? '?';

  async function handleCopyHash() {
    if (!item.stellarTxHash) return;
    haptics.light();
    await Clipboard.setStringAsync(item.stellarTxHash);
    Alert.alert('Copied', 'Stellar transaction hash copied to clipboard.');
  }

  function handleShowReceipt() {
    haptics.light();
    Alert.alert(
      'Receipt Details',
      `Receipt ID: ${item.id.slice(0, 8).toUpperCase()}\n\nCustomer: ${item.customer.name}\nAmount Paid: ${item.paymentMethod === 'usdc' ? `${Number(item.amount)} USDC` : formatPeso(Number(item.amount))}\nMethod: ${item.paymentMethod.toUpperCase()}\nStatus: Verified\nDate: ${formatDashboardDate(item.createdAt)}`
    );
  }

  return (
    <View 
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
          <View 
            style={{ 
              width: 42, 
              height: 42, 
              borderRadius: 21, 
              backgroundColor: avatarColor, 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          >
            <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 16, color: '#FFFFFF' }}>{initials}</Text>
          </View>
          
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 15, color: '#111827' }} numberOfLines={1}>
              {item.customer.name}
            </Text>
            <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>
              {formatDashboardDate(item.createdAt)}
            </Text>
          </View>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <Text 
            style={{ 
              fontFamily: 'Geist_700Bold', 
              fontSize: 16, 
              color: item.paymentMethod === 'usdc' ? '#2563EB' : '#16A34A' 
            }}
          >
            +{item.paymentMethod === 'usdc' ? `${Number(item.amount)} USDC` : formatPeso(Number(item.amount))}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
            {item.paymentMethod === 'usdc' ? (
              <View 
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  gap: 3, 
                  backgroundColor: '#EFF6FF', 
                  paddingHorizontal: 8, 
                  paddingVertical: 2, 
                  borderRadius: 10 
                }}
              >
                <Coins size={10} color="#2563EB" />
                <Text style={{ fontFamily: 'Geist_500Medium', fontSize: 10, color: '#2563EB' }}>USDC</Text>
              </View>
            ) : (
              <View 
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  gap: 3, 
                  backgroundColor: '#F0FDF4', 
                  paddingHorizontal: 8, 
                  paddingVertical: 2, 
                  borderRadius: 10 
                }}
              >
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#16A34A' }} />
                <Text style={{ fontFamily: 'Geist_500Medium', fontSize: 10, color: '#16A34A' }}>Cash</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {item.stellarTxHash && (
        <TouchableOpacity 
          onPress={handleCopyHash}
          activeOpacity={0.7}
          style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            gap: 6, 
            backgroundColor: '#F9FAFB', 
            paddingHorizontal: 10, 
            paddingVertical: 8, 
            borderRadius: 12,
            marginTop: 4,
            borderWidth: 1,
            borderColor: '#F3F4F6'
          }}
        >
          <Shield size={12} color="#4B5563" />
          <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 11, color: '#4B5563', flex: 1 }}>
            Stellar: {compactKey(item.stellarTxHash)}
          </Text>
          <Copy size={11} color="#9CA3AF" />
        </TouchableOpacity>
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
        <TouchableOpacity 
          onPress={handleShowReceipt}
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
        >
          <Sparkles size={12} color="#16A34A" />
          <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 12, color: '#16A34A' }}>
            View Receipt
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
