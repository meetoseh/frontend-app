import { useEffect } from "react";
import {
  ValueWithCallbacks,
  useWritableValueWithCallbacks,
} from "../lib/Callbacks";
import { setVWC } from "../lib/setVWC";

/**
 * A basic hook which provides a value with callbacks for true while
 * a useEffect is mounted, and false when it is unmounted. Helpful
 * for determining mounted state within a useCallback
 */
export const useIsMounted = (): ValueWithCallbacks<boolean> => {
  const result = useWritableValueWithCallbacks(() => false);

  useEffect(() => {
    setVWC(result, true);
    return () => {
      setVWC(result, false);
    };
  }, [result]);

  return result;
};
