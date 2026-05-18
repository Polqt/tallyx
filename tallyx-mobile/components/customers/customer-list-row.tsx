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
        className="mb-3 flex-row items-center rounded-3xl border border-gray-100 bg-white p-4"
        style={{ boxShadow: '0 8px 22px rgba(15, 23, 42, 0.05)' }}
      >
        <View className="h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: color }}>
          <Text className="text-lg font-bold text-white">{customer.name[0]?.toUpperCase() ?? '?'}</Text>
        </View>

        <View className="ml-3 flex-1">
          <Text className="text-[15px] font-bold text-gray-950" numberOfLines={1}>
            {customer.name}
          </Text>
          <Text className="mt-1 text-[12px] text-gray-400" numberOfLines={1}>
            {customer.phone || 'No phone number'}
          </Text>
        </View>

        <View className="items-end gap-2">
          <View className={`rounded-full px-3 py-1 ${hasBalance ? 'bg-amber-50' : 'bg-green-50'}`}>
            <Text className={`text-[12px] font-bold ${hasBalance ? 'text-amber-700' : 'text-green-700'}`}>
              {hasBalance ? formatPeso(customer.balance) : 'Settled'}
            </Text>
          </View>

          <View className="flex-row items-center gap-1">
            {customer.lastTransactionDate ? (
              <Text className="text-[11px] text-gray-400">
                {formatDashboardDate(customer.lastTransactionDate)}
              </Text>
            ) : null}
            <ChevronRight size={15} color="#D1D5DB" strokeWidth={2.2} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
