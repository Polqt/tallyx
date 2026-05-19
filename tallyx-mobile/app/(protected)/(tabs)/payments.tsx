import { useEffect, useRef, useState } from 'react';
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
import { router, useNavigation } from 'expo-router';
import { Plus, History } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { fetchPayments } from '@/features/payments/payment.service';
import type { PaymentItem } from '@/features/payments/payment.types';
import { PaymentListRow } from '@/components/payments/payment-list-row';
import { PaymentEmptyState } from '@/components/payments/payment-empty-state';
import { formatPeso } from '@/utils/dashboard';
import { haptics } from '@/utils/haptics';

export default function Payments() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const navigation = useNavigation();

  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  // Trigger animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Load payments from API
  const loadPayments = async (showLoading = true, signal?: AbortSignal) => {
    if (!token) return;
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const data = await fetchPayments(token!, signal);
      setPayments(data);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Unable to load payment history.');
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch payments on mount and screen focus
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
  }, [token, navigation]);

  const handleRefresh = () => {
    haptics.light();
    setRefreshing(true);
    loadPayments(false);
  };

  const handleRecordNew = () => {
    haptics.light();
    router.push('/(protected)/payments/new');
  };

  // Calculate dynamic summary stats
  const totalCollections = payments.reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Visual Stat Header */}
      <View 
        style={{ 
          backgroundColor: '#14532D', 
          paddingTop: insets.top + 20, 
          paddingHorizontal: 20, 
          paddingBottom: 32 
        }}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 }}>
            <History size={16} color="rgba(255,255,255,0.7)" />
            <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
              Collections Hub
            </Text>
          </View>

          <View style={{ alignItems: 'center' }}>
            <Text 
              style={{
                fontFamily: 'Geist_500Medium', 
                fontSize: 11, 
                color: 'rgba(255,255,255,0.55)',
                letterSpacing: 1.4, 
                textTransform: 'uppercase', 
                marginBottom: 8,
              }}
            >
              Total Collections
            </Text>
            <Text style={{ fontFamily: 'Geist_700Bold', fontSize: 44, color: '#FFFFFF', lineHeight: 52 }}>
              {formatPeso(totalCollections)}
            </Text>
            <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 8 }}>
              {payments.length} successful payment{payments.length !== 1 ? 's' : ''} logged
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Main List Container */}
      <View 
        style={{ 
          backgroundColor: '#FFFFFF', 
          borderTopLeftRadius: 28, 
          borderTopRightRadius: 28, 
          marginTop: -20, 
          flex: 1 
        }}
      >
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="small" color="#16A34A" />
            <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 13, color: '#9CA3AF', marginTop: 10 }}>
              Loading collections...
            </Text>
          </View>
        ) : error ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
            <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 16, color: '#991B1B' }}>
              Connection Issue
            </Text>
            <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 6 }}>
              {error}
            </Text>
            <TouchableOpacity 
              onPress={() => loadPayments(true)}
              style={{ 
                marginTop: 16, 
                backgroundColor: '#14532D', 
                paddingHorizontal: 16, 
                paddingVertical: 8, 
                borderRadius: 12 
              }}
            >
              <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 13, color: '#FFFFFF' }}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : payments.length === 0 ? (
          <PaymentEmptyState />
        ) : (
          <FlatList
            data={payments}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <PaymentListRow item={item} />}
            contentContainerStyle={{ 
              paddingHorizontal: 20, 
              paddingTop: 24, 
              paddingBottom: insets.bottom + 100 
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={handleRefresh} 
                colors={['#16A34A']} 
                tintColor="#16A34A" 
              />
            }
          />
        )}
      </View>

      {/* Floating Action Button */}
      <View 
        style={{ 
          position: 'absolute', 
          bottom: insets.bottom + 85, 
          left: 20, 
          right: 20 
        }}
      >
        <TouchableOpacity
          onPress={handleRecordNew}
          activeOpacity={0.9}
          style={{
            backgroundColor: '#14532D',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingVertical: 16,
            borderRadius: 20,
            shadowColor: '#14532D',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 4,
          }}
        >
          <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 15, color: '#FFFFFF' }}>
            Record Payment
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
