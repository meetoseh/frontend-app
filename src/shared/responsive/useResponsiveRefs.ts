import { LayoutChangeEvent, View } from 'react-native';
import {
  WritableValueWithCallbacks,
  createWritableValueWithCallbacks,
} from '../lib/Callbacks';
import { MutableRefObject, useCallback, useRef } from 'react';
import { setVWC } from '../lib/setVWC';

/**
 * Describes a reference to a view so that it can be used for useMinHeights.
 *
 * On the web this is relatively straightforward, but in native we need to
 * handle the oddities of measure(), onLayout(), and collapsable, and the
 * differences between ios/android. Notably, measure() doesn't work unless
 * onLayout is set.
 */
export type ResponsiveRef = {
  /**
   * The actual view, or null if unmounted
   */
  ref: WritableValueWithCallbacks<View | null>;

  /**
   * The size of this element the last time it was mounted, if it has
   * ever been mounted, otherwise null
   */
  size: WritableValueWithCallbacks<{ width: number; height: number } | null>;
};

export type ResponsiveRefs<K extends string> = { [key in K]: ResponsiveRef };

/**
 * Initializes responsive refs using the given keys. The keys are assumed
 * to never change.
 */
export const useResponsiveRefs = <K extends string>(
  keys: K[]
): ResponsiveRefs<K> => {
  const resultRef = useRef<ResponsiveRefs<K>>(null) as MutableRefObject<
    ResponsiveRefs<K>
  >;
  if (resultRef.current === null) {
    resultRef.current = {} as ResponsiveRefs<K>;
    for (const key of keys) {
      resultRef.current[key] = {
        ref: createWritableValueWithCallbacks<View | null>(null),
        size: createWritableValueWithCallbacks<{
          width: number;
          height: number;
        } | null>(null),
      };
    }
  }

  return resultRef.current;
};

/**
 * Creates the appropriate onLayout handler for the given key
 * in the given responsive refs. onLayout must always be set
 * for measure() to work on android.
 */
export const useOnLayout = <K extends string>(
  key: K,
  refs: ResponsiveRefs<K>
): ((event: LayoutChangeEvent) => void) => {
  return useCallback(
    (event: LayoutChangeEvent) => {
      const width = event?.nativeEvent?.layout?.width;
      const height = event?.nativeEvent?.layout?.height;
      if (width !== undefined && height !== undefined) {
        setVWC(
          refs[key].size,
          { width, height },
          (a, b) =>
            a === b ||
            (a !== null &&
              b !== null &&
              a.width === b.width &&
              a.height === b.height)
        );
      }
    },
    [key, refs]
  );
};
