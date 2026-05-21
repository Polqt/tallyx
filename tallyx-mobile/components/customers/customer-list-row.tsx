import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import type { CustomerListItem } from '@/features/customers/customer.types';
import { formatDashboardDate, formatPeso } from '@/utils/dashboard';
import { getCustomerAvatarColor } from '@/utils/customers';

type CustomerListRowProps = {
  customer: CustomerListItem;
  opacity: Animated.Value;
  onPress: () => void;
};

export function CustomerListRow({ customer, opacity, onPress }: CustomerListRowProps) {
  const color = getCustomerAvatarColor(customer.name);
  const hasBalance = customer.balance > 0;

  return (
    <Animated.View style={{ opacity }}>
      <TouchableOpacity
        activeOpacity={0.74}
        onPress={onPress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: '#F3F4F6',
          paddingHorizontal: 14,
          paddingVertical: 10,
          marginBottom: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>{customer.name[0]?.toUpperCase() ?? '?'}</Text>
        </View>

        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#030712' }} numberOfLines={1}>
            {customer.name}
          </Text>
          {customer.lastTransactionDate ? (
            <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }} numberOfLines={1}>
              {formatDashboardDate(customer.lastTransactionDate)}
            </Text>
          ) : null}
        </View>

        <View style={{ alignItems: 'center', gap: 8 }}>
          {hasBalance ? (
            <View style={{ backgroundColor: '#FFFBEB', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#B45309' }}>
                {formatPeso(customer.balance)}
              </Text>
            </View>
          ) : null}
          <ChevronRight size={15} color="#D1D5DB" strokeWidth={2.2} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
