import { PropsWithChildren } from 'react';
import {
  LayoutChangeEvent,
  ScrollView,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';
import { useWindowSize } from '../hooks/useWindowSize';
import { useIsEffectivelyTinyScreen } from '../hooks/useIsEffectivelyTinyScreen';

/**
 * Shows a regular view if no accessibility scaling is detected, and a ScrollView
 * otherwise. This is useful for views which are designed to fit within a typical
 * screen but won't fit if the user has accessibility scaling enabled.
 */
export const FullscreenView = ({
  style,
  alwaysScroll,
  heightScale,
  children,
  onLayout,
}: PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  /**
   * If specified and true, a scroll view is used even if the screen is not
   * affected by accessibility settings. This should generally be set to true if
   * the screen is smaller than the smallest tested (e.g., if you've tested that
   * it fits on a 360x640 screen, but not smaller, set this to true when either
   * the width is less than 360 or the height less than 640). Particularly important
   * if the screen is tight.
   */
  alwaysScroll?: boolean;
  /**
   * If specified, if we do not switch to a scroll view then the applied height
   * of the view is scaled by this factor. Useful for modals.
   */
  heightScale?: number;

  /**
   * Layout event handler for the rendered container
   */
  onLayout?: (e: LayoutChangeEvent) => void;
}>) => {
  const isTinyScreen = useIsEffectivelyTinyScreen();
  const windowSize = useWindowSize();

  if (!isTinyScreen && !alwaysScroll) {
    return (
      <View
        style={Object.assign({}, style, {
          width: windowSize.width,
          height: windowSize.height * (heightScale ?? 1),
        })}
        onLayout={onLayout}
      >
        {children}
      </View>
    );
  }

  return (
    <ScrollView
      style={{ width: windowSize.width, height: windowSize.height }}
      contentContainerStyle={Object.assign({}, style, {
        width: windowSize.width,
        height: undefined,
        maxHeight: undefined,
        minHeight: windowSize.height,
      })}
      onLayout={onLayout}
    >
      {children}
    </ScrollView>
  );
};
