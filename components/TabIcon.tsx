import { useEffect } from 'react';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

type Props = {
  focused: boolean;
  color: string;
  size?: number;
  icon: (props: { size: number; color: string }) => React.ReactNode;
};

export function TabIcon({ focused, color, size = 21, icon }: Props) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.15 : 1, {
      damping: 14,
      stiffness: 220,
      mass: 0.6,
    });
  }, [focused, scale]);

  const wrapperStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={wrapperStyle} className="items-center justify-center">
      {icon({ size, color })}
    </Animated.View>
  );
}