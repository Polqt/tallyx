import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Check, Search, UserRound, X } from 'lucide-react-native';
import { fetchCustomers } from '@/features/customers/customer.service';
import type { CustomerListItem } from '@/features/customers/customer.types';
import { formatPeso } from '@/utils/dashboard';
import { haptics } from '@/utils/haptics';

type Props = {
  token: string;
  selectedCustomerId: string;
  onSelect: (id: string) => void;
  TextInputComponent?: React.ComponentType<React.ComponentProps<typeof TextInput>>;
};

export function CreditCustomerPicker({ token, selectedCustomerId, onSelect, TextInputComponent = TextInput }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CustomerListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [focused, setFocused] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const selectedCustomer = results.find((c) => c.id === selectedCustomerId)
    ?? (initialLoaded ? null : undefined);

  const search = useCallback(async (q: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const data = await fetchCustomers(token, { page: 1, limit: 10, query: q, signal: controller.signal });
      setResults(data.items);
      if (!initialLoaded) setInitialLoaded(true);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
    } finally {
      setLoading(false);
    }
  }, [initialLoaded, token]);

  useEffect(() => {
    search('');
    return () => abortRef.current?.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!initialLoaded) return;
    const timer = setTimeout(() => search(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [initialLoaded, query, search]);

  useEffect(() => {
    if (initialLoaded && !selectedCustomerId && results.length > 0) {
      onSelect(results[0].id);
    }
  }, [initialLoaded, onSelect, results, selectedCustomerId]);

  const visibleResults = selectedCustomerId && selectedCustomer && !query
    ? [selectedCustomer, ...results.filter((c) => c.id !== selectedCustomerId)]
    : results;

  return (
    <View style={{ gap: 8, marginBottom: 4 }}>
      {/* Search input */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 48,
          backgroundColor: '#F5F5F5',
          borderRadius: 14,
          paddingHorizontal: 14,
          gap: 10,
          borderWidth: 1.5,
          borderColor: focused ? '#16A34A' : 'transparent',
        }}
      >
        <Search size={16} color="#9CA3AF" strokeWidth={2} />
        <TextInputComponent
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search customers"
          placeholderTextColor="#9CA3AF"
          returnKeyType="search"
          autoCorrect={false}
          style={{ flex: 1, fontSize: 14, color: '#111827' }}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
            <X size={14} color="#9CA3AF" strokeWidth={2.5} />
          </TouchableOpacity>
        )}
        {loading && <ActivityIndicator size="small" color="#16A34A" />}
      </View>

      {/* Results */}
      {!initialLoaded ? (
        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
          <ActivityIndicator size="small" color="#16A34A" />
          <Text style={{ marginTop: 8, fontSize: 13, color: '#9CA3AF' }}>Loading customers...</Text>
        </View>
      ) : visibleResults.length === 0 ? (
        <View style={{ backgroundColor: '#F9FAFB', borderRadius: 14, padding: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>
            {query ? 'No customers found' : 'No customers yet'}
          </Text>
          <Text style={{ marginTop: 4, fontSize: 13, color: '#9CA3AF', lineHeight: 20 }}>
            {query ? 'Try a different name or phone number.' : 'Add a customer first before recording a credit.'}
          </Text>
        </View>
      ) : (
        visibleResults.map((customer) => {
          const selected = customer.id === selectedCustomerId;
          return (
            <TouchableOpacity
              key={customer.id}
              onPress={() => { haptics.light(); onSelect(customer.id); }}
              activeOpacity={0.75}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderRadius: 14,
                padding: 14,
                backgroundColor: selected ? '#F0FDF4' : '#F9FAFB',
                borderWidth: selected ? 1.5 : 0,
                borderColor: selected ? '#16A34A' : 'transparent',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: selected ? '#16A34A' : '#E5E7EB',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <UserRound size={18} color={selected ? '#FFFFFF' : '#9CA3AF'} strokeWidth={2} />
                </View>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: selected ? '700' : '400', color: selected ? '#111827' : '#374151' }}>
                    {customer.name}
                  </Text>
                  <Text style={{ marginTop: 2, fontSize: 13, color: '#9CA3AF' }}>
                    Balance {formatPeso(customer.balance)}
                  </Text>
                </View>
              </View>
              {selected && <Check size={18} color="#16A34A" strokeWidth={2.5} />}
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );
}
