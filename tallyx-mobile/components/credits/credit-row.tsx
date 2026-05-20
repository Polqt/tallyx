import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { CreditListItem } from '@/features/credits/credit.types';
import { SyncBadge } from '@/components/common/sync-badge';
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
    <Pressable
      onPress={handlePress}
      style={{ opacity: isVoided ? 0.5 : 1, marginBottom: 12 }}
    >
      {({ pressed }) => (
        <View
          style={{
            backgroundColor: pressed ? '#F9FAFB' : '#FFFFFF',
            borderRadius: 20,
            borderWidth: 1,
            borderColor: pressed ? '#E5E7EB' : '#F3F4F6',
            paddingHorizontal: 16,
            paddingVertical: 14,
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }} numberOfLines={1}>
                {credit.customerName ?? 'Customer'}
              </Text>
              <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                Due {credit.dueDate ? formatDashboardDate(credit.dueDate) : 'No due date'}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <SyncBadge status={credit.syncStatus ?? 'local'} />
                <View style={{ backgroundColor: status.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, color: status.color }}>
                    {status.label}
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>
                {formatPeso(credit.balance)}
              </Text>
            </View>
          </View>
        </View>
      )}
    </Pressable>
  );
}
