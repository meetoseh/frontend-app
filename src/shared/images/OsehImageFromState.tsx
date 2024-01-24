import { ReactElement, useMemo } from 'react';
import {
  Image,
  ImageSourcePropType,
  ImageStyle,
  StyleProp,
  View,
  ViewProps,
} from 'react-native';
import { OsehImageState } from './OsehImageState';
import { base64URLToByteArray, thumbHashToDataURL } from '../lib/colorUtils';

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

  /**
   * Can be used to prevent the image from being interacted with.
   */
  pointerEvents?: ViewProps['pointerEvents'];
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
  pointerEvents,
}: OsehImageStateFromStateProps): ReactElement => {
  const fullStyle = useMemo(() => {
    return Object.assign(
      {},
      { width: state.displayWidth, height: state.displayHeight },
      style
    );
  }, [state.displayHeight, state.displayWidth, style]);

  const source = useMemo<ImageSourcePropType | null>(() => {
    if (state.localUrl) {
      return { uri: state.localUrl };
    }

    if (state.thumbhash !== null) {
      return { uri: thumbHashToDataURL(base64URLToByteArray(state.thumbhash)) };
    }

    return null;
  }, [state.localUrl, state.thumbhash]);

  return source ? (
    pointerEvents === undefined ? (
      <Image style={fullStyle} source={source} />
    ) : (
      <View pointerEvents={pointerEvents}>
        <Image style={fullStyle} source={source} />
      </View>
    )
  ) : (
    <View style={fullStyle} pointerEvents={pointerEvents} />
  );
};
