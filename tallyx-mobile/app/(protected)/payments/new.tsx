import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { User, Calendar, CreditCard, QrCode } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { fetchCustomerDetail } from '@/features/customers/customer.service';
import { recordPayment } from '@/features/payments/payment.service';
import { CustomerSelectModal } from '@/components/payments/customer-select-modal';
import { CreditSelectModal } from '@/components/payments/credit-select-modal';
import { PaymentMethodSelector } from '@/components/payments/payment-method-selector';
import { QrScannerModal } from '@/components/payments/qr-scanner-modal';
import type { CustomerListItem, CustomerCredit } from '@/features/customers/customer.types';
import { formatPeso } from '@/utils/dashboard';
import { haptics } from '@/utils/haptics';

export default function NewPayment() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();

  const [customer, setCustomer] = useState<CustomerListItem | null>(null);
  const [credit, setCredit] = useState<CustomerCredit | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'cash' | 'usdc'>('cash');
  const [loading, setLoading] = useState(false);

  // Modal Visibility State
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [creditModalVisible, setCreditModalVisible] = useState(false);
  const [qrScannerVisible, setQrScannerVisible] = useState(false);

  // Input Validation
  const numericAmount = Number(amount);
  const isOverpaid = credit ? numericAmount > credit.balance : false;
  const isFormValid = customer && credit && amount.trim() && numericAmount > 0 && !isOverpaid;

  const handleSelectCustomer = (selected: CustomerListItem) => {
    setCustomer(selected);
    setCredit(null);
    setAmount('');
  };

  const handleSelectCredit = (selected: CustomerCredit) => {
    setCredit(selected);
    setAmount(String(selected.balance));
  };

  const handleScanQR = () => {
    haptics.light();
    setQrScannerVisible(true);
  };

  const handleScanSuccess = async (customerId: string) => {
    setQrScannerVisible(false);
    if (!token || loading) return;
    setLoading(true);
    try {
      const detail = await fetchCustomerDetail(token!, customerId);
      if (detail && detail.id) {
        const mappedCustomer: CustomerListItem = {
          id: detail.id,
          storeId: detail.storeId,
          qrIdentity: detail.qrIdentity,
          name: detail.name,
          phone: detail.phone,
          balance: detail.balance,
        };
        handleSelectCustomer(mappedCustomer);
        haptics.success();
      } else {
        haptics.error();
        Alert.alert('Not Found', 'No customer matches this scanned QR identity.');
      }
    } catch {
      haptics.error();
      Alert.alert('Scan Error', 'Unable to resolve the scanned QR identity.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!isFormValid || !token) return;

    setLoading(true);
    try {
      haptics.light();
      await recordPayment(token!, {
        creditId: credit!.id,
        amount: numericAmount,
        paymentMethod: method,
      });

      haptics.success();
      Alert.alert('Success', 'Payment has been successfully recorded!');
      router.back();
    } catch (err) {
      haptics.error();
      Alert.alert('Payment Failed', err instanceof Error ? err.message : 'Unable to record payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
    >

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: insets.bottom + 40 }}
      >
        {/* Step 1: Select Customer */}
        <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 13, color: '#4B5563', textTransform: 'uppercase', letterSpacing: 1.1, marginBottom: 8 }}>
          Step 1: Customer
        </Text>
        {customer ? (
          <TouchableOpacity
            onPress={() => setCustomerModalVisible(true)}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 16,
              backgroundColor: '#F9FAFB',
              borderRadius: 20,
              borderWidth: 1,
              borderColor: '#E5E7EB',
              marginBottom: 24
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' }}>
                <User size={18} color="#16A34A" />
              </View>
              <View>
                <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 15, color: '#111827' }}>{customer.name}</Text>
                <Text style={{ fontFamily: 'Geist_500Medium', fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                  Outstanding: {formatPeso(customer.balance)}
                </Text>
              </View>
            </View>
            <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 12, color: '#16A34A' }}>Change</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 24 }}>
            <TouchableOpacity
              onPress={() => setCustomerModalVisible(true)}
              activeOpacity={0.8}
              style={{
                flex: 1,
                aspectRatio: 1,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#FFFFFF',
                borderRadius: 24,
                borderWidth: 1.5,
                borderColor: '#E5E7EB',
                borderStyle: 'dashed',
                padding: 16,
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.02,
                shadowRadius: 6,
                elevation: 1,
              }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <User size={20} color="#2563EB" />
              </View>
              <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 13, color: '#1F2937', textAlign: 'center' }}>
                Choose Customer
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleScanQR}
              activeOpacity={0.8}
              style={{
                flex: 1,
                aspectRatio: 1,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#FFFFFF',
                borderRadius: 24,
                borderWidth: 1.5,
                borderColor: '#E5E7EB',
                borderStyle: 'dashed',
                padding: 16,
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.02,
                shadowRadius: 6,
                elevation: 1,
              }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <QrCode size={20} color="#16A34A" />
              </View>
              <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 13, color: '#1F2937', textAlign: 'center' }}>
                Scan QR
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Select Outstanding Credit */}
        {customer && (
          <>
            <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 13, color: '#4B5563', textTransform: 'uppercase', letterSpacing: 1.1, marginBottom: 8 }}>
              Step 2: Select Credit Entry
            </Text>
            {credit ? (
              <TouchableOpacity
                onPress={() => setCreditModalVisible(true)}
                activeOpacity={0.8}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 16,
                  backgroundColor: '#F9FAFB',
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  marginBottom: 24
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF8E1', alignItems: 'center', justifyContent: 'center' }}>
                    <Calendar size={18} color="#D97706" />
                  </View>
                  <View>
                    <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 15, color: '#111827' }}>
                      Remaining Owed: {formatPeso(credit.balance)}
                    </Text>
                    <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                      Credit Issued: {new Date(credit.date).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 12, color: '#16A34A' }}>Change</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => setCreditModalVisible(true)}
                activeOpacity={0.8}
                style={{
                  paddingVertical: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 20,
                  borderWidth: 1.5,
                  borderColor: '#E5E7EB',
                  borderStyle: 'dashed',
                  marginBottom: 24
                }}
              >
                <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 14, color: '#16A34A' }}>
                  + Select Unpaid Credit
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Step 3: Payment Method & Details */}
        {credit && (
          <>
            <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 13, color: '#4B5563', textTransform: 'uppercase', letterSpacing: 1.1, marginBottom: 12 }}>
              Step 3: Payment Details
            </Text>

            <PaymentMethodSelector selected={method} onChange={setMethod} />

            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontFamily: 'Geist_500Medium', fontSize: 13, color: '#374151', marginBottom: 8 }}>
                Amount to Pay ({method === 'usdc' ? 'USDC' : 'PHP'})
              </Text>
              <TextInput
                keyboardType="decimal-pad"
                placeholder="0.00"
                value={amount}
                onChangeText={setAmount}
                style={{
                  borderWidth: 1,
                  borderColor: isOverpaid ? '#DC2626' : '#E5E7EB',
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 16,
                  fontFamily: 'Geist_400Regular',
                  color: '#111827',
                  backgroundColor: '#F9FAFB'
                }}
              />
              {isOverpaid && (
                <Text style={{ fontFamily: 'Geist_500Medium', fontSize: 12, color: '#DC2626', marginTop: 6 }}>
                  Warning: Amount exceeds outstanding credit balance of {formatPeso(credit.balance)}.
                </Text>
              )}
            </View>

            {/* Action Submit */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={!isFormValid || loading}
              style={{
                backgroundColor: isFormValid ? '#14532D' : '#E5E7EB',
                paddingVertical: 16,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
                marginTop: 8
              }}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <CreditCard size={18} color={isFormValid ? '#FFFFFF' : '#9CA3AF'} />
                  <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 15, color: isFormValid ? '#FFFFFF' : '#9CA3AF' }}>
                    Confirm Payment
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Customer Select Modal Sheet */}
      <CustomerSelectModal
        visible={customerModalVisible}
        onClose={() => setCustomerModalVisible(false)}
        onSelect={handleSelectCustomer}
      />

      {/* Credit Select Modal Sheet */}
      {customer && (
        <CreditSelectModal
          visible={creditModalVisible}
          customerId={customer.id}
          onClose={() => setCreditModalVisible(false)}
          onSelect={handleSelectCredit}
        />
      )}

      {/* QR Scanner Modal Sheet */}
      <QrScannerModal
        visible={qrScannerVisible}
        onClose={() => setQrScannerVisible(false)}
        onScanSuccess={handleScanSuccess}
      />
    </KeyboardAvoidingView>
  );
}
