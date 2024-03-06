import { Platform } from 'react-native';

/**
 * Determines the unusable height at the bottom of the screen covered by the
 * android slider
 *
 * NOTE:
 *   It's VERY IMPORTANT for consistency that the expo status bar is always
 *   included in the react DOM. If you do not include it, then react native will render
 *   the container below the status bar. To add to the confusion, react native's
 *   onLayout events won't be accurate. You only get accurate layout events and
 *   positioning when exactly one StatusBar is included in the DOM  at the end of
 *   the top-level view.
 *
 *   If things are not laying out as you expect, this is the first thing to check.
 */
export const useBotBarHeight = () => getBotBarHeight();

/**
 * Gets the bot bar height outside of a react component
 */
export const getBotBarHeight = () =>
  Platform.select({
    android: 24,
    default: 0,
  });
