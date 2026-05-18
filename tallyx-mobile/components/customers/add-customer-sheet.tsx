import { forwardRef, useCallback } from 'react';
import { Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { AddCustomerForm } from '@/components/customers/add-customer-form';

type AddCustomerSheetProps = {
  name: string;
  phone: string;
  creating: boolean;
  formVersion: number;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
};

export const AddCustomerSheet = forwardRef<BottomSheet, AddCustomerSheetProps>(
  ({ name, phone, creating, formVersion, onNameChange, onPhoneChange, onSubmit, onClose }, ref) => {
    const insets = useSafeAreaInsets();
    const { height: screenHeight } = useWindowDimensions();
    const canSubmit = Boolean(name.trim()) && !creating;

    const innerHeight = screenHeight * 0.60 - 20;

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
      ),
      []
    );

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={[`${0.60 * 100}%`]}
        enablePanDownToClose
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        backdropComponent={renderBackdrop}
        onClose={onClose}
        handleIndicatorStyle={{ backgroundColor: '#D1D5DB', width: 40 }}
        backgroundStyle={{ borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
      >
        <BottomSheetView
          style={{
            height: innerHeight,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: insets.bottom + 16,
            justifyContent: 'space-between',
          }}
        >

          <View>
            <View className="mb-10 items-center">
              <Text className="text-[24px] font-bold tracking-[2px] text-gray-900 uppercase">New Customer</Text>
              <Text className="mt-2 text-[13px] leading-5 text-gray-400 text-center">
                Credits and payments can be added after.
              </Text>
            </View>

            <AddCustomerForm
              name={name}
              phone={phone}
              creating={creating}
              formVersion={formVersion}
              onNameChange={onNameChange}
              onPhoneChange={onPhoneChange}
              onSubmit={onSubmit}
            />
          </View>

          <TouchableOpacity
            onPress={onSubmit}
            activeOpacity={0.85}
            disabled={!canSubmit}
            className={`h-[54px] items-center justify-center rounded-2xl ${
              canSubmit ? 'bg-green-600' : 'bg-green-200'
            }`}
          >
            <Text className="text-[15px] font-bold text-white">
              {creating ? 'Creating...' : 'Create Customer'}
            </Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

AddCustomerSheet.displayName = 'AddCustomerSheet';
