import { forwardRef, useCallback } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { CreditCustomerPicker } from '@/components/credits/credit-customer-picker';
import { CreditDetailForm } from '@/components/credits/credit-detail-form';
import { parsePesoAmount } from '@/utils/credit';

type Props = {
  token: string;
  selectedCustomerId: string;
  amount: string;
  dueDate: string;
  note: string;
  saving: boolean;
  isOnline: boolean;
  onSelectCustomer: (id: string) => void;
  onAmountChange: (v: string) => void;
  onDueDateChange: (v: string) => void;
  onNoteChange: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
};

export const AddCreditSheet = forwardRef<BottomSheet, Props>(
  ({
    token,
    selectedCustomerId,
    amount,
    dueDate,
    note,
    saving,
    isOnline,
    onSelectCustomer,
    onAmountChange,
    onDueDateChange,
    onNoteChange,
    onSubmit,
    onClose,
  }, ref) => {
    const insets = useSafeAreaInsets();
    const parsedAmount = parsePesoAmount(amount);
    const canSubmit = Boolean(selectedCustomerId) && parsedAmount > 0 && !saving && isOnline;

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" />
      ),
      []
    );

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={['50%', '92%']}
        enablePanDownToClose
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        backdropComponent={renderBackdrop}
        onClose={onClose}
        handleIndicatorStyle={{ backgroundColor: '#D1D5DB', width: 40 }}
        backgroundStyle={{ backgroundColor: '#FFFFFF' }}
      >
        <BottomSheetScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: insets.bottom + 24,
          }}
        >
          {/* Header */}
          <Text style={{ fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 4 }}>
            Record Credit
          </Text>
          <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>
            Add a new utang entry for a customer.
          </Text>

          {/* Customer section */}
          <Text style={{ fontSize: 13, fontWeight: '500', color: '#9CA3AF', marginBottom: 10 }}>
            Customer
          </Text>
          <CreditCustomerPicker
            token={token}
            selectedCustomerId={selectedCustomerId}
            onSelect={onSelectCustomer}
            TextInputComponent={BottomSheetTextInput as any}
          />

          {/* Details section */}
          <Text style={{ fontSize: 13, fontWeight: '500', color: '#9CA3AF', marginTop: 16, marginBottom: 10 }}>
            Details
          </Text>
          <CreditDetailForm
            amount={amount}
            dueDate={dueDate}
            note={note}
            onAmountChange={onAmountChange}
            onDueDateChange={onDueDateChange}
            onNoteChange={onNoteChange}
            TextInputComponent={BottomSheetTextInput as any}
          />

          <View style={{ flexGrow: 1 }} />

          {/* Submit button */}
          {!isOnline && (
            <Text style={{ fontSize: 12, color: '#D97706', textAlign: 'center', marginBottom: 8, fontFamily: 'Geist_400Regular' }}>
              You&apos;re offline. Connect to record a credit.
            </Text>
          )}
          <TouchableOpacity
            onPress={onSubmit}
            activeOpacity={0.85}
            disabled={!canSubmit}
            style={{
              marginTop: 24,
              height: 54,
              borderRadius: 27,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: canSubmit ? '#16A34A' : '#D1FAE5',
            }}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={{ fontSize: 16, fontWeight: '700', color: canSubmit ? '#FFFFFF' : '#86EFAC' }}>
                Record Credit
              </Text>
            )}
          </TouchableOpacity>
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);

AddCreditSheet.displayName = 'AddCreditSheet';
