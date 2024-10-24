import { AppState, AppStateStatus } from 'react-native';
import { ScreenContext } from '../../../hooks/useScreenContext';
import { dismissAllNotificationsAsync } from 'expo-notifications';

/**
 * Clears any push notifications while the app is in the foreground.
 * Returns a cleanup function. This is currently used as the body of
 * an effect in App.tsx
 */
export const keepRemindersCleared = (_ctx: ScreenContext): (() => void) => {
  const subscription = AppState.addEventListener('change', listener);
  listener(AppState.currentState);
  return () => {
    subscription.remove();
  };

  function listener(nextAppState: AppStateStatus) {
    if (nextAppState === 'active') {
      dismissAllNotificationsAsync();
    }
  }
};
