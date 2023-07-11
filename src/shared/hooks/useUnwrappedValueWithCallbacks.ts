import { MutableRefObject, useEffect, useRef } from 'react';
import { useStateCompat as useState } from "../hooks/useStateCompat";
import { ValueWithCallbacks } from '../lib/Callbacks';
import { defaultEqualityFn } from './useMappedValueWithCallbacks';

const notSet = Symbol();

/**
 * Unwraps the given ValueWithCallbacks and returns the value; when the
 * value changes, a react rerender is used to update the component.
 *
 * Note that it is not a no-op to use ValueWithCallbacks and then unwrap
 * it later: this will skip the rerender on the parent component. If the
 * only component that changed is very nested, i.e., the state is highly
 * lifted, this is a tremendous performance win with almost no mental
 * overhead.
 *
 * @param original The value to unwrap
 * @param equalityFn The equality function to use to determine if the value has changed.
 *   By default this is the defaultEqualityFn for useMappedValueWithCallbacks, which is
 *   like === but always false for objects.
 * @returns The unwrapped value
 */
export const useUnwrappedValueWithCallbacks = <T>(
  original: ValueWithCallbacks<T>,
  equalityFn?: (a: T, b: T) => boolean
): T => {
  const equalityFnRef = useRef(equalityFn ?? defaultEqualityFn);
  equalityFnRef.current = equalityFn ?? defaultEqualityFn;

  const [value, setValue] = useState<T>(original.get());
  let currentValue = useRef<T>(notSet as any) as MutableRefObject<T>;
  if (currentValue.current === notSet) {
    currentValue.current = value;
  }
  

  useEffect(() => {
    let active = true;
    let settingValueTo: typeof notSet | T = notSet;
    original.callbacks.add(handleChange);
    handleChange();
    return () => {
      if (!active) {
        return;
      }
      active = false;
      settingValueTo = notSet;
      original.callbacks.remove(handleChange);
    };

    function handleChange() {
      if (!active) {
        return;
      }
      const newValue = original.get();
      if (settingValueTo !== notSet) {
        settingValueTo = newValue;
        return;
      }

      if (!equalityFnRef.current(newValue, currentValue.current)) {
        settingValueTo = newValue;
        requestAnimationFrame(() => {
          const setTo = settingValueTo;
          settingValueTo = notSet;
          if (setTo !== notSet && !equalityFnRef.current(setTo, currentValue.current)) {
            currentValue.current = setTo;
            setValue(setTo);
          }
        });
        setValue(newValue);
      }
    }
  }, [original]);

  return value;
};
