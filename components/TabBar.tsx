import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Calendar, Check, LayoutGrid, Sparkle, Target } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

const ICONS = {
  index: Target,
  habits: Check,
  calendar: Calendar,
  overview: LayoutGrid,
} as const;

const BRAND = '#43cf1d';
const MUTED = '#7a7a7e';

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const go = (route: (typeof state.routes)[number], focused: boolean) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });
    if (!focused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  const tabs = state.routes.filter((r) => r.name !== 'assistant');
  const ai = state.routes.find((r) => r.name === 'assistant');
  const aiFocused = state.routes[state.index]?.name === 'assistant';

  return (
    <View className="absolute bottom-0 w-full flex-row items-center justify-center gap-3 px-4 mb-safe">
      <BlurView
        intensity={70}
        tint="light"
        className="flex-1 overflow-hidden rounded-pill border border-white/60"
      >
        <View className="flex-row justify-around px-2 py-3">
          {tabs.map((route) => {
            const focused = state.routes[state.index]?.key === route.key;
            const Icon = ICONS[route.name as keyof typeof ICONS];
            const label = descriptors[route.key].options.title ?? route.name;

            return (
              <Pressable
                key={route.key}
                onPress={() => go(route, focused)}
                accessibilityRole="button"
                accessibilityState={focused ? { selected: true } : {}}
                accessibilityLabel={label}
                className="items-center gap-1 px-2"
              >
                <Icon size={22} color={focused ? BRAND : MUTED} strokeWidth={2} />
                <Text
                  className={`text-xs ${focused ? 'font-semibold text-brand' : 'text-muted'}`}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </BlurView>

      {ai && (
        <Pressable
          onPress={() => go(ai, aiFocused)}
          accessibilityRole="button"
          accessibilityLabel="AI assistant"
          className="h-16 w-16 items-center justify-center rounded-full bg-brand"
        >
          <Sparkle size={26} color="#ffffff" fill="#ffffff" />
        </Pressable>
      )}
    </View>
  );
}