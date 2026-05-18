import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, UserPlus, FilePlus, Banknote, ShieldCheck, Wifi } from 'lucide-react-native';
import { haptics } from '@/utils/haptics';

const STEPS = [
  {
    icon: UserPlus,
    number: '01',
    title: 'Add a Customer',
    description: 'Go to the Customers tab and tap +. Enter their name and contact. They appear in your list instantly — ready to start tracking credits.',
    color: '#2563EB',
    bg: '#EFF6FF',
  },
  {
    icon: FilePlus,
    number: '02',
    title: 'Record a Credit',
    description: 'Tap Credits in the tab bar. Pick a customer, enter the amount, and optionally set a due date. Saved to your ledger immediately.',
    color: '#7C3AED',
    bg: '#F5F3FF',
  },
  {
    icon: Banknote,
    number: '03',
    title: 'Collect a Payment',
    description: 'Open the Payments tab and log a payment against an open credit. The balance updates automatically and history is always accessible.',
    color: '#059669',
    bg: '#ECFDF5',
  },
  {
    icon: ShieldCheck,
    number: '04',
    title: 'Your Data is Secure',
    description: 'All records are tied to your account and stored securely. Only you can access your store\'s data — your customers\' info is private.',
    color: '#D97706',
    bg: '#FFFBEB',
  },
  {
    icon: Wifi,
    number: '05',
    title: 'Stay Connected',
    description: 'Tallyx syncs in real time. Stay connected when recording credits or collecting payments so nothing gets lost.',
    color: '#DB2777',
    bg: '#FDF2F8',
  },
];

export default function GuideScreen() {
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
          <Text style={{ fontFamily: 'Geist_700Bold', fontSize: 17, color: '#111827' }}>How Tallyx Works</Text>
          <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>5 steps to get you started</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingTop: 28, paddingHorizontal: 24, paddingBottom: insets.bottom + 48 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ fontFamily: 'Geist_700Bold', fontSize: 26, color: '#111827', lineHeight: 34, marginBottom: 6 }}>
          Your guide to{'\n'}managing utang.
        </Text>
        <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 14, color: '#6B7280', lineHeight: 22, marginBottom: 36 }}>
          {"Follow these steps and you'll have your store running digitally in minutes."}
        </Text>

        {/* Timeline */}
        <View>
          {STEPS.map((item, index) => {
            const isLast = index === STEPS.length - 1;
            return (
              <View key={item.number} style={{ flexDirection: 'row', gap: 16 }}>

                {/* Left: connector column */}
                <View style={{ alignItems: 'center', width: 44 }}>
                  <View style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: item.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <item.icon size={20} color={item.color} strokeWidth={2} />
                  </View>
                  {!isLast && (
                    <View style={{
                      width: 1.5,
                      flex: 1,
                      backgroundColor: '#F3F4F6',
                      marginTop: 8,
                      marginBottom: 8,
                      minHeight: 24,
                    }} />
                  )}
                </View>

                {/* Right: content */}
                <View style={{ flex: 1, paddingBottom: isLast ? 0 : 28, paddingTop: 2 }}>
                  <Text style={{ fontFamily: 'Geist_500Medium', fontSize: 11, color: '#D1D5DB', letterSpacing: 1, marginBottom: 4 }}>
                    STEP {item.number}
                  </Text>
                  <Text style={{ fontFamily: 'Geist_700Bold', fontSize: 16, color: '#111827', marginBottom: 6 }}>
                    {item.title}
                  </Text>
                  <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 13, color: '#6B7280', lineHeight: 21 }}>
                    {item.description}
                  </Text>
                </View>

              </View>
            );
          })}
        </View>

        {/* Footer note */}
        <View style={{
          marginTop: 36,
          backgroundColor: '#F9FAFB',
          borderRadius: 16,
          padding: 18,
          borderWidth: 1,
          borderColor: '#F3F4F6',
        }}>
          <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 13, color: '#374151', marginBottom: 4 }}>
            Need more help?
          </Text>
          <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 13, color: '#9CA3AF', lineHeight: 20 }}>
            {"Reach out to us through the Settings screen. We're happy to walk you through anything."}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
