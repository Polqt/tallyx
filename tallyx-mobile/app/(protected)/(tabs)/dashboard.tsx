import { useRef, useEffect, useState } from 'react';
import { ScrollView, Text, View, Animated, TouchableOpacity, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TrendingUp, ChevronDown } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useStoreStore } from '@/stores/store.store';
import { getGreeting } from '@/utils/dashboard';
import { haptics } from '@/utils/haptics';

const PERIODS = ['All time', 'This week', 'This month', 'This year'] as const;
type Period = (typeof PERIODS)[number];

// Placeholder data — replace with real API values when wired
const overdueAmount = 0;
const customerCount = 0;
const openCreditsCount = 0;

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const profile = useStoreStore((s) => s.profile);
  const storeName = profile?.name ?? user?.ownerName ?? 'My Store';

  const [period, setPeriod] = useState<Period>('All time');
  const [pickerVisible, setPickerVisible] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.delay(300),
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
          Animated.timing(waveAnim, { toValue: -0.5, duration: 120, useNativeDriver: true }),
          Animated.timing(waveAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
          Animated.timing(waveAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
        ]),
        { iterations: 3 }
      ),
    ]).start();
  }, [fadeAnim, slideAnim, waveAnim]);

  const waveRotate = waveAnim.interpolate({
    inputRange: [-0.5, 0, 1],
    outputRange: ['-10deg', '0deg', '20deg'],
  });

  function openPicker() {
    haptics.light();
    setPickerVisible(true);
  }

  function selectPeriod(p: Period) {
    haptics.selection();
    setPeriod(p);
    setPickerVisible(false);
  }

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: '#FFFFFF' }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Dark green header ── */}
        <View style={{ backgroundColor: '#14532D', paddingTop: insets.top + 20, paddingHorizontal: 20, paddingBottom: 32 }}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            {/* Line 1: greeting */}
            <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 15, color: 'rgba(255,255,255,0.7)', marginBottom: 3 }}>
              {getGreeting()}, {user?.ownerName?.split(' ')[0] ?? 'there'}
            </Text>

            {/* Line 2: store name + wave */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 28 }}>
              <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 13, color: '#FFFFFF' }}>
                {storeName}
              </Text>
              <Animated.Text style={{ fontSize: 13, transform: [{ rotate: waveRotate }] }}>👋</Animated.Text>
            </View>

            {/* Total receivables — centered */}
            <View style={{ alignItems: 'center' }}>
              <Text style={{
                fontFamily: 'Geist_500Medium', fontSize: 11, color: 'rgba(255,255,255,0.55)',
                letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 8,
              }}>
                Total Receivables
              </Text>
              <Text style={{ fontFamily: 'Geist_700Bold', fontSize: 64, color: '#FFFFFF', lineHeight: 72 }}>
                {"₱0"}
              </Text>
              {overdueAmount > 0 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#F59E0B' }} />
                  <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 13, color: '#FCD34D' }}>
                    ₱{overdueAmount.toLocaleString()} overdue
                  </Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF' }} />
                  <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                    No overdue this week
                  </Text>
                </View>
              )}
            </View>

          </Animated.View>
        </View>

        {/* ── White sheet with 28px arc ── */}
        <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -20, flexGrow: 1 }}>

          {/* Stats strip — no cards, no icons, dividers only */}
          <View style={{ flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 20 }}>

            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Geist_700Bold', fontSize: 28, color: '#111827' }}>
                {customerCount}
              </Text>
              <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 12, color: '#6B7280', marginTop: 3 }}>
                Customers
              </Text>
            </View>

            <View style={{ width: 1, backgroundColor: '#F3F4F6', marginVertical: 4 }} />

            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Geist_700Bold', fontSize: 28, color: '#111827' }}>
                {openCreditsCount}
              </Text>
              <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 12, color: '#6B7280', marginTop: 3 }}>
                Open Credits
              </Text>
            </View>

            <View style={{ width: 1, backgroundColor: '#F3F4F6', marginVertical: 4 }} />

            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{
                fontFamily: 'Geist_700Bold', fontSize: 28,
                color: overdueAmount > 0 ? '#D97706' : '#111827',
              }}>
                {"₱0"}
              </Text>
              <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 12, color: '#6B7280', marginTop: 3 }}>
                Overdue
              </Text>
            </View>

          </View>

          {/* Horizontal divider below strip */}
          <View style={{ height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 0 }} />

          {/* Recent Activity */}
          <View style={{ marginTop: 24, paddingHorizontal: 20 }}>

            {/* Header row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontFamily: 'Geist_700Bold', fontSize: 17, color: '#111827' }}>Recent Activity</Text>
              <TouchableOpacity
                onPress={openPicker}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 4,
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 20,
                  paddingHorizontal: 12, paddingVertical: 6,
                }}
              >
                <Text style={{ fontFamily: 'Geist_500Medium', fontSize: 13, color: '#374151' }}>{period}</Text>
                <ChevronDown size={13} color="#6B7280" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {/* Empty state — no card, flat on white */}
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <TrendingUp size={28} color="#D1D5DB" strokeWidth={1.8} />
              <Text style={{ fontFamily: 'Geist_700Bold', fontSize: 15, color: '#374151', marginTop: 14 }}>
                No activity yet
              </Text>
              <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 13, color: '#9CA3AF', marginTop: 4, textAlign: 'center', lineHeight: 20 }}>
                {"Credits and payments you record\nwill appear here."}
              </Text>
            </View>

          </View>
        </View>
      </ScrollView>

      {/* Period picker bottom sheet */}
      <Modal visible={pickerVisible} transparent animationType="fade" onRequestClose={() => setPickerVisible(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}
          onPress={() => setPickerVisible(false)}
        >
          <Pressable onPress={() => {}}>
            <View style={{
              backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
              paddingTop: 12, paddingBottom: insets.bottom + 24,
            }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 20 }} />
              <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 15, color: '#111827', paddingHorizontal: 20, marginBottom: 12 }}>
                Filter by period
              </Text>
              {PERIODS.map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => selectPeriod(p)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    paddingHorizontal: 20, paddingVertical: 14,
                    backgroundColor: period === p ? '#F0FDF4' : 'transparent',
                  }}
                >
                  <Text style={{
                    fontFamily: period === p ? 'Geist_600SemiBold' : 'Geist_400Regular',
                    fontSize: 15,
                    color: period === p ? '#16A34A' : '#374151',
                  }}>{p}</Text>
                  {period === p && (
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A' }} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
