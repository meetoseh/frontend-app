import { Platform } from 'react-native';

/** The source of visitors created on this platform */
export const VISITOR_SOURCE: 'browser' | 'ios' | 'android' = Platform.select({
  ios: 'ios',
  default: 'android',
});
