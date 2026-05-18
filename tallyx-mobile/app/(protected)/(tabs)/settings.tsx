import { View, Text, TouchableOpacity, Alert, ScrollView, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  User,
  BookOpen,
  Info,
  MessageSquareWarning,
  RefreshCw,
  LogOut,
  ChevronRight,
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useOnboardingStore } from '@/stores/onboarding.store';

function SectionLabel({ label }: { label: string }) {
  return (
    <Text style={{ fontSize: 11, fontFamily: 'Geist_600SemiBold', color: '#9CA3AF', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6, marginTop: 24, paddingHorizontal: 4 }}>
      {label}
    </Text>
  );
}

function SettingsRow({ icon: Icon, iconBg, iconColor, label, sublabel, onPress, destructive, hideChevron }: {
  icon: typeof BookOpen;
  iconBg: string;
  iconColor: string;
  label: string;
  sublabel?: string;
  onPress: () => void;
  destructive?: boolean;
  hideChevron?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 14 }}
    >
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color={iconColor} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontFamily: 'Geist_500Medium', color: destructive ? '#EF4444' : '#111827' }}>{label}</Text>
        {sublabel && <Text style={{ fontSize: 12, fontFamily: 'Geist_400Regular', color: '#9CA3AF', marginTop: 1 }}>{sublabel}</Text>}
      </View>
      {!hideChevron && <ChevronRight size={16} color="#D1D5DB" strokeWidth={2} />}
    </TouchableOpacity>
  );
}

function SettingsGroup({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 18, overflow: 'hidden' }}>
      {children}
    </View>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: '#F3F4F6' }} />;
}

export default function Settings() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const setHasSeenOnboarding = useOnboardingStore((s) => s.setHasSeenOnboarding);

  function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  }

  function handleResetOnboarding() {
    Alert.alert('Reset Onboarding', 'This will sign you out and replay the intro screens.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', onPress: () => { setHasSeenOnboarding(false); signOut(); } },
    ]);
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#F8FAFC' }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={{ fontSize: 26, fontFamily: 'Geist_700Bold', color: '#111827', marginBottom: 2, paddingHorizontal: 4 }}>Settings</Text>
      <Text style={{ fontSize: 13, fontFamily: 'Geist_400Regular', color: '#9CA3AF', paddingHorizontal: 4 }}>Manage your account and preferences</Text>

      {/* Account */}
      <SectionLabel label="Account" />
      <View style={{ backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' }}>
          <User size={22} color="#16A34A" strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontFamily: 'Geist_600SemiBold', color: '#111827' }}>{user?.ownerName ?? '—'}</Text>
          <Text style={{ fontSize: 13, fontFamily: 'Geist_400Regular', color: '#6B7280', marginTop: 2 }}>{user?.email ?? '—'}</Text>
        </View>
      </View>

      {/* App */}
      <SectionLabel label="App" />
      <SettingsGroup>
        <SettingsRow
          icon={BookOpen}
          iconBg="#EFF6FF"
          iconColor="#3B82F6"
          label="Guide to Tallyx"
          sublabel="Learn how to use the app"
          onPress={() => router.push('/(protected)/settings/guide')}
        />
        <Divider />
        <SettingsRow
          icon={Info}
          iconBg="#F0FDF4"
          iconColor="#16A34A"
          label="About Tallyx"
          sublabel="Version, mission and more"
          onPress={() => router.push('/(protected)/settings/about')}
        />
      </SettingsGroup>

      {/* Support */}
      <SectionLabel label="Support" />
      <SettingsGroup>
        <SettingsRow
          icon={MessageSquareWarning}
          iconBg="#FFF7ED"
          iconColor="#F97316"
          label="Report a Problem"
          sublabel="Send us feedback or report an issue"
          onPress={() => Linking.openURL('mailto:support@tallyx.app?subject=Bug Report')}
        />
      </SettingsGroup>

      {/* Account actions */}
      <SectionLabel label="Account" />
      <SettingsGroup>
        <SettingsRow
          icon={RefreshCw}
          iconBg="#F9FAFB"
          iconColor="#6B7280"
          label="Reset Onboarding"
          sublabel="Replay the intro screens"
          onPress={handleResetOnboarding}
        />
        <Divider />
        <SettingsRow
          icon={LogOut}
          iconBg="#FEF2F2"
          iconColor="#EF4444"
          label="Sign Out"
          onPress={handleSignOut}
          destructive
          hideChevron
        />
      </SettingsGroup>
    </ScrollView>
  );
}
