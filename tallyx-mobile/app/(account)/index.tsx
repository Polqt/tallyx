import { useState } from 'react';
import { router } from 'expo-router';
import { useAccountSetupStore } from '@/stores/account-setup.store';
import { SingleFocusScreen } from '@/components/account/single-focus-screen';

export default function StoreNameStep() {
  const { storeName, setStoreName } = useAccountSetupStore();
  const [value, setValue] = useState(storeName);

  function handleContinue() {
    setStoreName(value.trim());
    router.push('/(account)/phone-number' as any);
  }

  return (
    <SingleFocusScreen
      stepNumber={1}
      totalSteps={3}
      headline="Name Your Store."
      subtitle="Choose a name for your store. You can change it later."
      placeholder="My Store"
      privacyNote="Your store name is visible to your customers. Just kidding, you can change it later and it won't be visible to anyone but you."
      value={value}
      onChangeText={setValue}
      onContinue={handleContinue}
      onBack={() => router.back()}
      autoCapitalize="words"
    />
  );
}
