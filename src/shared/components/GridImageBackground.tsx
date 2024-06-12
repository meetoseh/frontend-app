import { ReactElement } from 'react';
import { ValueWithCallbacks } from '../lib/Callbacks';
import { OsehImageExportCropped } from '../images/OsehImageExportCropped';
import { RenderGuardedComponent } from './RenderGuardedComponent';
import { GridDarkGrayBackground } from './GridDarkGrayBackground';
import { base64URLToByteArray, thumbHashToDataURL } from '../lib/colorUtils';
import { useMappedValuesWithCallbacks } from '../hooks/useMappedValuesWithCallbacks';
import { View, Image } from 'react-native';

/**
 * An element which fills the background using grid-area: 1 / 1 / -1 / -1
 * with the given image, or the gradient background if the image is null.
 */
export const GridImageBackground = ({
  image: imageVWC,
  size: sizeVWC,
  thumbhash: thumbhashVWC,
  borderRadius,
}: {
  /** The image to show, which may have a different true size, usually only for a short time */
  image: ValueWithCallbacks<OsehImageExportCropped | null>;
  /** The size of the container for the image; the image is centered in the container (hiding overflow) */
  size: ValueWithCallbacks<{ width: number; height: number }>;
  thumbhash?: ValueWithCallbacks<string | null>;
  borderRadius?: number;
}): ReactElement => {
  return (
    <RenderGuardedComponent
      props={useMappedValuesWithCallbacks([imageVWC, sizeVWC], () => ({
        image: imageVWC.get(),
        size: sizeVWC.get(),
      }))}
      component={({ image, size }) => {
        if (image === null) {
          if (thumbhashVWC === undefined) {
            return <GridDarkGrayBackground />;
          }

          return (
            <RenderGuardedComponent
              props={thumbhashVWC}
              component={(thumbhash) => {
                if (thumbhash === null) {
                  return <GridDarkGrayBackground />;
                }
                const thumbhashUrl = thumbHashToDataURL(
                  base64URLToByteArray(thumbhash)
                );
                return (
                  <WithSrc
                    src={thumbhashUrl}
                    size={size}
                    borderRadius={borderRadius}
                    imgDisplaySize={size}
                  />
                );
              }}
            />
          );
        }

        return (
          <WithSrc
            src={image.croppedUrl}
            size={size}
            borderRadius={borderRadius}
            imgDisplaySize={{
              width: image.croppedToDisplay.displayWidth,
              height: image.croppedToDisplay.displayHeight,
            }}
          />
        );
      }}
    />
  );
};

const WithSrc = ({
  src,
  size,
  imgDisplaySize,
  borderRadius,
}: {
  src: string;
  size: { width: number; height: number };
  imgDisplaySize: { width: number; height: number };
  borderRadius?: number;
}): ReactElement => {
  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: size.width,
        height: size.height,
        borderRadius,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Image
        source={{
          uri: src,
          width: imgDisplaySize.width,
          height: imgDisplaySize.height,
        }}
      />
    </View>
  );
};
