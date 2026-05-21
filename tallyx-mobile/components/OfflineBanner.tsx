import { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { WifiOff } from 'lucide-react-native';

type Props = { isOnline: boolean };

export function OfflineBanner({ isOnline }: Props) {
  const translateY = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: isOnline ? -60 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOnline, translateY]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 999,
        transform: [{ translateY }],
      }}
      pointerEvents="none"
    >
      <View
        style={{
          backgroundColor: '#92400E',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 10,
          paddingHorizontal: 16,
        }}
      >
        <WifiOff size={14} color="#FDE68A" strokeWidth={2} />
        <Text
          style={{
            fontFamily: 'Geist_600SemiBold',
            fontSize: 13,
            color: '#FDE68A',
          }}
        >
          You're offline · Showing cached data
        </Text>
      </View>
    </Animated.View>
  );
}
