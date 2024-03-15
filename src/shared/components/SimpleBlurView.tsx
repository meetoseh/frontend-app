import { BlurView, BlurViewProps } from 'expo-blur';
import { PropsWithChildren, useEffect } from 'react';
import {
  ValueWithCallbacks,
  WritableValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../lib/Callbacks';
import { Platform, View, Image } from 'react-native';
import { useValueWithCallbacksEffect } from '../hooks/useValueWithCallbacksEffect';
import { setVWC } from '../lib/setVWC';
import { RenderGuardedComponent } from './RenderGuardedComponent';
import ViewShot from 'react-native-view-shot';
import { useValuesWithCallbacksEffect } from '../hooks/useValuesWithCallbacksEffect';
import { useTimedValueWithCallbacks } from '../hooks/useTimedValue';
import { useMappedValuesWithCallbacks } from '../hooks/useMappedValuesWithCallbacks';

export type SimpleBlurViewProps = BlurViewProps & {
  captureAllowed?: ValueWithCallbacks<boolean>;
  captured?: WritableValueWithCallbacks<boolean>;
};

export const SimpleBlurView = ({
  children,
  captureAllowed,
  captured,
  ...rest
}: PropsWithChildren<SimpleBlurViewProps>) => {
  return Platform.select({
    android: (
      <AndroidCompatBlurView {...rest}>{children}</AndroidCompatBlurView>
    ),
    default: (
      <DefaultCompatBlurView {...rest}>{children}</DefaultCompatBlurView>
    ),
  });
};
/**
 * The android blur view thats available right now will blur the foreground. To
 * prevent this, this component will draw a standard view, then take the size of
 * the view, replace it with a blank blurview that has the correct size, snapshot,
 * then replace the blank blurview with a regular view with a background that is
 * the snapshot and the foreground is the children.
 */
const AndroidCompatBlurView = ({
  children,
  captureAllowed: captureAllowedRaw,
  captured: capturedRaw,
  ...rest
}: PropsWithChildren<SimpleBlurViewProps>) => {
  // could also test to see what happens if we pop the children in with a delay?
  const sizeVWC = useWritableValueWithCallbacks<{
    width: number;
    height: number;
  } | null>(() => null);
  const defaultAllowingCapturesVWC = useTimedValueWithCallbacks(
    false,
    true,
    500
  );
  const delayingPopinVWC = useWritableValueWithCallbacks<boolean>(() => true);
  const captureVWC = useWritableValueWithCallbacks<string | null>(() => null);

  const allowingCapturesVWC = captureAllowedRaw ?? defaultAllowingCapturesVWC;
  useValueWithCallbacksEffect(allowingCapturesVWC, (allowing) => {
    if (!allowing) {
      setVWC(delayingPopinVWC, true);
      setVWC(captureVWC, null);
    }
    return undefined;
  });
  useValueWithCallbacksEffect(captureVWC, () => {
    if (capturedRaw !== undefined) {
      setVWC(capturedRaw, captureVWC.get() !== null);
    }
    return undefined;
  });

  useValuesWithCallbacksEffect([sizeVWC, captureVWC], () => {
    const size = sizeVWC.get();
    const capture = captureVWC.get();
    if (size === null || !delayingPopinVWC.get() || capture === null) {
      return;
    }
    let active = true;
    requestAnimationFrame(() => {
      if (!active) {
        return;
      }
      setVWC(delayingPopinVWC, false);
    });
    return () => {
      active = false;
    };
  });

  return (
    <RenderGuardedComponent
      props={useMappedValuesWithCallbacks(
        [sizeVWC, allowingCapturesVWC],
        () => ({
          size: sizeVWC.get(),
          allowingCaptures: allowingCapturesVWC.get(),
        })
      )}
      component={({ size, allowingCaptures }) => {
        if (size === null || !allowingCaptures) {
          return (
            <View
              style={Object.assign({}, rest.style, { opacity: 0 })}
              onLayout={(e) => {
                if (
                  e.nativeEvent?.layout?.width === undefined ||
                  e.nativeEvent?.layout?.height === undefined
                ) {
                  return;
                }
                setVWC(sizeVWC, {
                  width: e.nativeEvent.layout.width,
                  height: e.nativeEvent.layout.height,
                });
              }}
            >
              {children}
            </View>
          );
        }
        return (
          <RenderGuardedComponent
            props={delayingPopinVWC}
            component={(delayingPopin) => {
              if (delayingPopin) {
                const style = Object.assign({}, rest.style, {
                  width: size.width,
                  height: size.height,
                });
                return (
                  <ViewShot
                    onCapture={(capture) => {
                      setVWC(captureVWC, capture);
                    }}
                    captureMode="mount"
                  >
                    <BlurView {...rest} style={style} />
                  </ViewShot>
                );
              }

              const currentCapture = captureVWC.get();
              return (
                <View
                  style={Object.assign({}, rest.style, {
                    position: 'relative',
                  })}
                  onLayout={(e) => {
                    if (
                      e.nativeEvent?.layout?.width === undefined ||
                      e.nativeEvent?.layout?.height === undefined
                    ) {
                      return;
                    }

                    if (
                      Math.abs(size.width - e.nativeEvent.layout.width) > 1 ||
                      Math.abs(size.height - e.nativeEvent.layout.height) > 1
                    ) {
                      setVWC(sizeVWC, {
                        width: e.nativeEvent.layout.width,
                        height: e.nativeEvent.layout.height,
                      });
                      setVWC(delayingPopinVWC, true);
                      setVWC(captureVWC, null);
                    }
                  }}
                >
                  {currentCapture !== null && (
                    <View
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                      }}
                    >
                      <Image
                        source={{ uri: currentCapture }}
                        style={{ width: size.width, height: size.height }}
                      />
                    </View>
                  )}
                  {children}
                </View>
              );
            }}
          />
        );
      }}
    />
  );
};

const DefaultCompatBlurView = ({
  children,
  captureAllowed: captureAllowedRaw,
  captured: capturedRaw,
  ...rest
}: PropsWithChildren<SimpleBlurViewProps>) => {
  useEffect(() => {
    if (capturedRaw === undefined) {
      return;
    }
    if (captureAllowedRaw === undefined) {
      setVWC(capturedRaw, true);
      return;
    }
    const captured = capturedRaw;
    const captureAllowed = captureAllowedRaw;
    captureAllowed.callbacks.add(handle);
    handle();
    return () => {
      captureAllowed.callbacks.remove(handle);
    };

    function handle() {
      setVWC(captured, captureAllowed.get());
    }
  }, [captureAllowedRaw, capturedRaw]);
  return <BlurView {...rest}>{children}</BlurView>;
};