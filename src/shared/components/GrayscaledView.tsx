import { ViewStyle, Image, PixelRatio } from 'react-native';
import {
  VariableStrategyProps,
  useVariableStrategyPropsAsValueWithCallbacks,
} from '../anim/VariableStrategyProps';
import { ReactElement, useCallback } from 'react';
import {
  WritableValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../lib/Callbacks';
import ViewShot, { releaseCapture } from 'react-native-view-shot';
import { useValueWithCallbacksEffect } from '../hooks/useValueWithCallbacksEffect';
import { setVWC } from '../lib/setVWC';
import { RenderGuardedComponent } from './RenderGuardedComponent';
import { useMappedValuesWithCallbacks } from '../hooks/useMappedValuesWithCallbacks';
import { GrayscaledImage } from '../anim/GrayscaledImage';
import { adaptValueWithCallbacksAsVariableStrategyProps } from '../lib/adaptValueWithCallbacksAsVariableStrategyProps';
import { useValuesWithCallbacksEffect } from '../hooks/useValuesWithCallbacksEffect';
import * as FileSystem from 'expo-file-system';

type GrayscaledViewProps = {
  /**
   * A strength of 0 means the view looks like the original. A strength
   * of 1 means completely grayscale. Values in between are a mix of the
   * two, where colors are progressively washed out.
   */
  strength: VariableStrategyProps<number>;

  /**
   * The style to apply to the view. Changing this will require a
   * recapture of the view, so it should be memoized if possible.
   * May be left undefined to be treated as
   * `{ type: 'react-rerender', props: undefined }`
   */
  style?: VariableStrategyProps<ViewStyle | undefined>;

  /**
   * The child component to render with a grayscale filter applied.
   * This is not passed as children as every time it's changed we
   * will recapture the view, which is a rather expensive operation.
   * Hence, the caller should memoize this component.
   */
  child: VariableStrategyProps<ReactElement>;

  /**
   * If specified, we will indicate if this view is actually
   * grayscaling or not. It can be used to avoid a flash of color if
   * the view starts grayscaled, since the grayscaling only takes
   * effect after an image has been successfully captured.
   */
  ready?: WritableValueWithCallbacks<boolean>;
};

/**
 * Renders the given child component with a grayscale filter of the given
 * strength. Note that the child will be mounted, captured, and then unmounted,
 * so it should not contain e.g. press handlers or side effects. An ideal
 * situation for this would be for grayscaling an emoji rendered via a Text
 * component.
 */
export const GrayscaledView = ({
  strength: strengthVariableStrategy,
  style: styleVariableStrategy,
  child: childVariableStrategy,
  ready: readyOptWVWC,
}: GrayscaledViewProps) => {
  const strengthVWC = useVariableStrategyPropsAsValueWithCallbacks(
    strengthVariableStrategy
  );
  const styleVWC = useVariableStrategyPropsAsValueWithCallbacks(
    styleVariableStrategy ?? { type: 'react-rerender', props: undefined }
  );
  const childVWC = useVariableStrategyPropsAsValueWithCallbacks(
    childVariableStrategy
  );

  const imageWVWC = useWritableValueWithCallbacks<
    { uri: string; width: number; height: number } | undefined
  >(() => undefined);
  const viewShotWVWC = useWritableValueWithCallbacks<ViewShot | null>(
    () => null
  );

  useValueWithCallbacksEffect(
    imageWVWC,
    useCallback(
      (uri) => {
        if (readyOptWVWC !== undefined) {
          setVWC(readyOptWVWC, uri !== undefined);
        }
        return undefined;
      },
      [readyOptWVWC]
    )
  );

  useValueWithCallbacksEffect(
    viewShotWVWC,
    useCallback(
      (viewShot) => {
        if (viewShot === null || viewShot.capture === undefined) {
          return undefined;
        }

        let active = true;
        viewShot.capture().then((uri) => {
          if (!active) {
            return;
          }

          const infoPromise = FileSystem.getInfoAsync(uri);
          Image.getSize(
            uri,
            (width, height) => {
              infoPromise.then((info) => {
                if (!active) {
                  return;
                }
                setVWC(imageWVWC, { uri: info.uri, width, height });
              });
            },
            (err) => {
              console.warn('grayscaled view failed to get size: ' + err);
            }
          );
        });
        return () => {
          active = false;
        };
      },
      [imageWVWC]
    )
  );

  useValuesWithCallbacksEffect(
    [styleVWC, childVWC],
    useCallback(() => {
      const old = imageWVWC.get();
      if (old === undefined) {
        return;
      }
      imageWVWC.set(undefined);
      imageWVWC.callbacks.call(undefined);
      releaseCapture(old.uri);
      return undefined;
    }, [imageWVWC])
  );

  return (
    <RenderGuardedComponent
      props={useMappedValuesWithCallbacks(
        [imageWVWC, styleVWC, childVWC],
        () => []
      )}
      component={useCallback(() => {
        const img = imageWVWC.get();
        if (img === undefined) {
          return (
            <ViewShot
              ref={(r) => setVWC(viewShotWVWC, r)}
              style={styleVWC.get()}
            >
              {childVWC.get()}
            </ViewShot>
          );
        }

        const unitLayoutSize = PixelRatio.roundToNearestPixel(1);
        const pixelsForUnitLayoutSize =
          PixelRatio.getPixelSizeForLayoutSize(unitLayoutSize);
        const pixelsPerPoint = pixelsForUnitLayoutSize / unitLayoutSize;
        const renderedSize = {
          width: img.width / pixelsPerPoint,
          height: img.height / pixelsPerPoint,
        };

        return (
          <GrayscaledImage
            strength={adaptValueWithCallbacksAsVariableStrategyProps(
              strengthVWC
            )}
            width={renderedSize.width}
            height={renderedSize.height}
            imageUri={img.uri}
          />
        );
      }, [viewShotWVWC, strengthVWC, styleVWC, childVWC])}
    />
  );
};
