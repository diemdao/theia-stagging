import { Tabs } from 'expo-router';
import {
    Calendar as CalendarIcon,
    LayoutGrid,
    Repeat,
    Sparkles,
    Target,
} from 'lucide-react-native';
import { TabBar } from '../../components/TabBar';
import { TabBarScrollProvider } from '../../components/TabBarScroll';
import { TabIcon } from '../../components/TabIcon';

type IconProps = { size: number; color: string };

const makeIcon =
  (Icon: (props: IconProps) => React.ReactNode) =>
  ({ focused, color }: { focused: boolean; color: string }) =>
    (
      <TabIcon
        focused={focused}
        color={color}
        icon={({ size }) => <Icon size={size} color={color} />}
      />
    );

export default function TabLayout() {
  return (
    <TabBarScrollProvider>
      <Tabs
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: 'Goals', tabBarIcon: makeIcon(Target) }}
        />
        <Tabs.Screen
          name="habits"
          options={{ title: 'Habits', tabBarIcon: makeIcon(Repeat) }}
        />
        <Tabs.Screen
          name="calendar"
          options={{ title: 'Calendar', tabBarIcon: makeIcon(CalendarIcon) }}
        />
        <Tabs.Screen
          name="overview"
          options={{ title: 'Overview', tabBarIcon: makeIcon(LayoutGrid) }}
        />
        <Tabs.Screen
          name="assistant"
          options={{ title: 'Assistant', tabBarIcon: makeIcon(Sparkles) }}
        />
      </Tabs>
    </TabBarScrollProvider>
  );
}