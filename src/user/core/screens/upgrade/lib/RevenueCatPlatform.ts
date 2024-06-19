import { Platform } from 'react-native';

export const RevenueCatPlatform: string | undefined = Platform.select({
  ios: 'appstore',
  android: 'playstore',
  default: undefined,
});
