import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useAuth } from '@/context/AuthContext';
import { CreditCustomerPicker } from '@/components/credits/credit-customer-picker';
import { CreditDetailForm } from '@/components/credits/credit-detail-form';
import { createCredit } from '@/features/credits/credit.service';
import { parseDueDate, parsePesoAmount } from '@/utils/credit';
import { formatPeso } from '@/utils/dashboard';
import { haptics } from '@/utils/haptics';

export default function NewCredit() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { customerId } = useLocalSearchParams<{ customerId?: string }>();
  const sheetRef = useRef<BottomSheet>(null);

  const [selectedCustomerId, setSelectedCustomerId] = useState(customerId ?? '');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const parsedAmount = useMemo(() => parsePesoAmount(amount), [amount]);

  const handleSheetChange = useCallback((index: number) => {
    if (index === -1) router.back();
  }, []);

  async function handleSave() {
    if (!token || saving) return;
    if (!selectedCustomerId) {
      Alert.alert('Select customer', 'Choose the customer who received the credit.');
      return;
    }
    if (parsedAmount <= 0) {
      Alert.alert('Enter amount', 'Credit amount must be greater than zero.');
      return;
    }
    const parsedDueDateValue = parseDueDate(dueDate);
    if (parsedDueDateValue === null) {
      Alert.alert('Check due date', 'Use YYYY-MM-DD format, for example 2026-05-30.');
      return;
    }

    haptics.medium();
    setSaving(true);
    try {
      await createCredit(token, {
        customerId: selectedCustomerId,
        amount: parsedAmount,
        dueDate: parsedDueDateValue,
        note: note.trim() || undefined,
      });
      haptics.success();
      router.replace('/(protected)/(tabs)/credits' as any);
    } catch (error) {
      haptics.error();
      Alert.alert('Credit not saved', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="flex-1 items-center justify-center px-6">
        <View className="mb-3 w-full rounded-[20px] bg-[#14532D] p-5">
          <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-white/55">Amount</Text>
          <Text className="mt-2 text-[40px] font-bold text-white">{formatPeso(parsedAmount)}</Text>
          <Text className="mt-2 text-[13px] text-white/60">
            {selectedCustomerId ? 'Customer selected below' : 'Select a customer in the sheet below'}
          </Text>
        </View>
      </View>

      <BottomSheet
        ref={sheetRef}
        index={0}
        snapPoints={['50%', '100%']}
        topInset={insets.top}
        onChange={handleSheetChange}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        enablePanDownToClose={false}
        enableOverDrag={false}
        animationConfigs={{ duration: 450, dampingRatio: 0.8 }}
        handleIndicatorStyle={{ backgroundColor: '#D1D5DB', width: 40 }}
        backgroundStyle={{ borderRadius: 28 }}
      >
        <BottomSheetScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 32 }}
        >
          <Text className="mb-1 text-[22px] font-bold text-gray-900">Record Credit</Text>
          <Text className="mb-5 text-[13px] leading-5 text-gray-400">
            Add a new utang entry for a customer.
          </Text>

          <Text className="mb-2 text-[11px] font-bold uppercase tracking-[1.6px] text-gray-400">Customer</Text>
          <CreditCustomerPicker
            token={token ?? ''}
            selectedCustomerId={selectedCustomerId}
            onSelect={setSelectedCustomerId}
          />

          <Text className="mb-2 text-[11px] font-bold uppercase tracking-[1.6px] text-gray-400">Details</Text>
          <CreditDetailForm
            amount={amount}
            dueDate={dueDate}
            note={note}
            onAmountChange={setAmount}
            onDueDateChange={setDueDate}
            onNoteChange={setNote}
          />

          <TouchableOpacity
            disabled={saving}
            className={`mt-6 h-[54px] items-center justify-center rounded-[27px] ${saving ? 'bg-gray-300' : 'bg-green-600'}`}
            activeOpacity={0.85}
            onPress={handleSave}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-[16px] font-bold text-white">Record Credit</Text>
            )}
          </TouchableOpacity>
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}
