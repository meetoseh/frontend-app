import { useEffect, useState } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

/**
 * Gets the logical screen size of the device. Note that this differs
 * from Dimensions.get("window") in that it includes the status bar height,
 * if it's translucent.
 *
 * This is a better analogue to the window size in the web browser than
 * Dimensions.get("window") is, and hence we use the same name for it.
 */
export const useWindowSize = (): ScaledSize => {
  const [screenSize, setScreenSize] = useState<ScaledSize>(Dimensions.get('screen'));

  useEffect(() => {
    const onScreenSizeChange = ({ screen }: { window: ScaledSize; screen: ScaledSize }) => {
      setScreenSize(screen);
    };

    const subscription = Dimensions.addEventListener('change', onScreenSizeChange);

    return () => {
      subscription.remove();
    };
  }, []);

  return screenSize;
};
