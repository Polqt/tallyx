import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, BackHandler, FlatList, Modal, Pressable, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, FileText, Plus } from 'lucide-react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import Toast from 'react-native-toast-message';
import { AddCreditSheet } from '@/components/credits/add-credit-sheet';
import { CreditRow } from '@/components/credits/credit-row';
import { useAuth } from '@/context/AuthContext';
import { useNavVisibility } from '@/context/NavVisibilityContext';
import { createCredit, fetchCredits, voidCredit } from '@/features/credits/credit.service';
import type { CreditListItem, CreditStatus } from '@/features/credits/credit.types';
import { parseDueDate, parsePesoAmount } from '@/utils/credit';
import { formatPeso } from '@/utils/dashboard';
import { haptics } from '@/utils/haptics';

export default function Credits() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { hideNav, showNav } = useNavVisibility();
  const { customerId } = useLocalSearchParams<{ customerId?: string }>();

  const [credits, setCredits] = useState<CreditListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const sheetRef = useRef<BottomSheet>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customerId ?? '');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<CreditStatus | undefined>(undefined);
  const [filterPickerVisible, setFilterPickerVisible] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if ((credits || []).length === 0 && !loading) {
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
  }, [credits, credits.length, loading, pulseAnim]);

  useFocusEffect(
    useCallback(() => {
      if (!sheetOpen) return;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        sheetRef.current?.close();
        return true;
      });
      return () => sub.remove();
    }, [sheetOpen])
  );

  const totalReceivables = useMemo(
    () => (credits || []).filter((c) => c?.status !== 'paid').reduce((sum, c) => sum + (c?.balance ?? 0), 0),
    [credits]
  );
  const overdueAmount = useMemo(
    () => (credits || []).filter((c) => c?.status === 'overdue').reduce((sum, c) => sum + (c?.balance ?? 0), 0),
    [credits]
  );

  const loadCredits = useCallback(async (nextPage = 1, append = false) => {
    if (!token) { setLoading(false); return; }
    if (append) setLoadingMore(true);
    else setLoadError(null);

    try {
      const data = await fetchCredits(token, { page: nextPage, limit: 20, customerId, status: statusFilter });
      setCredits((prev) => append ? [...prev, ...(data?.items || [])] : (data?.items || []));
      setPage(data?.pagination?.page ?? 1);
      setHasMore(data?.pagination?.hasMore ?? false);
    } catch (error) {
      if (append) {
        Toast.show({ type: 'error', text1: 'Could not load more credits', text2: error instanceof Error ? error.message : 'Please try again.', position: 'top' });
      } else {
        setLoadError(error instanceof Error ? error.message : 'Unable to load credits.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [customerId, statusFilter, token]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadCredits(1);
    }, [loadCredits])
  );

  const handleFilterChange = useCallback((status: CreditStatus | undefined) => {
    haptics.light();
    setStatusFilter(status);
    setLoading(true);
  }, []);

  function openSheet() {
    haptics.light();
    sheetRef.current?.snapToIndex(0);
    setSheetOpen(true);
    hideNav();
  }

  function handleSheetClose() {
    setSheetOpen(false);
    showNav();
    setAmount('');
    setDueDate('');
    setNote('');
    setSelectedCustomerId(customerId ?? '');
  }

  async function handleSave() {
    if (!token || saving) return;
    if (!selectedCustomerId) {
      Alert.alert('Select customer', 'Choose the customer who received the credit.');
      return;
    }
    const parsedAmount = parsePesoAmount(amount);
    if (parsedAmount <= 0) {
      Alert.alert('Enter amount', 'Credit amount must be greater than zero.');
      return;
    }
    const parsedDueDateValue = parseDueDate(dueDate);
    if (parsedDueDateValue === null) {
      Alert.alert('Check due date', 'Use YYYY-MM-DD format, for example 2026-05-30.');
      return;
    }

    haptics.medium();
    setSaving(true);
    try {
      await createCredit(token, {
        customerId: selectedCustomerId,
        amount: parsedAmount,
        dueDate: parsedDueDateValue,
        note: note.trim() || undefined,
      });
      haptics.success();
      sheetRef.current?.close();
      loadCredits(1);
    } catch (error) {
      haptics.error();
      Alert.alert('Credit not saved', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const refreshCredits = useCallback(() => {
    haptics.light();
    setRefreshing(true);
    loadCredits(1);
  }, [loadCredits]);

  const loadMoreCredits = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    loadCredits(page + 1, true);
  }, [hasMore, loadCredits, loading, loadingMore, page]);

  const handleVoid = useCallback((credit: CreditListItem) => {
    if (!token) return;
    if (credit.status === 'voided') return;
    if (credit.status === 'paid') {
      Alert.alert('Cannot void', 'This credit has already been fully paid.');
      return;
    }
    haptics.medium();
    Alert.alert(
      'Void credit?',
      `This will cancel the ₱${credit.amount.toLocaleString()} credit for ${credit.customerName ?? 'this customer'}. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Void',
          style: 'destructive',
          onPress: async () => {
            try {
              await voidCredit(token, credit.id);
              haptics.success();
              loadCredits(1);
            } catch (error) {
              haptics.error();
              Alert.alert('Could not void credit', error instanceof Error ? error.message : 'Please try again.');
            }
          },
        },
      ]
    );
  }, [loadCredits, token]);

  const renderHeader = useCallback(() => (
    <View className="gap-4 pb-4">
      {/* Ledger card */}
      <View
        style={{
          backgroundColor: '#14532D',
          borderRadius: 20,
          padding: 20,
          shadowColor: '#14532D',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.22,
          shadowRadius: 20,
          elevation: 6,
        }}
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-4">
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 6 }}>
              Total Receivables
            </Text>
            <Text style={{ fontSize: 44, fontWeight: '700', color: '#FFFFFF', lineHeight: 50 }}>
              {formatPeso(totalReceivables)}
            </Text>
            <View className="mt-3 flex-row items-center gap-1.5">
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: overdueAmount > 0 ? '#F59E0B' : '#4ADE80',
                }}
              />
              <Text
                style={{
                  fontSize: 13,
                  color: overdueAmount > 0 ? '#FCD34D' : 'rgba(255,255,255,0.75)',
                }}
              >
                {overdueAmount > 0 ? `${formatPeso(overdueAmount)} overdue` : 'No overdue credits'}
              </Text>
            </View>
          </View>

          {/* View Ledger pill */}
          <View
            style={{
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            <Text style={{ fontSize: 12, color: '#FFFFFF', fontWeight: '500' }}>View Ledger</Text>
          </View>
        </View>
      </View>

      {/* Section label row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>
          {customerId ? 'Customer Credits' : 'Recent Credits'}
        </Text>
        <TouchableOpacity
          onPress={() => { haptics.light(); setFilterPickerVisible(true); }}
          activeOpacity={0.7}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 4,
            backgroundColor: statusFilter ? '#F0FDF4' : '#FFFFFF',
            borderWidth: 1, borderColor: statusFilter ? '#86EFAC' : '#E5E7EB',
            borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '500', color: statusFilter ? '#16A34A' : '#374151' }}>
            {statusFilter ? statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1) : 'All'}
          </Text>
          <ChevronDown size={13} color={statusFilter ? '#16A34A' : '#6B7280'} strokeWidth={2} />
        </TouchableOpacity>
      </View>

    </View>
  ), [customerId, overdueAmount, statusFilter, totalReceivables]);

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View className="items-center py-4">
        <ActivityIndicator size="small" color="#16A34A" />
      </View>
    );
  }, [loadingMore]);

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top + 16 }}>
      {loading ? (
        <View className="flex-1 items-center justify-center px-8">
          <ActivityIndicator size="small" color="#16A34A" />
          <Text className="mt-3 text-sm text-gray-400">Loading credits...</Text>
        </View>
      ) : loadError ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-2 text-base font-bold text-amber-700">Credits unavailable</Text>
          <Text className="text-center text-sm leading-5 text-gray-500">{loadError}</Text>
        </View>
      ) : (
        <FlatList
          data={credits}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CreditRow credit={item} onLongPress={() => handleVoid(item)} />}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 80 }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: '#F0FDF4',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <FileText size={24} color="#16A34A" strokeWidth={1.8} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8, textAlign: 'center' }}>
                {statusFilter ? `No ${statusFilter} credits` : 'No credits yet'}
              </Text>
              <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 }}>
                {statusFilter
                  ? 'Try a different filter to see other credits.'
                  : "Record a customer's utang and it will appear here."}
              </Text>
            </View>
          }
          onEndReached={loadMoreCredits}
          onEndReachedThreshold={0.35}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshCredits} tintColor="#16A34A" />}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 120 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {!sheetOpen && (
        <Animated.View
          style={{
            position: 'absolute',
            right: 20,
            bottom: insets.bottom + 90,
            transform: [{ scale: pulseAnim }],
          }}
        >
          <TouchableOpacity
            onPress={openSheet}
            activeOpacity={0.85}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: '#16A34A',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#16A34A',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.45,
              shadowRadius: 12,
              elevation: 10,
            }}
          >
            <Plus size={24} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </Animated.View>
      )}

      <AddCreditSheet
        ref={sheetRef}
        token={token ?? ''}
        selectedCustomerId={selectedCustomerId}
        amount={amount}
        dueDate={dueDate}
        note={note}
        saving={saving}
        onSelectCustomer={setSelectedCustomerId}
        onAmountChange={setAmount}
        onDueDateChange={setDueDate}
        onNoteChange={setNote}
        onSubmit={handleSave}
        onClose={handleSheetClose}
      />

      <Modal
        visible={filterPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterPickerVisible(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}
          onPress={() => setFilterPickerVisible(false)}
        >
          <Pressable onPress={() => {}}>
            <View style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 12,
              paddingBottom: insets.bottom + 24,
            }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 20 }} />
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827', paddingHorizontal: 20, marginBottom: 12 }}>
                Filter by status
              </Text>
              {([undefined, 'pending', 'partial', 'overdue', 'paid'] as (CreditStatus | undefined)[]).map((s) => {
                const label = s === undefined ? 'All credits' : s.charAt(0).toUpperCase() + s.slice(1);
                const active = statusFilter === s;
                return (
                  <TouchableOpacity
                    key={label}
                    onPress={() => { handleFilterChange(s); setFilterPickerVisible(false); }}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                      paddingHorizontal: 20, paddingVertical: 14,
                      backgroundColor: active ? '#F0FDF4' : 'transparent',
                    }}
                  >
                    <Text style={{ fontSize: 15, fontWeight: active ? '600' : '400', color: active ? '#16A34A' : '#374151' }}>
                      {label}
                    </Text>
                    {active && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A' }} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
