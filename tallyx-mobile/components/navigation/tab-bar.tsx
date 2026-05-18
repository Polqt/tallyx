import React from 'react';
import { Animated, View, Text, TouchableOpacity } from 'react-native';
import { useNavVisibility } from '@/context/NavVisibilityContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  House,
  UsersRound,
  HandCoins,
  Wallet,
  SlidersHorizontal,
} from 'lucide-react-native';

const ALL_TABS: { name: string; label?: string; Icon: React.ComponentType<{ size: number; color: string; strokeWidth: number; fill?: string }> }[] = [
  { name: 'dashboard', label: 'Home',      Icon: House },
  { name: 'customers', label: 'Customers', Icon: UsersRound },
  { name: 'credits',                        Icon: HandCoins },
  { name: 'payments',  label: 'Payments',  Icon: Wallet },
  { name: 'settings',  label: 'Settings',  Icon: SlidersHorizontal },
];

const ACTIVE   = '#16A34A';
const INACTIVE = '#9CA3AF';

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { navOpacity } = useNavVisibility();

  return (
    <Animated.View
      style={{
        opacity: navOpacity,
        position: 'absolute',
        bottom: insets.bottom > 0 ? insets.bottom : 12,
        left: 16,
        right: 16,
        paddingBottom: 8,
        paddingTop: 6,
        paddingHorizontal: 8,
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 16,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
        {ALL_TABS.map((tab, index) => {
          const active = state.index === index;
          const isCenter = tab.name === 'credits';

          if (isCenter) {
            return (
              <TouchableOpacity
                key={tab.name}
                onPress={() => navigation.navigate(tab.name)}
                activeOpacity={0.85}
                style={{ flex: 1, alignItems: 'center', marginBottom: 2 }}
              >
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: active ? ACTIVE : '#059669',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: -2,
                    shadowColor: ACTIVE,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.45,
                    shadowRadius: 10,
                    elevation: 10,
                    borderWidth: 3,
                    borderColor: '#FFFFFF',
                  }}
                >
                  <tab.Icon size={22} color="#FFFFFF" strokeWidth={2} />
                </View>
              </TouchableOpacity>
            );
          }

          const label = tab.label ?? '';

          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => navigation.navigate(tab.name)}
              activeOpacity={0.7}
              style={{ flex: 1, alignItems: 'center', paddingVertical: 2 }}
            >
              {active ? (
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: ACTIVE,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: ACTIVE,
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.35,
                    shadowRadius: 8,
                    elevation: 6,
                  }}
                >
                  <tab.Icon size={20} color="#FFFFFF" strokeWidth={2} fill="#FFFFFF" />
                </View>
              ) : (
                <View style={{ alignItems: 'center', gap: 3, paddingVertical: 2 }}>
                  <tab.Icon size={20} color={INACTIVE} strokeWidth={1.8} />
                  <Text
                    style={{
                      fontSize: 10,
                      color: INACTIVE,
                      fontFamily: 'Geist_400Regular',
                    }}
                  >
                    {label}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
}
