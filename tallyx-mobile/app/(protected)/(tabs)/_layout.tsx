import { Tabs } from 'expo-router';
import { TabBar } from '@/components/navigation/tab-bar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="customers" />
      <Tabs.Screen name="credits" />
      <Tabs.Screen name="payments" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
