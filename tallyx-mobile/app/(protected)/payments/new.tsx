import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';

// TODO(backend): POST payment to API
// TODO(blockchain): call record_payment on the Soroban credit-ledger contract after saving
// TODO(scanner): when QR scanning is added, use parseCustomerQRData(rawValue),
// find the customer by customerId, then auto-select that customer here.

export default function NewPayment() {
  const [creditId, setCreditId] = useState('');
  const [amount, setAmount] = useState('');

  function handleSave() {
    if (!creditId.trim() || !amount.trim()) {
      Alert.alert('Missing fields', 'Credit ID and amount are required.');
      return;
    }
    // TODO(blockchain): submit payment to Soroban contract via Stellar SDK
    Alert.alert('Saved', 'Payment recorded. (Not yet connected to blockchain)');
    router.back();
  }

  return (
    <View className="flex-1 px-6 pt-8 bg-white">
      <Text className="text-2xl font-bold text-gray-900 mb-6">Record Payment</Text>
      <TextInput
        className="border border-gray-200 rounded-xl px-4 py-3.5 text-base bg-gray-50 mb-4"
        placeholder="Credit ID"
        value={creditId}
        onChangeText={setCreditId}
        keyboardType="numeric"
      />
      <TextInput
        className="border border-gray-200 rounded-xl px-4 py-3.5 text-base bg-gray-50 mb-4"
        placeholder="Amount paid (e.g. 100)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />
      <TouchableOpacity className="bg-primary py-4 rounded-xl items-center" onPress={handleSave}>
        <Text className="text-white text-base font-semibold">Record Payment</Text>
      </TouchableOpacity>
    </View>
  );
}
