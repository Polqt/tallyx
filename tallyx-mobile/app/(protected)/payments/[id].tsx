import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Coins, ExternalLink, Shield } from 'lucide-react-native';
import { SyncBadge } from '@/components/common/sync-badge';
import { openTransactionExplorer } from '@/features/stellar/stellar.service';
import { useAuth } from '@/context/AuthContext';
import { fetchPayment } from '@/features/payments/payment.service';
import type { PaymentItem } from '@/features/payments/payment.types';
import { getCustomerAvatarColor } from '@/utils/customers';
import { formatDashboardDate, formatPeso, compactKey } from '@/utils/dashboard';
import { haptics } from '@/utils/haptics';

export default function PaymentDetailScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [payment, setPayment] = useState<PaymentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !id) { setLoading(false); return; }
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchPayment(token!, id as string, controller.signal);
        setPayment(data);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Unable to load payment.');
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [id, token]);

  const isUsdc = payment?.paymentMethod === 'usdc';
  const amountText = payment
    ? isUsdc
      ? `${Number(payment.amount)} USDC`
      : formatPeso(Number(payment.amount))
    : '';
  const avatarColor = payment ? getCustomerAvatarColor(payment.customer.name) : '#16A34A';
  const initials = payment?.customer.name[0]?.toUpperCase() ?? '?';

  const creditPaidPercent = payment && Number(payment.credit.amount) > 0
    ? Math.max(0, Math.min(100, Math.round(
        ((Number(payment.credit.amount) - Number(payment.credit.balance)) / Number(payment.credit.amount)) * 100
      )))
    : 0;

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', paddingTop: insets.top }}>
      {/* Nav bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
        <TouchableOpacity
          onPress={() => { haptics.light(); router.back(); }}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: '#F3F4F6' }}
        >
          <ChevronLeft size={20} color="#111827" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#111827' }}>Payment</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="small" color="#16A34A" />
          <Text style={{ marginTop: 10, fontSize: 13, color: '#9CA3AF' }}>Loading payment...</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#B45309' }}>Payment unavailable</Text>
          <Text style={{ marginTop: 6, fontSize: 13, color: '#9CA3AF', textAlign: 'center' }}>{error}</Text>
        </View>
      ) : payment ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 36 }}>

          {/* Hero amount */}
          <View style={{ alignItems: 'center', paddingTop: 32, paddingBottom: 28, paddingHorizontal: 24 }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              backgroundColor: isUsdc ? '#EFF6FF' : '#F0FDF4',
              paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginBottom: 16,
            }}>
              {isUsdc
                ? <Coins size={13} color="#2563EB" />
                : <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#16A34A' }} />
              }
              <Text style={{ fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: isUsdc ? '#2563EB' : '#16A34A' }}>
                {isUsdc ? 'USDC Payment' : 'Cash Payment'}
              </Text>
            </View>

            <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 6 }}>Amount Received</Text>
            <Text style={{ fontSize: 52, fontWeight: '800', color: isUsdc ? '#2563EB' : '#14532D', lineHeight: 60 }}>
              {amountText}
            </Text>
            <Text style={{ fontSize: 13, color: '#9CA3AF', marginTop: 6 }}>
              {formatDashboardDate(payment.createdAt)}
            </Text>
          </View>

          {/* Customer */}
          <View style={{ marginHorizontal: 20, marginBottom: 10 }}>
            <View style={{ borderRadius: 20, borderWidth: 1, borderColor: '#F3F4F6', backgroundColor: '#FAFAFA', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: avatarColor, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: 'Geist_700Bold', fontSize: 18, color: '#FFFFFF' }}>{initials}</Text>
              </View>
              <View>
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>Customer</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>{payment.customer.name}</Text>
              </View>
            </View>
          </View>

          {/* Credit info */}
          <View style={{ marginHorizontal: 20, marginBottom: 10 }}>
            <View style={{ borderRadius: 20, borderWidth: 1, borderColor: '#F3F4F6', backgroundColor: '#FAFAFA', padding: 16 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Applied to Credit</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 3 }}>Original</Text>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>{formatPeso(Number(payment.credit.amount))}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 3 }}>Remaining</Text>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: Number(payment.credit.balance) > 0 ? '#D97706' : '#16A34A' }}>
                    {formatPeso(Number(payment.credit.balance))}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 3 }}>Status</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: payment.credit.status === 'paid' ? '#16A34A' : '#D97706', textTransform: 'capitalize' }}>
                    {payment.credit.status}
                  </Text>
                </View>
              </View>
              {/* Credit progress bar */}
              <View style={{ height: 5, borderRadius: 3, backgroundColor: '#F3F4F6', overflow: 'hidden' }}>
                <View style={{ height: 5, borderRadius: 3, backgroundColor: payment.credit.status === 'paid' ? '#16A34A' : '#14532D', width: `${creditPaidPercent}%` }} />
              </View>
              <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 5, textAlign: 'right' }}>
                {creditPaidPercent}% settled
              </Text>
            </View>
          </View>

          {/* Receipt ID */}
          <View style={{ marginHorizontal: 20, marginBottom: 10 }}>
            <View style={{ borderRadius: 20, borderWidth: 1, borderColor: '#F3F4F6', backgroundColor: '#FAFAFA', padding: 16 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Receipt ID</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', letterSpacing: 0.5 }}>
                {payment.id.slice(0, 8).toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Blockchain */}
          <View style={{ marginHorizontal: 20, marginBottom: 10 }}>
            <View style={{ borderRadius: 20, borderWidth: 1, borderColor: '#F3F4F6', backgroundColor: '#FAFAFA', padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Shield size={13} color="#9CA3AF" strokeWidth={2} />
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 }}>Blockchain</Text>
                </View>
                <SyncBadge status={payment.syncStatus} />
              </View>
              {payment.stellarTxHash ? (
                <TouchableOpacity
                  onPress={async () => {
                    haptics.light();
                    try {
                      await openTransactionExplorer(payment.stellarTxHash!);
                    } catch {
                      Alert.alert('Unable to open explorer', 'Please try again.');
                    }
                  }}
                  activeOpacity={0.7}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
                >
                  <Text style={{ fontSize: 13, color: '#2563EB', flex: 1, fontFamily: 'Geist_400Regular' }} numberOfLines={1}>
                    {compactKey(payment.stellarTxHash)}
                  </Text>
                  <ExternalLink size={14} color="#2563EB" />
                </TouchableOpacity>
              ) : (
                <Text style={{ fontSize: 13, color: '#9CA3AF' }}>Not synced on-chain</Text>
              )}
            </View>
          </View>

        </ScrollView>
      ) : null}
    </View>
  );
}
