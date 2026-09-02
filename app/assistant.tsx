import { ScrollView, Text, View } from 'react-native';

export default function Assistant() {
  return (
    <View className="flex-1 bg-bg">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-2xl font-semibold text-ink">Assistant</Text>
      </ScrollView>
    </View>
  );
}