import { useRef, useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, Mail, Lock, ChevronLeft } from 'lucide-react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import Toast from 'react-native-toast-message';
import { useAuth } from '@/context/AuthContext';
import { haptics } from '@/utils/haptics';
import { TallyxLogo } from '@/components/common/tallyx-logo';
import { AuthInput } from '@/components/auth/auth-input';
import { AuthButton } from '@/components/auth/auth-button';

const { width, height } = Dimensions.get('window');
const SNAP_POINTS = ['50%', '100%'];

export default function SignUp() {
  const insets = useSafeAreaInsets();
  const { signUp } = useAuth();
  const sheetRef = useRef<BottomSheet>(null);
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordTooShort = password.length > 0 && password.length < 8;
  const canSubmit = ownerName.trim().length > 0 && email.trim().length > 0 && password.length >= 8;

  const handleSheetChange = useCallback((index: number) => {
    if (index === -1) router.back();
  }, []);

  async function handleSignUp() {
    haptics.medium();
    setLoading(true);
    try {
      await signUp(ownerName.trim(), email.trim().toLowerCase(), password);
      haptics.success();
    } catch (e: any) {
      haptics.error();
      Toast.show({
        type: 'error',
        text1: 'Sign up failed',
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
        source={require('@/assets/icons/signup.png')}
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
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 8 }}
        >
          <View className="flex-row items-center mb-4">
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

          <Text className="font-geist-bold text-gray-900" style={{ fontSize: 30 }}>
            {'Create your\n'}
            <Text style={{ color: '#16A34A' }}>store </Text>
            {'account'}
            <Text style={{ color: '#16A34A' }}>.</Text>
          </Text>
          <Text className="font-geist text-gray-500 mt-1" style={{ fontSize: 14 }}>
            {"Let's set up your sari-sari store on Tallyx."}
          </Text>

          <View className="mt-5" style={{ gap: 12 }}>
            <AuthInput
              isBottomSheet
              icon={<User size={18} color="#9CA3AF" strokeWidth={2} />}
              label="Owner name"
              value={ownerName}
              onChangeText={setOwnerName}
              autoCapitalize="words"
            />
            <AuthInput
              isBottomSheet
              icon={<Mail size={18} color="#9CA3AF" strokeWidth={2} />}
              label="Email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <AuthInput
              isBottomSheet
              icon={<Lock size={18} color="#9CA3AF" strokeWidth={2} />}
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              showToggle
              error={passwordTooShort ? 'Password must be at least 8 characters.' : undefined}
            />
          </View>
        </BottomSheetScrollView>

        {/* Fixed footer — always visible */}
        <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 24, gap: 12 }}>
          <AuthButton
            label="Create Account"
            onPress={handleSignUp}
            loading={loading}
            disabled={!canSubmit}
          />
          <View className="items-center">
            <Text className="font-geist" style={{ fontSize: 14, color: '#6B7280' }}>
              {'Already have an account? '}
              <Text
                className="font-geist-bold"
                style={{ color: '#16A34A' }}
                onPress={() => router.replace('/(auth)/sign-in')}
              >
                Sign In
              </Text>
            </Text>
          </View>
        </View>
      </BottomSheet>
    </View>
  );
}
