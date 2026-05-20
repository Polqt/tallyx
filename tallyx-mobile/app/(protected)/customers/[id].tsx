import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ChevronRight, Pencil, QrCode, ReceiptText, Trash2, TrendingUp } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '@/context/AuthContext';
import { deleteCustomer, fetchCustomerDetail, updateCustomer } from '@/features/customers/customer.service';
import type { CustomerDetail } from '@/features/customers/customer.types';
import { formatDashboardDate, formatPeso } from '@/utils/dashboard';
import { getCustomerAvatarColor } from '@/utils/customers';
import { haptics } from '@/utils/haptics';

export default function CustomerDetailScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const nameInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!token || !id) { setLoading(false); return; }

    const controller = new AbortController();

    async function loadCustomer() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchCustomerDetail(token!, id as string, controller.signal);
        setCustomer(data);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Unable to load customer.');
      } finally {
        setLoading(false);
      }
    }

    loadCustomer();
    return () => controller.abort();
  }, [id, token]);

  const color = getCustomerAvatarColor(customer?.name ?? 'Customer');

  function handleDelete() {
    if (!customer || !token) return;
    if (customer.balance > 0) {
      Alert.alert(
        'Cannot delete customer',
        `${customer.name} still has an outstanding balance of ${formatPeso(customer.balance)}. Settle all credits first.`
      );
      return;
    }
    Alert.alert(
      'Delete customer',
      `Are you sure you want to delete ${customer.name}? This will also remove all their settled credit and payment records. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            haptics.medium();
            setDeleting(true);
            try {
              await deleteCustomer(token, customer.id);
              haptics.success();
              router.back();
            } catch (err) {
              haptics.error();
              Alert.alert('Delete failed', err instanceof Error ? err.message : 'Please try again.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }

  function openEdit() {
    if (!customer) return;
    haptics.light();
    setEditName(customer.name);
    setEditPhone(customer.phone ? customer.phone.replace(/^\+63/, '') : '');
    setEditVisible(true);
    setTimeout(() => nameInputRef.current?.focus(), 150);
  }

  async function handleEditSave() {
    if (!token || !customer || saving) return;
    const name = editName.trim();
    if (!name) {
      Alert.alert('Name required', 'Customer name cannot be empty.');
      return;
    }
    haptics.medium();
    setSaving(true);
    try {
      const digits = editPhone.replace(/\D/g, '');
      const phone = digits ? `+63${digits}` : null;
      await updateCustomer(token, customer.id, { name, phone });
      haptics.success();
      setCustomer((prev) => prev ? { ...prev, name, phone: phone ?? undefined } : prev);
      setEditVisible(false);
    } catch (err) {
      haptics.error();
      Alert.alert('Update failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function openQrScreen() {
    console.log('[CustomerDetailScreen] openQrScreen pressed', { customerId: customer?.id, customerName: customer?.name });
    if (!customer) {
      console.warn('[CustomerDetailScreen] openQrScreen aborted - customer detail object is empty!');
      return;
    }
    haptics.light();
    router.push(
      `/(protected)/customers/qr?id=${customer.id}&name=${encodeURIComponent(customer.name)}&qr=${encodeURIComponent(customer.qrIdentity)}` as any
    );
  }

  function openCreditHistory() {
    if (!customer) return;
    haptics.light();
    router.push(`/(protected)/(tabs)/credits?customerId=${customer.id}` as any);
  }

  function openPaymentHistory() {
    if (!customer) return;
    haptics.light();
    router.push(`/(protected)/(tabs)/payments?customerId=${customer.id}` as any);
  }

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between border-b border-gray-100 px-5 py-3.5">
        <TouchableOpacity
          onPress={() => { haptics.light(); router.back(); }}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="h-9 w-9 items-center justify-center rounded-full bg-gray-100"
        >
          <ChevronLeft size={20} color="#111827" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text className="text-[17px] font-bold text-gray-900">Customer</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity onPress={openEdit} activeOpacity={0.7} className="h-9 w-9 items-center justify-center rounded-full bg-gray-100">
            <Pencil size={16} color="#374151" strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity onPress={openQrScreen} activeOpacity={0.7} className="h-9 w-9 items-center justify-center rounded-full bg-green-50">
            <QrCode size={18} color="#16A34A" strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDelete}
            activeOpacity={0.7}
            disabled={deleting}
            style={{ height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: '#FEF2F2' }}
          >
            {deleting
              ? <ActivityIndicator size="small" color="#DC2626" />
              : <Trash2 size={17} color="#DC2626" strokeWidth={2} />
            }
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center px-7">
          <ActivityIndicator size="small" color="#16A34A" />
          <Text className="mt-2.5 text-center text-[13px] text-gray-400">Loading customer...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-7">
          <Text className="text-base font-bold text-amber-700">Customer unavailable</Text>
          <Text className="mt-2 text-center text-[13px] leading-5 text-gray-400">{error}</Text>
        </View>
      ) : customer ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 36 }}>

          <View className="items-center px-5 pb-5 pt-7">
            <View className="mb-3.5 h-[72px] w-[72px] items-center justify-center rounded-full" style={{ backgroundColor: color }}>
              <Text className="text-[28px] font-bold text-white">{customer.name[0]?.toUpperCase() ?? '?'}</Text>
            </View>
            <Text className="text-[22px] font-bold text-gray-900">{customer.name}</Text>
            <Text className="mb-3.5 mt-1 text-sm text-gray-500">
              {customer.phone ? `+63${customer.phone}` : 'No phone number'}
            </Text>
            <View className={`rounded-[20px] px-4 py-[7px] ${customer.balance > 0 ? 'bg-amber-50' : 'bg-green-50'}`}>
              <Text className={`text-[13px] font-semibold ${customer.balance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                {customer.balance > 0 ? `${formatPeso(customer.balance)} outstanding` : 'All settled'}
              </Text>
            </View>
          </View>

          <View className="mx-5 items-center rounded-3xl border border-gray-100 bg-white p-5" style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12 }}>
            <View className="rounded-[18px] bg-white p-3">
              <QRCode value={customer.qrIdentity} size={160} color="#111827" backgroundColor="#FFFFFF" />
            </View>
            <Text className="mt-3 text-[15px] font-bold text-gray-900">Customer QR identity</Text>
          </View>

          <View className="flex-row px-5 py-[22px]">
            <View className="flex-1 items-center">
              <Text className="text-[20px] font-bold text-gray-900">{formatPeso(customer.totalCredit)}</Text>
              <Text className="mt-0.5 text-[12px] text-gray-500">Total Credit</Text>
            </View>
            <View className="my-1 w-px bg-gray-100" />
            <View className="flex-1 items-center">
              <Text className="text-[20px] font-bold text-gray-900">{formatPeso(customer.totalPaid)}</Text>
              <Text className="mt-0.5 text-[12px] text-gray-500">Total Paid</Text>
            </View>
            <View className="my-1 w-px bg-gray-100" />
            <View className="flex-1 items-center">
              <Text className={`text-[20px] font-bold ${customer.balance > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
                {formatPeso(customer.balance)}
              </Text>
              <Text className="mt-0.5 text-[12px] text-gray-500">Balance</Text>
            </View>
          </View>

          {/* Credit History */}
          <View className="mx-5 mt-6" style={{ borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(22,163,74,0.2)' }}>
            <BlurView intensity={55} tint="light" style={{ padding: 16 }}>
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(240,253,244,0.6)' }} />
              <TouchableOpacity onPress={openCreditHistory} activeOpacity={0.75} className="flex-row items-center justify-between pb-3">
                <View className="flex-row items-center gap-2">
                  <View className="h-7 w-7 items-center justify-center rounded-full bg-green-100">
                    <TrendingUp size={14} color="#16A34A" strokeWidth={2.5} />
                  </View>
                  <Text className="text-[13px] font-bold uppercase tracking-[1.5px] text-green-800">Credit History</Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Text className="text-[12px] font-medium text-green-600">See all</Text>
                  <ChevronRight size={14} color="#16A34A" strokeWidth={2.5} />
                </View>
              </TouchableOpacity>

              {customer.credits.length === 0 ? (
                <View className="items-center py-7">
                  <Text className="text-[14px] font-semibold text-green-900">No credits yet</Text>
                  <Text className="mt-1 text-center text-[12px] leading-5 text-green-700/60">
                    Credits recorded for this customer will appear here.
                  </Text>
                </View>
              ) : (
                customer.credits.map((credit, i) => (
                  <View
                    key={credit.id}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: i === 0 ? 1 : 0, borderTopColor: 'rgba(22,163,74,0.12)', borderBottomWidth: i < customer.credits.length - 1 ? 1 : 0, borderBottomColor: 'rgba(22,163,74,0.12)' }}
                  >
                    <View className="flex-row items-center gap-3 flex-1">
                      <View className={`h-8 w-8 items-center justify-center rounded-full ${credit.status === 'paid' ? 'bg-green-100' : 'bg-amber-50'}`}>
                        <TrendingUp size={14} color={credit.status === 'paid' ? '#16A34A' : '#D97706'} strokeWidth={2} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[15px] font-bold text-gray-900">{formatPeso(credit.amount)}</Text>
                        <Text className="mt-0.5 text-[12px] text-gray-500">Remaining {formatPeso(credit.balance)}</Text>
                      </View>
                    </View>
                    <View className="items-end gap-1">
                      <View className={`rounded-full px-2.5 py-0.5 ${credit.status === 'paid' ? 'bg-green-100' : 'bg-amber-100'}`}>
                        <Text className={`text-[11px] font-bold ${credit.status === 'paid' ? 'text-green-700' : 'text-amber-700'}`}>
                          {credit.status === 'paid' ? 'Paid' : 'Open'}
                        </Text>
                      </View>
                      <Text className="text-[11px] text-gray-400">{formatDashboardDate(credit.date)}</Text>
                    </View>
                  </View>
                ))
              )}
            </BlurView>
          </View>

          <View className="mx-5 my-5 flex-row items-center gap-3">
            <View className="flex-1 h-px bg-gray-100" />
            <Text className="text-[10px] font-bold uppercase tracking-[2px] text-gray-300">Activity</Text>
            <View className="flex-1 h-px bg-gray-100" />
          </View>

          <View className="mx-5" style={{ borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(37,99,235,0.2)' }}>
            <BlurView intensity={55} tint="light" style={{ padding: 16 }}>
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(239,246,255,0.6)' }} />
              <TouchableOpacity onPress={openPaymentHistory} activeOpacity={0.75} className="flex-row items-center justify-between pb-3">
                <View className="flex-row items-center gap-2">
                  <View className="h-7 w-7 items-center justify-center rounded-full bg-blue-100">
                    <ReceiptText size={14} color="#2563EB" strokeWidth={2.5} />
                  </View>
                  <Text className="text-[13px] font-bold uppercase tracking-[1.5px] text-blue-800">Payment History</Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Text className="text-[12px] font-medium text-blue-600">See all</Text>
                  <ChevronRight size={14} color="#2563EB" strokeWidth={2.5} />
                </View>
              </TouchableOpacity>

              {customer.payments.length === 0 ? (
                <View className="items-center py-7">
                  <Text className="text-[14px] font-semibold text-blue-900">No payments yet</Text>
                  <Text className="mt-1 text-center text-[12px] leading-5 text-blue-700/60">
                    Payments collected from this customer will appear here.
                  </Text>
                </View>
              ) : (
                customer.payments.map((payment, i) => (
                  <View
                    key={payment.id}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: i === 0 ? 1 : 0, borderTopColor: 'rgba(37,99,235,0.12)', borderBottomWidth: i < customer.payments.length - 1 ? 1 : 0, borderBottomColor: 'rgba(37,99,235,0.12)' }}
                  >
                    <View className="flex-row items-center gap-3 flex-1">
                      <View className="h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                        <ReceiptText size={14} color="#2563EB" strokeWidth={2} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[15px] font-bold text-gray-900">{formatPeso(payment.amount)}</Text>
                        <Text className="mt-0.5 text-[12px] text-gray-500">Payment received</Text>
                      </View>
                    </View>
                    <Text className="text-[11px] text-gray-400">{formatDashboardDate(payment.date)}</Text>
                  </View>
                ))
              )}
            </BlurView>
          </View>

        </ScrollView>
      ) : null}

      <Modal
        visible={editVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditVisible(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
          onPress={() => setEditVisible(false)}
        >
          <Pressable onPress={() => {}}>
            <View style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingTop: 12,
              paddingHorizontal: 24,
              paddingBottom: insets.bottom + 24,
            }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 20 }} />
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 20 }}>Edit Customer</Text>

              <Text style={{ fontSize: 13, fontWeight: '500', color: '#6B7280', marginBottom: 6 }}>Name</Text>
              <TextInput
                ref={nameInputRef}
                value={editName}
                onChangeText={setEditName}
                placeholder="Customer name"
                placeholderTextColor="#D1D5DB"
                autoCapitalize="words"
                style={{
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: '#F9FAFB',
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  paddingHorizontal: 16,
                  fontSize: 15,
                  color: '#111827',
                  marginBottom: 16,
                }}
              />

              <Text style={{ fontSize: 13, fontWeight: '500', color: '#6B7280', marginBottom: 6 }}>Phone number</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 28 }}>
                <View style={{
                  height: 48, paddingHorizontal: 12,
                  borderTopLeftRadius: 14, borderBottomLeftRadius: 14,
                  backgroundColor: '#F3F4F6',
                  borderWidth: 1, borderColor: '#E5E7EB', borderRightWidth: 0,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 15, color: '#374151', fontWeight: '500' }}>+63</Text>
                </View>
                <TextInput
                  value={editPhone}
                  onChangeText={(t) => setEditPhone(t.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9XX XXX XXXX"
                  placeholderTextColor="#D1D5DB"
                  keyboardType="phone-pad"
                  style={{
                    flex: 1, height: 48,
                    borderTopRightRadius: 14, borderBottomRightRadius: 14,
                    backgroundColor: '#F9FAFB',
                    borderWidth: 1, borderColor: '#E5E7EB',
                    paddingHorizontal: 14, fontSize: 15, color: '#111827',
                  }}
                />
              </View>

              <TouchableOpacity
                onPress={handleEditSave}
                disabled={saving || !editName.trim()}
                activeOpacity={0.85}
                style={{
                  height: 52, borderRadius: 26,
                  backgroundColor: saving || !editName.trim() ? '#D1FAE5' : '#16A34A',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                {saving
                  ? <ActivityIndicator size="small" color="#86EFAC" />
                  : <Text style={{ fontSize: 16, fontWeight: '600', color: saving || !editName.trim() ? '#86EFAC' : '#FFFFFF' }}>Save Changes</Text>
                }
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
