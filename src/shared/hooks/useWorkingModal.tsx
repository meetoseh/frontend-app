import { useCallback } from 'react';
import { WorkingOverlay } from '../components/WorkingOverlay';
import { Modals, addModalWithCallbackToRemove } from '../contexts/ModalContext';
import {
  ValueWithCallbacks,
  WritableValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../lib/Callbacks';
import { useValueWithCallbacksEffect } from './useValueWithCallbacksEffect';
import { setVWC } from '../lib/setVWC';

/**
 * Shows a working modal in the given modals list while working is true.
 *
 * If delayStartMs is specified, the working modal doesn't show up until
 * after working has been set to true for the given number of milliseconds,
 * but it still goes away immediately.
 */
export const useWorkingModal = (
  modals: WritableValueWithCallbacks<Modals>,
  working: ValueWithCallbacks<boolean>,
  delayStartMs?: number
) => {
  const reallyWorking = useWritableValueWithCallbacks(() => working.get());
  useValueWithCallbacksEffect(working, (val) => {
    if (delayStartMs === undefined) {
      setVWC(reallyWorking, val);
      return undefined;
    }

    if (!val) {
      setVWC(reallyWorking, false);
      return undefined;
    }

    if (val === reallyWorking.get()) {
      return undefined;
    }

    let timeout: NodeJS.Timeout | null = setTimeout(() => {
      timeout = null;
      setVWC(reallyWorking, true);
    }, delayStartMs);
    return () => {
      if (timeout !== null) {
        clearTimeout(timeout);
        timeout = null;
      }
    };
  });

  useValueWithCallbacksEffect(
    reallyWorking,
    useCallback(
      (working) => {
        if (!working) {
          return;
        }

        return addModalWithCallbackToRemove(modals, <WorkingOverlay />);
      },
      [modals]
    )
  );
};
