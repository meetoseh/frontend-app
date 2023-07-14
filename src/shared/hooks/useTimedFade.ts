import { RefObject, useEffect } from 'react';
import { BezierAnimation, animIsComplete, calculateAnimValue } from '../lib/BezierAnimation';
import { ease } from '../lib/Bezier';
import { StyleProp, View, ViewStyle } from 'react-native';

/**
 * Fades the container in immediately, then fades it out such that its completely
 * faded out by the given time. This takes over managing the style of the given
 * ref in native, so needs the base style.
 *
 * @param containerRef The container to fade in / out
 * @param until The time at which the container should be faded out
 * @param duration How long the fade in / out should take
 */
export const useTimedFade = (
  containerRef: RefObject<View | null>,
  baseStyle: StyleProp<ViewStyle>,
  until: number,
  duration: number = 350
) => {
  useEffect(() => {
    if (containerRef.current === null) {
      return;
    }

    const container = containerRef.current;

    let step: 'in' | 'out' = 'in';
    let opacityAnim: BezierAnimation = {
      from: 0,
      to: 1,
      startedAt: null,
      ease,
      duration,
    };

    let active = true;
    let timeout: NodeJS.Timeout | null = null;
    requestAnimationFrame(onFrame);
    return () => {
      active = false;
      if (timeout !== null) {
        clearTimeout(timeout);
        timeout = null;
      }
    };

    function onFrame(now: DOMHighResTimeStamp) {
      if (!active) {
        return;
      }

      if (animIsComplete(opacityAnim, now)) {
        if (step === 'in') {
          const epochNow = Date.now();
          const fadeOutAt = until - duration;
          step = 'out';
          opacityAnim = {
            from: 1,
            to: 0,
            startedAt: null,
            ease,
            duration,
          };
          if (epochNow < fadeOutAt) {
            timeout = setTimeout(() => {
              timeout = null;
              requestAnimationFrame(onFrame);
            }, fadeOutAt - epochNow);
            container.setNativeProps({
              style: Object.assign({}, baseStyle, {
                opacity: 1
              })
            });
            return;
          }
        } else {
          return;
        }
      }

      container.setNativeProps({
        style: Object.assign({}, baseStyle, {
          opacity: calculateAnimValue(opacityAnim, now)
        })
      });
      requestAnimationFrame(onFrame);
    }
  }, [containerRef, baseStyle, until, duration]);
};
