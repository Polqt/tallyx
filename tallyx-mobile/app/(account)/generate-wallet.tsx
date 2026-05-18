import { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { haptics } from '@/utils/haptics';
import { useAuth } from '@/context/AuthContext';
import { useAccountSetupStore } from '@/stores/account-setup.store';
import { getOrCreateStoreWallet } from '@/features/wallet/wallet.service';

const steps = [
  'Generating your keypair...',
  'Securing your secret key...',
  'Saving to your account...',
];

export default function GenerateWallet() {
  const insets = useSafeAreaInsets();
  const { setupStore } = useAuth();
  const { storeName, phoneNumber, reset } = useAccountSetupStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);
  const startedRef = useRef(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    if (!startedRef.current) {
      startedRef.current = true;
      runSetup();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runSetup() {
    try {
      setFailed(false);
      setDone(false);

      if (!storeName.trim()) {
        Toast.show({
          type: 'error',
          text1: 'Store name missing',
          text2: 'Please enter your store name first.',
          position: 'top',
        });
        router.replace('/(account)');
        return;
      }

      await delay(600);
      setCurrentStep(0);

      const wallet = await getOrCreateStoreWallet();

      setCurrentStep(1);
      await delay(wallet.wasCreated ? 700 : 350);

      setCurrentStep(2);
      await delay(500);

      await setupStore(storeName.trim(), phoneNumber, wallet.publicKey);

      reset();
      setDone(true);
      haptics.success();
    } catch (e: any) {
      setFailed(true);
      haptics.error();
      Toast.show({
        type: 'error',
        text1: 'Wallet setup failed',
        text2: e.message ?? 'Something went wrong.',
        position: 'top',
      });
    }
  }

  function retry() {
    haptics.medium();
    runSetup();
  }

  function delay(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }

  return (
    <Animated.View style={{ flex: 1, backgroundColor: '#ffffff', paddingTop: insets.top, opacity: fadeAnim }}>

      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 12,
        height: 52,
      }}>
        <TouchableOpacity
          onPress={() => { haptics.light(); router.back(); }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={22} color="#9CA3AF" strokeWidth={2} />
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <View style={{ width: 28, height: 4, borderRadius: 2, backgroundColor: '#16A34A' }} />
          <View style={{ width: 28, height: 4, borderRadius: 2, backgroundColor: '#16A34A' }} />
          <View style={{ width: 28, height: 4, borderRadius: 2, backgroundColor: done ? '#16A34A' : '#E5E7EB' }} />
        </View>

        {/* spacer to balance the back button */}
        <View style={{ width: 36 }} />
      </View>

      {/* Content */}
      <View style={{ flex: 1, paddingHorizontal: 28, paddingTop: 40 }}>
        <Text style={{ fontFamily: 'Geist_700Bold', fontSize: 28, color: '#111827', lineHeight: 36 }}>
          Your Digital{'\n'}Store Wallet.
        </Text>
        <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 14, color: '#6B7280', marginTop: 8, lineHeight: 22 }}>
          {"We're generating a secure Stellar wallet\njust for your store. Your secret key stays on this device."}
        </Text>

        {/* Steps */}
        <View style={{ marginTop: 40, gap: 20 }}>
          {steps.map((label, i) => {
            const isActive = i === currentStep && !done;
            const isComplete = done || i < currentStep;

            return (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: isComplete ? '#15803D' : isActive ? '#DCFCE7' : '#F3F4F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {isComplete ? (
                    <Text style={{ color: '#ffffff', fontSize: 14, fontFamily: 'Geist_600SemiBold' }}>✓</Text>
                  ) : (
                    <Text style={{ color: isActive ? '#15803D' : '#9CA3AF', fontSize: 13, fontFamily: 'Geist_600SemiBold' }}>
                      {i + 1}
                    </Text>
                  )}
                </View>
                <Text style={{
                  fontFamily: isActive || isComplete ? 'Geist_600SemiBold' : 'Geist_400Regular',
                  fontSize: 14,
                  color: isComplete ? '#15803D' : isActive ? '#111827' : '#9CA3AF',
                  flex: 1,
                }}>
                  {label}
                </Text>
                {isActive && !done && <PulseDot />}
              </View>
            );
          })}
        </View>

        {done && (
          <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 13, color: '#9CA3AF', marginTop: 32, lineHeight: 20 }}>
            Wallet ready. Taking you to your dashboard...
          </Text>
        )}
      </View>

      {/* Bottom actions */}
      {failed && (
        <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 16 }}>
          <TouchableOpacity
            onPress={retry}
            activeOpacity={0.85}
            style={{
              height: 52,
              borderRadius: 26,
              backgroundColor: '#16A34A',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#ffffff', fontSize: 16, fontFamily: 'Geist_600SemiBold' }}>
              Try Again
            </Text>
          </TouchableOpacity>
          </View>
      )}

    </Animated.View>
  );
}

function PulseDot() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ])
    ).start();
    return () => anim.stopAnimation();
  }, [anim]);

  return (
    <Animated.View style={{
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#15803D',
      opacity: anim,
    }} />
  );
}
