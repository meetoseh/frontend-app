import { ReactElement, useMemo } from 'react';
import {
  ValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../lib/Callbacks';
import { OsehImageExportCropped } from '../images/OsehImageExportCropped';
import { RenderGuardedComponent } from './RenderGuardedComponent';
import { GridDarkGrayBackground } from './GridDarkGrayBackground';
import {
  base64URLToByteArray,
  computeAverageRGBAUsingThumbhash,
  thumbHashToDataURL,
} from '../lib/colorUtils';
import { useMappedValuesWithCallbacks } from '../hooks/useMappedValuesWithCallbacks';
import { View, Image } from 'react-native';
import { setVWC } from '../lib/setVWC';

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
  borderRadius?:
    | number
    | {
        topLeft: number;
        topRight: number;
        bottomRight: number;
        bottomLeft: number;
      };
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
                const byteArray = base64URLToByteArray(thumbhash);
                const thumbhashUrl = thumbHashToDataURL(byteArray);
                const averageColor =
                  computeAverageRGBAUsingThumbhash(byteArray);
                return (
                  <GridImageWithSrc
                    src={thumbhashUrl}
                    size={size}
                    borderRadius={borderRadius}
                    imgDisplaySize={size}
                    averageColor={`rgb(${averageColor.slice(0, 3).join(',')})`}
                  />
                );
              }}
            />
          );
        }

        if (thumbhashVWC !== undefined) {
          return (
            <RenderGuardedComponent
              props={thumbhashVWC}
              component={(thumbhash) => {
                const averageColorRGBA =
                  thumbhash === null
                    ? [0, 0, 0, 1]
                    : computeAverageRGBAUsingThumbhash(
                        base64URLToByteArray(thumbhash)
                      );
                return (
                  <GridImageWithSrc
                    src={image.croppedUrl}
                    size={size}
                    borderRadius={borderRadius}
                    imgDisplaySize={{
                      width: image.croppedToDisplay.displayWidth,
                      height: image.croppedToDisplay.displayHeight,
                    }}
                    averageColor={`rgb(${averageColorRGBA
                      .slice(0, 3)
                      .join(',')})`}
                  />
                );
              }}
            />
          );
        }

        return (
          <GridImageWithSrc
            src={image.croppedUrl}
            size={size}
            borderRadius={borderRadius}
            imgDisplaySize={{
              width: image.croppedToDisplay.displayWidth,
              height: image.croppedToDisplay.displayHeight,
            }}
            averageColor="black"
          />
        );
      }}
    />
  );
};

/**
 * Displays the image with the given src in a container of the given size,
 * cutting off the image if it is larger than the container. The image itself
 * is rendered at the given display size.
 */
export const GridImageWithSrc = ({
  src,
  size,
  imgDisplaySize,
  borderRadius,
  averageColor,
}: {
  src: string;
  size: { width: number; height: number };
  imgDisplaySize: { width: number; height: number };
  borderRadius?:
    | number
    | {
        topLeft: number;
        topRight: number;
        bottomRight: number;
        bottomLeft: number;
      };
  averageColor: string;
}): ReactElement => {
  const sourceMemo = useMemo(
    () => ({
      uri: src,
      width: imgDisplaySize.width,
      height: imgDisplaySize.height,
    }),
    [src, imgDisplaySize.width, imgDisplaySize.height]
  );

  const loadingVWC = useWritableValueWithCallbacks(() => true);

  const borderRadiusStyle = useMemo(() => {
    if (borderRadius === undefined) {
      return {};
    }
    if (typeof borderRadius === 'number') {
      return { borderRadius };
    }
    return {
      borderTopLeftRadius: borderRadius.topLeft,
      borderTopRightRadius: borderRadius.topRight,
      borderBottomRightRadius: borderRadius.bottomRight,
      borderBottomLeftRadius: borderRadius.bottomLeft,
    };
  }, [borderRadius]);

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: size.width,
        height: size.height,
        ...borderRadiusStyle,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: averageColor,
      }}
    >
      <Image
        source={sourceMemo}
        onLoadStart={() => setVWC(loadingVWC, true)}
        onLoadEnd={() => setVWC(loadingVWC, false)}
      />
      <RenderGuardedComponent
        props={loadingVWC}
        component={(loading) => {
          if (!loading) {
            return <></>;
          }
          return (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: size.width,
                height: size.height,
                backgroundColor: averageColor,
              }}
            />
          );
        }}
      />
    </View>
  );
};
