import { useState } from 'react';
import { router } from 'expo-router';
import { useAccountSetupStore } from '@/stores/account-setup.store';
import { SingleFocusScreen } from '@/components/account/single-focus-screen';

export default function PhoneNumberStep() {
  const { setPhoneNumber } = useAccountSetupStore();
  const [value, setValue] = useState('');

  function formatPhone(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} - ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} - ${digits.slice(3, 6)} - ${digits.slice(6)}`;
  }

  function handleChangeText(text: string) {
    setValue(formatPhone(text));
  }

  function proceed(phone: string) {
    const digits = phone.replace(/\D/g, '');
    setPhoneNumber(digits ? `+63${digits}` : '');
    router.push('/(account)/generate-wallet' as any);
  }

  return (
    <SingleFocusScreen
      stepNumber={2}
      totalSteps={3}
      headline="Your Phone Number."
      subtitle="So your customers can reach you. Totally optional."
      prefix="+63"
      placeholder="9XX - XXX - XXXX"
      privacyNote={"Used for customer notifications. You can add or change this anytime."}
      value={value}
      onChangeText={handleChangeText}
      onContinue={() => proceed(value)}
      onBack={() => router.back()}
      onSkip={() => proceed('')}
      keyboardType="phone-pad"
    />
  );
}
