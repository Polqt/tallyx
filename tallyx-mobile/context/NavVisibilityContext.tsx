import { createContext, useContext, useRef, useCallback } from 'react';
import { Animated } from 'react-native';

interface NavVisibilityContextValue {
  navOpacity: Animated.Value;
  hideNav: () => void;
  showNav: () => void;
}

const NavVisibilityContext = createContext<NavVisibilityContextValue | null>(null);

export function NavVisibilityProvider({ children }: { children: React.ReactNode }) {
  const navOpacity = useRef(new Animated.Value(1)).current;

  const hideNav = useCallback(() => {
    Animated.timing(navOpacity, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [navOpacity]);

  const showNav = useCallback(() => {
    Animated.timing(navOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [navOpacity]);

  return (
    <NavVisibilityContext.Provider value={{ navOpacity, hideNav, showNav }}>
      {children}
    </NavVisibilityContext.Provider>
  );
}

export function useNavVisibility() {
  const ctx = useContext(NavVisibilityContext);
  if (!ctx) throw new Error('useNavVisibility must be used inside NavVisibilityProvider');
  return ctx;
}
