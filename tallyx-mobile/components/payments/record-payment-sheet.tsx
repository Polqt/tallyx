import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { forwardRef, useCallback, useRef, useState  } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import { User, Calendar, QrCode, CreditCard } from 'lucide-react-native';
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

type Props = {
  onClose: () => void;
  onSuccess: () => void;
  isOnline: boolean;
};

export const RecordPaymentSheet = forwardRef<BottomSheet, Props>(
  function RecordPaymentSheet({ onClose, onSuccess, isOnline }, ref) {
    const insets = useSafeAreaInsets();
    const { token } = useAuth();

    const [customer, setCustomer] = useState<CustomerListItem | null>(null);
    const [credit, setCredit] = useState<CustomerCredit | null>(null);
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState<'cash' | 'usdc'>('cash');
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(false);
    const fetchAbortRef = useRef<AbortController | null>(null);

    const [customerModalVisible, setCustomerModalVisible] = useState(false);
    const [creditModalVisible, setCreditModalVisible] = useState(false);
    const [qrScannerVisible, setQrScannerVisible] = useState(false);

    const numericAmount = Number(amount);
    const isOverpaid = credit ? numericAmount > credit.balance : false;
    const isFormValid = customer && credit && amount.trim() && numericAmount > 0 && !isOverpaid && isOnline;

    const handleChange = useCallback(
      (index: number) => {
        if (index === -1) onClose();
      },
      [onClose]
    );

    function reset() {
      setCustomer(null);
      setCredit(null);
      setAmount('');
      setMethod('cash');
    }

    const handleSelectCustomer = (selected: CustomerListItem) => {
      setCustomer(selected);
      setCredit(null);
      setAmount('');
    };

    const handleSelectCredit = (selected: CustomerCredit) => {
      setCredit(selected);
      setAmount(String(selected.balance));
    };

    const handleScanSuccess = async (customerId: string) => {
      setQrScannerVisible(false);
      if (!token || fetchLoading) return;
      fetchAbortRef.current?.abort();
      const controller = new AbortController();
      fetchAbortRef.current = controller;
      setFetchLoading(true);
      try {
        const detail = await fetchCustomerDetail(token, customerId);
        if (controller.signal.aborted) return;
        if (detail?.id) {
          handleSelectCustomer({
            id: detail.id,
            storeId: detail.storeId,
            qrIdentity: detail.qrIdentity,
            name: detail.name,
            phone: detail.phone,
            balance: detail.balance,
          });
          haptics.success();
        } else {
          haptics.error();
          Alert.alert('Not Found', 'No customer matches this QR code.');
        }
      } catch {
        if (controller.signal.aborted) return;
        haptics.error();
        Alert.alert('Scan Error', 'Unable to resolve the scanned QR identity.');
      } finally {
        setFetchLoading(false);
      }
    };

    const handleSave = async () => {
      if (!isFormValid || !token) return;
      setLoading(true);
      try {
        haptics.light();
        await recordPayment(token, {
          creditId: credit!.id,
          amount: numericAmount,
          paymentMethod: method,
        });
        haptics.success();
        reset();
        (ref as React.RefObject<BottomSheet>)?.current?.close();
        onSuccess();
      } catch (err) {
        haptics.error();
        Alert.alert('Payment Failed', err instanceof Error ? err.message : 'Unable to record payment.');
      } finally {
        setLoading(false);
      }
    };

    return (
      <>
        <BottomSheet
          ref={ref}
          index={-1}
          snapPoints={['75%']}
          enablePanDownToClose
          enableDynamicSizing={false}
          onChange={handleChange}
          backgroundStyle={{ backgroundColor: '#FFFFFF', borderRadius: 28 }}
          handleIndicatorStyle={{ backgroundColor: '#D1D5DB', width: 36 }}
        >
          <BottomSheetView className="flex-1 justify-between">

            {/* Header */}
            <View className="px-5 pt-1 pb-4 border-b border-gray-100">
              <Text style={{ fontFamily: 'Geist_700Bold', fontSize: 16, color: '#111827', textAlign: 'center' }}>
                Record Payment
              </Text>
            </View>

            {/* Scrollable form */}
            <BottomSheetScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }}
              style={{ flex: 1 }}
            >
              {/* Step 1: Customer */}
              <Text className="font-[Geist_600SemiBold] text-[11px] text-gray-500 uppercase tracking-widest mb-2">
                Step 1 · Customer
              </Text>
              {customer ? (
                <TouchableOpacity
                  onPress={() => setCustomerModalVisible(true)}
                  activeOpacity={0.8}
                  className="flex-row items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200 mb-5"
                >
                  <View className="flex-row items-center gap-3">
                    <View className="w-9 h-9 rounded-full bg-blue-50 items-center justify-center">
                      <User size={18} color="#2563EB" />
                    </View>
                    <View>
                      <Text className="font-[Geist_600SemiBold] text-[15px] text-gray-900">{customer.name}</Text>
                      <Text className="font-[Geist_400Regular] text-[12px] text-gray-500 mt-0.5">
                        Outstanding: {formatPeso(customer.balance)}
                      </Text>
                    </View>
                  </View>
                  <Text className="font-[Geist_600SemiBold] text-[12px] text-green-600">Change</Text>
                </TouchableOpacity>
              ) : (
                <View className="mb-5">
                  <TouchableOpacity
                    onPress={() => setCustomerModalVisible(true)}
                    activeOpacity={0.8}
                    className="items-center justify-center py-7 bg-white rounded-2xl border border-dashed border-gray-200"
                  >
                    <View className="w-14 h-14 rounded-full bg-blue-50 items-center justify-center mb-3">
                      <User size={26} color="#2563EB" />
                    </View>
                    <Text className="font-[Geist_700Bold] text-[15px] text-gray-800">Choose Customer</Text>
                    <Text className="font-[Geist_400Regular] text-[12px] text-gray-400 mt-1">Search from your customer list</Text>
                  </TouchableOpacity>

                  {/* OR divider */}
                  <View className="flex-row items-center gap-3 my-3">
                    <View className="flex-1 h-px bg-gray-100" />
                    <Text className="font-[Geist_600SemiBold] text-[12px] text-gray-400">OR</Text>
                    <View className="flex-1 h-px bg-gray-100" />
                  </View>

                  <TouchableOpacity
                    onPress={() => { haptics.light(); setQrScannerVisible(true); }}
                    activeOpacity={0.8}
                    className="items-center justify-center py-7 bg-white rounded-2xl border border-dashed border-gray-200"
                  >
                    <View className="w-14 h-14 rounded-full bg-green-50 items-center justify-center mb-3">
                      <QrCode size={26} color="#16A34A" />
                    </View>
                    <Text className="font-[Geist_700Bold] text-[15px] text-gray-800">Scan QR Code</Text>
                    <Text className="font-[Geist_400Regular] text-[12px] text-gray-400 mt-1">Point camera at customer QR</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Step 2: Credit */}
              {customer && (
                <>
                  <Text className="font-[Geist_600SemiBold] text-[11px] text-gray-500 uppercase tracking-widest mb-2">
                    Step 2 · Select Credit
                  </Text>
                  {credit ? (
                    <TouchableOpacity
                      onPress={() => setCreditModalVisible(true)}
                      activeOpacity={0.8}
                      className="flex-row items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200 mb-5"
                    >
                      <View className="flex-row items-center gap-3">
                        <View className="w-9 h-9 rounded-full bg-yellow-50 items-center justify-center">
                          <Calendar size={18} color="#D97706" />
                        </View>
                        <View>
                          <Text className="font-[Geist_600SemiBold] text-[15px] text-gray-900">
                            Remaining: {formatPeso(credit.balance)}
                          </Text>
                          <Text className="font-[Geist_400Regular] text-[12px] text-gray-500 mt-0.5">
                            Issued: {new Date(credit.date).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                      <Text className="font-[Geist_600SemiBold] text-[12px] text-green-600">Change</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => setCreditModalVisible(true)}
                      activeOpacity={0.8}
                      className="py-5 items-center justify-center bg-white rounded-2xl border border-dashed border-gray-200 mb-5"
                    >
                      <Text className="font-[Geist_600SemiBold] text-[14px] text-green-600">
                        + Select Unpaid Credit
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}

              {/* Step 3: Payment details */}
              {credit && (
                <>
                  <Text className="font-[Geist_600SemiBold] text-[11px] text-gray-500 uppercase tracking-widest mb-3">
                    Step 3 · Payment Details
                  </Text>
                  <PaymentMethodSelector selected={method} onChange={setMethod} />
                  <View className="mb-6">
                    <Text className="font-[Geist_500Medium] text-[13px] text-gray-700 mb-2">
                      Amount ({method === 'usdc' ? 'USDC' : 'PHP'})
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
                        backgroundColor: '#F9FAFB',
                      }}
                    />
                    {isOverpaid && (
                      <Text className="font-[Geist_500Medium] text-[12px] text-red-600 mt-1.5">
                        Amount exceeds balance of {formatPeso(credit.balance)}.
                      </Text>
                    )}
                  </View>
                </>
              )}
            </BottomSheetScrollView>

            {/* Pinned submit button */}
            <View
              className="px-5 pt-3"
              style={{ paddingBottom: Math.max(insets.bottom, 24) }}
            >
              {!isOnline && (
                <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 12, color: '#D97706', textAlign: 'center', marginBottom: 8 }}>
                  You&apos;re offline. Connect to record a payment.
                </Text>
              )}
              <TouchableOpacity
                onPress={handleSave}
                disabled={!isFormValid || loading || fetchLoading}
                activeOpacity={0.85}
                className={`h-[52px] rounded-2xl items-center justify-center flex-row gap-2 ${isFormValid ? 'bg-green-700' : 'bg-gray-200'}`}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <CreditCard size={18} color={isFormValid ? '#FFFFFF' : '#9CA3AF'} />
                    <Text className={`font-[Geist_600SemiBold] text-[15px] ${isFormValid ? 'text-white' : 'text-gray-400'}`}>
                      Confirm Payment
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

          </BottomSheetView>
        </BottomSheet>

        <CustomerSelectModal
          visible={customerModalVisible}
          onClose={() => setCustomerModalVisible(false)}
          onSelect={handleSelectCustomer}
        />
        {customer && (
          <CreditSelectModal
            visible={creditModalVisible}
            customerId={customer.id}
            onClose={() => setCreditModalVisible(false)}
            onSelect={handleSelectCredit}
          />
        )}
        <QrScannerModal
          visible={qrScannerVisible}
          onClose={() => setQrScannerVisible(false)}
          onScanSuccess={handleScanSuccess}
        />
      </>
    );
  }
);
