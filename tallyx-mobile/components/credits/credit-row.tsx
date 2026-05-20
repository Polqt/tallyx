import { TouchableOpacity, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { CreditListItem } from '@/features/credits/credit.types';
import { statusStyles } from '@/utils/credit';
import { formatDashboardDate, formatPeso } from '@/utils/dashboard';
import { haptics } from '@/utils/haptics';

export function CreditRow({ credit }: { credit: CreditListItem }) {
  const status = statusStyles[credit.status] ?? statusStyles.pending;
  const isVoided = credit.status === 'voided';

  function handlePress() {
    haptics.light();
    router.push(`/(protected)/credits/${credit.id}` as any);
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.75}
      style={{ opacity: isVoided ? 0.5 : 1 }}
    >
      <View
        className="mb-3 rounded-[20px] border border-gray-100 bg-white px-4 py-3.5"
        style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-[15px] font-bold text-gray-900" numberOfLines={1}>
              {credit.customerName ?? 'Customer'}
            </Text>
            <Text className="mt-0.5 text-[12px] text-gray-400">
              Due {credit.dueDate ? formatDashboardDate(credit.dueDate) : 'No due date'}
            </Text>
          </View>
          <View className="items-end gap-1.5">
            <View className={`rounded-full px-2.5 py-0.5 ${status.bg}`}>
              <Text className={`text-[11px] font-bold uppercase tracking-[0.6px] ${status.text}`}>
                {status.label}
              </Text>
            </View>
            <Text className="text-[15px] font-bold text-gray-900">
              {formatPeso(credit.balance)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
