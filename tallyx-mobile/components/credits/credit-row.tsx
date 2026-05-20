import { TouchableOpacity, Text, View } from 'react-native';
import type { CreditListItem } from '@/features/credits/credit.types';
import { statusStyles, syncStyles } from '@/utils/credit';
import { formatDashboardDate, formatPeso } from '@/utils/dashboard';

interface CreditRowProps {
  credit: CreditListItem;
  onLongPress?: () => void;
}

export function CreditRow({ credit, onLongPress }: CreditRowProps) {
  const status = statusStyles[credit.status] ?? statusStyles.pending;
  const sync = syncStyles[credit.syncStatus] ?? syncStyles.pending;
  const SyncIcon = sync.Icon;
  const isVoided = credit.status === 'voided';

  return (
    <TouchableOpacity
      onLongPress={onLongPress}
      delayLongPress={400}
      activeOpacity={0.85}
      disabled={!onLongPress}
    >
    <View className="mb-3 rounded-[22px] border border-gray-100 bg-white p-4" style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12, opacity: isVoided ? 0.55 : 1 }}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-[16px] font-bold text-gray-900">{credit.customerName ?? 'Customer'}</Text>
          <Text className="mt-1 text-[12px] text-gray-400">
            Recorded {formatDashboardDate(credit.createdAt)}
          </Text>
        </View>
        <View className={`rounded-full px-3 py-1 ${status.bg}`}>
          <Text className={`text-[11px] font-bold uppercase tracking-[0.8px] ${status.text}`}>{status.label}</Text>
        </View>
      </View>

      <View className="mt-4 flex-row items-end justify-between">
        <View>
          <Text className="text-[12px] font-medium uppercase tracking-[1.4px] text-gray-400">Remaining</Text>
          <Text className={`mt-1 text-[28px] font-bold ${credit.status === 'paid' ? 'text-gray-900' : 'text-green-800'}`}>
            {formatPeso(credit.balance)}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-[12px] text-gray-400">Original</Text>
          <Text className="mt-1 text-[15px] font-semibold text-gray-700">{formatPeso(credit.amount)}</Text>
        </View>
      </View>

      <View className="mt-4 flex-row items-center justify-between border-t border-gray-100 pt-3">
        <View className="flex-1 pr-3">
          <Text className="text-[12px] text-gray-500">
            Due {credit.dueDate ? formatDashboardDate(credit.dueDate) : 'No due date'}
          </Text>
          {credit.note ? (
            <Text className="mt-1 text-[12px] text-gray-400" numberOfLines={1}>{credit.note}</Text>
          ) : null}
        </View>
        <View className="flex-row items-center gap-1.5">
          <SyncIcon size={13} color={sync.color} strokeWidth={2.2} />
          <Text style={{ color: sync.color }} className="text-[11px] font-semibold">{sync.label}</Text>
        </View>
      </View>
    </View>
    </TouchableOpacity>
  );
}
