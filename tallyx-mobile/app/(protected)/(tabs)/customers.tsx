import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, BackHandler, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { Plus, UsersRound } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import BottomSheet from '@gorhom/bottom-sheet';
import { AddCustomerSheet } from '@/components/customers/add-customer-sheet';
import { CustomerEmptyState } from '@/components/customers/customer-empty-state';
import { CustomerListRow } from '@/components/customers/customer-list-row';
import { CustomerSearchBar } from '@/components/customers/customer-search-bar';
import { useAuth } from '@/context/AuthContext';
import { useNavVisibility } from '@/context/NavVisibilityContext';
import { createCustomer, fetchCustomers } from '@/features/customers/customer.service';
import type { CustomerListItem } from '@/features/customers/customer.types';
import { haptics } from '@/utils/haptics';


export default function Customers() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { hideNav, showNav } = useNavVisibility();
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCustomers, setTotalCustomers] = useState(0);

  const sheetRef = useRef<BottomSheet>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [creating, setCreating] = useState(false);

  const fadeAnims = useRef<Record<string, Animated.Value>>({});
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (customers.length === 0 && !loading) {
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
  }, [customers.length, loading, pulseAnim]);

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

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const authToken = token;
    const controller = new AbortController();

    setCustomers([]);
    setPage(1);
    setHasMore(false);

    async function loadCustomers() {
      setLoading(true);
      setLoadError(null);

      try {
        const data = await fetchCustomers(authToken, {
          page: 1,
          limit: 20,
          query: debouncedQuery,
          signal: controller.signal,
        });
        setCustomers(data.items);
        setPage(data.pagination.page);
        setHasMore(data.pagination.hasMore);
        setTotalCustomers(data.pagination.total);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
        setLoadError(error instanceof Error ? error.message : 'Unable to load customers.');
      } finally {
        setLoading(false);
      }
    }

    loadCustomers();
    return () => controller.abort();
  }, [debouncedQuery, token]);

  const loadMoreCustomers = useCallback(async () => {
    if (!token || loading || loadingMore || !hasMore) return;

    setLoadingMore(true);

    try {
      const nextPage = page + 1;
      const data = await fetchCustomers(token, {
        page: nextPage,
        limit: 20,
        query: debouncedQuery,
      });

      setCustomers((prev) => [...prev, ...data.items]);
      setPage(data.pagination.page);
      setHasMore(data.pagination.hasMore);
      setTotalCustomers(data.pagination.total);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Could not load more customers',
        text2: error instanceof Error ? error.message : 'Please try again.',
        position: 'top',
      });
    } finally {
      setLoadingMore(false);
    }
  }, [debouncedQuery, hasMore, loading, loadingMore, page, token]);

  function openSheet() {
    haptics.light();
    sheetRef.current?.snapToIndex(0);
    setSheetOpen(true);
    hideNav();
  }

  function handleSheetClose() {
    setSheetOpen(false);
    showNav();
    setNewName('');
    setNewPhone('');
  }

  async function handleCreate() {
    if (!token) return;
    if (!newName.trim()) return;
    if (newPhone.trim() && newPhone.trim().length < 7) {
      Toast.show({
        type: 'error',
        text1: 'Check the phone number',
        text2: 'Use at least 7 digits or leave it blank.',
        position: 'top',
      });
      return;
    }

    haptics.medium();
    setCreating(true);

    try {
      const customer = await createCustomer(token, {
        name: newName.trim(),
        phone: newPhone.trim() || undefined,
      });

      fadeAnims.current[customer.id] = new Animated.Value(0);
      setCustomers((prev) => [customer, ...prev]);
      setTotalCustomers((total) => total + 1);
      sheetRef.current?.close();
      haptics.success();
      router.push(`/(protected)/customers/${customer.id}` as any);

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
    <View style={{ marginBottom: 8 }}>
      <CustomerSearchBar value={query} onChange={setQuery} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2, marginTop: 16, marginBottom: 8 }}>
        <Text style={{ fontFamily: 'Geist_700Bold', fontSize: 15, color: '#111827' }}>
          {query.trim() ? 'Search results' : 'Recent customers'}
        </Text>
        <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 12, color: '#9CA3AF' }}>
          {customers.length} shown
        </Text>
      </View>
    </View>
  ), [customers.length, query]);

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={{ alignItems: 'center', paddingVertical: 16 }}>
        <ActivityIndicator size="small" color="#16A34A" />
      </View>
    );
  }, [loadingMore]);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ backgroundColor: '#14532D', paddingTop: insets.top + 20, paddingHorizontal: 20, paddingBottom: 32 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 }}>
          <UsersRound size={16} color="rgba(255,255,255,0.7)" />
          <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
            Customer Book
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontFamily: 'Geist_500Medium', fontSize: 11, color: 'rgba(255,255,255,0.55)', letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 8 }}>
            Total Customers
          </Text>
          <Text style={{ fontFamily: 'Geist_700Bold', fontSize: 44, color: '#FFFFFF', lineHeight: 52 }}>
            {totalCustomers}
          </Text>
          <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 8 }}>
            {totalCustomers === 1 ? '1 customer record' : `${totalCustomers} customer records`}
          </Text>
        </View>
      </View>

      <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -20, flex: 1 }}>
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="small" color="#16A34A" />
            <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 13, color: '#9CA3AF', marginTop: 10 }}>
              Loading customers...
            </Text>
          </View>
        ) : loadError ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
            <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 16, color: '#991B1B' }}>Customers unavailable</Text>
            <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 6 }}>{loadError}</Text>
          </View>
        ) : (
          <FlatList
            data={customers}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListHeaderComponent={renderHeader}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={
              <CustomerEmptyState isSearching={Boolean(query.trim())} onAddCustomer={openSheet} />
            }
            onEndReached={loadMoreCustomers}
            onEndReachedThreshold={0.35}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: insets.bottom + 100 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>

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

      <AddCustomerSheet
        ref={sheetRef}
        name={newName}
        phone={newPhone}
        creating={creating}
        onNameChange={setNewName}
        onPhoneChange={setNewPhone}
        onSubmit={handleCreate}
        onClose={handleSheetClose}
      />
    </View>
  );
}
