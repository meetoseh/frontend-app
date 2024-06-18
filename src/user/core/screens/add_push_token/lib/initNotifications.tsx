import {
  AndroidImportance,
  setNotificationChannelAsync,
} from 'expo-notifications';
import {
  ValueWithCallbacks,
  createWritableValueWithCallbacks,
} from '../../../../../shared/lib/Callbacks';
import { setVWC } from '../../../../../shared/lib/setVWC';
import { Platform } from 'react-native';

/**
 * Initializes notifications with a callback to cleanup. This does
 * not cause any native popups.
 */
export const initNotifications = (): (() => void) => {
  const active = createWritableValueWithCallbacks(true);

  Platform.select({
    android: () => initializeNotificationsAndroid(active),
    default: () => {},
  })();

  return () => {
    setVWC(active, false);
  };
};

async function initializeNotificationsAndroid(
  active: ValueWithCallbacks<boolean>
) {
  if (!active.get()) {
    return;
  }

  try {
    await setNotificationChannelAsync('default', {
      name: 'default',
      importance: AndroidImportance.LOW,
      vibrationPattern: [0, 250, 250, 250],
      enableVibrate: true,
      enableLights: true,
      lightColor: '#1A383C7C',
    });
    if (!active) {
      return;
    }
    await setNotificationChannelAsync('daily_reminder', {
      name: 'Daily Reminders',
      importance: AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      enableVibrate: true,
      enableLights: true,
      lightColor: '#1A383C7C',
    });
  } catch (e) {
    if (active.get()) {
      console.error(`Error initializing notifications (android): ${e}`);
    }
  }
}
