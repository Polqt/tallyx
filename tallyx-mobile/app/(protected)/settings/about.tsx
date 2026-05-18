import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Sparkles, ShieldCheck, Zap, Globe, Heart } from 'lucide-react-native';
import { haptics } from '@/utils/haptics';

const APP_VERSION = '1.0.0';
const BUILD = '2026.1';

const FEATURES = [
  {
    icon: Sparkles,
    color: '#7C3AED',
    bg: '#F5F3FF',
    title: 'Simple & Fast',
    body: 'Record a credit in seconds. No complicated setup, no learning curve — just open and go.',
  },
  {
    icon: ShieldCheck,
    color: '#059669',
    bg: '#ECFDF5',
    title: 'Secure by Design',
    body: 'Your data is encrypted and stored safely. Only you have access to your store\'s records.',
  },
  {
    icon: Globe,
    color: '#2563EB',
    bg: '#EFF6FF',
    title: 'Stellar-Powered',
    body: 'Built on the Stellar blockchain so your wallet and records are yours — always.',
  },
  {
    icon: Zap,
    color: '#D97706',
    bg: '#FFFBEB',
    title: 'Built for Filipino Stores',
    body: 'Designed around the sari-sari store workflow — from utang tracking to payment collection.',
  },
];

export default function AboutScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>

      {/* Header */}
      <View style={{
        paddingTop: insets.top + 12,
        paddingHorizontal: 20,
        paddingBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
      }}>
        <TouchableOpacity
          onPress={() => { haptics.light(); router.back(); }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={20} color="#111827" strokeWidth={2.5} />
        </TouchableOpacity>
        <View>
          <Text style={{ fontFamily: 'Geist_700Bold', fontSize: 17, color: '#111827' }}>About Tallyx</Text>
          <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>App info and mission</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Dark hero */}
        <View style={{
          backgroundColor: '#111827',
          paddingHorizontal: 28,
          paddingTop: 40,
          paddingBottom: 44,
        }}>
          <View style={{
            width: 56,
            height: 56,
            borderRadius: 18,
            backgroundColor: '#16A34A',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}>
            <Text style={{ fontFamily: 'Geist_700Bold', fontSize: 22, color: '#FFFFFF' }}>T</Text>
          </View>
          <Text style={{ fontFamily: 'Geist_700Bold', fontSize: 36, color: '#FFFFFF', letterSpacing: -0.5, lineHeight: 42 }}>
            Tallyx
          </Text>
          <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 15, color: '#9CA3AF', marginTop: 8, lineHeight: 24 }}>
            The modern credit ledger for{'\n'}sari-sari store owners.
          </Text>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 24 }}>
            <View style={{ backgroundColor: '#1F2937', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 }}>
              <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 12, color: '#6B7280' }}>
                v{APP_VERSION}
              </Text>
            </View>
            <View style={{ backgroundColor: '#1F2937', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 }}>
              <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 12, color: '#6B7280' }}>
                Build {BUILD}
              </Text>
            </View>
          </View>
        </View>

        {/* Mission block */}
        <View style={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
          <Text style={{ fontFamily: 'Geist_500Medium', fontSize: 11, color: '#D1D5DB', letterSpacing: 1, marginBottom: 10 }}>
            OUR MISSION
          </Text>
          <Text style={{ fontFamily: 'Geist_700Bold', fontSize: 22, color: '#111827', lineHeight: 30, marginBottom: 12 }}>
            Say goodbye to the notebook.
          </Text>
          <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 14, color: '#6B7280', lineHeight: 23 }}>
            Tallyx was built for the millions of sari-sari store owners who still track utang with pen and paper. We wanted to give them something powerful, simple, and designed for how they actually work.
          </Text>
        </View>

        {/* Features */}
        <View style={{ paddingHorizontal: 24, paddingTop: 28, gap: 14 }}>
          <Text style={{ fontFamily: 'Geist_500Medium', fontSize: 11, color: '#D1D5DB', letterSpacing: 1, marginBottom: 2 }}>
            WHAT MAKES IT DIFFERENT
          </Text>
          {FEATURES.map((f) => (
            <View key={f.title} style={{
              flexDirection: 'row',
              gap: 14,
              backgroundColor: '#F9FAFB',
              borderRadius: 18,
              padding: 16,
              borderWidth: 1,
              borderColor: '#F3F4F6',
            }}>
              <View style={{
                width: 42,
                height: 42,
                borderRadius: 13,
                backgroundColor: f.bg,
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <f.icon size={18} color={f.color} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Geist_700Bold', fontSize: 14, color: '#111827', marginBottom: 4 }}>{f.title}</Text>
                <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 13, color: '#6B7280', lineHeight: 20 }}>{f.body}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={{ alignItems: 'center', paddingTop: 40, paddingBottom: 8, gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Heart size={13} color="#F87171" strokeWidth={2} fill="#F87171" />
            <Text style={{ fontFamily: 'Geist_500Medium', fontSize: 12, color: '#9CA3AF' }}>
              Made for Filipino store owners
            </Text>
          </View>
          <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 11, color: '#D1D5DB' }}>
            © 2026 Tallyx. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
