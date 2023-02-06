import { PropsWithChildren, ReactElement } from 'react';
import { ImageBackground, StyleProp, View, ViewStyle } from 'react-native';
import { OsehImageState } from '../hooks/useOsehImage';

/**
 * Uses the standard rendering for the given oseh image state, using a placeholder
 * before the image is available. Accepts children which are rendered on top of
 * the image.
 *
 * If a style is specified, it should not include the width and height, as those
 * are set by the state. However, if it does, it will override the state's values.
 *
 * @param state The state to render
 */
export const OsehImageBackgroundFromState = ({
  children,
  state,
  style = undefined,
}: PropsWithChildren<{
  state: OsehImageState;
  style?: StyleProp<ViewStyle> | undefined;
}>): ReactElement => {
  const viewStyle = Object.assign(
    { width: state.displayWidth, height: state.displayHeight },
    style
  );
  return state.localUrl ? (
    <ImageBackground style={viewStyle} source={{ uri: state.localUrl }}>
      {children}
    </ImageBackground>
  ) : (
    <View style={viewStyle}>{children}</View>
  );
};
