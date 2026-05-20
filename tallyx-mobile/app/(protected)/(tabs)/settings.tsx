import { useState } from 'react';
import { Alert, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Bell, BookOpen, Info, MessageSquareWarning } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useStoreStore } from '@/stores/store.store';
import { useOnboardingStore } from '@/stores/onboarding.store';
import { SettingsRow, SettingsSectionLabel } from '@/components/settings/settings-row';

export default function Settings() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const profile = useStoreStore((s) => s.profile);
  const setHasSeenOnboarding = useOnboardingStore((s) => s.setHasSeenOnboarding);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

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
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <View className="items-center py-3.5">
        <Text className="text-[17px] font-bold text-gray-900">Settings</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 100, paddingTop: 8 }}
      >
        <View className="items-center py-4">
          <View style={{ height: 64, width: 64, borderRadius: 32, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 26, fontWeight: '700', color: '#FFFFFF' }}>{user?.ownerName?.[0]?.toUpperCase() ?? '?'}</Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827', marginTop: 12 }}>
            {user?.ownerName ?? '—'}
          </Text>
          <View style={{ marginTop: 6, paddingHorizontal: 12, paddingVertical: 3, borderRadius: 20, backgroundColor: '#F0FDF4' }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#16A34A' }}>
              {profile?.name ?? '—'}
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 16 }}>
          <SettingsSectionLabel label="App" />
          <SettingsRow icon={BookOpen} label="Guide to Tallyx" onPress={() => router.push('/(protected)/settings/guide')} />
          <SettingsRow icon={Info} label="About Tallyx" onPress={() => router.push('/(protected)/settings/about')} />
        </View>

        <View style={{ marginTop: 16 }}>
          <SettingsSectionLabel label="Notifications" />
          <SettingsRow
            icon={Bell}
            label="Notifications"
            right={{ type: 'toggle', value: notificationsEnabled, onChange: setNotificationsEnabled }}
          />
        </View>

        <View style={{ marginTop: 16 }}>
          <SettingsSectionLabel label="Support" />
          <SettingsRow
            icon={MessageSquareWarning}
            label="Report a Problem"
            onPress={() => Linking.openURL('mailto:support@tallyx.app?subject=Bug Report')}
          />
        </View>

        <View style={{ marginTop: 24, gap: 12 }}>
          <TouchableOpacity
            onPress={handleResetOnboarding}
            activeOpacity={0.75}
            style={{ height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 15, fontWeight: '500', color: '#374151' }}>Reset Onboarding</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSignOut}
            activeOpacity={0.75}
            style={{ height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#FECACA', alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#DC2626' }}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
