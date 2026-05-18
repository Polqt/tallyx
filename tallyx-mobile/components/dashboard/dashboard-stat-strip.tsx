import { Text, View } from 'react-native';
import { formatPeso } from '@/utils/dashboard';

interface Props {
  customerCount: number;
  openCreditsCount: number;
  overdueAmount: number;
}

export function DashboardStatStrip({ customerCount, openCreditsCount, overdueAmount }: Props) {
  return (
    <>
      <View style={{ flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 20 }}>
        <StatColumn value={customerCount.toString()} label="Customers" />
        <Divider />
        <StatColumn value={openCreditsCount.toString()} label="Open Credits" />
        <Divider />
        <StatColumn value={formatPeso(overdueAmount)} label="Overdue" highlighted={overdueAmount > 0} />
      </View>
      <View style={{ height: 1, backgroundColor: '#F3F4F6' }} />
    </>
  );
}

function StatColumn({ value, label, highlighted }: { value: string; label: string; highlighted?: boolean }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontFamily: 'Geist_700Bold', fontSize: 28, color: highlighted ? '#D97706' : '#111827' }}>
        {value}
      </Text>
      <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 12, color: '#6B7280', marginTop: 3 }}>
        {label}
      </Text>
    </View>
  );
}

function Divider() {
  return <View style={{ width: 1, backgroundColor: '#F3F4F6', marginVertical: 4 }} />;
}
