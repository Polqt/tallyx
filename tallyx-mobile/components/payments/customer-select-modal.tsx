import { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { X, Search } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { fetchCustomers } from '@/features/customers/customer.service';
import type { CustomerListItem } from '@/features/customers/customer.types';
import { getCustomerAvatarColor } from '@/utils/customers';
import { formatPeso } from '@/utils/dashboard';
import { haptics } from '@/utils/haptics';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (customer: CustomerListItem) => void;
}

export function CustomerSelectModal({ visible, onClose, onSelect }: Props) {
  const { token } = useAuth();
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !token) return;

    let active = true;
    async function loadCustomers() {
      setLoading(true);
      try {
        const res = await fetchCustomers(token!, { query: search });
        if (active) setCustomers(res.items);
      } catch {
        if (active) setCustomers([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      loadCustomers();
    }, 150);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [visible, search, token]);

  function handleSelect(customer: CustomerListItem) {
    haptics.light();
    onSelect(customer);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingTop: 20 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <Text style={{ fontFamily: 'Geist_700Bold', fontSize: 20, color: '#111827' }}>Select Customer</Text>
          <TouchableOpacity 
            onPress={onClose} 
            activeOpacity={0.7}
            style={{ 
              width: 32, 
              height: 32, 
              borderRadius: 16, 
              backgroundColor: '#F3F4F6', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          >
            <X size={16} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View 
          style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            gap: 10, 
            backgroundColor: '#F3F4F6', 
            borderRadius: 14, 
            paddingHorizontal: 12, 
            paddingVertical: 10,
            marginBottom: 20
          }}
        >
          <Search size={18} color="#9CA3AF" />
          <TextInput
            placeholder="Search customer by name..."
            value={search}
            onChangeText={setSearch}
            style={{ 
              flex: 1, 
              fontFamily: 'Geist_400Regular', 
              fontSize: 15, 
              color: '#111827',
              padding: 0
            }}
          />
        </View>

        {/* List */}
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="small" color="#16A34A" />
          </View>
        ) : customers.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 15, color: '#9CA3AF' }}>
              No customers found.
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {customers.map((c) => {
              const color = getCustomerAvatarColor(c.name);
              const initials = c.name[0]?.toUpperCase() ?? '?';

              return (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => handleSelect(c)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: '#F3F4F6',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                    <View 
                      style={{ 
                        width: 38, 
                        height: 38, 
                        borderRadius: 19, 
                        backgroundColor: color, 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}
                    >
                      <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 14, color: '#FFFFFF' }}>{initials}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 15, color: '#111827' }} numberOfLines={1}>
                        {c.name}
                      </Text>
                      {c.phone && (
                        <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>
                          +63 {c.phone}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text 
                      style={{ 
                        fontFamily: 'Geist_600SemiBold', 
                        fontSize: 14, 
                        color: c.balance > 0 ? '#D97706' : '#16A34A' 
                      }}
                    >
                      {c.balance > 0 ? `${formatPeso(c.balance)} outstanding` : 'Settled'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}
