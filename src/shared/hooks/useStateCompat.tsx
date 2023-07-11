import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const notSet = Symbol();

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
  initial: T | (() => T)
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(initial);
  const stateRef = useRef(state);
  stateRef.current = state;
  const settingTo = useRef<typeof notSet | T>(notSet);

  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const fixedSetState = useCallback<Dispatch<SetStateAction<T>>>((v) => {
    const val: T =
      typeof v === "function"
        ? (v as (old: T) => T)(
            settingTo.current !== notSet ? settingTo.current : stateRef.current
          )
        : v;

    if (settingTo.current !== notSet) {
      settingTo.current = val;
      return;
    }
    settingTo.current = val;
    setTimeout(() => {
      if (!mounted) {
        return;
      }

      const nowSettingTo = settingTo.current;
      if (nowSettingTo === notSet) {
        return;
      }
      settingTo.current = notSet;
      setState(nowSettingTo);
    }, 0);
  }, []);

  return [state, fixedSetState];
}
