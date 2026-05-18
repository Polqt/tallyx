import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, QrCode, TrendingUp } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { fetchCustomerDetail } from '@/features/customers/customer.service';
import type { CustomerDetail } from '@/features/customers/customer.types';
import { formatDashboardDate, formatPeso } from '@/utils/dashboard';
import { getCustomerAvatarColor } from '@/utils/customers';
import { haptics } from '@/utils/haptics';

export default function CustomerDetailScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !id) return;

    const authToken = token;
    const customerId = id;
    const controller = new AbortController();

    async function loadCustomer() {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchCustomerDetail(authToken, customerId, controller.signal);
        setCustomer(data);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Unable to load customer.');
      } finally {
        setLoading(false);
      }
    }

    loadCustomer();
    return () => controller.abort();
  }, [id, token]);

  const color = getCustomerAvatarColor(customer?.name ?? 'Customer');

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => { haptics.light(); router.back(); }}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.backBtn}
        >
          <ChevronLeft size={20} color="#111827" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer</Text>
        <TouchableOpacity
          onPress={() => {
            if (!customer) return;
            haptics.light();
            router.push(`/(protected)/customers/qr?id=${customer.id}&name=${encodeURIComponent(customer.name)}` as any);
          }}
          activeOpacity={0.7}
          style={styles.qrBtn}
        >
          <QrCode size={18} color="#16A34A" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color="#16A34A" />
          <Text style={styles.centerSubtitle}>Loading customer...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.errorTitle}>Customer unavailable</Text>
          <Text style={styles.centerSubtitle}>{error}</Text>
        </View>
      ) : customer ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
        >
          <View style={styles.hero}>
            <View style={[styles.avatar, { backgroundColor: color }]}>
              <Text style={styles.avatarText}>{customer.name[0]?.toUpperCase() ?? '?'}</Text>
            </View>
            <Text style={styles.name}>{customer.name}</Text>
            {customer.phone ? (
              <Text style={styles.phone}>{customer.phone}</Text>
            ) : null}
            <View style={[
              styles.balancePill,
              customer.balance > 0 ? styles.balancePillOwed : styles.balancePillClear,
            ]}>
              <Text style={[
                styles.balancePillText,
                customer.balance > 0 ? styles.balancePillTextOwed : styles.balancePillTextClear,
              ]}>
                {customer.balance > 0 ? `${formatPeso(customer.balance)} outstanding` : 'All settled'}
              </Text>
            </View>
          </View>

          <View style={styles.statsStrip}>
            <View style={styles.statCol}>
              <Text style={styles.statNumber}>{formatPeso(customer.totalCredit)}</Text>
              <Text style={styles.statLabel}>Total Credit</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statNumber}>{formatPeso(customer.totalPaid)}</Text>
              <Text style={styles.statLabel}>Total Paid</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={[styles.statNumber, customer.balance > 0 && { color: '#D97706' }]}>
                {formatPeso(customer.balance)}
              </Text>
              <Text style={styles.statLabel}>Balance</Text>
            </View>
          </View>
          <View style={styles.stripDivider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Credit History</Text>

            {customer.credits.length === 0 ? (
              <View style={styles.emptyWrap}>
                <TrendingUp size={28} color="#D1D5DB" strokeWidth={1.8} />
                <Text style={styles.emptyTitle}>No credits yet</Text>
                <Text style={styles.emptySubtitle}>
                  Credits you record for this customer will appear here.
                </Text>
              </View>
            ) : (
              customer.credits.map((credit) => (
                <View key={credit.id} style={styles.creditRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.creditAmount}>{formatPeso(credit.amount)}</Text>
                    <Text style={styles.creditNote}>Balance: {formatPeso(credit.balance)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <View style={[styles.statusPill, credit.status === 'paid' ? styles.statusPaid : styles.statusOpen]}>
                      <Text style={[styles.statusText, credit.status === 'paid' ? styles.statusTextPaid : styles.statusTextOpen]}>
                        {credit.status === 'paid' ? 'Paid' : 'Open'}
                      </Text>
                    </View>
                    <Text style={styles.creditDate}>{formatDashboardDate(credit.date)}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen:               { flex: 1, backgroundColor: '#FFFFFF' },

  header:               { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backBtn:              { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  headerTitle:          { fontFamily: 'Geist_700Bold', fontSize: 17, color: '#111827' },
  qrBtn:                { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },

  centerState:          { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  centerSubtitle:       { fontFamily: 'Geist_400Regular', fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginTop: 10, lineHeight: 20 },
  errorTitle:           { fontFamily: 'Geist_700Bold', fontSize: 16, color: '#B45309' },

  hero:                 { alignItems: 'center', paddingTop: 32, paddingBottom: 24, paddingHorizontal: 20 },
  avatar:               { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  avatarText:           { fontFamily: 'Geist_700Bold', fontSize: 28, color: '#FFFFFF' },
  name:                 { fontFamily: 'Geist_700Bold', fontSize: 22, color: '#111827', marginBottom: 4 },
  phone:                { fontFamily: 'Geist_400Regular', fontSize: 14, color: '#6B7280', marginBottom: 14 },
  balancePill:          { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, marginTop: 4 },
  balancePillOwed:      { backgroundColor: '#FFFBEB' },
  balancePillClear:     { backgroundColor: '#F0FDF4' },
  balancePillText:      { fontFamily: 'Geist_600SemiBold', fontSize: 13 },
  balancePillTextOwed:  { color: '#D97706' },
  balancePillTextClear: { color: '#16A34A' },

  statsStrip:           { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 20 },
  statCol:              { flex: 1, alignItems: 'center' },
  statNumber:           { fontFamily: 'Geist_700Bold', fontSize: 20, color: '#111827' },
  statLabel:            { fontFamily: 'Geist_400Regular', fontSize: 12, color: '#6B7280', marginTop: 3 },
  statDivider:          { width: 1, backgroundColor: '#F3F4F6', marginVertical: 4 },
  stripDivider:         { height: 1, backgroundColor: '#F3F4F6' },

  section:              { paddingHorizontal: 20, paddingTop: 24 },
  sectionTitle:         { fontFamily: 'Geist_700Bold', fontSize: 17, color: '#111827', marginBottom: 16 },

  emptyWrap:            { alignItems: 'center', paddingVertical: 40 },
  emptyTitle:           { fontFamily: 'Geist_700Bold', fontSize: 15, color: '#374151', marginTop: 14 },
  emptySubtitle:        { fontFamily: 'Geist_400Regular', fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginTop: 4, lineHeight: 20 },

  creditRow:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  creditAmount:         { fontFamily: 'Geist_700Bold', fontSize: 15, color: '#111827' },
  creditNote:           { fontFamily: 'Geist_400Regular', fontSize: 13, color: '#6B7280', marginTop: 2 },
  creditDate:           { fontFamily: 'Geist_400Regular', fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  statusPill:           { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusOpen:           { backgroundColor: '#FFFBEB' },
  statusPaid:           { backgroundColor: '#F0FDF4' },
  statusText:           { fontFamily: 'Geist_600SemiBold', fontSize: 11 },
  statusTextOpen:       { color: '#D97706' },
  statusTextPaid:       { color: '#16A34A' },
});
