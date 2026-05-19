import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated } from 'react-native';

interface NavVisibilityContextValue {
  navOpacity: Animated.Value;
  navInteractive: boolean;
  hideNav: () => void;
  showNav: () => void;
}

const NavVisibilityContext = createContext<NavVisibilityContextValue | null>(null);

export function NavVisibilityProvider({ children }: { children: React.ReactNode }) {
  const navOpacity = useRef(new Animated.Value(1)).current;
  const [navInteractive, setNavInteractive] = useState(true);

  const hideNav = useCallback(() => {
    setNavInteractive(false);
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
    }).start(() => setNavInteractive(true));
  }, [navOpacity]);

  return (
    <NavVisibilityContext.Provider value={{ navOpacity, navInteractive, hideNav, showNav }}>
      {children}
    </NavVisibilityContext.Provider>
  );
}

export function useNavVisibility() {
  const ctx = useContext(NavVisibilityContext);
  if (!ctx) throw new Error('useNavVisibility must be used inside NavVisibilityProvider');
  return ctx;
}
