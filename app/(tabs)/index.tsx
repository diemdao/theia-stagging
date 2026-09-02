import { Image, Text } from 'react-native';
import { ScreenScroll } from '../../components/TabBarScroll';

export default function Goals() {
  return (
    <ScreenScroll className="flex-1 bg-bg">
      <Text className="px-4 pt-16 pb-4 text-2xl font-semibold text-ink">
        Goals
      </Text>

      {[0, 1, 2, 3,4,5,6].map((i) => (
        <Image
          key={i}
          source={require('../../assets/images/test/test-reddit.png')}
          className="mb-4 h-96 w-full"
          resizeMode="cover"
        />
      ))}
    </ScreenScroll>
  );
}
