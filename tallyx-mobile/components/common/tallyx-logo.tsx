import { View, Text } from 'react-native';

export function TallyxLogo() {
  return (
    <View className="flex-row items-center justify-center" style={{ gap: 8 }}>
      {/* <Image
        source={require('@/assets/images/logo.png')}
        style={{ width: 28, height: 28 }}
        resizeMode="contain"
      /> */}
      <Text className="text-xl font-geist-bold text-gray-900">Tallyx</Text>
    </View>
  );
}
