import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useNavVisibility } from '@/context/NavVisibilityContext';

export function useHideTabBarOnFocus() {
  const { hideNav, showNav } = useNavVisibility();

  useFocusEffect(
    useCallback(() => {
      hideNav();
      return () => showNav();
    }, [hideNav, showNav])
  );
}
