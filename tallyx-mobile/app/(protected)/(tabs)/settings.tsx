import { useState } from 'react';
import { Alert, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Bell, BookOpen, ChevronRight, Info, LogOut, MessageSquareWarning, RefreshCw } from 'lucide-react-native';
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

  const initial = user?.ownerName?.[0]?.toUpperCase() ?? '?';

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
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 100, paddingTop: 8 }}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          className="flex-row items-center rounded-2xl border border-[#F3F4F6] bg-[#F9FAFB] px-3.5 py-3.5"
        >
          <View className="h-11 w-11 items-center justify-center rounded-full bg-green-600">
            <Text className="text-[18px] font-bold text-white">{initial}</Text>
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-[15px] font-bold text-gray-900">{user?.ownerName ?? '—'}</Text>
            <Text className="mt-0.5 text-[13px] text-gray-500">{profile?.name ?? user?.email ?? '—'}</Text>
          </View>
          <ChevronRight size={16} color="#D1D5DB" strokeWidth={2} />
        </TouchableOpacity>

        <View className="mt-8">
          <SettingsSectionLabel label="App" />
          <SettingsRow icon={BookOpen} label="Guide to Tallyx" onPress={() => router.push('/(protected)/settings/guide')} />
          <SettingsRow icon={Info} label="About Tallyx" onPress={() => router.push('/(protected)/settings/about')} showDivider={false} />
        </View>

        <View className="mt-8">
          <SettingsSectionLabel label="Notifications" />
          <SettingsRow
            icon={Bell}
            label="Notifications"
            right={{ type: 'toggle', value: notificationsEnabled, onChange: setNotificationsEnabled }}
            showDivider={false}
          />
        </View>

        <View className="mt-8">
          <SettingsSectionLabel label="Support" />
          <SettingsRow icon={MessageSquareWarning} label="Report a Problem" onPress={() => Linking.openURL('mailto:support@tallyx.app?subject=Bug Report')} showDivider={false} />
        </View>

        <View className="mt-8">
          <SettingsSectionLabel label="Account" />
          <SettingsRow icon={RefreshCw} label="Reset Onboarding" onPress={handleResetOnboarding} />
          <SettingsRow icon={LogOut} label="Sign Out" labelColor="#EF4444" right={{ type: 'none' }} onPress={handleSignOut} showDivider={false} />
        </View>
      </ScrollView>
    </View>
  );
}
