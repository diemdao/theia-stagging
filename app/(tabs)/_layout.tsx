import { Tabs } from 'expo-router';
import { TabBar } from '../../components/TabBar';

export default function TabLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Goals' }} />
      <Tabs.Screen name="habits" options={{ title: 'Habits' }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendar' }} />
      <Tabs.Screen name="overview" options={{ title: 'Overview' }} />
      <Tabs.Screen name="assistant" options={{ title: 'Assistant' }} />
    </Tabs>
  );
}