import { useFocusEffect } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

export const COLLAPSE_DURATION = 400;

type ScrollRef = React.RefObject<React.ComponentRef<
  typeof Animated.ScrollView
> | null>;

type Collapse = {
  // 0 = expanded, 1 = collapsed.
  collapsed: SharedValue<number>;
  // Where `collapsed` is heading. Shared rather than per-screen so that
  // tapping the bar open also clears the latch the scroll handler reads -
  // otherwise the handler still believes it has already collapsed, and the
  // next downward scroll is ignored.
  intent: SharedValue<number>;
  // Points at the focused screen's scroll view, or nothing.
  registerScroll: (ref: ScrollRef) => () => void;
  scrollToTop: () => void;
};

const Ctx = createContext<Collapse | null>(null);

export function TabBarScrollProvider({ children }: { children: ReactNode }) {
  const collapsed = useSharedValue(0);
  const intent = useSharedValue(0);

  // Holds the ref object rather than the instance, so it stays correct
  // across the focused screen's own re-renders.
  const activeScroll = useRef<ScrollRef | null>(null);

  const registerScroll = useCallback((ref: ScrollRef) => {
    activeScroll.current = ref;
    return () => {
      // Only clear if this screen is still the registered one. On a tab
      // switch the incoming screen can focus before the outgoing one blurs,
      // and an unguarded clear would wipe the new registration.
      if (activeScroll.current === ref) {
        activeScroll.current = null;
      }
    };
  }, []);

  const scrollToTop = useCallback(() => {
    activeScroll.current?.current?.scrollTo({ y: 0, animated: true });
  }, []);

  const value = useMemo(
    () => ({ collapsed, intent, registerScroll, scrollToTop }),
    [collapsed, intent, registerScroll, scrollToTop],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTabBarCollapse() {
  const v = useContext(Ctx);
  if (!v) {
    throw new Error('useTabBarCollapse must be used inside TabBarScrollProvider');
  }
  return v;
}

// Attach to any scrollable screen. Collapses on scroll down, expands on up.
export function useTabBarScroll() {
  const { collapsed, intent } = useTabBarCollapse();
  const lastY = useSharedValue(0);

  return useAnimatedScrollHandler({
    onScroll: (e) => {
      const y = e.contentOffset.y;
      const dy = y - lastY.value;

      // Ignore tiny jitter and the bounce above the top.
      if (y < 0 || Math.abs(dy) < 4) return;
      lastY.value = y;

      const next = dy > 0 && y > 40 ? 1 : 0;
      // Without this the timing restarts on every scroll frame and never
      // gets to play out. It is also what keeps a programmatic scroll to the
      // top quiet: the bar is already expanded, so there is nothing to run.
      if (next === intent.value) return;
      intent.value = next;
      collapsed.value = withTiming(next, { duration: COLLAPSE_DURATION });
    },
  });
}

type ScreenScrollProps = React.ComponentProps<typeof Animated.ScrollView> & {
  className?: string;
};

// A screen-level scroll view already wired to the tab bar.
export function ScreenScroll({
  children,
  className = 'flex-1 bg-bg',
  contentContainerStyle,
  ...rest
}: ScreenScrollProps) {
  const onScroll = useTabBarScroll();
  const { registerScroll } = useTabBarCollapse();
  const ref = useRef<React.ComponentRef<typeof Animated.ScrollView>>(null);

  // Registering on focus (and unregistering on blur or unmount) means the
  // provider only ever points at the screen the user can actually see.
  useFocusEffect(useCallback(() => registerScroll(ref), [registerScroll]));

  return (
    // The classes go on a plain View so the scroll view can be a bare
    // Animated.ScrollView: styled() returns a function component, and relying
    // on it to forward a ref would be relying on React 19 prop semantics.
    <View className={className}>
      <Animated.ScrollView
        ref={ref}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
        // Clears the floating bar so the last row isn't stuck underneath it.
        contentContainerStyle={[{ paddingBottom: 140 }, contentContainerStyle]}
        {...rest}
      >
        {children}
      </Animated.ScrollView>
    </View>
  );
}
