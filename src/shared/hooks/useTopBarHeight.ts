import { useEffect, useMemo } from 'react';
import { useStateCompat as useState } from '../hooks/useStateCompat';
import { Dimensions, Platform, ScaledSize, StatusBar } from 'react-native';

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

  return useMemo(() => {
    return (
      Platform.select({
        ios: () => StatusBar.currentHeight ?? 24,
        android: () => {
          const bottomNavHeight = sizes.screen.height - sizes.window.height;
          const statusHeight = StatusBar.currentHeight ?? 0;
          if (bottomNavHeight > statusHeight) {
            return bottomNavHeight - statusHeight;
          } else {
            console.log(
              'android fallback instead of returning',
              bottomNavHeight,
              '-',
              statusHeight
            );
            return 24;
          }
        },
      })?.() ?? 24
    );
  }, [sizes]);
};
