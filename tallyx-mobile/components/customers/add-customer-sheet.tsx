import React from 'react';
import { Modal, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { AddCustomerForm } from '@/components/customers/add-customer-form';

type AddCustomerSheetProps = {
  visible: boolean;
  name: string;
  phone: string;
  creating: boolean;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
};

export function AddCustomerSheet({
  visible,
  name,
  phone,
  creating,
  onNameChange,
  onPhoneChange,
  onSubmit,
  onClose,
}: AddCustomerSheetProps) {
  const insets = useSafeAreaInsets();
  const canSubmit = Boolean(name.trim()) && !creating;
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: '#FFFFFF' }}
      >
        <View style={{ flex: 1, paddingTop: 20 }}>
          {/* Header */}
          <View 
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              paddingHorizontal: 20, 
              paddingBottom: 16, 
              borderBottomWidth: 1, 
              borderColor: '#F3F4F6' 
            }}
          >
            <TouchableOpacity 
              onPress={onClose} 
              activeOpacity={0.7} 
              style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 20, 
                backgroundColor: '#F3F4F6', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}
            >
              <X size={20} color="#1F2937" strokeWidth={2.5} />
            </TouchableOpacity>
            <Text style={{ fontFamily: 'Geist_700Bold', fontSize: 17, color: '#111827' }}>NEW CUSTOMER</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: insets.bottom + 24 }}
          >
            <View className="mb-10 items-center">
              <Text className="text-[13px] leading-5 text-gray-400 text-center">
                Credits and payments can be added after creating the customer profile.
              </Text>
            </View>

            <AddCustomerForm
              name={name}
              phone={phone}
              onNameChange={onNameChange}
              onPhoneChange={onPhoneChange}
              onSubmit={onSubmit}
            />

            <TouchableOpacity
              onPress={() => {
                console.log('[AddCustomerSheet] Create button pressed', { name, phone, canSubmit, creating });
                onSubmit();
              }}
              activeOpacity={0.85}
              disabled={!canSubmit}
              className={`h-[54px] items-center justify-center rounded-2xl mt-8 ${
                canSubmit ? 'bg-green-600' : 'bg-green-200'
              }`}
            >
              <Text className="text-[15px] font-bold text-white">
                {creating ? 'Creating...' : 'Create Customer'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
