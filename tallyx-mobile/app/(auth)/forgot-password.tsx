import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, ChevronLeft } from 'lucide-react-native';
import { TallyxLogo } from '@/components/common/tallyx-logo';
import { AuthInput } from '@/components/auth/auth-input';
import { AuthButton } from '@/components/auth/auth-button';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export default function ForgotPassword() {
  const insets = useSafeAreaInsets();
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSend() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Failed to send reset link');
      setSent(true);
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-row items-center px-6 mb-1">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
        >
          <ChevronLeft size={20} color="#111827" strokeWidth={2.5} />
        </TouchableOpacity>
        <View className="flex-1 items-center">
          <TallyxLogo />
        </View>
        <View className="w-9" />
      </View>

      {sent ? (
        <View className="mx-6 mt-10 items-center rounded-2xl p-6" style={{ backgroundColor: '#F0FDF4' }}>
          <View
            className="items-center justify-center rounded-full"
            style={{ width: 56, height: 56, backgroundColor: '#16A34A' }}
          >
            <Text style={{ color: '#ffffff', fontSize: 24 }}>{'✓'}</Text>
          </View>
          <Text className="font-geist-bold text-gray-900 mt-4 text-center" style={{ fontSize: 17 }}>
            Check your inbox
          </Text>
          <Text className="font-geist text-gray-500 mt-2 text-center" style={{ fontSize: 14, lineHeight: 20 }}>
            We sent a reset link to your contact.
          </Text>
          <TouchableOpacity className="mt-5" onPress={() => router.replace('/(auth)/sign-in')}>
            <Text className="font-geist-bold" style={{ fontSize: 14, color: '#16A34A' }}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View className="mt-8 px-6">
            <Text className="font-geist-bold text-gray-900" style={{ fontSize: 28 }}>
              {'Forgot password'}
              <Text style={{ color: '#16A34A' }}>{'?'}</Text>
            </Text>
            <Text className="font-geist text-gray-500 mt-2" style={{ fontSize: 14, lineHeight: 20 }}>
              Enter your phone number or email and we will send you a reset link.
            </Text>
          </View>

          <View className="mt-6 px-6" style={{ gap: 12 }}>
            <AuthInput
                              icon={<User size={18} color="#9CA3AF" strokeWidth={2} />}
                              placeholder="Phone number or email"
                              value={identifier}
                              onChangeText={setIdentifier}
                              autoCapitalize="none"
                              keyboardType="email-address" label={''}            />

            {error.length > 0 && (
              <View className="rounded-xl px-4 py-3" style={{ backgroundColor: '#FEF2F2' }}>
                <Text className="font-geist" style={{ fontSize: 14, color: '#DC2626' }}>{error}</Text>
              </View>
            )}

            <View className="mt-2">
              <AuthButton
                label="Send Reset Link"
                onPress={handleSend}
                loading={loading}
                disabled={identifier.length === 0}
              />
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}
