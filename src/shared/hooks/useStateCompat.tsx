import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const notSet = Symbol();

type UseStateCompatSettings<T> = {
  /**
   * True to log every call to the console, false for normal behavior
   */
  debug: boolean;
  /**
   * The identifier to use when logging
   */
  debugId: string;

  /**
   * Converts the given value to the string format to print
   * @param v the value
   * @returns the string format
   */
  toRepr: (v: T) => string;
};

/**
 * React and react-native differ on how useState is implemented. In react,
 * useState always defers (and potentially batches), whereas in react-native,
 * useState will synchronously update the state.
 *
 * This is a very important distinction: react native can exceed depth limits
 * as well as cause callback loops that wouldn't occur in react.
 *
 * This hook should always be used in place of useState to get the same behavior:
 * setState is always on a fresh stack.
 */
export function useStateCompat<T>(
  initial: T | (() => T),
  settings?: UseStateCompatSettings<T>
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(initial);
  const stateRef = useRef(state);
  stateRef.current = state;
  const settingTo = useRef<typeof notSet | T>(notSet);

  const myId = useRef(Math.random().toString(36).substring(7));
  const memodSettings = useMemo<UseStateCompatSettings<T> | undefined>(() => {
    if (settings?.debug === undefined) {
      return undefined;
    }

    return {
      debug: settings.debug,
      debugId: settings.debugId,
      toRepr: settings.toRepr,
    };
  }, [settings?.debug, settings?.debugId, settings?.toRepr]);

  const mounted = useRef(false);
  useEffect(() => {
    if (memodSettings?.debug) {
      console.log(
        `useStateCompat (${myId.current}): ${
          memodSettings.debugId
        } mounted (initial value: ${memodSettings.toRepr(state)})`
      );
    }
    mounted.current = true;
    return () => {
      if (memodSettings?.debug) {
        console.log(
          `useStateCompat (${myId.current}): ${memodSettings.debugId} unmounted`
        );
      }
      mounted.current = false;
    };
  }, [memodSettings]);

  const fixedSetState = useCallback<Dispatch<SetStateAction<T>>>(
    (v) => {
      const val: T =
        typeof v === "function"
          ? (v as (old: T) => T)(
              settingTo.current !== notSet
                ? settingTo.current
                : stateRef.current
            )
          : v;

      if (settingTo.current !== notSet) {
        if (memodSettings?.debug) {
          console.log(
            `useStateCompat (${myId.current}): ${
              memodSettings.debugId
            } set to ${memodSettings.toRepr(val)}: replaced queued call`
          );
        }
        settingTo.current = val;
        return;
      }
      if (memodSettings?.debug) {
        console.log(
          `useStateCompat (${myId.current}): ${
            memodSettings.debugId
          } set to ${memodSettings.toRepr(val)}: queued`
        );
      }
      settingTo.current = val;
      setTimeout(() => {
        if (!mounted) {
          if (memodSettings?.debug) {
            console.log(
              `useStateCompat (${myId.current}): ${memodSettings.debugId} skipped queued state; not mounted`
            );
          }
          return;
        }

        const nowSettingTo = settingTo.current;
        if (nowSettingTo === notSet) {
          if (memodSettings?.debug) {
            console.log(
              `useStateCompat (${myId.current}): ${memodSettings.debugId} skipped queued state; impossible`
            );
          }
          return;
        }
        settingTo.current = notSet;
        if (!Object.is(nowSettingTo, stateRef.current)) {
          if (memodSettings?.debug) {
            console.log(
              `useStateCompat (${myId.current}): ${
                memodSettings.debugId
              } calling setState(${memodSettings.toRepr(
                nowSettingTo
              )}) in callback`
            );
          }
          setState(nowSettingTo);
        } else {
          if (memodSettings?.debug) {
            console.log(
              `useStateCompat (${myId.current}): ${memodSettings.debugId} skipped setState in callback; values already match`
            );
          }
        }
      }, 0);
    },
    [memodSettings]
  );

  return [state, fixedSetState];
}
