import { ElementRef, useRef } from 'react';
import { Text, TextInput, View } from 'react-native';
import { formatPHPhone, stripFormatting } from '@/utils/customers';

type AddCustomerFormProps = {
  name: string;
  phone: string;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onSubmit: () => void;
};

export function AddCustomerForm({
  name,
  phone,
  onNameChange,
  onPhoneChange,
  onSubmit,
}: AddCustomerFormProps) {
  const phoneRef = useRef<ElementRef<typeof TextInput>>(null);

  function handlePhoneChange(text: string) {
    const digits = stripFormatting(text).slice(0, 10);
    onPhoneChange(digits);
  }

  return (
    <View className="gap-3">
      <TextInput
        className="h-14 rounded-2xl border border-gray-100 bg-gray-50 px-4 text-[15px] text-gray-900"
        placeholder="Customer name"
        placeholderTextColor="#9CA3AF"
        value={name}
        onChangeText={onNameChange}
        autoCapitalize="words"
        returnKeyType="next"
        onSubmitEditing={() => phoneRef.current?.focus()}
      />

      <View className="h-14 flex-row items-center overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
        <View className="h-full items-center justify-center border-r border-gray-200 bg-gray-100 px-4">
          <Text className="text-[15px] font-semibold text-gray-500">PH +63</Text>
        </View>

        <TextInput
          ref={phoneRef}
          className="flex-1 px-4 text-[15px] text-gray-900"
          placeholder="9XX XXX XXXX"
          placeholderTextColor="#9CA3AF"
          value={formatPHPhone(phone)}
          onChangeText={handlePhoneChange}
          keyboardType="number-pad"
          returnKeyType="done"
          onSubmitEditing={onSubmit}
          maxLength={12}
        />
      </View>
    </View>
  );
}
