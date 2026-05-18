import { useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, Animated, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Search, Plus, ChevronRight, UserRound } from 'lucide-react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { haptics } from '@/utils/haptics';

interface Customer {
  id: string;
  name: string;
  phone?: string;
  notes?: string;
  balance: number;
  lastTransactionDate?: string;
}

const AVATAR_COLORS = ['#16A34A', '#2563EB', '#7C3AED', '#D97706', '#DC2626', '#DB2777'];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function Customers() {
  const insets = useSafeAreaInsets();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchVisible, setSearchVisible] = useState(false);
  const [query, setQuery] = useState('');

  const sheetRef = useRef<BottomSheet>(null);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [creating, setCreating] = useState(false);

  const fadeAnims = useRef<Record<string, Animated.Value>>({});

  const filtered = query.trim()
    ? customers.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
    : customers;

  function openSearch() {
    haptics.light();
    setSearchVisible(true);
  }

  function closeSearch() {
    setSearchVisible(false);
    setQuery('');
    Keyboard.dismiss();
  }

  function openSheet() {
    haptics.light();
    sheetRef.current?.expand();
  }

  function resetForm() {
    setNewName('');
    setNewPhone('');
    setNewNotes('');
  }

  function handleCreate() {
    if (!newName.trim()) return;
    haptics.success();
    setCreating(true);

    const id = Date.now().toString();
    const customer: Customer = {
      id,
      name: newName.trim(),
      phone: newPhone.trim() || undefined,
      notes: newNotes.trim() || undefined,
      balance: 0,
    };

    fadeAnims.current[id] = new Animated.Value(0);
    setCustomers((prev) => [customer, ...prev]);
    resetForm();
    sheetRef.current?.close();
    setCreating(false);

    setTimeout(() => {
      Animated.timing(fadeAnims.current[id], {
        toValue: 1, duration: 350, useNativeDriver: true,
      }).start();
    }, 50);
  }

  const renderBackdrop = useCallback(
    (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />,
    []
  );

  const renderItem = useCallback(({ item }: { item: Customer }) => {
    const fadeAnim = fadeAnims.current[item.id] ?? new Animated.Value(1);
    const color = avatarColor(item.name);

    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => { haptics.light(); router.push(`/(protected)/customers/${item.id}` as any); }}
          className="flex-row items-center px-5 py-4 border-b border-gray-100"
        >
          {/* Avatar */}
          <View className="w-11 h-11 rounded-full items-center justify-center" style={{ backgroundColor: color }}>
            <Text className="text-white text-lg font-bold">{item.name[0].toUpperCase()}</Text>
          </View>

          {/* Info */}
          <View className="flex-1 ml-3">
            <Text className="text-gray-900 text-[15px] font-bold">{item.name}</Text>
            <Text className={`text-[13px] mt-0.5 ${item.balance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {item.balance > 0 ? `₱${item.balance.toLocaleString()}` : 'All settled'}
            </Text>
          </View>

          {/* Right */}
          <View className="items-end gap-1">
            <ChevronRight size={16} color="#D1D5DB" strokeWidth={2} />
            {item.lastTransactionDate ? (
              <Text className="text-[11px] text-gray-400">{item.lastTransactionDate}</Text>
            ) : null}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }, []);

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 16 }}>

      {/* ── Header ── */}
      <View className="flex-row items-center justify-between px-5 mb-1">
        <Text className="text-[28px] font-bold text-gray-900">Customers</Text>
        <TouchableOpacity onPress={openSearch} activeOpacity={0.7} className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
          <Search size={18} color="#6B7280" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* ── Search bar ── */}
      {searchVisible && (
        <View className="flex-row items-center mx-5 mt-2 mb-2 bg-gray-100 rounded-xl h-11 px-3">
          <Search size={16} color="#9CA3AF" strokeWidth={2} />
          <TextInput
            className="flex-1 ml-2 text-sm text-gray-900"
            placeholder="Search customers"
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            autoFocus
            onBlur={closeSearch}
            returnKeyType="search"
          />
          <TouchableOpacity onPress={closeSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text className="text-sm font-medium text-green-600 ml-2">Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── List / Empty ── */}
      {customers.length === 0 && !searchVisible ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-16 h-16 rounded-full bg-green-50 items-center justify-center mb-4">
            <UserRound size={28} color="#16A34A" strokeWidth={1.8} />
          </View>
          <Text className="text-base font-bold text-gray-900 mb-2">No customers yet</Text>
          <Text className="text-sm text-gray-500 text-center mb-6 leading-5">
            Add your first customer to start tracking utang
          </Text>
          <TouchableOpacity onPress={openSheet} activeOpacity={0.85} className="bg-green-600 px-5 py-3 rounded-[20px]">
            <Text className="text-[15px] font-bold text-white">Add Customer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}

      {/* ── FAB ── */}
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

      {/* ── Add Customer Bottom Sheet ── */}
      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={['60%']}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        onClose={resetForm}
        handleIndicatorStyle={{ backgroundColor: '#E5E7EB', width: 36 }}
        backgroundStyle={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
      >
        <BottomSheetView className="flex-1 px-5 pt-2 pb-8">
          <Text className="text-[18px] font-bold text-gray-900 mb-5">Add Customer</Text>

          <View className="gap-3 mb-6">
            <TextInput
              className="bg-gray-50 rounded-xl h-12 px-4 text-sm text-gray-900 border border-gray-100"
              placeholder="Customer name"
              placeholderTextColor="#9CA3AF"
              value={newName}
              onChangeText={setNewName}
              autoCapitalize="words"
              returnKeyType="next"
            />
            <TextInput
              className="bg-gray-50 rounded-xl h-12 px-4 text-sm text-gray-900 border border-gray-100"
              placeholder="Phone number (optional)"
              placeholderTextColor="#9CA3AF"
              value={newPhone}
              onChangeText={setNewPhone}
              keyboardType="phone-pad"
              returnKeyType="next"
            />
            <TextInput
              className="bg-gray-50 rounded-xl h-12 px-4 text-sm text-gray-900 border border-gray-100"
              placeholder="Notes (optional)"
              placeholderTextColor="#9CA3AF"
              value={newNotes}
              onChangeText={setNewNotes}
              returnKeyType="done"
            />
          </View>

          <TouchableOpacity
            onPress={handleCreate}
            activeOpacity={0.85}
            disabled={!newName.trim() || creating}
            className={`h-[52px] rounded-xl items-center justify-center ${!newName.trim() ? 'bg-green-200' : 'bg-green-600'}`}
          >
            <Text className="text-[15px] font-bold text-white">Create Customer</Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}
