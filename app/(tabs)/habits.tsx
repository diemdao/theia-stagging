import { Text, View } from 'react-native';
import { ScreenScroll } from '../../components/TabBarScroll';

export default function Habits() {
  return (
    <ScreenScroll className="flex-1 bg-blue-100">
      <Text className="px-4 pt-16 pb-4 text-2xl font-semibold text-ink">
        Habits
      </Text>

      {Array.from({ length: 30 }).map((_, i) => (
        <View key={i} className="mx-4 mb-3 h-24 rounded-card bg-fill" />
      ))}
    </ScreenScroll>
  );
}
