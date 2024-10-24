import { ReactElement, useEffect, useMemo } from 'react';
import { PIAnimation, PIAnimationKeyPoint } from '../models/PIAnimation';
import {
  createWritableValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../../../../../shared/lib/Callbacks';
import { Image, ImageStyle } from 'react-native';
import { setVWC } from '../../../../../shared/lib/setVWC';
import {
  Bezier,
  ease,
  easeIn,
  easeInBack,
  easeInOut,
  easeInOutBack,
  easeOut,
  easeOutBack,
} from '../../../../../shared/lib/Bezier';
import { useMappedValueWithCallbacks } from '../../../../../shared/hooks/useMappedValueWithCallbacks';
import { useValuesWithCallbacksEffect } from '../../../../../shared/hooks/useValuesWithCallbacksEffect';

/**
 * Uses position: absolute to render within a box of the given
 * size an image animating according to the given animation.
 *
 * This doesn't generally start at the beginning of the animation;
 * to keep things easily synced, this maps the start of the animation
 * loop to performance.now() === 0
 */
export const PIAnimatedImage = ({
  src,
  width,
  height,
  boxWidth,
  boxHeight,
  animation,
  precomputed,
}: {
  src: string;
  width: number;
  height: number;
  boxWidth: number;
  boxHeight: number;
  animation: PIAnimation;
  precomputed: Map<string, Bezier>;
}): ReactElement => {
  const sourceMemo = useMemo(
    () => ({
      uri: src,
      width: width,
      height: height,
    }),
    [src, width, height]
  );

  const stateVWC = useWritableValueWithCallbacks<PIAnimationKeyPoint>(
    () => animation.start
  );

  const easesByIndex = useMemo(() => {
    const liveComputersById = new Map<string, Bezier>();
    const result: ((progress: number) => number)[] = [];
    for (let i = 0; i < animation.parts.length; i++) {
      const piEase = animation.parts[i].ease;
      if (piEase.type === 'standard') {
        if (piEase.id === 'ease') {
          result.push((progress) => ease.y_x(progress));
        } else if (piEase.id === 'ease-in') {
          result.push((progress) => easeIn.y_x(progress));
        } else if (piEase.id === 'ease-in-out') {
          result.push((progress) => easeInOut.y_x(progress));
        } else if (piEase.id === 'ease-in-back') {
          result.push((progress) => easeInBack.y_x(progress));
        } else if (piEase.id === 'ease-in-out-back') {
          result.push((progress) => easeInOutBack.y_x(progress));
        } else if (piEase.id === 'ease-out') {
          result.push((progress) => easeOut.y_x(progress));
        } else if (piEase.id === 'ease-out-back') {
          result.push((progress) => easeOutBack.y_x(progress));
        } else if (piEase.id === 'linear') {
          result.push((progress) => progress);
        } else {
          ((v: never) => console.warn('unknown standard ease:', v))(piEase.id);
          result.push((progress) => progress);
        }
      } else if (piEase.type === 'custom-cubic-bezier') {
        const key = [piEase.x1, piEase.x2, piEase.x3, piEase.x4]
          .map((v) => v.toFixed(3))
          .join(',');
        const bezier = precomputed.get(key);
        if (bezier === undefined) {
          if (piEase.precompute) {
            // not available and live computation disallowed, fallback to linear
            result.push((progress) => progress);
          } else {
            let custom = liveComputersById.get(key);
            if (custom === undefined) {
              custom = new Bezier([
                [0, 0],
                [piEase.x1, piEase.x2],
                [piEase.x3, piEase.x4],
                [1, 1],
              ]);
              liveComputersById.set(key, custom);
            }
            result.push((progress) => custom.y_x(progress));
          }
        } else {
          result.push((progress) => bezier.y_x(progress));
        }
      } else {
        ((v: never) => console.warn('unknown ease type:', v))(piEase);
        result.push((progress) => progress);
      }
    }
    return result;
  }, [animation, precomputed]);

  useEffect(() => {
    const active = createWritableValueWithCallbacks(true);
    const loopTimeMS = computeLoopTimeMS();
    let ticker: number | null = null;

    let loopStartedAtMS =
      Math.floor(performance.now() / loopTimeMS) * loopTimeMS;

    let activeIndices: number[] = []; // asc order by end time
    let nextUnstartedIndex = 0; // in sortedIndicesByAscDelay

    const sortedIndicesByAscDelay = (() => {
      const res = animation.parts.map((_, i) => i);
      res.sort((a, b) => animation.parts[a].delay - animation.parts[b].delay);
      return res;
    })();

    tick();
    return () => {
      setVWC(active, false);
      if (ticker !== null) {
        cancelAnimationFrame(ticker);
        ticker = null;
      }
    };

    function tick() {
      ticker = null;

      // prep
      const nowMS = performance.now();
      const newState = { ...stateVWC.get() };
      if (!active.get()) {
        return;
      }

      // determine animation time (t) relative to the last loop start
      let tMS = nowMS - loopStartedAtMS;
      if (tMS > loopTimeMS) {
        const loops = Math.floor(tMS / loopTimeMS);
        loopStartedAtMS += loops * loopTimeMS;
        tMS -= loops * loopTimeMS;
        activeIndices = [];
        nextUnstartedIndex = 0;
      }

      // fill parts that have started

      while (nextUnstartedIndex < animation.parts.length) {
        const idx = sortedIndicesByAscDelay[nextUnstartedIndex];
        const part = animation.parts[idx];
        if (part.delay * 1000 > tMS) {
          break;
        }

        nextUnstartedIndex++;
        if (activeIndices.length === 0) {
          activeIndices.push(idx);
          continue;
        }

        // typical case optimization (tail insert)
        {
          const tailPart =
            animation.parts[activeIndices[activeIndices.length - 1]];
          if (
            part.delay + part.duration >=
            tailPart.delay + tailPart.duration
          ) {
            activeIndices.push(idx);
            continue;
          }
        }

        // binary insert on end time
        {
          let lo = 0;
          let hi = activeIndices.length;
          while (lo < hi) {
            const mid = (lo + hi) >> 1;
            const midPart = animation.parts[activeIndices[mid]];
            if (part.delay + part.duration < midPart.delay + midPart.duration) {
              hi = mid;
            } else {
              lo = mid + 1;
            }
          }
          activeIndices.splice(lo, 0, idx);
        }
      }

      // remove parts that have ended
      // WARN: can't be moved before adding without some check for started and also ended
      while (activeIndices.length > 0) {
        const part = animation.parts[activeIndices[0]];
        const endAt = part.delay + part.duration;
        if (tMS < endAt * 1000) {
          break;
        }
        newState[part.param] = part.final;
        activeIndices.shift();
      }

      // apply active parts
      const tSeconds = tMS / 1000;
      for (let i = 0; i < activeIndices.length; i++) {
        const part = animation.parts[activeIndices[i]];
        const partProgress = Math.max(
          Math.min((tSeconds - part.delay) / part.duration, 1),
          0
        );
        const partValue =
          part.initial +
          (part.final - part.initial) *
            easesByIndex[activeIndices[i]](partProgress);
        newState[part.param] = partValue;
      }

      // update state
      stateVWC.set(newState);
      stateVWC.callbacks.call(undefined);

      // request next tick
      ticker = requestAnimationFrame(tick);
    }

    function computeLoopTimeMS(): number {
      let result = 0;
      for (let i = 0; i < animation.parts.length; i++) {
        const part = animation.parts[i];
        const endAt = part.delay + part.duration;
        if (endAt > result) {
          result = endAt;
        }
      }
      return result * 1000;
    }
  }, [animation.parts, easesByIndex, stateVWC]);

  const imageRefVWC = useWritableValueWithCallbacks<Image | null>(() => null);
  const imageStyleVWC = useMappedValueWithCallbacks(
    stateVWC,
    (s): ImageStyle => ({
      position: 'absolute',
      left: s.x * boxWidth - width / 2,
      top: s.y * boxHeight - height / 2,
      width: width,
      height: height,
      transform: [{ rotate: `${s.rotation}rad` }, { scale: s.scale }],
    })
  );
  useValuesWithCallbacksEffect([imageRefVWC, imageStyleVWC], () => {
    const ele = imageRefVWC.get();
    const s = imageStyleVWC.get();
    if (ele !== null) {
      ele.setNativeProps({ style: s });
    }
    return undefined;
  });

  return (
    <Image
      source={sourceMemo}
      style={imageStyleVWC.get()}
      ref={(r) => setVWC(imageRefVWC, r)}
    />
  );
};
