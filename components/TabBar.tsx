import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import { styled } from 'nativewind';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View, type LayoutRectangle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { EXPAND_DURATION, useTabBarCollapse } from './TabBarScroll';

// styled() RETURNS a wrapped component - it does not register the original, so
// these wrappers are what has to be rendered. className on a bare BlurView or
// Animated.View is silently dropped: NativeWind's babel plugin only rewrites
// components imported from react-native.
const BlurSurface = styled(BlurView);
const AnimatedView = styled(Animated.View);
const GradientSurface = styled(LinearGradient);

type TabRoute = BottomTabBarProps['state']['routes'][number];

// Mirrors --color-ink / --color-muted in global.css, which carries a note back
// to here. Only the icon needs these: `color` is a prop on an SVG component,
// not a style, so no class can reach it, and NativeWind's one JS-side reader
// for theme tokens (useUnstableNativeVariable) throws on web. The label beside
// the icon is plain text, so it uses the classes directly.
const ACTIVE = '#1a1a1b';
const INACTIVE = '#7a7a7e';

const X_SPRING = { damping: 22, stiffness: 160, mass: 1.1 };
const W_SPRING = { damping: 14, stiffness: 110, mass: 1.2 };

// px-1 on the padded row container, and the 1px border on the clipping view.
const BAR_PAD = 4;
const EDGE = 1;

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const [layouts, setLayouts] = useState<Record<string, LayoutRectangle>>({});
  const measured = useRef(false);
  const router = useRouter();

  const x = useSharedValue(0);
  const w = useSharedValue(0);
  const shown = useSharedValue(0);
  const dragStart = useSharedValue(0);

  const { collapsed, intent, scrollToTop } = useTabBarCollapse();
  const fullWidth = useSharedValue(0);

  // Tapping the collapsed bar opens it again. Clearing `intent` too keeps the
  // scroll handler honest about which way the bar should move next.
  const expand = () => {
    intent.value = 0;
    collapsed.value = withTiming(0, { duration: EXPAND_DURATION });
  };

  // The gesture runs on the UI thread and can't read React state, so the
  // measured slots are mirrored into a shared value it can see.
  const slots = useSharedValue<{ x: number; width: number }[]>([]);

  // Collapsed is a UI-thread value; this mirror is only for the props that
  // have to be decided on the JS thread.
  const [isCollapsed, setIsCollapsed] = useState(false);
  useAnimatedReaction(
    () => collapsed.value > 0.5,
    (v, prev) => {
      if (v !== prev) runOnJS(setIsCollapsed)(v);
    },
  );

  // The assistant is a root-level modal now, not a tab, so every route here
  // is a real tab.
  const tabs = state.routes;

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

  // The one place a tab is actually entered, whether by tap or by drag.
  const selectRoute = useCallback(
    (route: TabRoute) => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    },
    [navigation],
  );

  // Navigation has to happen back on the JS thread.
  const goToIndex = useCallback(
    (i: number) => {
      const route = tabs[i];
      if (!route || route.key === activeKey) return;
      selectRoute(route);
    },
    [tabs, activeKey, selectRoute],
  );

  const pan = useMemo(
    () =>
      Gesture.Pan()
        // Nothing to drag between when only the active tab is showing.
        .enabled(!isCollapsed)
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
        }),
    [isCollapsed, goToIndex, dragStart, slots, w, x],
  );

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
    width: w.value,
    opacity: shown.value,
  }));

  // Collapsed, the bar is just the active tab plus the row padding and border.
  const barStyle = useAnimatedStyle(() => {
    const full = fullWidth.value;
    if (full === 0) return { width: '100%' as const };
    const shut = w.value > 0 ? w.value + BAR_PAD * 2 + EDGE * 2 : full;
    return { width: full + (shut - full) * collapsed.value };
  });

  // Pinned to the expanded width so the tabs never reflow as the bar closes -
  // they are clipped by the bar instead, which is what keeps the active tab
  // the same size throughout.
  const trackStyle = useAnimatedStyle(() => ({
    width:
      fullWidth.value === 0 ? ('100%' as const) : fullWidth.value - EDGE * 2,
  }));

  // Slides the active tab to the bar's left edge as it closes. Without this,
  // collapsing would always leave "Goals" showing.
  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -x.value * collapsed.value }],
  }));

  const othersStyle = useAnimatedStyle(() => ({
    opacity: 1 - collapsed.value,
  }));

  return (
    <View className="absolute bottom-0 w-full flex-row items-center justify-center gap-3 px-4 mb-safe">
      {/* Stable full-width slot. It never animates, so its onLayout is a
          trustworthy measure of the expanded width - measuring the view we
          then shrink would feed the collapsed width back into itself. It also
          keeps the AI button still while the bar closes. */}
      <View
        className="flex-1"
        onLayout={(e) => {
          fullWidth.value = e.nativeEvent.layout.width;
        }}
      >
        <AnimatedView
          style={barStyle}
          className="overflow-hidden rounded-pill border border-glass"
        >
          <BlurSurface intensity={70} tint="light">
            {/* The wash that lifts the blur toward white. */}
            <AnimatedView style={trackStyle} className="bg-glass px-1 py-1">
              <GestureDetector gesture={pan}>
                {/* No padding here. The pill is absolute inside this View, so
                    it and the tabs must share the same origin. */}
                <AnimatedView style={rowStyle} className="flex-row">
                  {/* Static look from the class, motion from the animated
                      style; the two merge, with the animated style winning. */}
                  <AnimatedView
                    pointerEvents="none"
                    className="absolute bottom-0 left-0 top-0 rounded-indicator bg-indicator"
                    style={pillStyle}
                  />

                  {tabs.map((route) => {
                    const { options } = descriptors[route.key];
                    const focused =
                      state.routes[state.index]?.key === route.key;
                    const label = options.title ?? route.name;
                    const iconColor = focused ? ACTIVE : INACTIVE;

                    return (
                      <Pressable
                        key={route.key}
                        // Faded-out tabs sit outside the collapsed bar, but
                        // stay hit-testable until this says otherwise.
                        pointerEvents={
                          isCollapsed && !focused ? 'none' : 'auto'
                        }
                        onPress={() => {
                          // Collapsed, the only tab on screen is the active
                          // one, so a tap means "open the bar", not "navigate".
                          if (isCollapsed) {
                            expand();
                            return;
                          }
                          // Tapping the tab you are already on takes you back
                          // to the top of it.
                          if (focused) {
                            scrollToTop();
                            return;
                          }
                          selectRoute(route);
                        }}
                        onLayout={(e) => {
                          const {
                            x: lx,
                            y,
                            width,
                            height,
                          } = e.nativeEvent.layout;
                          setLayouts((prev) => ({
                            ...prev,
                            [route.key]: { x: lx, y, width, height },
                          }));
                        }}
                        accessibilityRole="button"
                        accessibilityState={{ selected: focused }}
                        accessibilityLabel={label}
                        className="flex-1 items-center py-1.5"
                      >
                        <AnimatedView
                          style={focused ? undefined : othersStyle}
                          className="items-center gap-1"
                        >
                          {options.tabBarIcon?.({
                            focused,
                            color: iconColor,
                            size: 21,
                          })}
                          <Text
                            numberOfLines={1}
                            className={`text-xs ${focused ? 'font-semibold text-ink' : 'text-muted'}`}
                          >
                            {label}
                          </Text>
                        </AnimatedView>
                      </Pressable>
                    );
                  })}
                </AnimatedView>
              </GestureDetector>
            </AnimatedView>
          </BlurSurface>
        </AnimatedView>
      </View>

      {/* Opens the assistant as a root-level modal over whatever screen you
          are on, so it can act on that context and dismiss back to it. */}
      <Pressable
        onPress={() => router.push('/assistant')}
        accessibilityRole="button"
        accessibilityLabel="AI assistant"
        className="h-16 w-16 overflow-hidden rounded-full border-4 border-glass"
      >
        <GradientSurface
          colors={['#4DBCF5', '#6885D4', '#E64DD3', '#FF4DB9', '#F79340']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="h-full w-full items-center justify-center rounded-full"
        >
          <Sparkles size={28} color="#ffffff" fill="#ffffff" strokeWidth={2} />
        </GradientSurface>
      </Pressable>
    </View>
  );
}
