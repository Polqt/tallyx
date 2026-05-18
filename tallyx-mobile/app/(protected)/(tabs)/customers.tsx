import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Plus, UsersRound, WalletCards } from 'lucide-react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import Toast from 'react-native-toast-message';
import { AddCustomerSheet } from '@/components/customers/add-customer-sheet';
import { CustomerEmptyState } from '@/components/customers/customer-empty-state';
import { CustomerListRow } from '@/components/customers/customer-list-row';
import { CustomerSearchBar } from '@/components/customers/customer-search-bar';
import { useAuth } from '@/context/AuthContext';
import { useNavVisibility } from '@/context/NavVisibilityContext';
import { createCustomer, fetchCustomers } from '@/features/customers/customer.service';
import type { CustomerListItem } from '@/features/customers/customer.types';
import { formatPeso } from '@/utils/dashboard';
import { haptics } from '@/utils/haptics';

export default function Customers() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { hideNav, showNav } = useNavVisibility();
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const sheetRef = useRef<BottomSheet>(null);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [creating, setCreating] = useState(false);
  const [formVersion, setFormVersion] = useState(0);

  const fadeAnims = useRef<Record<string, Animated.Value>>({});

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return customers;

    return customers.filter((customer) =>
      [customer.name, customer.phone].filter(Boolean).some((value) =>
        value!.toLowerCase().includes(normalizedQuery)
      )
    );
  }, [customers, query]);

  const totalReceivables = useMemo(
    () => customers.reduce((sum, customer) => sum + customer.balance, 0),
    [customers]
  );

  useEffect(() => {
    if (!token) return;

    const authToken = token;
    const controller = new AbortController();

    async function loadCustomers() {
      setLoading(true);
      setLoadError(null);

      try {
        const data = await fetchCustomers(authToken, controller.signal);
        setCustomers(data);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
        setLoadError(error instanceof Error ? error.message : 'Unable to load customers.');
      } finally {
        setLoading(false);
      }
    }

    loadCustomers();
    return () => controller.abort();
  }, [token]);

  function openSheet() {
    haptics.light();
    hideNav();
    sheetRef.current?.expand();
  }

  function resetForm() {
    setNewName('');
    setNewPhone('');
    setFormVersion((version) => version + 1);
    showNav();
  }

  async function handleCreate() {
    if (!token || !newName.trim()) return;

    haptics.medium();
    setCreating(true);

    try {
      const customer = await createCustomer(token, {
        name: newName.trim(),
        phone: newPhone.trim() || undefined,
      });

      fadeAnims.current[customer.id] = new Animated.Value(0);
      setCustomers((prev) => [customer, ...prev]);
      resetForm();
      sheetRef.current?.close();
      haptics.success();

      setTimeout(() => {
        Animated.timing(fadeAnims.current[customer.id], {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }).start();
      }, 50);
    } catch (error) {
      haptics.error();
      Toast.show({
        type: 'error',
        text1: 'Customer not saved',
        text2: error instanceof Error ? error.message : 'Please try again.',
        position: 'top',
      });
    } finally {
      setCreating(false);
    }
  }

  const renderItem = useCallback(({ item }: { item: CustomerListItem }) => {
    const fadeAnim = fadeAnims.current[item.id] ?? new Animated.Value(1);

    return (
      <CustomerListRow
        customer={item}
        opacity={fadeAnim}
        onPress={() => {
          haptics.light();
          router.push(`/(protected)/customers/${item.id}` as any);
        }}
      />
    );
  }, []);

  const renderHeader = useCallback(() => (
    <View className="gap-4 pb-4">
      <View className="rounded-[28px] bg-[#14532D] p-5" style={{ boxShadow: '0 12px 30px rgba(20, 83, 45, 0.16)' }}>
        <View className="mb-6 flex-row items-center justify-between">
          <View>
            <Text className="text-[12px] font-medium uppercase tracking-[2px] text-white/55">
              Customer book
            </Text>
            <Text className="mt-1 text-[26px] font-bold text-white">{customers.length} customers</Text>
          </View>
          <View className="h-12 w-12 items-center justify-center rounded-full bg-white/12">
            <UsersRound size={22} color="#FFFFFF" strokeWidth={2} />
          </View>
        </View>

        <View className="rounded-3xl bg-white/10 p-4">
          <View className="flex-row items-center gap-2">
            <WalletCards size={17} color="rgba(255,255,255,0.72)" strokeWidth={2} />
            <Text className="text-[12px] font-medium uppercase tracking-[1.5px] text-white/60">
              Outstanding balance
            </Text>
          </View>
          <Text className="mt-2 text-[32px] font-bold text-white" style={{ fontVariant: ['tabular-nums'] }}>
            {formatPeso(totalReceivables)}
          </Text>
        </View>
      </View>

      <CustomerSearchBar value={query} onChange={setQuery} />

      <View className="flex-row items-center justify-between">
        <Text className="text-[12px] font-bold uppercase tracking-[1.8px] text-gray-400">
          {query.trim() ? 'Search results' : 'Recent customers'}
        </Text>
        <Text className="text-[12px] font-medium text-gray-400">
          {filtered.length} shown
        </Text>
      </View>
    </View>
  ), [customers.length, filtered.length, query, totalReceivables]);

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top + 16 }}>

      {loading ? (
        <View className="flex-1 items-center justify-center px-8">
          <ActivityIndicator size="small" color="#16A34A" />
          <Text className="text-sm text-gray-400 mt-3">Loading customers...</Text>
        </View>
      ) : loadError ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-base font-bold text-amber-700 mb-2">Customers unavailable</Text>
          <Text className="text-sm text-gray-500 text-center leading-5">{loadError}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <CustomerEmptyState isSearching={Boolean(query.trim())} onAddCustomer={openSheet} />
          }
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}

      {customers.length > 0 && (
        <TouchableOpacity
          onPress={openSheet}
          activeOpacity={0.85}
          className="absolute right-5 w-14 h-14 rounded-full bg-green-600 items-center justify-center"
          style={{
            bottom: insets.bottom + 90,
            shadowColor: '#16A34A',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 10,
            elevation: 8,
          }}
        >
          <Plus size={24} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
      )}

      <AddCustomerSheet
        ref={sheetRef}
        name={newName}
        phone={newPhone}
        creating={creating}
        formVersion={formVersion}
        onNameChange={setNewName}
        onPhoneChange={setNewPhone}
        onSubmit={handleCreate}
        onClose={resetForm}
      />
    </View>
  );
}
