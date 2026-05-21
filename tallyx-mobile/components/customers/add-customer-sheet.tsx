import React, { forwardRef, useCallback } from 'react';
import { Text, TouchableOpacity, View, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { AddCustomerForm } from '@/components/customers/add-customer-form';

const SNAP = 0.75;
const SHEET_HEIGHT = Dimensions.get('window').height * SNAP;

type AddCustomerSheetProps = {
  name: string;
  phone: string;
  creating: boolean;
  isOnline: boolean;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
};

export const AddCustomerSheet = forwardRef<BottomSheet, AddCustomerSheetProps>(
  function AddCustomerSheet(
    { name, phone, creating, isOnline, onNameChange, onPhoneChange, onSubmit, onClose },
    ref
  ) {
    const insets = useSafeAreaInsets();
    const canSubmit = Boolean(name.trim()) && !creating && isOnline;

    const handleChange = useCallback(
      (index: number) => {
        if (index === -1) onClose();
      },
      [onClose]
    );

    return (
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
        <BottomSheetView style={{ height: SHEET_HEIGHT - 30 }}>

          {/* Header */}
          <View style={[styles.header, { borderBottomWidth: 1, borderColor: '#F3F4F6' }]}>
            <Text style={styles.title}>New Customer</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.hint}>
              Credits and payments can be added after creating the customer profile.
            </Text>
            <AddCustomerForm
              name={name}
              phone={phone}
              onNameChange={onNameChange}
              onPhoneChange={onPhoneChange}
              onSubmit={onSubmit}
            />
          </View>

          {/* Button pinned to bottom */}
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            {!isOnline && (
              <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 12, color: '#D97706', textAlign: 'center', marginBottom: 8 }}>
                You&apos;re offline. Connect to create a customer.
              </Text>
            )}
            <TouchableOpacity
              onPress={onSubmit}
              activeOpacity={0.85}
              disabled={!canSubmit}
              style={[styles.button, { backgroundColor: canSubmit ? '#16A34A' : '#BBF7D0' }]}
            >
              <Text style={styles.buttonText}>
                {creating ? 'Creating...' : 'Create Customer'}
              </Text>
            </TouchableOpacity>
          </View>

        </BottomSheetView>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  title: {
    fontFamily: 'Geist_700Bold',
    fontSize: 16,
    color: '#111827',
    textAlign: 'center',
  },
  form: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  hint: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  button: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: 'Geist_700Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },
});
