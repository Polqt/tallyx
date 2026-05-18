import { useRef, useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mail, Lock } from 'lucide-react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import Toast from 'react-native-toast-message';
import { useAuth } from '@/context/AuthContext';
import { haptics } from '@/utils/haptics';
import { TallyxLogo } from '@/components/common/tallyx-logo';
import { AuthInput } from '@/components/auth/auth-input';
import { AuthButton } from '@/components/auth/auth-button';

const { width, height } = Dimensions.get('window');
const SNAP_POINTS = ['50%', '100%'];

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const sheetRef = useRef<BottomSheet>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  const handleSheetChange = useCallback((index: number) => {
    if (index === -1) router.back();
  }, []);

  async function handleSignIn() {
    haptics.medium();
    setLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
      haptics.success();
    } catch (e: any) {
      haptics.error();
      Toast.show({
        type: 'error',
        text1: 'Sign in failed',
        text2: e.message ?? 'Something went wrong.',
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-white">
      <Image
        source={require('@/assets/icons/login.png')}
        style={{ width, height: height * 0.42, marginTop: insets.top + 48 }}
        resizeMode="contain"
      />

      <BottomSheet
        ref={sheetRef}
        index={0}
        snapPoints={SNAP_POINTS}
        topInset={insets.top}
        onChange={handleSheetChange}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        enableOverDrag={false}
        enablePanDownToClose={false}
        handleIndicatorStyle={{ backgroundColor: '#D1D5DB', width: 40 }}
        backgroundStyle={{ borderRadius: 28 }}
      >
        <BottomSheetScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: insets.bottom + 24 }}
        >
          <View className="flex-row items-center mb-4">
            <View className="w-9" />
            <View className="flex-1 items-center">
              <TallyxLogo />
            </View>
            <View className="w-9" />
          </View>

          <Text className="font-geist-bold text-gray-900" style={{ fontSize: 30 }}>
            Welcome back<Text style={{ color: '#16A34A' }}>.</Text>
          </Text>
          <Text className="font-geist text-gray-500 mt-1" style={{ fontSize: 14 }}>
            Sign in to continue to your Tallyx account.
          </Text>

          <View className="mt-5" style={{ gap: 12 }}>
            <AuthInput
              icon={<Mail size={18} color="#9CA3AF" strokeWidth={2} />}
              label="Email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <AuthInput
              icon={<Lock size={18} color="#9CA3AF" strokeWidth={2} />}
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              showToggle
            />

            <TouchableOpacity className="items-end" onPress={() => router.push('/(auth)/forgot-password')}>
              <Text className="font-geist" style={{ fontSize: 14, color: '#16A34A' }}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexGrow: 1 }} />

          <View style={{ gap: 12, marginTop: 16 }}>
            <AuthButton label="Sign In" onPress={handleSignIn} loading={loading} disabled={!canSubmit} />
            <View className="items-center">
              <Text className="font-geist" style={{ fontSize: 14, color: '#6B7280' }}>
                {"Don't have an account? "}
                <Text
                  className="font-geist-bold"
                  style={{ color: '#16A34A' }}
                  onPress={() => router.push('/(auth)/sign-up')}
                >
                  Sign Up
                </Text>
              </Text>
            </View>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}
