import { ReactElement, useMemo } from 'react';
import { Image, ImageSourcePropType, ImageStyle, StyleProp, View } from 'react-native';
import { OsehImageState } from '../hooks/useOsehImage';

type OsehImageStateFromStateProps = {
  /**
   * The image to render
   */
  state: OsehImageState;

  /**
   * Additional styles to apply to the image. Should not include a width
   * or height, as these are set by the image state.
   */
  style?: StyleProp<ImageStyle>;
};
/**
 * Uses the standard rendering for the given oseh image state, using a placeholder
 * before the image is available.
 *
 * @param state The state to render
 */
export const OsehImageFromState = ({
  state,
  style,
}: OsehImageStateFromStateProps): ReactElement => {
  const fullStyle = useMemo(() => {
    return Object.assign({}, { width: state.displayWidth, height: state.displayHeight }, style);
  }, [state.displayHeight, state.displayWidth, style]);

  const source = useMemo<ImageSourcePropType | null>(() => {
    if (state.localUrl) {
      return { uri: state.localUrl };
    }

    return null;
  }, [state.localUrl]);

  return source ? <Image style={fullStyle} source={source} /> : <View style={fullStyle} />;
};
