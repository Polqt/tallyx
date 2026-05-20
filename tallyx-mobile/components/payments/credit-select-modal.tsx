import { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { X, Calendar, TrendingUp } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { fetchCustomerDetail } from '@/features/customers/customer.service';
import type { CustomerCredit } from '@/features/customers/customer.types';
import { formatPeso, formatDashboardDate } from '@/utils/dashboard';
import { haptics } from '@/utils/haptics';

interface Props {
  visible: boolean;
  customerId: string;
  onClose: () => void;
  onSelect: (credit: CustomerCredit) => void;
}

export function CreditSelectModal({ visible, customerId, onClose, onSelect }: Props) {
  const { token } = useAuth();
  const [credits, setCredits] = useState<CustomerCredit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !token || !customerId) return;

    async function loadCustomerCredits() {
      setLoading(true);
      try {
        const res = await fetchCustomerDetail(token!, customerId);
        // Filter out fully paid credits
        const outstanding = (res.credits || []).filter((c: CustomerCredit) => c.balance > 0);
        setCredits(outstanding);
      } catch {
        setCredits([]);
      } finally {
        setLoading(false);
      }
    }

    loadCustomerCredits();
  }, [visible, customerId, token]);

  function handleSelect(credit: CustomerCredit) {
    haptics.light();
    onSelect(credit);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingTop: 20 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <Text style={{ fontFamily: 'Geist_700Bold', fontSize: 20, color: '#111827' }}>Select Outstanding Credit</Text>
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

        {/* List */}
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="small" color="#16A34A" />
          </View>
        ) : credits.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
            <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 15, color: '#9CA3AF', textAlign: 'center' }}>
              No outstanding credits found for this customer.
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {credits.map((c) => (
              <TouchableOpacity
                key={c.id}
                onPress={() => handleSelect(c)}
                activeOpacity={0.75}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  padding: 16,
                  marginBottom: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Calendar size={14} color="#6B7280" />
                    <Text style={{ fontFamily: 'Geist_500Medium', fontSize: 13, color: '#4B5563' }}>
                      Issued: {formatDashboardDate(c.date)}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <TrendingUp size={14} color="#16A34A" />
                    <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 13, color: '#6B7280' }}>
                      Original Amount: <Text style={{ fontFamily: 'Geist_600SemiBold', color: '#111827' }}>{formatPeso(c.amount)}</Text>
                    </Text>
                  </View>

                  {c.dueDate && (
                    <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 11, color: '#DC2626', marginTop: 2 }}>
                      Due: {formatDashboardDate(c.dueDate)}
                    </Text>
                  )}
                </View>

                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={{ fontFamily: 'Geist_700Bold', fontSize: 16, color: '#D97706' }}>
                    {formatPeso(c.balance)}
                  </Text>
                  <Text style={{ fontFamily: 'Geist_500Medium', fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase' }}>
                    Balance Owed
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}
