import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useLocalSearchParams } from 'expo-router';
import { Plus, History } from 'lucide-react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { useAuth } from '@/context/AuthContext';
import { useNavVisibility } from '@/context/NavVisibilityContext';
import { fetchPayments } from '@/features/payments/payment.service';
import type { PaymentItem } from '@/features/payments/payment.types';
import { PaymentListRow } from '@/components/payments/payment-list-row';
import { PaymentSearchBar } from '@/components/payments/payment-search-bar';
import { RecordPaymentSheet } from '@/components/payments/record-payment-sheet';
import { formatPeso } from '@/utils/dashboard';
import { haptics } from '@/utils/haptics';

type MethodFilter = 'all' | 'cash' | 'usdc';

export default function Payments() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { hideNav, showNav } = useNavVisibility();
  const navigation = useNavigation();
  const { customerId } = useLocalSearchParams<{ customerId?: string }>();

  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<MethodFilter>('all');
  const [sheetOpen, setSheetOpen] = useState(false);

  const sheetRef = useRef<BottomSheet>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const loadPayments = useCallback(async (showLoading = true, signal?: AbortSignal) => {
    if (!token) return;
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const data = await fetchPayments(token, undefined, signal);
      setPayments(data.items);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Unable to load payment history.');
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    const controller = new AbortController();
    loadPayments(true, controller.signal);

    const unsubscribe = navigation.addListener('focus', () => {
      loadPayments(false);
    });

    return () => {
      controller.abort();
      unsubscribe();
    };
  }, [loadPayments, navigation]);

  const handleRefresh = () => {
    haptics.light();
    setRefreshing(true);
    loadPayments(false);
  };

  function openSheet() {
    haptics.light();
    sheetRef.current?.snapToIndex(0);
    setSheetOpen(true);
    hideNav();
  }

  function handleSheetClose() {
    setSheetOpen(false);
    showNav();
  }

  const basePayments = useMemo(() =>
    customerId ? payments.filter((p) => p.customer.id === customerId) : payments,
    [customerId, payments]
  );

  const totalCash = useMemo(() =>
    basePayments.filter((p) => p.paymentMethod === 'cash').reduce((sum, p) => sum + Number(p.amount), 0),
    [basePayments]
  );
  const totalUsdc = useMemo(() =>
    basePayments.filter((p) => p.paymentMethod === 'usdc').reduce((sum, p) => sum + Number(p.amount), 0),
    [basePayments]
  );

  const visiblePayments = useMemo(() => {
    let list = basePayments;
    if (methodFilter !== 'all') list = list.filter((p) => p.paymentMethod === methodFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => p.customer.name.toLowerCase().includes(q));
    }
    return list;
  }, [basePayments, methodFilter, search]);

  useEffect(() => {
    if (visiblePayments.length === 0 && !loading) {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.delay(1800),
        ])
      );
      pulseLoop.current.start();
    } else {
      pulseLoop.current?.stop();
      pulseAnim.setValue(1);
    }
    return () => pulseLoop.current?.stop();
  }, [visiblePayments.length, loading, pulseAnim]);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Visual Stat Header */}
      <View style={{ backgroundColor: '#14532D', paddingTop: insets.top + 20, paddingHorizontal: 20, paddingBottom: 32 }}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 }}>
            <History size={16} color="rgba(255,255,255,0.7)" />
            <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
              Collections Hub
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Geist_500Medium', fontSize: 11, color: 'rgba(255,255,255,0.55)', letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 8 }}>
              Cash Collections
            </Text>
            <Text style={{ fontFamily: 'Geist_700Bold', fontSize: 44, color: '#FFFFFF', lineHeight: 52 }}>
              {formatPeso(totalCash)}
            </Text>
            {totalUsdc > 0 && (
              <Text style={{ fontFamily: 'Geist_500Medium', fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
                + {totalUsdc.toLocaleString()} USDC
              </Text>
            )}
            <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 8 }}>
              {visiblePayments.length} successful payment{visiblePayments.length !== 1 ? 's' : ''} logged
              {customerId ? ' · filtered by customer' : ''}
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Main List Container */}
      <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -20, flex: 1 }}>
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="small" color="#16A34A" />
            <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 13, color: '#9CA3AF', marginTop: 10 }}>
              Loading collections...
            </Text>
          </View>
        ) : error ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
            <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 16, color: '#991B1B' }}>Connection Issue</Text>
            <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 6 }}>{error}</Text>
            <TouchableOpacity onPress={() => loadPayments(true)} style={{ marginTop: 16, backgroundColor: '#14532D', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}>
              <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 13, color: '#FFFFFF' }}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={visiblePayments}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <PaymentListRow item={item} />}
            ListHeaderComponent={
              <View style={{ marginBottom: 8 }}>
                <View style={{ marginBottom: 24 }}>
                  <PaymentSearchBar value={search} onChange={setSearch} placeholder="Search by customer name..." />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {(['all', 'cash', 'usdc'] as MethodFilter[]).map((m) => {
                      const active = methodFilter === m;
                      const label = m === 'all' ? 'All' : m === 'cash' ? 'Cash' : 'USDC';
                      return (
                        <TouchableOpacity
                          key={m}
                          onPress={() => { haptics.light(); setMethodFilter(m); }}
                          activeOpacity={0.7}
                          style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: active ? '#14532D' : '#FFFFFF', borderWidth: 1, borderColor: active ? '#14532D' : '#E5E7EB' }}
                        >
                          <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 12, color: active ? '#FFFFFF' : '#6B7280' }}>{label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 12, color: '#9CA3AF' }}>
                    {visiblePayments.length} result{visiblePayments.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            }
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 }}>
                <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 15, color: '#111827', marginBottom: 6 }}>No payments found</Text>
                <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 13, color: '#9CA3AF', textAlign: 'center' }}>
                  {search.trim() ? 'Try a different name.' : methodFilter !== 'all' ? 'Try a different filter.' : 'Record a payment to get started.'}
                </Text>
              </View>
            }
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: insets.bottom + 100 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#16A34A']} tintColor="#16A34A" />}
          />
        )}
      </View>

      {!sheetOpen && (
        <Animated.View style={{ position: 'absolute', right: 20, bottom: insets.bottom + 90, transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            onPress={openSheet}
            activeOpacity={0.85}
            style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center', shadowColor: '#16A34A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 12, elevation: 10 }}
          >
            <Plus size={24} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </Animated.View>
      )}

      <RecordPaymentSheet
        ref={sheetRef}
        onClose={handleSheetClose}
        onSuccess={() => loadPayments(false)}
      />
    </View>
  );
}
