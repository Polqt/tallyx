import { Text, View } from 'react-native';
import { ArrowDownLeft, ArrowUpRight, TrendingUp } from 'lucide-react-native';
import type { DashboardActivity } from '@/features/dashboard/dashboard.types';
import { formatDashboardDate, formatPeso } from '@/utils/dashboard';

interface Props {
  items: DashboardActivity[];
}

export function RecentActivityList({ items }: Props) {
  if (items.length === 0) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 40 }}>
        <TrendingUp size={28} color="#D1D5DB" strokeWidth={1.8} />
        <Text style={{ fontFamily: 'Geist_700Bold', fontSize: 15, color: '#374151', marginTop: 14 }}>
          No activity yet
        </Text>
        <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 13, color: '#9CA3AF', marginTop: 4, textAlign: 'center', lineHeight: 20 }}>
          {'Credits and payments you record\nwill appear here.'}
        </Text>
      </View>
    );
  }

  return (
    <View>
      {items.map((item, index) => {
        const isPayment = item.type === 'payment';
        return (
          <View
            key={item.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 14,
              borderBottomWidth: index < items.length - 1 ? 1 : 0,
              borderBottomColor: '#F3F4F6',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isPayment ? '#F0FDF4' : '#FFF7ED',
                }}
              >
                {isPayment
                  ? <ArrowDownLeft size={16} color="#16A34A" strokeWidth={2} />
                  : <ArrowUpRight size={16} color="#D97706" strokeWidth={2} />
                }
              </View>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 14, color: '#111827' }}>
                  {item.title}
                </Text>
                <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                  {item.customerName ? `${item.customerName} · ` : ''}{formatDashboardDate(item.createdAt)}
                </Text>
              </View>
            </View>
            <Text
              style={{
                fontFamily: 'Geist_700Bold',
                fontSize: 14,
                color: isPayment ? '#16A34A' : '#14532D',
              }}
            >
              {isPayment ? '+' : '-'}{formatPeso(item.amount)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
