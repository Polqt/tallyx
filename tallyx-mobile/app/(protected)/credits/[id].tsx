import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Clock3, ShieldCheck, WifiOff, XCircle } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { fetchCredit, voidCredit } from '@/features/credits/credit.service';
import type { CreditListItem } from '@/features/credits/credit.types';
import { statusStyles } from '@/utils/credit';
import { formatDashboardDate, formatPeso } from '@/utils/dashboard';
import { haptics } from '@/utils/haptics';

const syncConfig = {
  pending: { label: 'Sync pending', color: '#D97706', Icon: Clock3 },
  synced: { label: 'On-chain synced', color: '#16A34A', Icon: ShieldCheck },
  failed: { label: 'Sync failed', color: '#DC2626', Icon: WifiOff },
};

export default function CreditDetailScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [credit, setCredit] = useState<CreditListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voiding, setVoiding] = useState(false);

  useEffect(() => {
    if (!token || !id) { setLoading(false); return; }
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchCredit(token!, id as string, controller.signal);
        setCredit(data);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Unable to load credit.');
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [id, token]);

  function handleVoid() {
    if (!credit || !token) return;
    if (credit.status === 'voided') return;
    if (credit.status === 'paid') {
      Alert.alert('Cannot void', 'This credit has already been fully paid.');
      return;
    }
    haptics.medium();
    Alert.alert(
      'Void credit?',
      `This will cancel the ${formatPeso(credit.amount)} credit for ${credit.customerName ?? 'this customer'}. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Void',
          style: 'destructive',
          onPress: async () => {
            setVoiding(true);
            try {
              await voidCredit(token, credit.id);
              haptics.success();
              setCredit((prev) => prev ? { ...prev, status: 'voided', balance: 0 } : prev);
            } catch (err) {
              haptics.error();
              Alert.alert('Could not void credit', err instanceof Error ? err.message : 'Please try again.');
            } finally {
              setVoiding(false);
            }
          },
        },
      ]
    );
  }

  const status = credit ? (statusStyles[credit.status] ?? statusStyles.pending) : null;
  const sync = credit ? (syncConfig[credit.syncStatus] ?? syncConfig.pending) : null;
  const SyncIcon = sync?.Icon;
  const canVoid = credit && credit.status !== 'voided' && credit.status !== 'paid';
  const paidPercent = credit && credit.amount > 0
    ? Math.round(((credit.amount - credit.balance) / credit.amount) * 100)
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

        <Text style={{ fontSize: 17, fontWeight: '700', color: '#111827' }}>Credit Detail</Text>

        {canVoid ? (
          <TouchableOpacity
            onPress={handleVoid}
            activeOpacity={0.7}
            disabled={voiding}
            style={{ height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: '#FEF2F2' }}
          >
            {voiding
              ? <ActivityIndicator size="small" color="#DC2626" />
              : <XCircle size={18} color="#DC2626" strokeWidth={2} />
            }
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="small" color="#16A34A" />
          <Text style={{ marginTop: 10, fontSize: 13, color: '#9CA3AF' }}>Loading credit...</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#B45309' }}>Credit unavailable</Text>
          <Text style={{ marginTop: 6, fontSize: 13, color: '#9CA3AF', textAlign: 'center' }}>{error}</Text>
        </View>
      ) : credit && status && sync && SyncIcon ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 36 }}>

          <View style={{ alignItems: 'center', paddingTop: 32, paddingBottom: 24, paddingHorizontal: 24 }}>
            <View style={{ paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginBottom: 16, backgroundColor: status.bg.replace('bg-', '') === status.bg ? '#F3F4F6' : undefined }}>
              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: credit.status === 'paid' ? '#16A34A' : credit.status === 'overdue' ? '#DC2626' : credit.status === 'voided' ? '#6B7280' : credit.status === 'partial' ? '#2563EB' : '#D97706' }}>
                {status.label}
              </Text>
            </View>
            <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 6 }}>Remaining Balance</Text>
            <Text style={{ fontSize: 52, fontWeight: '800', color: credit.status === 'paid' || credit.status === 'voided' ? '#9CA3AF' : '#14532D', lineHeight: 60 }}>
              {formatPeso(credit.balance)}
            </Text>
            <Text style={{ fontSize: 14, color: '#9CA3AF', marginTop: 6 }}>
              of {formatPeso(credit.amount)} original
            </Text>
          </View>

          {credit.amount > 0 && (
            <View style={{ marginHorizontal: 24, marginBottom: 28 }}>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: '#F3F4F6', overflow: 'hidden' }}>
                <View style={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: credit.status === 'paid' ? '#16A34A' : credit.status === 'voided' ? '#9CA3AF' : '#14532D',
                  width: `${paidPercent}%`,
                }} />
              </View>
              <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6, textAlign: 'right' }}>
                {paidPercent}% paid
              </Text>
            </View>
          )}

          <View style={{ marginHorizontal: 20, marginBottom: 10 }}>
            <View style={{ borderRadius: 20, borderWidth: 1, borderColor: '#F3F4F6', backgroundColor: '#FAFAFA', padding: 16 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Customer</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>{credit.customerName ?? '—'}</Text>
            </View>
          </View>

          <View style={{ marginHorizontal: 20, marginBottom: 10, flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1, borderRadius: 20, borderWidth: 1, borderColor: '#F3F4F6', backgroundColor: '#FAFAFA', padding: 16 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Recorded</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>{formatDashboardDate(credit.createdAt)}</Text>
            </View>
            <View style={{ flex: 1, borderRadius: 20, borderWidth: 1, borderColor: '#F3F4F6', backgroundColor: '#FAFAFA', padding: 16 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Due Date</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: credit.status === 'overdue' ? '#DC2626' : '#111827' }}>
                {credit.dueDate ? formatDashboardDate(credit.dueDate) : 'None'}
              </Text>
            </View>
          </View>

          {/* Note */}
          {credit.note ? (
            <View style={{ marginHorizontal: 20, marginBottom: 10 }}>
              <View style={{ borderRadius: 20, borderWidth: 1, borderColor: '#F3F4F6', backgroundColor: '#FAFAFA', padding: 16 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Note</Text>
                <Text style={{ fontSize: 14, color: '#374151', lineHeight: 20 }}>{credit.note}</Text>
              </View>
            </View>
          ) : null}

          {/* Blockchain sync */}
          <View style={{ marginHorizontal: 20, marginBottom: 10 }}>
            <View style={{ borderRadius: 20, borderWidth: 1, borderColor: '#F3F4F6', backgroundColor: '#FAFAFA', padding: 16 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Blockchain</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <SyncIcon size={15} color={sync.color} strokeWidth={2.2} />
                <Text style={{ fontSize: 14, fontWeight: '600', color: sync.color }}>{sync.label}</Text>
              </View>
              {credit.stellarTxHash ? (
                <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }} numberOfLines={1}>
                  {credit.stellarTxHash}
                </Text>
              ) : null}
            </View>
          </View>

        </ScrollView>
      ) : null}
    </View>
  );
}
