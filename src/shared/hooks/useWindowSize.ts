import { useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';
import { ValueWithCallbacks, useWritableValueWithCallbacks } from '../lib/Callbacks';
import { useUnwrappedValueWithCallbacks } from './useUnwrappedValueWithCallbacks';

/**
 * Gets the logical screen size of the device. Note that this differs
 * from Dimensions.get("window") in that it includes the status bar height,
 * if it's translucent.
 *
 * This is a better analogue to the window size in the web browser than
 * Dimensions.get("window") is, and hence we use the same name for it.
 */
export const useWindowSize = (): ScaledSize => {
  return useUnwrappedValueWithCallbacks(
    useWindowSizeValueWithCallbacks()
  );
};

/**
 * The same idea as useWindowSize, except doesn't trigger react rerenders. Only
 * used when it's really important that we don't trigger even a single extra
 * react rerender on a component.
 */
export const useWindowSizeValueWithCallbacks = (): ValueWithCallbacks<ScaledSize> => {
  const screenSize = useWritableValueWithCallbacks<ScaledSize>(() => Dimensions.get('screen'));

  useEffect(() => {
    const onScreenSizeChange = ({ screen }: { window: ScaledSize; screen: ScaledSize }) => {
      screenSize.set(screen);
    };

    const subscription = Dimensions.addEventListener('change', onScreenSizeChange);

    return () => {
      subscription.remove();
    };
  }, []);

  return screenSize;
};
