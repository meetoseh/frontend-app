import { useEffect, useMemo } from 'react';
import { useStateCompat as useState } from '../hooks/useStateCompat';
import { Dimensions, Platform, ScaledSize, StatusBar } from 'react-native';
import { getBotBarHeight } from './useBotBarHeight';
import Constants from 'expo-constants';

/**
 * Determines the amount of unusable space at the top of the screen, which we
 * may be able to put stuff behind but on top of it will be the translucent
 * status bar on android.
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
export const useTopBarHeight = (): number => {
  const [sizes, setSizes] = useState<{
    screen: ScaledSize;
    window: ScaledSize;
  }>({
    screen: Dimensions.get('screen'),
    window: Dimensions.get('window'),
  });

  useEffect(() => {
    const onSizesChange = ({
      window,
      screen,
    }: {
      window: ScaledSize;
      screen: ScaledSize;
    }) => {
      setSizes({ window, screen });
    };

    const subscription = Dimensions.addEventListener('change', onSizesChange);

    return () => {
      subscription.remove();
    };
  }, []);

  return useMemo(
    () =>
      StatusBar.currentHeight ??
      Platform.select({
        ios: Constants.statusBarHeight,
        default: Math.max(
          sizes.screen.height - sizes.window.height - getBotBarHeight(),
          0
        ),
      }),
    [sizes]
  );
};

/**
 * Same calculation as useTopBarHeight, but as a function instead of a hook.
 */
export const getTopBarHeight = (): number =>
  StatusBar.currentHeight ??
  Platform.select({
    ios: Constants.statusBarHeight,
    default: Math.max(
      Dimensions.get('screen').height -
        Dimensions.get('window').height -
        getBotBarHeight(),
      0
    ),
  });
