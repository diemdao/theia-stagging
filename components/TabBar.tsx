import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Sparkle } from 'lucide-react-native';
import { styled } from 'nativewind';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View, type LayoutRectangle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

// styled() RETURNS a wrapped component - it does not register the original, so
// these wrappers are what has to be rendered. className on a bare BlurView or
// Animated.View is silently dropped: NativeWind's babel plugin only rewrites
// components imported from react-native.
const BlurSurface = styled(BlurView);
const IndicatorView = styled(Animated.View);

const ACTIVE = '#1a1a1b';
const INACTIVE = '#7a7a7e';

const X_SPRING = { damping: 22, stiffness: 90, mass: 1.1 };
const W_SPRING = { damping: 14, stiffness: 60, mass: 1.2 };

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const [layouts, setLayouts] = useState<Record<string, LayoutRectangle>>({});
  const measured = useRef(false);

  const x = useSharedValue(0);
  const w = useSharedValue(0);
  const shown = useSharedValue(0);
  const dragStart = useSharedValue(0);

  // The gesture runs on the UI thread and can't read React state, so the
  // measured slots are mirrored into a shared value it can see.
  const slots = useSharedValue<{ x: number; width: number }[]>([]);

  const tabs = state.routes.filter((r) => r.name !== 'assistant');
  const ai = state.routes.find((r) => r.name === 'assistant');
  const aiFocused = state.routes[state.index]?.name === 'assistant';

  const activeKey = state.routes[state.index]?.key;
  const activeLayout = activeKey ? layouts[activeKey] : undefined;

  useEffect(() => {
    const next = tabs
      .map((r) => layouts[r.key])
      .filter(Boolean)
      .map((l) => ({ x: l.x, width: l.width }));
    if (next.length === tabs.length) {
      slots.value = next;
    }
  }, [layouts, tabs, slots]);

  useEffect(() => {
    if (!activeLayout) return;

    if (!measured.current) {
      x.value = activeLayout.x;
      w.value = activeLayout.width;
      shown.value = 1;
      measured.current = true;
      return;
    }

    x.value = withSpring(activeLayout.x, X_SPRING);
    w.value = withSpring(activeLayout.width, W_SPRING);
  }, [activeLayout, x, w, shown]);

  // Navigation has to happen back on the JS thread.
  const goToIndex = (i: number) => {
    const route = tabs[i];
    if (!route || route.key === activeKey) return;
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });
    if (!event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  const pan = Gesture.Pan()
    // Only take over once the finger has clearly moved sideways, so taps
    // still reach the Pressables underneath.
    .activeOffsetX([-8, 8])
    .failOffsetY([-12, 12])
    .onBegin(() => {
      dragStart.value = x.value;
    })
    .onUpdate((e) => {
      const list = slots.value;
      if (list.length === 0) return;
      const min = list[0].x;
      const last = list[list.length - 1];
      const max = last.x + last.width - w.value;
      const next = dragStart.value + e.translationX;
      x.value = Math.min(Math.max(next, min), max);
    })
    .onEnd(() => {
      const list = slots.value;
      if (list.length === 0) return;

      // Snap to whichever slot's centre is closest to the pill's centre.
      const centre = x.value + w.value / 2;
      let best = 0;
      let bestDist = Infinity;
      for (let i = 0; i < list.length; i++) {
        const d = Math.abs(list[i].x + list[i].width / 2 - centre);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      }

      x.value = withSpring(list[best].x, X_SPRING);
      w.value = withSpring(list[best].width, W_SPRING);
      runOnJS(goToIndex)(best);
    });

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
    width: w.value,
    opacity: shown.value,
  }));

  return (
    <View className="absolute bottom-0 w-full flex-row items-center justify-center gap-3 px-4 mb-safe">
      <BlurSurface
        intensity={70}
        tint="light"
        className="flex-1 overflow-hidden rounded-pill border border-glass"
      >
        {/* The wash that lifts the blur toward white. */}
        <View className="bg-glass px-1 py-1">
          <GestureDetector gesture={pan}>
            {/* No padding here. The pill is absolute inside this View, so it
                and the tabs must share the same origin. */}
            <View className="flex-row">
              {/* Static look from the class, motion from the animated style;
                  the two merge, with the animated style winning. */}
              <IndicatorView
                pointerEvents="none"
                className="absolute bottom-0 left-0 top-0 rounded-indicator bg-indicator"
                style={pillStyle}
              />

              {tabs.map((route) => {
                const { options } = descriptors[route.key];
                const focused = state.routes[state.index]?.key === route.key;
                const label = options.title ?? route.name;
                const color = focused ? ACTIVE : INACTIVE;

                return (
                  <Pressable
                    key={route.key}
                    onPress={() => {
                      const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                      });
                      if (!focused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                      }
                    }}
                    onLayout={(e) => {
                    const { x: lx, y, width, height } = e.nativeEvent.layout;
                        setLayouts((prev) => ({
                        ...prev,
                        [route.key]: { x: lx, y, width, height },
                        }));
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: focused }}
                    accessibilityLabel={label}
                    className="flex-1 items-center gap-1 py-1.5 "
                  >
                    {options.tabBarIcon?.({ focused, color, size: 21 })}
                    <Text
                      numberOfLines={1}
                      style={{ color }}
                      className={`text-xs ${focused ? 'font-semibold' : ''}`}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </GestureDetector>
        </View>
      </BlurSurface>

      {ai && (
        <Pressable
          onPress={() => {
            const event = navigation.emit({
              type: 'tabPress',
              target: ai.key,
              canPreventDefault: true,
            });
            if (!aiFocused && !event.defaultPrevented) {
              navigation.navigate(ai.name);
            }
          }}
          accessibilityRole="button"
          accessibilityState={{ selected: aiFocused }}
          accessibilityLabel="AI assistant"
          className="h-16 w-16 items-center justify-center rounded-full bg-brand"
        >
          <Sparkle size={26} color="#ffffff" fill="#ffffff" />
        </Pressable>
      )}
    </View>
  );
}