import { PropsWithChildren } from "react";
import { ScrollView, StyleProp, View, ViewStyle } from "react-native";
import { useWindowSize } from "../hooks/useWindowSize";
import { useIsEffectivelyTinyScreen } from "../hooks/useIsEffectivelyTinyScreen";

/**
 * Shows a regular view if no accessibility scaling is detected, and a ScrollView
 * otherwise. This is useful for views which are designed to fit within a typical
 * screen but won't fit if the user has accessibility scaling enabled.
 */
export const FullscreenView = ({
  style,
  children,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) => {
  const isTinyScreen = useIsEffectivelyTinyScreen();
  const windowSize = useWindowSize();

  if (!isTinyScreen) {
    return (
      <View
        style={Object.assign({}, style, {
          width: windowSize.width,
          height: windowSize.height,
        })}
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
    >
      {children}
    </ScrollView>
  );
};
