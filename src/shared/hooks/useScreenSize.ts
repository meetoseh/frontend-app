import { useEffect, useState } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

/**
 * Gets the logical screen size of the device. Note that this differs
 * from Dimensions.get("window") in that it includes the status bar height,
 * if it's translucent.
 */
export const useScreenSize = (): ScaledSize => {
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

  if (
    isNaN(screenSize.width) ||
    isNaN(screenSize.height) ||
    screenSize.width <= 0 ||
    screenSize.height <= 0
  ) {
    console.log('invalid screenSize:', screenSize);
  }

  return screenSize;
};
