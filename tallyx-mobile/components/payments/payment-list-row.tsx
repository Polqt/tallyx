import { TouchableOpacity, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Coins } from 'lucide-react-native';
import type { PaymentItem } from '@/features/payments/payment.types';
import { getCustomerAvatarColor } from '@/utils/customers';
import { formatPeso, formatDashboardDate } from '@/utils/dashboard';
import { haptics } from '@/utils/haptics';

export function PaymentListRow({ item }: { item: PaymentItem }) {
  const avatarColor = getCustomerAvatarColor(item.customer.name);
  const initials = item.customer.name[0]?.toUpperCase() ?? '?';
  const isUsdc = item.paymentMethod === 'usdc';
  const amountText = isUsdc
    ? `+${Number(item.amount)} USDC`
    : `+${formatPeso(Number(item.amount))}`;

  function handlePress() {
    haptics.light();
    router.push(`/(protected)/payments/${item.id}` as any);
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.75}
    >
      <View style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
      }}>
        {/* Avatar */}
        <View style={{
          width: 42, height: 42, borderRadius: 21,
          backgroundColor: avatarColor,
          alignItems: 'center', justifyContent: 'center',
          marginRight: 12,
        }}>
          <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 16, color: '#FFFFFF' }}>
            {initials}
          </Text>
        </View>

        {/* Name + date */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 15, color: '#111827' }} numberOfLines={1}>
            {item.customer.name}
          </Text>
          <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
            {formatDashboardDate(item.createdAt)}
          </Text>
        </View>

        {/* Amount + method */}
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontFamily: 'Geist_700Bold', fontSize: 15, color: isUsdc ? '#2563EB' : '#16A34A' }}>
            {amountText}
          </Text>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4,
            backgroundColor: isUsdc ? '#EFF6FF' : '#F0FDF4',
            paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
          }}>
            {isUsdc
              ? <Coins size={10} color="#2563EB" />
              : <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#16A34A' }} />
            }
            <Text style={{ fontFamily: 'Geist_500Medium', fontSize: 10, color: isUsdc ? '#2563EB' : '#16A34A' }}>
              {isUsdc ? 'USDC' : 'Cash'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
