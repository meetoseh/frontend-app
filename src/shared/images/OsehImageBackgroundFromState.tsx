import { PropsWithChildren, ReactElement, useMemo } from 'react';
import {
  ImageBackground,
  ImageSourcePropType,
  ImageStyle,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';
import { OsehImageState } from './OsehImageState';
import { base64URLToByteArray, thumbHashToDataURL } from '../lib/colorUtils';
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
  imageStyle = undefined,
}: PropsWithChildren<{
  state: OsehImageState;
  style?: StyleProp<ViewStyle> | undefined;
  imageStyle?: StyleProp<ImageStyle> | undefined;
}>): ReactElement => {
  const viewStyle = Object.assign(
    { width: state.displayWidth, height: state.displayHeight },
    style
  );

  const source = useMemo<ImageSourcePropType | null>(() => {
    if (state.localUrl) {
      return { uri: state.localUrl };
    }

    if (state.thumbhash !== null) {
      return { uri: thumbHashToDataURL(base64URLToByteArray(state.thumbhash)) };
    }

    return null;
  }, [state.localUrl, state.thumbhash]);

  return source !== null ? (
    <ImageBackground style={viewStyle} source={source} imageStyle={imageStyle}>
      {children}
    </ImageBackground>
  ) : (
    <View style={viewStyle}>{children}</View>
  );
};
