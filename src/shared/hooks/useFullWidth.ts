import { useMemo } from 'react';
import { StyleProp, ViewStyle } from 'react-native';

/**
 * A convenience hook for setting the width of a style to the width of the screen.
 *
 * @param style The style to modify
 * @param screenSize The size of the screen
 * @returns The modified style
 */
export const useFullWidth = (
  style: StyleProp<ViewStyle>,
  screenSize: { width: number }
): StyleProp<ViewStyle> => {
  return useMemo(
    () => Object.assign({}, style, { width: screenSize.width }),
    [style, screenSize.width]
  );
};
