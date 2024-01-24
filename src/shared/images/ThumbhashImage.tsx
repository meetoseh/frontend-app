import { base64URLToByteArray, thumbHashToDataURL } from '../lib/colorUtils';
import { ReactElement, useMemo } from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

export type ThumbhashImageProps = {
  /** The thumbhash, base64url encoded */
  thumbhash: string;
  /** The width to render the image at */
  width: number;
  /** The height to render the image at */
  height: number;
  /**
   * Additional styles to apply to the image. Should not include a width
   * or height, as these are set by the image state.
   */
  style?: StyleProp<ImageStyle>;
};

export const ThumbhashImage = ({
  thumbhash,
  width,
  height,
  style,
}: ThumbhashImageProps): ReactElement => {
  const dataUrl = useMemo(
    () => ({ uri: thumbHashToDataURL(base64URLToByteArray(thumbhash)) }),
    [thumbhash]
  );
  const fullStyle = useMemo(() => {
    return Object.assign({}, { width, height }, style);
  }, [width, height, style]);

  return <Image source={dataUrl} style={fullStyle} />;
};
