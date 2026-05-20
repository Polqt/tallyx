import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown } from 'lucide-react-native';
import { DashboardStatStrip } from '@/components/dashboard/dashboard-stat-strip';
import { RecentActivityList } from '@/components/dashboard/recent-activity-list';
import { useAuth } from '@/context/AuthContext';
import { fetchDashboardSummary } from '@/features/dashboard/dashboard.service';
import { useStoreStore } from '@/stores/store.store';
import {
  DASHBOARD_PERIODS,
  EMPTY_DASHBOARD_SUMMARY,
  formatPeso,
  getGreeting,
  type DashboardPeriod,
} from '@/utils/dashboard';
import { haptics } from '@/utils/haptics';

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const { user, token } = useAuth();
  const profile = useStoreStore((s) => s.profile);
  const storeName = profile?.name ?? user?.ownerName ?? 'My Store';

  const [period, setPeriod] = useState<DashboardPeriod>('All time');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [summary, setSummary] = useState(EMPTY_DASHBOARD_SUMMARY);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!token) return;

    const authToken = token;
    const controller = new AbortController();

    async function loadDashboardSummary() {
      setLoadingSummary(true);
      setSummaryError(null);

      try {
        const data = await fetchDashboardSummary(authToken, period, controller.signal);
        setSummary(data);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
        setSummaryError(error instanceof Error ? error.message : 'Unable to load dashboard.');
      } finally {
        setLoadingSummary(false);
      }
    }

    loadDashboardSummary();
    return () => controller.abort();
  }, [token, period]);

  const waveRotate = waveAnim.interpolate({
    inputRange: [-0.5, 0, 1],
    outputRange: ['-10deg', '0deg', '20deg'],
  });
  const totals = summary.totals;

  function openPicker() {
    haptics.light();
    setPickerVisible(true);
  }

  function selectPeriod(p: DashboardPeriod) {
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
        <View style={{ backgroundColor: '#14532D', paddingTop: insets.top + 20, paddingHorizontal: 20, paddingBottom: 32 }}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 15, color: 'rgba(255,255,255,0.7)', marginBottom: 3 }}>
              {getGreeting()}, {user?.ownerName?.split(' ')[0] ?? 'there'}{' '}
              <Animated.Text style={{ fontSize: 13, transform: [{ rotate: waveRotate }] }}>{'\uD83D\uDC4B'}</Animated.Text>
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 28 }}>
              <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 13, color: '#FFFFFF' }}>
                {storeName}
              </Text>
            </View>

            <View style={{ alignItems: 'center' }}>
              <Text style={{
                fontFamily: 'Geist_500Medium', fontSize: 11, color: 'rgba(255,255,255,0.55)',
                letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 8,
              }}>
                Total Receivables
              </Text>
              <Text style={{ fontFamily: 'Geist_700Bold', fontSize: 64, color: '#FFFFFF', lineHeight: 72 }}>
                {formatPeso(totals.totalReceivables)}
              </Text>
              {totals.overdueAmount > 0 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#F59E0B' }} />
                  <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 13, color: '#FCD34D' }}>
                    {formatPeso(totals.overdueAmount)} overdue
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

        <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -20, flexGrow: 1 }}>
          <DashboardStatStrip
            customerCount={totals.customerCount}
            openCreditsCount={totals.openCreditsCount}
            overdueAmount={totals.overdueAmount}
          />

          <View style={{ marginTop: 24, paddingHorizontal: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontFamily: 'Geist_700Bold', fontSize: 17, color: '#111827' }}>Recent Activity</Text>
              <TouchableOpacity
                onPress={openPicker}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 4,
                  backgroundColor: period !== 'All time' ? '#F0FDF4' : '#FFFFFF',
                  borderWidth: 1, borderColor: period !== 'All time' ? '#86EFAC' : '#E5E7EB', borderRadius: 20,
                  paddingHorizontal: 12, paddingVertical: 6,
                }}
              >
                <Text style={{ fontFamily: 'Geist_500Medium', fontSize: 13, color: period !== 'All time' ? '#16A34A' : '#374151' }}>{period}</Text>
                <ChevronDown size={13} color={period !== 'All time' ? '#16A34A' : '#6B7280'} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {loadingSummary ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator size="small" color="#16A34A" />
                <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 13, color: '#9CA3AF', marginTop: 10 }}>
                  Loading dashboard...
                </Text>
              </View>
            ) : summaryError ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 14, color: '#B45309' }}>
                  Dashboard unavailable
                </Text>
                <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 13, color: '#9CA3AF', marginTop: 4, textAlign: 'center' }}>
                  {summaryError}
                </Text>
              </View>
            ) : (
              <RecentActivityList items={summary.recentActivity} />
            )}
          </View>
        </View>
      </ScrollView>

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
              {DASHBOARD_PERIODS.map((p) => (
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
