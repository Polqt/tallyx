import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';

// TODO(backend): POST new credit to API
// TODO(blockchain): call create_credit on the Soroban credit-ledger contract after saving
// TODO(scanner): when QR scanning is added, use parseCustomerQRData(rawValue),
// find the customer by customerId, then auto-select that customer here.

export default function NewCredit() {
  const [customerId, setCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');

  function handleSave() {
    if (!customerId.trim() || !amount.trim()) {
      Alert.alert('Missing fields', 'Customer and amount are required.');
      return;
    }
    // TODO(blockchain): submit to Soroban contract via Stellar SDK
    Alert.alert('Saved', 'Credit recorded. (Not yet connected to blockchain)');
    router.back();
  }

  return (
    <View className="flex-1 px-6 pt-8 bg-white">
      <Text className="text-2xl font-bold text-gray-900 mb-6">Record Credit</Text>
      <TextInput
        className="border border-gray-200 rounded-xl px-4 py-3.5 text-base bg-gray-50 mb-4"
        placeholder="Customer name or ID"
        value={customerId}
        onChangeText={setCustomerId}
      />
      <TextInput
        className="border border-gray-200 rounded-xl px-4 py-3.5 text-base bg-gray-50 mb-4"
        placeholder="Amount (e.g. 150)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />
      <TextInput
        className="border border-gray-200 rounded-xl px-4 py-3.5 text-base bg-gray-50 mb-4"
        placeholder="Due date (e.g. 2025-12-31)"
        value={dueDate}
        onChangeText={setDueDate}
      />
      <TouchableOpacity className="bg-primary py-4 rounded-xl items-center" onPress={handleSave}>
        <Text className="text-white text-base font-semibold">Record Credit</Text>
      </TouchableOpacity>
    </View>
  );
}
